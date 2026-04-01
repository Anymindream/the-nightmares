/* ─────────────────────────────────────────────
   SCENE 05 — Smaller Than Me
   Effect: background crossfade + centered girl image sequence
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-5');

  const IMAGES = [
    'Images/smaller/girl1-1.png',
    'Images/smaller/girl1-2.png',
    'Images/smaller/girl1-3.png',
    'Images/smaller/girl1-4.png',
  ];

  let bg2El      = null;
  let stackEl    = null;
  let startTimer = null;

  function init() {
    /* 배경 2번째 이미지 */
    bg2El = document.createElement('div');
    bg2El.className = 'stm-bg2';
    sceneEl.appendChild(bg2El);

    /* 소녀 이미지 스택 */
    stackEl = document.createElement('div');
    stackEl.className = 'stm-stack';
    IMAGES.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      stackEl.appendChild(img);
    });
    sceneEl.appendChild(stackEl);
  }

  function start() {
    bg2El.classList.add('running');
    startTimer = setTimeout(() => {
      stackEl.classList.add('running');
    }, 9000);
  }

  function stop() {
    clearTimeout(startTimer);
    bg2El.classList.remove('running');
    bg2El.style.opacity = '0';
    stackEl.classList.remove('running');
  }

  init();

  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 5) start();
    else stop();
  });

})();
