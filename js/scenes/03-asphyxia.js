/* ─────────────────────────────────────────────
   SCENE 03 — Asphyxia of Dreams
───────────────────────────────────────────── */

(function () {
  /* ── SVG 필터 생성 ──
  scale="25" → 숫자 올리면 왜곡 더 강하게, 내리면 더 섬세하게
dur="35s" → 올리면 더 느리게
baseFrequency 값 범위 → 낮출수록 파장이 커지고 더 부드럽게
 */
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  svg.innerHTML = `
    <defs>
      <filter id="asphyxia-ripple" x="-8%" y="-8%" width="116%" height="116%"
              color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.002"
                      numOctaves="1" seed="2" result="noise">
          <animate attributeName="baseFrequency"
            values="0.002; 0.004; 0.002"
            dur="8s"
            calcMode="spline"
            keySplines="0.45 0.05 0.55 0.95; 0.45 0.05 0.55 0.95"
            repeatCount="indefinite"/>
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise"
                           scale="35" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
  `;
  document.body.appendChild(svg);

  /* ── 씬 활성화 시 필터 토글 ── */
  const sceneEl = document.getElementById('scene-3');
  const bg      = sceneEl.querySelector('.scene-bg');

  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 3) {
      bg.classList.add('asphyxia-ripple');
    } else {
      bg.classList.remove('asphyxia-ripple');
    }
  });
})();
