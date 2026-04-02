/* ─────────────────────────────────────────────
   SCENE 09 — Dream Commander

   레이어 순서 (z-index):
     0  scene-bg            : 기본 배경 (9dream-commander.png)
     1  sky-img             : 별 하늘 이미지 (9dream-commander2-0.png)
     2  cmd-img             : commander 오버레이 (commander2.jpg)
     3  cmd3-img            : commander3 오버레이 (commander3.jpg) — 별 아웃과 오버랩
     4  dc-star-layer       : CSS 흰 점 별
     4  canvas (sparks)     : 십자 스파크
     5  scene-overlay       : 그라데이션
     6  dc-lightning-layer  : 번개 (scene-08 스타일)

   타이밍 (오디오 기준):
     0s     씬 활성화 — Phase 1 시작 (루프 번개 + 먹구름)
     1:07   번개/연기 종료, commander2 페이드 인 (9s)  ㅌ
     1:18   별 하늘 + 스파크 페이드 인 (12s)
     1:50   별 페이드 아웃, commander3 페이드 인 (8s)
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-9');
  function rand(min, max) { return min + Math.random() * (max - min); }

  const TOP_RATIO = 0.30;

  /* ── 오디오 타임라인 큐 (초) ── */
  const CUE_CMD    = 63;    /* 1:07 — commander2 페이드 인, 번개/연기 종료 */
  const CUE_STAR   = 72;    /* 1:18 — 별 이펙트 페이드 인 */
  const CUE_STAROUT = 108;   /* 1:48 — 별 페이드 아웃 */
  const CUE_CMD3    = 113;   /* 1:40 — commander3 페이드 인 */
  const CUE_SUNRAY  = 112;   /* 1:51 — 선레이 이미지 버스트 */

  /* ── 전환 지속시간 (ms) ── */
  const SKY_FADE_IN    = 12000;   /* sky + 별 페이드 인 */
  const SKY_FADE_OUT   =  5000;   /* sky + 별 페이드 아웃 */
  const CMD3_FADE_IN   =  8000;   /* commander3 페이드 인 */

  /* ── 큐 상태 ── */
  let cuesFired        = { cmd: false, star: false, starout: false, cmd3: false, sunray: false };
  let lastAudioT       = 0;
  let awaitingSceneAudio = false;  /* 씬 진입 직후 이전 씬 오디오 이벤트 차단 플래그 */

  let timeouts = [];
  function later(fn, ms) { const id = setTimeout(fn, ms); timeouts.push(id); return id; }
  function clearAll()    { timeouts.forEach(clearTimeout); timeouts = []; }

  function fadeTo(el, toOpacity, durationMs, cb) {
    el.style.transition = `opacity ${durationMs / 1000}s ease`;
    void el.offsetWidth;
    el.style.opacity = String(toOpacity);
    if (cb) { const id = setTimeout(cb, durationMs); timeouts.push(id); }
  }

  /* ════════════════════════════════════════════
     ① 번개 오버레이 (scene-08 스타일, z-index: 6)
  ════════════════════════════════════════════ */
  const lightningLayer = document.createElement('div');
  lightningLayer.className = 'dc-lightning-layer';
  sceneEl.appendChild(lightningLayer);

  /* 캔버스는 initBoltCanvas() 에서 lightningLayer 안에 생성 */

  /* ════════════════════════════════════════════
     ② 별 하늘 이미지 오버레이 (z-index: 1)
  ════════════════════════════════════════════ */
  const skyImg = document.createElement('img');
  skyImg.className = 'dc-sky-img';
  skyImg.src = 'Images/commander/9dream-commander2.webp';
  skyImg.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'object-fit:cover',
    'opacity:0',
    'z-index:1',
    'pointer-events:none',
  ].join(';');
  const sceneBg = sceneEl.querySelector('.scene-bg');
  sceneEl.insertBefore(skyImg, sceneBg ? sceneBg.nextSibling : sceneEl.firstChild);

  /* ════════════════════════════════════════════
     ③ Commander 폴더 이미지 오버레이 (z-index: 2)
  ════════════════════════════════════════════ */
  const cmdImg = document.createElement('img');
  cmdImg.className = 'dc-cmd-img';
  cmdImg.src = 'Images/commander/9dream-commander2.webp';
  cmdImg.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'object-fit:cover',
    'opacity:0',
    'z-index:2',
    'pointer-events:none',
  ].join(';');
  sceneEl.appendChild(cmdImg);

  /* ════════════════════════════════════════════
     ④ Commander3 이미지 (z-index: 3)
     별 이펙트 페이드 아웃후에 페이드 인
  ════════════════════════════════════════════ */
  const cmd3Img = document.createElement('img');
  cmd3Img.className = 'dc-cmd3-img';
  cmd3Img.src = 'Images/commander/9dream-commander3.webp';
  cmd3Img.style.cssText = [
    'position:absolute', 'inset:0',
    'width:100%', 'height:100%',
    'object-fit:cover',
    'opacity:0',
    'z-index:3',
    'pointer-events:none',
  ].join(';');
  /* scene-overlay 앞에 삽입 → 그라데이션 레이어 아래 */
  const overlay9 = sceneEl.querySelector('.scene-overlay');
  overlay9 ? sceneEl.insertBefore(cmd3Img, overlay9) : sceneEl.appendChild(cmd3Img);

  /* ════════════════════════════════════════════
     ④-b 선레이 이미지 오버레이 (z-index: 4)
         중심: 56.0% / 61.14%, scale 애니메이션
  ════════════════════════════════════════════ */
  const sunrayImg = document.createElement('img');
  sunrayImg.className = 'dc-sunray-img';
  sunrayImg.src = 'Images/commander/sunray.webp';
  sunrayImg.style.cssText = [
    'position:absolute',
    'left:56%', 'top:61.14%',
    'transform:translate(-50%,-50%) scale(0.3)',
    'opacity:0',
    'z-index:4',
    'pointer-events:none',
  ].join(';');
  overlay9 ? sceneEl.insertBefore(sunrayImg, overlay9) : sceneEl.appendChild(sunrayImg);

  /* ════════════════════════════════════════════
     ④ CSS 흰 점 별 레이어 (z-index: 4, 초기 opacity:0)
  ════════════════════════════════════════════ */
  const starLayer = document.createElement('div');
  starLayer.className = 'dc-star-layer';
  starLayer.style.opacity = '0';
  sceneEl.appendChild(starLayer);

  for (let i = 0; i < 70; i++) {
    const star = document.createElement('div');
    star.className = 'dc-star';
    const size = rand(1.5, 7);
    star.style.width  = size + 'px';
    star.style.height = size + 'px';
    star.style.left   = rand(0, 100) + '%';
    star.style.top    = rand(0, TOP_RATIO * 100) + '%';
    const dur   = rand(0.8, 3.5);
    const delay = -rand(0, 8);
    star.style.animation = `dcStarTwinkle ${dur}s ease-in-out ${delay}s infinite`;
    starLayer.appendChild(star);
  }

  /* ════════════════════════════════════════════
     ⑤ Canvas 십자 스파크 (z-index: 4, 초기 opacity:0)
  ════════════════════════════════════════════ */
  const COLORS = [
    [255,255,255],[220,235,255],[235,220,255],[255,245,200],
    [200,240,255],[255,210,240],[210,255,240],[255,230,200],
  ];

  let canvas, ctx, animId, active = false;
  const NUM_SPARKS = 45;
  let sparks = [];

  class Spark {
    constructor() { this.init(true); }
    init(cold) {
      const W = canvas.width, H = canvas.height;
      this.x = rand(0, W); this.y = rand(0, H * TOP_RATIO);
      this.size = rand(5, 22); this.life = 0;
      this.maxLife = Math.floor(rand(10, 35));
      const c = COLORS[Math.floor(rand(0, COLORS.length))];
      this.r = c[0]; this.g = c[1]; this.b = c[2];
      if (cold) this.life = Math.floor(rand(0, this.maxLife));
    }
    update() { this.life++; if (this.life >= this.maxLife) this.init(false); }
    draw() {
      const t = this.life / this.maxLife;
      const op = Math.sin(t * Math.PI);
      if (op < 0.02) return;
      const s = this.size * (0.5 + op * 0.5), sw = s * 0.12;
      ctx.save();
      ctx.globalAlpha = op;
      ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},0.9)`;
      ctx.shadowBlur  = s * 1.8;
      ctx.fillStyle   = 'rgba(255,255,255,1)';
      ctx.fillRect(this.x - sw/2, this.y - s, sw, s*2);
      ctx.fillRect(this.x - s, this.y - sw/2, s*2, sw);
      ctx.save();
      ctx.translate(this.x, this.y); ctx.rotate(Math.PI/4);
      const ds = s * 0.55;
      ctx.fillRect(-sw*0.6/2, -ds, sw*0.6, ds*2);
      ctx.fillRect(-ds, -sw*0.6/2, ds*2, sw*0.6);
      ctx.restore();
      ctx.shadowBlur = s*3;
      ctx.fillStyle  = `rgba(${this.r},${this.g},${this.b},0.8)`;
      ctx.beginPath(); ctx.arc(this.x, this.y, sw*1.5, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1; ctx.restore();
    }
  }

  /* ════════════════════════════════════════════
     ⑥ 절차적 번개 캔버스 (z-index: 6)
  ════════════════════════════════════════════ */
  let boltCanvas, boltCtx;
  let boltPhase1Active = false;
  let boltFlashActive  = false;

  /* 중점 변위(midpoint displacement) — 들쭉날쭉한 번개 경로 생성 */
  function makeBoltPath(x1, y1, x2, y2, depth) {
    if (depth === 0) return [[x1, y1], [x2, y2]];
    const mx = (x1+x2)/2, my = (y1+y2)/2;
    const dx = x2-x1, dy = y2-y1;
    const len = Math.sqrt(dx*dx + dy*dy);
    const disp = (Math.random()-0.5) * len * 0.42;
    const nx = -dy/len * disp, ny = dx/len * disp;
    const L = makeBoltPath(x1, y1, mx+nx, my+ny, depth-1);
    const R = makeBoltPath(mx+nx, my+ny, x2, y2, depth-1);
    return [...L, ...R.slice(1)];
  }

  /* 메인 볼트 + 브랜치 생성 */
  function generateBolt(dramatic) {
    const W = boltCanvas.width, H = boltCanvas.height;
    const xSpread = dramatic ? 0.18 : 0.25;
    const x1 = rand(W * 0.18, W * 0.82);
    const y1 = rand(-40, H * 0.04);
    const x2 = x1 + rand(-W * xSpread, W * xSpread);
    const y2 = rand(H * 0.38, H * 0.72);
    const main = makeBoltPath(x1, y1, x2, y2, dramatic ? 8 : 7);

    const branches = [];
    const num = Math.floor(rand(2, dramatic ? 6 : 5));
    for (let i = 0; i < num; i++) {
      const idx = Math.floor(rand(main.length * 0.15, main.length * 0.68));
      const [bx, by] = main[idx];
      const bLen = rand(H * 0.08, H * (dramatic ? 0.30 : 0.22));
      const iNext = Math.min(idx + 4, main.length - 1);
      const iPrev = Math.max(idx - 4, 0);
      const angle = Math.atan2(main[iNext][1]-main[iPrev][1], main[iNext][0]-main[iPrev][0])
                  + rand(-0.85, 0.85);
      branches.push(makeBoltPath(bx, by,
        bx + Math.cos(angle)*bLen, by + Math.sin(angle)*bLen,
        dramatic ? 5 : 4));
    }
    return { main, branches };
  }

  /* 단일 경로 렌더: 3-pass (outer glow / mid glow / sharp core) */
  function strokeBoltPath(pts, width, color, alpha, blur) {
    boltCtx.save();
    boltCtx.globalAlpha  = alpha;
    boltCtx.shadowColor  = 'rgba(160,210,255,1)';
    boltCtx.shadowBlur   = blur;
    boltCtx.strokeStyle  = color;
    boltCtx.lineWidth    = width;
    boltCtx.lineCap      = 'round';
    boltCtx.lineJoin     = 'round';
    boltCtx.beginPath();
    boltCtx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) boltCtx.lineTo(pts[i][0], pts[i][1]);
    boltCtx.stroke();
    boltCtx.restore();
  }

  function renderBolt(bolt, alpha) {
    boltCtx.clearRect(0, 0, boltCanvas.width, boltCanvas.height);
    if (alpha <= 0.01) return;
    const all   = [bolt.main, ...bolt.branches];
    const bAlph = alpha * 0.75;
    /* Pass 1: 두꺼운 외곽 글로우 */
    all.forEach((pts, i) =>
      strokeBoltPath(pts, 20, 'rgba(180,220,255,0.5)', (i===0?alpha:bAlph)*0.35, 48));
    /* Pass 2: 중간 글로우 */
    all.forEach((pts, i) =>
      strokeBoltPath(pts, 6,  'rgba(220,240,255,0.85)', (i===0?alpha:bAlph)*0.60, 18));
    /* Pass 3: 선명한 코어 */
    all.forEach((pts, i) =>
      strokeBoltPath(pts, i===0?2:1.2, 'white', i===0?alpha:bAlph*0.85, 0));
  }

  /* 멀티 플리커 시퀀스 */
  const FLASH_PATTERN = [
    { t:   0, op: 0    }, { t:  40, op: 1.00 },
    { t: 150, op: 0.18 }, { t: 185, op: 0.88 },
    { t: 340, op: 0.38 }, { t: 370, op: 0.72 },
    { t: 530, op: 0    }, { t: 830, op: 0    },
    { t: 865, op: 0.82 }, { t:1020, op: 0.12 },
    { t:1055, op: 0.62 }, { t:1250, op: 0    },
  ];

  function runFlashSequence(bolt, onDone) {
    boltFlashActive = true;
    let i = 0;
    function step() {
      if (!boltFlashActive) { boltCtx.clearRect(0,0,boltCanvas.width,boltCanvas.height); return; }
      if (i >= FLASH_PATTERN.length - 1) {
        renderBolt(bolt, 0);
        boltFlashActive = false;
        if (onDone) onDone();
        return;
      }
      const dur = FLASH_PATTERN[i+1].t - FLASH_PATTERN[i].t;
      renderBolt(bolt, FLASH_PATTERN[i].op);
      setTimeout(step, dur);
      i++;
    }
    step();
  }

  /* Phase 1: 불규칙 루프 번개 */
  function startLoopLightning() {
    boltPhase1Active = true;
    function schedule() {
      if (!boltPhase1Active) return;
      later(() => {
        if (!boltPhase1Active) return;
        runFlashSequence(generateBolt(false), schedule);
      }, rand(500, 3000));
    }
    schedule();
  }

  function stopLoopLightning() {
    boltPhase1Active = false;
    if (boltCtx) boltCtx.clearRect(0, 0, boltCanvas.width, boltCanvas.height);
  }

  /* Phase 2: 드라마틱 원샷 번개 */
  function fireLightningFlash() {
    runFlashSequence(generateBolt(true), null);
  }

  function stopAllLightning() {
    boltFlashActive  = false;
    boltPhase1Active = false;
    if (boltCtx) boltCtx.clearRect(0, 0, boltCanvas.width, boltCanvas.height);
  }

  function initBoltCanvas() {
    boltCanvas = document.createElement('canvas');
    boltCanvas.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:100%', 'height:100%', 'pointer-events:none',
    ].join(';');
    boltCanvas.width  = window.innerWidth;
    boltCanvas.height = window.innerHeight;
    boltCtx = boltCanvas.getContext('2d');
    lightningLayer.appendChild(boltCanvas);
  }

  /* ════════════════════════════════════════════
     ⑦ 검은 연기 캔버스 (Phase 1 전용, z-index: 5)
  ════════════════════════════════════════════ */
  let smokeCanvas, smokeCtx, smokeAnimId, smokeActive = false;
  let smokeParticles = [];
  const SMOKE_COUNT = 18;

  class SmokeParticle {
    constructor() { this.reset(true); }
    reset(cold) {
      const W = smokeCanvas.width, H = smokeCanvas.height;
      const fromLeft = Math.random() < 0.5;
      this.x        = fromLeft ? rand(-250, 20) : rand(W - 20, W + 250);
      this.y        = rand(H * 0.04, H * 0.93);
      this.vx       = fromLeft ? rand(0.55, 1.60) : rand(-1.60, -0.55);
      this.vy       = rand(-0.70, 0.20);
      this.waveFreq = rand(0.008, 0.022);
      this.waveOff  = rand(0, Math.PI * 2);
      const mobile  = window.innerWidth < 768;
      this.size     = mobile ? rand(80, 180) : rand(280, 550);
      this.life     = 0;
      this.maxLife  = Math.floor(rand(220, 480));
      this.peakOp   = mobile ? rand(0.10, 0.22) : rand(0.32, 0.62);
      this.opacity  = 0;
      if (cold) this.life = Math.floor(rand(0, this.maxLife));
    }
    update() {
      this.life++;
      this.x += this.vx + Math.sin(this.life * this.waveFreq + this.waveOff) * 0.40;
      this.y += this.vy + Math.cos(this.life * this.waveFreq * 0.8)           * 0.22;
      const t = this.life / this.maxLife;
      this.opacity = t < 0.15 ? (t / 0.15) * this.peakOp
                   : t > 0.75 ? ((1 - t) / 0.25) * this.peakOp
                   : this.peakOp;
      if (this.life >= this.maxLife) this.reset(false);
    }
    draw() {
      if (this.opacity < 0.005) return;
      const g = smokeCtx.createRadialGradient(
        this.x, this.y, 0, this.x, this.y, this.size);
      g.addColorStop(0,    `rgba(3,  2,  8,  ${this.opacity})`);
      g.addColorStop(0.40, `rgba(5,  3, 12,  ${this.opacity * 0.70})`);
      g.addColorStop(0.75, `rgba(8,  5, 16,  ${this.opacity * 0.25})`);
      g.addColorStop(1,    'rgba(0,0,0,0)');
      smokeCtx.fillStyle = g;
      smokeCtx.beginPath();
      smokeCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      smokeCtx.fill();
    }
  }

  function initSmokeCanvas() {
    smokeCanvas = document.createElement('canvas');
    smokeCanvas.style.cssText = [
      'position:absolute', 'top:0', 'left:0',
      'width:100%', 'height:100%',
      'z-index:5', 'opacity:0', 'pointer-events:none',
    ].join(';');
    smokeCanvas.width  = window.innerWidth;
    smokeCanvas.height = window.innerHeight;
    smokeCtx = smokeCanvas.getContext('2d');
    const particleCount = window.innerWidth < 768 ? 7 : SMOKE_COUNT;
    smokeParticles = Array.from({ length: particleCount }, () => new SmokeParticle());
    sceneEl.appendChild(smokeCanvas);
  }

  function smokeLoop() {
    if (!smokeActive) return;
    smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    smokeParticles.forEach(p => { p.update(); p.draw(); });
    smokeAnimId = requestAnimationFrame(smokeLoop);
  }

  function startSmoke() {
    if (smokeActive) return;
    smokeActive = true;
    smokeCanvas.style.transition = 'opacity 0.8s ease';
    smokeCanvas.style.opacity    = '1';
    smokeLoop();
  }

  function stopSmoke() {
    smokeActive = false;
    cancelAnimationFrame(smokeAnimId);
    if (smokeCtx) smokeCtx.clearRect(0, 0, smokeCanvas.width, smokeCanvas.height);
    smokeCanvas.style.transition = 'none';
    smokeCanvas.style.opacity    = '0';
  }

  function initCanvas() {
    canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:absolute','top:0','left:0',
      'width:100%','height:100%',
      'z-index:4','opacity:0','pointer-events:none',
    ].join(';');
    resize(); ctx = canvas.getContext('2d');
    sparks = Array.from({ length: NUM_SPARKS }, () => new Spark());
    sceneEl.appendChild(canvas);
  }

  function resize() {
    if (canvas)       { canvas.width       = window.innerWidth; canvas.height       = window.innerHeight; }
    if (smokeCanvas)  { smokeCanvas.width  = window.innerWidth; smokeCanvas.height  = window.innerHeight; }
    if (boltCanvas)   { boltCanvas.width   = window.innerWidth; boltCanvas.height   = window.innerHeight; }
  }
  function loop()  { if (!active) return; ctx.clearRect(0,0,canvas.width,canvas.height); sparks.forEach(s=>{s.update();s.draw();}); animId = requestAnimationFrame(loop); }
  function startLoop() { if (active) return; active = true; loop(); }
  function stopLoop()  { active = false; cancelAnimationFrame(animId); if (ctx) ctx.clearRect(0,0,canvas.width,canvas.height); }

  window.addEventListener('resize', resize);
  initCanvas();
  initSmokeCanvas();
  initBoltCanvas();

  /* ════════════════════════════════════════════
     타이밍 시퀀스
  ════════════════════════════════════════════ */
  const overlayEl = sceneEl.querySelector('.scene-overlay');

  /* 왼쪽 텍스트 가독성 그라데이션 — 마지막 배경 시에만 페이드 인 */
  const leftGrad = document.createElement('div');
  leftGrad.className = 'dc-left-grad';
  sceneEl.appendChild(leftGrad);

  /* 하단 텍스트 그라데이션 — 항상 표시, 페이드 아웃 대상 아님 */
  const bottomGrad = document.createElement('div');
  bottomGrad.className = 'dc-bottom-grad';
  sceneEl.appendChild(bottomGrad);

  function reset() {
    ['transition','opacity'].forEach(p => {
    [cmdImg, cmd3Img, skyImg, starLayer, canvas].forEach(el => {
        if (p === 'transition') el.style.transition = 'none';
        else el.style.opacity = '0';
      });
    });
    sunrayImg.style.transition = 'none';
    sunrayImg.style.opacity    = '0';
    sunrayImg.style.transform  = 'translate(-50%,-50%) scale(0.3)';
    leftGrad.style.transition  = 'none';
    leftGrad.style.opacity     = '0';
    stopAllLightning();
    stopSmoke();
    if (overlayEl) { overlayEl.style.transition = 'none'; overlayEl.style.opacity = '1'; }
  }

  /* ── 큐 실행 함수 ── */
  function fireCmd() {
    /* 1:07 — 번개/연기 종료, commander2 페이드 인 */
    stopLoopLightning();
    smokeCanvas.style.transition = 'opacity 4s ease';
    smokeCanvas.style.opacity    = '0';
    later(() => stopSmoke(), 4000);
    startLoop();
    later(() => fireLightningFlash(), 1000);
    fadeTo(cmdImg, 1, 9000);
  }

  function fireStar() {
    /* 1:18 — 별 하늘 + 스파크 페이드 인 */
    fadeTo(skyImg,    1, SKY_FADE_IN);
    fadeTo(starLayer, 1, SKY_FADE_IN);
    fadeTo(canvas,    1, SKY_FADE_IN);
  }

  function fireStarOut() {
    /* 1:41 — 별 하늘 + 스파크 페이드 아웃 */
    fadeTo(skyImg,    0, SKY_FADE_OUT);
    fadeTo(starLayer, 0, SKY_FADE_OUT);
    fadeTo(canvas,    0, SKY_FADE_OUT, stopLoop);
  }

  function fireCmd3() {
    /* 1:53 — commander3 페이드 인 */
    fadeTo(cmd3Img,  1, CMD3_FADE_IN);
    fadeTo(leftGrad, 1, CMD3_FADE_IN);
    if (overlayEl) fadeTo(overlayEl, 0, CMD3_FADE_IN);
  }

  function fireSunray() {
    /* 1:51 — 스케일 업 + 페이드 인 (2s), 2s 홀드, 스케일 다운 + 페이드 아웃 (3s) */
    sunrayImg.style.transition = 'opacity 2s ease, transform 2s ease';
    void sunrayImg.offsetWidth;
    sunrayImg.style.opacity   = '1';
    sunrayImg.style.transform = 'translate(-50%,-50%) scale(1)';
    later(() => {
      sunrayImg.style.transition = 'opacity 3s ease, transform 3s ease';
      sunrayImg.style.opacity    = '0';
      sunrayImg.style.transform  = 'translate(-50%,-50%) scale(0.3)';
    }, 2000);
  }

  function checkCues(t) {
    if (t >= CUE_CMD     && !cuesFired.cmd)     { cuesFired.cmd     = true; fireCmd();     }
    if (t >= CUE_STAR    && !cuesFired.star)    { cuesFired.star    = true; fireStar();    }
    if (t >= CUE_STAROUT && !cuesFired.starout) { cuesFired.starout = true; fireStarOut(); }
    if (t >= CUE_CMD3    && !cuesFired.cmd3)    { cuesFired.cmd3    = true; fireCmd3();    }
    if (t >= CUE_SUNRAY  && !cuesFired.sunray)  { cuesFired.sunray  = true; fireSunray();  }
  }

  function runSequence() {
    reset();
    clearAll();
    cuesFired          = { cmd: false, star: false, starout: false, cmd3: false, sunray: false };
    lastAudioT         = 0;     /* 이전 씬 체류 중 누적된 타임스탬프 초기화 */
    awaitingSceneAudio = true;  /* 새 오디오가 시작될 때까지 stale 이벤트 차단 */

    /* 항상 Phase 1 (루프 번개 + 연기) 부터 시작 */
    startLoopLightning();
    startSmoke();

    /* lastAudioT = 0 이므로 어떤 큐도 발동되지 않음 */
    checkCues(0);
  }

  function stop() {
    clearAll();
    stopLoop();
    reset();
  }

  /* ── 오디오 타임 큐 리스너 ── */
  window.addEventListener('audioTimeUpdate', (e) => {
    if (typeof current === 'undefined' || current !== 9) return;
    const t = e.detail.time;

    /* 씬 진입 직후 — 이전 씬 오디오의 stale 타임스탬프 무시.
       새 오디오가 t < 2 에서 시작하면 플래그 해제하고 정상 처리 재개. */
    if (awaitingSceneAudio) {
      lastAudioT = t;
      if (t < 2) awaitingSceneAudio = false;
      return;
    }

    /* 되감기 감지 — 전체 리셋 후 현재 위치에서 재시작 */
    if (t < lastAudioT - 2) {
      lastAudioT = t;
      clearAll();
      reset();
      cuesFired = { cmd: false, star: false, starout: false, cmd3: false, sunray: false };
      if (t < CUE_CMD) {
        startLoopLightning();
        startSmoke();
      }
      checkCues(t);
      return;
    }
    lastAudioT = t;
    checkCues(t);
  });

  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 9) runSequence();
    else stop();
  });

})();
