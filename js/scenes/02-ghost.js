/* ─────────────────────────────────────────────
   SCENE 02 — Ghost
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-2');

  /* ── 이미지 프레임 (배경 원본 비율 3058×1252 기준 좌표 시스템) ── */
  const ghostFrame = document.createElement('div');
  ghostFrame.className = 'ghost-frame';
  sceneEl.appendChild(ghostFrame);

  /* ── 고스트 이미지: 원본 기준 중심 (2112, 626) → 69.07% / 50.00%
        width 26.55% = 812px / 3058px (원본 ghost-only 폭 비율)       ── */
  const ghostImg = document.createElement('img');
  ghostImg.src       = 'Images/ghost/2ghost-only.webp';
  ghostImg.className = 'ghost-figure';
  ghostFrame.appendChild(ghostImg);

  /* ── 씬 활성 여부에 따라 애니메이션 토글 ── */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 2) {
      ghostImg.classList.add('visible');
    } else {
      ghostImg.classList.remove('visible');
    }
  });

})();
