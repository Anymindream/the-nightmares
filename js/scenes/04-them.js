/* ─────────────────────────────────────────────
   SCENE 04 — Them
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-4');

  /* ══ 눈 이미지 레이어 컨테이너 ══ */
  const eyesLayer = document.createElement('div');
  eyesLayer.className = 'them-eyes-layer';
  sceneEl.appendChild(eyesLayer);

  /* ══ 이미지 프레임 ══
     CSS aspect-ratio 3056/1257 + min-width/height 100% 로
     object-fit:cover 와 동일한 스케일링을 브라우저가 자동 처리.
     positionFrame() JS 계산 불필요. */
  const imageFrame = document.createElement('div');
  imageFrame.className = 'them-image-frame';
  eyesLayer.appendChild(imageFrame);

  /* ══ 눈 좌표 + 파일 ══
     left / top : 원본 이미지(3056 × 1257px) 기준 눈 중심점 %
     w    / h   : 원본 이미지 기준 눈 이미지 크기 %
  ══════════════════════════════════════════════ */
  const EYES = [
    { left: 25.05, top: 41.13, w: 11.42, h: 24.66, src: 'Images/them/eye1.webp'  },  // 01
    { left: 36.06, top: 41.13, w: 10.60, h: 24.66, src: 'Images/them/eye2.webp'  },  // 02
    { left: 33.77, top: 64.92, w:  6.02, h: 22.91, src: 'Images/them/eye3.webp'  },  // 03
    { left: 39.07, top: 64.92, w:  4.58, h: 22.91, src: 'Images/them/eye4.webp'  },  // 04
    { left: 82.24, top: 14.40, w:  4.52, h: 28.80, src: 'Images/them/eye5.webp'  },  // 05
    { left: 92.23, top: 41.13, w: 15.48, h: 24.66, src: 'Images/them/eye6.webp'  },  // 06
    { left: 79.65, top: 64.92, w:  9.69, h: 22.91, src: 'Images/them/eye7.webp'  },  // 07
    { left: 77.42, top: 88.19, w:  5.17, h: 23.63, src: 'Images/them/eye8.webp'  },  // 08
    { left: 53.03, top: 64.92, w:  3.04, h: 22.91, src: 'Images/them/eye9.webp'  },  // 09
    { left: 53.03, top: 88.19, w:  3.04, h: 23.63, src: 'Images/them/eye10.webp' },  // 10
    { left: 55.87, top: 61.97, w:  2.65, h: 17.03, src: 'Images/them/eye11.webp' },  // 11
    { left: 55.87, top: 73.43, w:  2.65, h:  5.89, src: 'Images/them/eye12.webp' },  // 12
    { left: 59.11, top: 61.97, w:  3.83, h: 17.03, src: 'Images/them/eye13.webp' },  // 13
    { left: 59.11, top: 84.05, w:  3.83, h: 15.35, src: 'Images/them/eye14.webp' },  // 14
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* 눈 이미지 생성 — 프레임 안에 image-native % 로 배치
     01-02: 느리게 (4~12s) / 03-14: 빠르게 (2~5s) */
  EYES.forEach((e, i) => {
    const img       = document.createElement('img');
    img.src         = e.src;
    img.className   = 'them-eye-img';
    img.style.left  = e.left + '%';
    img.style.top   = e.top  + '%';
    img.style.width  = e.w   + '%';
    img.style.height = e.h   + '%';

    const dur   = i < 2 ? rand(3, 7) : rand(2, 5);
    const delay = -rand(0, dur);
    img.style.animation = `eyeBlink ${dur}s ease-in-out ${delay}s infinite`;

    imageFrame.appendChild(img);
  });

  /* ══ 별빛 레이어 ══ */
  const starLayer = document.createElement('div');
  starLayer.className = 'them-star-layer';
  sceneEl.appendChild(starLayer);

  const STAR_COUNT = 200;
  for (let i = 0; i < STAR_COUNT; i++) {
    const star = document.createElement('div');
    star.className = 'them-star';

    const size = rand(2, 8);
    star.style.width  = size + 'px';
    star.style.height = size + 'px';
    star.style.left   = rand(0, 100) + '%';
    star.style.top    = rand(0, 100) + '%';

    const dur   = rand(0.8, 3);
    const delay = -rand(0, 8);
    star.style.animation = `starTwinkle ${dur}s ease-in-out ${delay}s infinite`;

    starLayer.appendChild(star);
  }

  /* ══ 큐브 레이어 ══ */
  const cubeLayer = document.createElement('div');
  cubeLayer.className = 'them-cube-layer';
  sceneEl.appendChild(cubeLayer);

  const CUBE_COUNT = window.innerWidth < 768 ? 8 : 28;
  const cubeStyles = document.createElement('style');

  for (let i = 0; i < CUBE_COUNT; i++) {
    const w   = rand(40, 170);
    const h   = w;
    const dx  = rand(-110, 110);
    const dy  = rand(-220, 40);
    const rot = rand(-420, 420);
    const dur = rand(9, 24);
    const del = -rand(0, dur);
    const alpha = (rand(0.45, 0.85)).toFixed(2);

    cubeStyles.textContent += `
      @keyframes themCube${i} {
        0%   { transform: translate(0,0) rotate(0deg); opacity: 0; }
        12%  { opacity: 0.5; }
        88%  { opacity: 0.45; }
        100% { transform: translate(${dx}px,${dy}px) rotate(${rot}deg); opacity: 0; }
      }
    `;

    const cube = document.createElement('div');
    cube.className = 'them-cube';
    cube.style.width  = w + 'px';
    cube.style.height = h + 'px';
    cube.style.left   = rand(0, 100) + '%';
    cube.style.top    = rand(10, 95) + '%';
    cube.style.border = `1px solid rgba(255,255,255,${alpha})`;
    cube.style.animation = `themCube${i} ${dur}s ease-in-out ${del}s infinite`;
    cubeLayer.appendChild(cube);
  }

  document.head.appendChild(cubeStyles);

  /* ══ 씬 진입/이탈 ══ */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 4) {
      eyesLayer.style.display = '';
    } else {
      eyesLayer.style.display = 'none';
    }
  });

})();
