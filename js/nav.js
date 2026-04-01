/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
let current           = 0;
let transitioning     = false;
let audioUnlocked     = false;
let playSceneTimer    = null;

const PLAY_DELAY_MS   = 700;

/* ── 좌표 확인 모드 ──────────────────────────────
   콘솔에서 coordinateMode = true 입력 시 활성화.
   클릭한 위치의 % 좌표를 출력하고 씬 전환을 차단.
   coordinateMode = false 로 원복.
─────────────────────────────────────────────── */
window.coordinateMode = false;
document.addEventListener('click', (e) => {
  if (!window.coordinateMode) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  const scene = document.getElementById('scene-' + current);
  const r = scene.getBoundingClientRect();
  const left = ((e.clientX - r.left) / r.width  * 100).toFixed(2);
  const top  = ((e.clientY - r.top)  / r.height * 100).toFixed(2);
  console.log(`{ left: ${left}, top: ${top} }`);
}, true);

async function goTo(index) {
  if (transitioning) return;
  if (index === current) return;
  if (index < 0 || index >= SCENES.length) return;

  transitioning = true;

  try {
    document.getElementById('scene-' + current).classList.remove('active');
    dotsEl.children[current].classList.remove('active');

    current = index;

    /* 현재 씬 + 인접 씬 배경 이미지 로드 */
    loadBg(current);
    loadBg(current - 1);
    loadBg(current + 1);

    stage.style.transform = `translateX(calc(${-current} * 100vw))`;

    document.getElementById('scene-' + current).classList.add('active');
    dotsEl.children[current].classList.add('active');

    /* seek-fill 리셋 — 이전 씬 프로그레스 노출 방지 */
    const seekFill = document.getElementById('seek-fill');
    if (seekFill) seekFill.style.width = '0%';

    /* 씬 전환 이벤트 — 각 scenes/*.js 파일에서 구독 */
    window.dispatchEvent(new CustomEvent('sceneChange', {
      detail: { index: current }
    }));

    /* Counter */
    document.getElementById('counter').textContent =
      current === 0
        ? 'THE NIGHTMARES'
        : String(current).padStart(2, '0') + ' / 09';

    /* Progress bar */
    document.getElementById('progress-bar').style.width =
      current === 0 ? '0%' : (current / (SCENES.length - 1) * 100) + '%';

    updateArrows();

    document.getElementById('player-bar').style.display =
      current === 0 ? 'none' : 'flex';

    /* 가사 — 오디오 unlock 여부와 무관하게 씬 전환 시 바로 로드 */
    const lyricsDisplay = document.getElementById('lyrics-display');
    const lyricsSrc = SCENES[current] && SCENES[current].lrc;
    if (lyricsSrc) {
      lyricsDisplay.style.display = 'block';
      document.body.classList.add('has-lyrics');
      loadLyrics(lyricsSrc);
    } else {
      lyricsDisplay.style.display = 'none';
      document.body.classList.remove('has-lyrics');
      lyricsLines = [];
      currentLyricsLine = -1;
      clearLyricsDisplay();
    }

    if (audioUnlocked) {
      clearTimeout(playSceneTimer);
      if (current === 0 && activeAudio && !activeAudio.paused) {
        /* 홈으로 돌아가면 현재 곡 페이드아웃 후 정지 */
        fadeVolume(activeAudio, activeAudio.volume, 0, FADE_OUT_MS, () => {
          activeAudio.pause();
        });
        updatePlayPauseBtn(false);
      } else {
        const targetScene = current;
        playSceneTimer = setTimeout(() => {
          if (current === targetScene) playScene(current);
        }, PLAY_DELAY_MS);
      }
    }

    document.getElementById('hint').classList.add('gone');
  } catch (e) {
    console.error('goTo error:', e);
  } finally {
    setTimeout(() => { transitioning = false; }, 1900);
  }
}

function updateArrows() {
  document.getElementById('arrow-prev')
    .classList.toggle('hidden', current === 0);
  document.getElementById('arrow-next')
    .classList.toggle('hidden', current === SCENES.length - 1);
  const playerNext = document.getElementById('player-next');
  if (playerNext) {
    playerNext.style.opacity = current === SCENES.length - 1 ? '0.15' : '';
    playerNext.style.pointerEvents = current === SCENES.length - 1 ? 'none' : '';
  }

  const icons = document.getElementById('streaming-icons');
  if (icons) icons.classList.toggle('hidden', current !== 0);
}

function navigate(dir) { goTo(current + dir); }

function unlockAudio() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  playScene(current);
}

/* ─────────────────────────────────────────────
   EVENTS
───────────────────────────────────────────── */
let wheelLocked = false;
window.addEventListener('wheel', e => {
  if (wheelLocked) return;
  unlockAudio();
  wheelLocked = true;
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  navigate(delta > 0 ? 1 : -1);
  setTimeout(() => { wheelLocked = false; }, 2100);
}, { passive: true });

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    unlockAudio(); navigate(1);
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    unlockAudio(); navigate(-1);
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (audioUnlocked) togglePlayPause();
    else unlockAudio();
  }
});

let tx = 0, ty = 0;
window.addEventListener('touchstart', e => {
  tx = e.touches[0].clientX;
  ty = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  const dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) > 40) {
    unlockAudio();
    navigate(dx < 0 ? 1 : -1);
  } else if (Math.abs(dy) > 40) {
    unlockAudio();
    navigate(dy < 0 ? 1 : -1);
  }
}, { passive: true });

document.getElementById('player-playpause').addEventListener('click', e => {
  e.stopPropagation();
  if (!audioUnlocked) unlockAudio();
  else togglePlayPause();
});

document.getElementById('player-next').addEventListener('click', e => {
  e.stopPropagation();
  unlockAudio();
  navigate(1);
});

document.getElementById('arrow-prev').addEventListener('click', e => {
  e.stopPropagation(); unlockAudio(); navigate(-1);
});
document.getElementById('arrow-next').addEventListener('click', e => {
  e.stopPropagation(); unlockAudio(); navigate(1);
});
