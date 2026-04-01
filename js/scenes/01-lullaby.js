/* ─────────────────────────────────────────────
   SCENE 01 — Lullaby
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-1');
  const bg      = sceneEl.querySelector('.scene-bg');

  /* ── 배경 슬로우 줌 ── */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 1) {
      bg.classList.add('background-img');
    } else {
      bg.classList.remove('background-img');
    }
  });

  /* ── 잉크닷 ── */
  const INKDOTS = [
    'Images/lullaby/inkdot1.png',
    'Images/lullaby/inkdot2.png',
    'Images/lullaby/inkdot3.png',
    'Images/lullaby/inkdot4.png',
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  function randomPos(el) {
    const size = rand(30, 100);          /* 30~100vw */
    el.style.width = size + 'vw';
    el.style.left  = rand(-10, 70) + 'vw';
    el.style.top   = rand(-10, 70) + 'vh';
  }

  INKDOTS.forEach((src) => {
    const img = document.createElement('img');
    img.src       = src;
    img.className = 'inkdot';

    /* 오퍼시티와 스케일에 서로 다른 duration → 자연스러운 비동기 */
    const fadeDur  = rand(12, 22);   /* 오퍼시티 사이클: 12~22초 */
    const pulseDur = rand(8, 18);    /* 스케일 사이클: 8~18초 */

    /* 네거티브 delay → 처음부터 이미 진행 중인 것처럼 시작 */
    const fadeDelay  = -rand(0, fadeDur);
    const pulseDelay = -rand(0, pulseDur);

    img.style.animation = [
      `inkFade  ${fadeDur}s  ease-in-out ${fadeDelay}s  infinite`,
      `inkPulse ${pulseDur}s ease-in-out ${pulseDelay}s infinite`,
    ].join(', ');

    randomPos(img);

    /* 오퍼시티 루프가 한 바퀴 돌 때마다 새 위치로 이동 */
    img.addEventListener('animationiteration', (e) => {
      if (e.animationName === 'inkFade') randomPos(img);
    });

    sceneEl.appendChild(img);
  });

})();
