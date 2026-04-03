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
                      numOctaves="1" seed="2" stitchTiles="stitch" result="noise">
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

  /* ── 씬 참조 ── */
  const sceneEl = document.getElementById('scene-3');
  const bg      = sceneEl.querySelector('.scene-bg');

  /* ════════════════════════════════════════════
     [1] 네온 그리드 Canvas  (z-index: 2)
  ════════════════════════════════════════════ */
  const canvas = document.createElement('canvas');
  canvas.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:2',
  ].join(';');
  sceneEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const COLORS     = ['#c8a4f8', '#7fffd4', '#ff9de2']; // 라벤더, 민트, 네온 핑크
  const OPACITY    = 0.6;
  const WAVE_AMP   = 8;
  const WAVE_FREQ  = 0.018;
  const WAVE_SPEED = 0.6;

  let W = 0, H = 0;
  let rafId = null;

  /* ── 떨림(shake) 상태 ── */
  let shaking       = false;
  let shakeStart    = 0;
  let shakeDuration = 0;
  let shakeTimer    = null;

  function scheduleShake() {
    const delay = 5000 + Math.random() * 10000; // 5~15초
    shakeTimer = setTimeout(() => {
      shaking       = true;
      shakeStart    = performance.now();
      shakeDuration = 300 + Math.random() * 200; // 0.3~0.5초
      setTimeout(() => {
        shaking = false;
        scheduleShake();
      }, shakeDuration);
    }, delay);
  }

  /* ── 리사이즈 (그리드) ── */
  function resizeGrid() {
    const nw = canvas.offsetWidth;
    const nh = canvas.offsetHeight;
    if (nw !== W || nh !== H) {
      W = nw; H = nh;
      canvas.width  = W;
      canvas.height = H;
    }
  }

  /* ── 그리드 드로우 ── */
  function drawGrid(now) {
    if (!W || !H) return;

    const t = now * 0.001;

    let sx = 0, sy = 0;
    if (shaking) {
      const p         = (now - shakeStart) / shakeDuration;
      const intensity = Math.sin(p * Math.PI) * 5;
      sx = (Math.random() * 2 - 1) * intensity;
      sy = (Math.random() * 2 - 1) * intensity;
    }

    ctx.clearRect(0, 0, W, H);

    const cellSize = W / 20;
    const STEP     = 3;

    ctx.lineWidth   = 1;
    ctx.globalAlpha = OPACITY;

    /* 세로선 */
    const vLines = Math.ceil(W / cellSize) + 1;
    for (let i = 0; i <= vLines; i++) {
      const baseX = i * cellSize;
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      for (let y = 0; y <= H; y += STEP) {
        const x = baseX
          + Math.sin(y * WAVE_FREQ + t * WAVE_SPEED + i * 1.1) * WAVE_AMP
          + sx;
        y === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* 가로선 */
    const hLines = Math.ceil(H / cellSize) + 1;
    for (let i = 0; i <= hLines; i++) {
      const baseY = i * cellSize;
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.beginPath();
      for (let x = 0; x <= W; x += STEP) {
        const y = baseY
          + Math.sin(x * WAVE_FREQ + t * WAVE_SPEED + i * 1.1) * WAVE_AMP
          + sy;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  /* ════════════════════════════════════════════
     [2] UV 구름 Canvas  (z-index: 3)
  ════════════════════════════════════════════ */
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.style.cssText = [
    'position:absolute',
    'inset:0',
    'width:100%',
    'height:100%',
    'pointer-events:none',
    'z-index:3',
  ].join(';');
  sceneEl.appendChild(cloudCanvas);

  const cctx = cloudCanvas.getContext('2d');

  /* ── 리사이즈 (구름) ── */
  function resizeCloud() {
    const nw = cloudCanvas.offsetWidth;
    const nh = cloudCanvas.offsetHeight;
    if (nw !== CW || nh !== CH) {
      CW = nw; CH = nh;
      cloudCanvas.width  = CW;
      cloudCanvas.height = CH;
    }
  }

  /* ── 타임 구간 상수 ── */
  const CLOUD_START    = 78;   // 활성 시작(초)
  const CLOUD_END      = 134;  // 활성 종료(초)
  const CLOUD_FADE_DUR = 2.5;  // 페이드 인/아웃 길이(초)
  const CLOUD_OPACITY  = 0.5;

  /* UV 팔레트 [r, g, b] */
  const UV_PALETTE = [
    [123,  0, 255],  // #7B00FF
    [148,  0, 211],  // #9400D3
    [ 75,  0, 130],  // #4B0082
  ];

  let CW = 0, CH = 0;
  let currentAudioTime = 0;

  /* ── smoothstep 이징 ── */
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /*
   * 수채화 얼룩(stain) — 화면 랜덤 위치에 독립적으로 등장·소멸
   *
   *   idle      : 대기 (2~8초)
   *   appearing : intensity 0→1 — 크기·불투명도 함께 증가 (4~9초)
   *   fading    : intensity 1→0 — 크기·불투명도 함께 감소 (5~11초)
   *
   * 활성화 시점마다 cx·cy·blobs·maxReach 를 새로 결정하므로
   * 매번 다른 위치·모양으로 나타남
   */
  const STAIN_COUNT = 6;
  const BLOB_COUNT  = 13;

  /* 전방향(360°) 랜덤 blob 클러스터 생성 */
  function generateBlobs() {
    const blobs = [];
    for (let i = 0; i < BLOB_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist  = 0.04 + Math.random() * 0.32;
      blobs.push({
        ox:         Math.cos(angle) * dist,
        oy:         Math.sin(angle) * dist,
        rScale:     0.35 + Math.random() * 0.70,
        alphaScale: 0.22 + Math.random() * 0.63,
        colorIdx:   Math.floor(Math.random() * UV_PALETTE.length),
      });
    }
    /* 중심 고정 기반 blob */
    blobs.push({ ox: 0, oy: 0, rScale: 0.95, alphaScale: 0.45, colorIdx: 0 });
    return blobs;
  }

  const stains = Array.from({ length: STAIN_COUNT }, () => ({
    cx: 0, cy: 0,
    blobs: null,
    maxReach: 0,
    intensity: 0,
    phase: 'idle',
    phaseStart: 0,
    phaseDuration: 0,
  }));

  let stainsReady = false;

  /* 얼룩 활성화 시 위치·모양 새로 결정 */
  function activateStain(stain) {
    stain.cx       = Math.random() * CW;
    stain.cy       = Math.random() * CH;
    stain.blobs    = generateBlobs();
    stain.maxReach = Math.sqrt(CW * CW + CH * CH) * (0.10 + Math.random() * 0.18);
  }

  /* 첫 진입 시 각 얼룩에 엇갈린 초기 딜레이 부여 */
  function initStains(now) {
    stains.forEach((s, i) => {
      s.phase        = 'idle';
      s.phaseStart   = now;
      s.phaseDuration = (1 + i * 1.4 + Math.random() * 2.5) * 1000;
      s.intensity    = 0;
      s.blobs        = null;
    });
  }

  function nextStainPhase(stain, now) {
    if (stain.phase === 'idle') {
      activateStain(stain);
      stain.phase        = 'appearing';
      stain.phaseStart   = now;
      stain.phaseDuration = (4 + Math.random() * 5) * 1000; // 4~9초
    } else if (stain.phase === 'appearing') {
      stain.phase        = 'fading';
      stain.phaseStart   = now;
      stain.phaseDuration = (5 + Math.random() * 6) * 1000; // 5~11초
    } else {
      stain.phase        = 'idle';
      stain.phaseStart   = now;
      stain.phaseDuration = (2 + Math.random() * 6) * 1000; // 2~8초 대기
      stain.intensity    = 0;
    }
  }

  function tickStain(stain, now) {
    const progress = (now - stain.phaseStart) / stain.phaseDuration;
    if (progress >= 1) {
      stain.intensity = stain.phase === 'appearing' ? 1 : 0;
      nextStainPhase(stain, now);
    } else {
      stain.intensity = stain.phase === 'appearing'
        ? smoothstep(progress)
        : smoothstep(1 - progress);
    }
  }

  /* ── 수채화 단일 blob 드로우 ── */
  function drawBlob(cx, cy, r, colorIdx, alpha) {
    if (r < 1) return;
    const [rv, gv, bv] = UV_PALETTE[colorIdx];
    const a = (f) => Math.min(1, CLOUD_OPACITY * alpha * f).toFixed(3);
    const g = cctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0,    `rgba(${rv},${gv},${bv},${a(0.65)})`);
    g.addColorStop(0.30, `rgba(${rv},${gv},${bv},${a(1.00)})`); // 가장 짙은 지점
    g.addColorStop(0.62, `rgba(${rv},${gv},${bv},${a(0.38)})`);
    g.addColorStop(0.85, `rgba(${rv},${gv},${bv},${a(0.10)})`);
    g.addColorStop(1,    `rgba(${rv},${gv},${bv},0)`);
    cctx.fillStyle = g;
    cctx.fillRect(0, 0, CW, CH);
  }

  /* ── watercolor 드로우 ── */
  function drawCloud(now) {
    if (!CW || !CH) return;

    if (!stainsReady) { initStains(now); stainsReady = true; }

    cctx.clearRect(0, 0, CW, CH);

    const t = currentAudioTime;
    if (t <= CLOUD_START || t >= CLOUD_END) return;

    /* 페이드 인/아웃 마스터 알파 */
    let masterAlpha = 1;
    if (t < CLOUD_START + CLOUD_FADE_DUR) {
      masterAlpha = (t - CLOUD_START) / CLOUD_FADE_DUR;
    } else if (t > CLOUD_END - CLOUD_FADE_DUR) {
      masterAlpha = (CLOUD_END - t) / CLOUD_FADE_DUR;
    }
    masterAlpha = Math.max(0, Math.min(1, masterAlpha));

    cctx.globalCompositeOperation = 'source-over';

    for (const stain of stains) {
      tickStain(stain, now);
      if (!stain.blobs || stain.intensity <= 0) continue;

      const reach = stain.maxReach * stain.intensity;
      const alpha = masterAlpha * stain.intensity;

      for (const blob of stain.blobs) {
        drawBlob(
          stain.cx + blob.ox * reach,
          stain.cy + blob.oy * reach,
          reach * blob.rScale,
          blob.colorIdx,
          alpha * blob.alphaScale,
        );
      }
    }
  }

  /* ── audioTimeUpdate 리스너 ── */
  window.addEventListener('audioTimeUpdate', (e) => {
    const raw = e.detail;
    currentAudioTime = (typeof raw === 'number')
      ? raw
      : (raw?.time ?? raw?.currentTime ?? 0);
  });

  /* ════════════════════════════════════════════
     [3] 공통 RAF 루프
  ════════════════════════════════════════════ */
  function loop(now) {
    resizeGrid();
    resizeCloud();
    drawGrid(now);
    drawCloud(now);
    rafId = requestAnimationFrame(loop);
  }

  /* ── 리사이즈 리스너 ── */
  window.addEventListener('resize', () => { resizeGrid(); resizeCloud(); });

  /* ── 시작 / 정지 ── */
  function start() {
    if (rafId) return;
    resizeGrid();
    resizeCloud();
    rafId = requestAnimationFrame(loop);
    scheduleShake();
  }

  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (shakeTimer) { clearTimeout(shakeTimer); shakeTimer = null; }
    shaking = false;
    stainsReady = false; // 재진입 시 타이머 재초기화
    if (W  && H)  ctx.clearRect(0, 0, W, H);
    if (CW && CH) cctx.clearRect(0, 0, CW, CH);
  }

  /* ── 씬 전환 리스너 ── */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 3) {
      if (window.innerWidth > 1366) bg.classList.add('asphyxia-ripple');
      start();
    } else {
      bg.classList.remove('asphyxia-ripple');
      stop();
    }
  });
})();
