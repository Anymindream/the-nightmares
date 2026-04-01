/* ─────────────────────────────────────────────
   SCENE 02 — Ghost
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-2');

  /* ── 유령 오버레이 이미지 생성 ── */
  const overlay = document.createElement('img');
  overlay.src       = 'Images/ghost/2ghost2.webp';
  overlay.className = 'ghost-overlay';
  sceneEl.appendChild(overlay);

  /* ── 씬 활성 여부에 따라 애니메이션 토글 ── */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 2) {
      overlay.classList.add('visible');
    } else {
      overlay.classList.remove('visible');
    }
  });

})();
