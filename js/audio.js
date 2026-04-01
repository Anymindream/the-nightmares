/* ─────────────────────────────────────────────
   LYRICS ENGINE  (LRC timestamp-based sync)
───────────────────────────────────────────── */
let lyricsLines       = [];   /* [{time: seconds, text: string}, ...] sorted */
let currentLyricsLine = -1;

function parseLRC(raw) {
  const lines = [];
  const re = /^\[(\d{1,2}):(\d{2}(?:\.\d+)?)\](.*)$/;
  raw.split('\n').forEach(row => {
    const m = row.trim().match(re);
    if (!m) return;
    const text = m[3].trim();
    if (!text) return;
    const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    lines.push({ time, text });
  });
  lines.sort((a, b) => a.time - b.time);
  return lines;
}


async function loadLyrics(src) {
  lyricsLines       = [];
  currentLyricsLine = -1;
  clearLyricsDisplay();
  try {
    const res  = await fetch(src);
    if (!res.ok) return;
    const text = await res.text();
    lyricsLines = parseLRC(text);
    /* 로드 즉시 첫 줄 표시 */
    if (lyricsLines.length) {
      const d = document.getElementById('lyrics-display');
      if (d) {
        const currEl = d.querySelector('.lyric-curr');
        currEl.textContent = lyricsLines[0].text;
        currEl.classList.remove('lyric-in');
        currEl.classList.add('lyric-waiting');
        d.querySelector('.lyric-next').textContent =
          lyricsLines[1] ? lyricsLines[1].text : '';
        currentLyricsLine = -1;
      }
    }
  } catch (e) { /* lyrics unavailable */ }
}

function clearLyricsDisplay() {
  const d = document.getElementById('lyrics-display');
  if (!d) return;
  d.querySelector('.lyric-prev').textContent = '';
  d.querySelector('.lyric-curr').textContent = '';
  d.querySelector('.lyric-next').textContent = '';
}

function updateLyricsDisplay(currentTime) {
  if (!lyricsLines.length) return;
  const d = document.getElementById('lyrics-display');
  if (!d || d.style.display === 'none') return;

  /* binary-search: largest index whose time <= currentTime */
  let lo = 0, hi = lyricsLines.length - 1, idx = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lyricsLines[mid].time <= currentTime) { idx = mid; lo = mid + 1; }
    else hi = mid - 1;
  }

  if (idx === currentLyricsLine) return;
  currentLyricsLine = idx;

  const prevEl = d.querySelector('.lyric-prev');
  const currEl = d.querySelector('.lyric-curr');
  const nextEl = d.querySelector('.lyric-next');

  /* idx = -1: currentTime이 첫 가사 이전 — 초기 대기 상태로 복원 */
  if (idx < 0) {
    currEl.classList.remove('lyric-in');
    currEl.classList.add('lyric-waiting');
    prevEl.textContent = '';
    currEl.textContent = lyricsLines[0] ? lyricsLines[0].text : '';
    nextEl.textContent = lyricsLines[1] ? lyricsLines[1].text : '';
    return;
  }

  currEl.classList.remove('lyric-waiting');
  prevEl.textContent = idx > 0 ? lyricsLines[idx - 1].text : '';
  nextEl.textContent = idx < lyricsLines.length - 1 ? lyricsLines[idx + 1].text : '';

  currEl.classList.remove('lyric-in');
  void currEl.offsetWidth;
  currEl.textContent = lyricsLines[idx].text;
  currEl.classList.add('lyric-in');
}

/* ─────────────────────────────────────────────
   AUDIO ENGINE
───────────────────────────────────────────── */
const FADE_IN_MS  = 2000;
const FADE_OUT_MS = 1500;
const TARGET_VOL  = 0.80;
const STEPS       = 40;

let activeAudio = null;
let paused      = false;
let userSeeking = false;  /* 시크바 드래그 중 timeupdate가 fill을 덮어쓰지 않도록 */

function fadeVolume(audio, from, to, ms, done) {
  audio.volume = Math.max(0, Math.min(1, from));
  const step  = (to - from) / STEPS;
  const delay = ms / STEPS;
  let count   = 0;
  const t = setInterval(() => {
    count++;
    audio.volume = Math.max(0, Math.min(1, from + step * count));
    if (count >= STEPS) {
      clearInterval(t);
      if (done) done();
    }
  }, delay);
  return t;
}

const ICON_PAUSE = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';  /* ⏸ */
const ICON_PLAY  = 'M8 5v14l11-7z';                     /* ▶ */

function updatePlayPauseBtn(isPlaying) {
  const path = document.getElementById('player-path');
  const btn  = document.getElementById('player-playpause');
  if (!path || !btn) return;
  if (isPlaying) {
    path.setAttribute('d', ICON_PAUSE);
    btn.setAttribute('aria-label', 'Pause');
  } else {
    path.setAttribute('d', ICON_PLAY);
    btn.setAttribute('aria-label', 'Play');
  }
}

function playScene(index) {
  const src = SCENES[index] && SCENES[index].audio;
  if (!src) return;

  paused = false;
  updatePlayPauseBtn(true);

  const prev = activeAudio;
  const next = new Audio(src);
  next.volume = 0;
  activeAudio = next;

  next.addEventListener('ended', () => {
    if (current < SCENES.length - 1) {
      goTo(current + 1);
    }
  });

  /* 씬별 타임라인 트리거 + 시크바 업데이트 */
  next.addEventListener('timeupdate', () => {
    window.dispatchEvent(new CustomEvent('audioTimeUpdate', { detail: { time: next.currentTime } }));
    /* 시크바 드래그 중이면 fill 업데이트 건너뜀 — seekTo가 직접 설정한 값 유지 */
    if (!userSeeking && next.duration) {
      const fill = document.getElementById('seek-fill');
      if (fill) fill.style.width = (next.currentTime / next.duration * 100) + '%';
    }
  });

  /* lyrics — timeupdate만 연결 (display/load는 goTo에서 처리) */
  if (SCENES[index] && SCENES[index].lrc) {
    next.addEventListener('timeupdate', () => {
      if (index === current) updateLyricsDisplay(next.currentTime + 0.3);
    });
  }

  const startNext = () => {
    next.play().then(() => {
      fadeVolume(next, 0, TARGET_VOL, FADE_IN_MS, null);
    }).catch(() => { /* autoplay blocked */ });
  };

  if (prev && !prev.paused) {
    fadeVolume(prev, prev.volume, 0, FADE_OUT_MS, () => {
      prev.pause();
      prev.src = '';
      startNext();
    });
  } else {
    startNext();
  }
}

function togglePlayPause() {
  if (!audioUnlocked) { unlockAudio(); return; }
  if (!activeAudio)   return;

  if (!paused) {
    /* 재생 중 → 일시정지 */
    paused = true;
    fadeVolume(activeAudio, activeAudio.volume, 0, 600, () => {
      activeAudio.pause();
    });
    updatePlayPauseBtn(false);
  } else {
    /* 일시정지 → 재개 */
    paused = false;
    activeAudio.play().then(() => {
      fadeVolume(activeAudio, 0, TARGET_VOL, 800, null);
    }).catch(() => {});
    updatePlayPauseBtn(true);
  }
}

/* ── 시크바 — 클릭 & 드래그 ── */
(function () {
  const seekBar = document.getElementById('seek-bar');

  function seekTo(e) {
    if (!activeAudio || !activeAudio.duration) return;
    const rect = seekBar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (!isFinite(ratio)) return;
    activeAudio.currentTime = ratio * activeAudio.duration;
    const fill = document.getElementById('seek-fill');
    if (fill) fill.style.width = (ratio * 100) + '%';
  }

  seekBar.addEventListener('mousedown', e => {
    e.stopPropagation();
    userSeeking = true;
    seekTo(e);
  });

  window.addEventListener('mousemove', e => {
    if (userSeeking) seekTo(e);
  });

  window.addEventListener('mouseup', () => {
    if (userSeeking) {
      userSeeking = false;
      /* mouseup 후 fill을 현재 실제 위치에 동기화 */
      if (activeAudio && activeAudio.duration) {
        const fill = document.getElementById('seek-fill');
        if (fill) fill.style.width = (activeAudio.currentTime / activeAudio.duration * 100) + '%';
      }
    }
  });
})();
