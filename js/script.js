/* ─────────────────────────────────────────────
   BUILD DOM
───────────────────────────────────────────── */
const stage  = document.getElementById('stage');
const dotsEl = document.getElementById('dots');

stage.style.width = `calc(${SCENES.length} * 100vw)`;

function buildTracklist(activeIndex, itemClass) {
  return SCENES.slice(1).map((song, idx) => {
    const sceneIdx = idx + 1;
    const isActive = sceneIdx === activeIndex;
    return `<li class="${itemClass}${isActive ? ' active' : ''}" data-scene="${sceneIdx}">
      <span class="tl-num">${song.num}</span>
      <span class="tl-name">${song.title}</span>
    </li>`;
  }).join('');
}

SCENES.forEach((s, i) => {
  const el = document.createElement('div');
  el.className = 'scene' + (i === 0 ? ' active' : '');
  el.id = 'scene-' + i;
  el.style.color = s.textColor;

  if (s.isHome) {
    el.innerHTML = `
      <div class="scene-bg" style="background-image:url('${s.img}')"></div>
      <div class="scene-overlay" style="background:${s.overlay}"></div>
      <div class="scene-home">
        <div class="home-album-tag">${s.tag}</div>
        <div class="home-title">The<br>Nightmares</div>
        <div class="home-artist">by Anymind</div>
        <ul class="home-tracklist">${buildTracklist(0, 'home-track')}</ul>
      </div>`;
    el.querySelectorAll('.home-track').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        unlockAudio();
        goTo(parseInt(item.dataset.scene));
      });
    });
    /* 씬 전체 클릭 네비게이션 제거 — 오발 방지 */
  } else {
    el.innerHTML = `
      <div class="scene-bg" data-bg="${s.img}"></div>
      <div class="scene-overlay" style="background:${s.overlay}"></div>
      <div class="scene-text">
        <div class="scene-home-link">The Nightmares</div>
        <ul class="scene-tracklist">${buildTracklist(i, 'scene-track')}</ul>
        <div class="scene-title">${s.title}</div>
        ${s.tag ? `<div class="scene-tag" style="color:${s.textColor}">${s.tag}</div>` : ''}
      </div>`;
    el.querySelector('.scene-home-link').addEventListener('click', e => {
      e.stopPropagation();
      goTo(0);
    });
    el.querySelectorAll('.scene-track').forEach(item => {
      item.addEventListener('click', e => {
        e.stopPropagation();
        unlockAudio();
        goTo(parseInt(item.dataset.scene));
      });
    });
    /* 씬 전체 클릭 네비게이션 제거 — 오발 방지 */
  }

  stage.appendChild(el);

  /* Nav dot */
  const dot = document.createElement('button');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.setAttribute('aria-label', s.isHome ? 'Home' : `Scene ${i}: ${s.title}`);
  dot.dataset.index = i;
  dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); });
  dotsEl.appendChild(dot);
});

/* ─────────────────────────────────────────────
   IMAGE OVERLAYS
   경계선 위치: 씬 N과 N+1 사이 = (N+1) * 100vw
   z-index 범위: 5–99 (텍스트 z-index 100 미만)
───────────────────────────────────────────── */
function addBoundaryOverlay(src, sceneIndex, opacity) {
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = [
    'position:absolute',
    'top:0',
    `left:${sceneIndex * 100}vw`,
    'height:100%',
    'width:auto',
    'transform:translateX(-50%)',
    'z-index:5',
    `opacity:${opacity}`,
    'pointer-events:none',
  ].join(';');
  stage.appendChild(img);
  return img;
}

/* Home ↔ Lullaby */
addBoundaryOverlay('Images/lullaby/inkdots.png', 1, 0.5);

/* Lullaby ↔ Ghost */
addBoundaryOverlay('Images/lullaby/inkdots.png', 2, 0.5);

/* ─────────────────────────────────────────────
   LAZY BG LOADER
───────────────────────────────────────────── */
function loadBg(index) {
  const scene = document.getElementById('scene-' + index);
  if (!scene) return;
  const bg = scene.querySelector('.scene-bg');
  if (!bg || !bg.dataset.bg || bg.style.backgroundImage) return;
  bg.style.backgroundImage = `url('${bg.dataset.bg}')`;
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.getElementById('progress-bar').style.width = '0%';

/* 홈 로드 시 scene 1 미리 로드 */
loadBg(1);

/* Try autoplay immediately (works on localhost / some browsers) */
setTimeout(() => {
  if (!audioUnlocked && activeAudio === null) {
    const firstSong = SCENES[1] && SCENES[1].audio;
    if (firstSong) {
      const probe = new Audio(firstSong);
      probe.volume = 0;
      probe.play().then(() => {
        probe.pause();
        probe.src = '';
        /* Don't auto-start — user is on home scene */
      }).catch(() => { /* will unlock on first interaction */ });
    }
  }
}, 200);
