/* ─────────────────────────────────────────────
   SCENE 08 — Crystal Ball
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-8');

  /* ══ 불꽃 레이어 컨테이너 ══ */
  const flameLayer = document.createElement('div');
  flameLayer.className = 'cb-flame-layer';
  sceneEl.appendChild(flameLayer);

  /* ══ 이미지 프레임 ══
     CSS aspect-ratio 2816/1536 + min-width/height 100% →
     background-size:cover 와 동일한 스케일링 자동 처리. */
  const imageFrame = document.createElement('div');
  imageFrame.className = 'cb-image-frame';
  flameLayer.appendChild(imageFrame);

  /* ══ 촛불 심지 끝 좌표 ══
     left / top : 원본 이미지(2816 × 1536px) 기준 심지 끝 %
     size       : 불꽃 너비 (이미지 프레임 너비 기준 %)
  ══════════════════════════════════════════════ */
  const CANDLES = [
    { left: 20.33, top: 18.72, size: 1.40,              slow: false },  // 01 — 왼쪽 큰 촛불
    { left: 29.70, top: 43.46, size: 1.33, height: 7.33, slow: true  },  // 02 — 폭 2/3, 높이 고정
    { left: 33.93, top: 50.83, size: 1.20, height: 8.80, slow: true  },  // 03 — 높이 2배 고정
    { left: 73.42, top: 28.03, size: 1.10,              slow: false },  // 04 — 오른쪽
    { left: 75.41, top: 32.98, size: 1.00,              slow: false },  // 05
    { left: 85.63, top: 35.19, size: 1.20, height: 8.80, slow: true  },  // 06 — 폭 50%, 높이 고정
  ];

  function rand(min, max) { return min + Math.random() * (max - min); }

  CANDLES.forEach((c) => {
    const flame = document.createElement('div');
    flame.className   = 'cb-flame';
    flame.style.left  = c.left + '%';
    flame.style.top   = c.top  + '%';
    flame.style.width = c.size + '%';
    if (c.height) flame.style.height = c.height + '%';  // aspect-ratio 무시하고 높이 고정

    /* slow: true → 1.4~2.2s (천천히), false → 0.6~1.2s (빠른 깜빡임) */
    const dur   = c.slow ? rand(1.4, 2.2) : rand(0.6, 1.2);
    const delay = -rand(0, dur);    // 음수 delay → 로드 시 이미 진행 중
    flame.style.animation = `flameFlicker ${dur}s ease-in-out ${delay}s infinite`;

    imageFrame.appendChild(flame);
  });

  /* ══ 크리스탈 볼 글로우 (SVG, 볼 자체 발광만 유지) ══ */
  (function () {
    const NS = 'http://www.w3.org/2000/svg';
    const CX = 1419.5, CY = 736, R = 245;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 2816 1536');
    Object.assign(svg.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      overflow: 'visible', pointerEvents: 'none',
    });
    svg.innerHTML = `
      <defs>
        <clipPath id="cb-ball-clip">
          <circle cx="${CX}" cy="${CY}" r="${R}"/>
        </clipPath>
        <radialGradient id="cb-mask-grad" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stop-color="white" stop-opacity="1"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
        <mask id="cb-ball-mask">
          <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#cb-mask-grad)"/>
        </mask>
        <radialGradient id="cb-glow-grad" cx="50%" cy="45%" r="50%">
          <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="40%"  stop-color="#88ccff" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="#1144bb" stop-opacity="0"/>
        </radialGradient>
      </defs>
`;
    imageFrame.appendChild(svg);
  })();

  /* ══ 검은 연기 소용돌이 + 절차적 번개 — 크리스탈 볼 canvas ══
     단일 RAF 루프: 연기(항상) + 번개(플래시) 동시 렌더링.
     볼 내부에 검은 연기가 소용돌이치고, 번개가 그 위에 번쩍임. */
  (function () {
    let cbCanvas, cbCtx, cbAnimId, cbActive = false;
    let currentBolt = null, boltAlpha = 0;
    const SMOKE_COUNT = 12;
    let smokeParticles = [];

    /* 볼 위치 동적 계산 */
    function getBallPos() {
      const vw=cbCanvas.width, vh=cbCanvas.height;
      const imgAsp=2816/1536, vAsp=vw/vh;
      const fw = vAsp>imgAsp ? vw : vh*imgAsp;
      const sc = fw/2816;
      return { cx:(vw-fw)/2+1419.5*sc, cy:(vh-(vAsp>imgAsp?vw/imgAsp:vh))/2+736*sc, r:245*sc };
    }

    /* 볼 내부 검은 연기 파티클 */
    class CBSmoke {
      constructor() { this.reset(true); }
      reset(cold) {
        const { cx, cy, r } = getBallPos();
        const angle = rand(0, Math.PI*2), dist = rand(0, r*0.80);
        this.x = cx + Math.cos(angle)*dist;
        this.y = cy + Math.sin(angle)*dist;
        this.vx = rand(-0.22, 0.22); this.vy = rand(-0.22, 0.22);
        this.waveFreq = rand(0.004, 0.012);
        this.waveOff  = rand(0, Math.PI*2);
        this.size    = rand(r*0.14, r*0.44);
        this.life    = 0;
        this.maxLife = Math.floor(rand(320, 720));
        this.peakOp  = rand(0.12, 0.32);
        this.opacity = 0;
        if (cold) this.life = Math.floor(rand(0, this.maxLife));
      }
      update() {
        this.life++;
        this.x += this.vx + Math.sin(this.life*this.waveFreq + this.waveOff)*0.28;
        this.y += this.vy + Math.cos(this.life*this.waveFreq*0.7)*0.18;
        const t = this.life/this.maxLife;
        this.opacity = t < 0.18 ? (t/0.18)*this.peakOp
                     : t > 0.72 ? ((1-t)/0.28)*this.peakOp
                     : this.peakOp;
        if (this.life >= this.maxLife) this.reset(false);
      }
      draw() {
        if (this.opacity < 0.005) return;
        const g = cbCtx.createRadialGradient(
          this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0,   `rgba(4, 2, 14, ${this.opacity})`);
        g.addColorStop(0.5, `rgba(6, 3, 18, ${this.opacity*0.58})`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        cbCtx.fillStyle = g;
        cbCtx.beginPath(); cbCtx.arc(this.x, this.y, this.size, 0, Math.PI*2); cbCtx.fill();
      }
    }

    /* 중점 변위 번개 경로 */
    function makePath(x1, y1, x2, y2, depth) {
      if (depth === 0) return [[x1, y1], [x2, y2]];
      const mx=(x1+x2)/2, my=(y1+y2)/2;
      const dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy);
      const d=(Math.random()-0.5)*len*0.42;
      const nx=-dy/len*d, ny=dx/len*d;
      const L=makePath(x1,y1,mx+nx,my+ny,depth-1);
      const R=makePath(mx+nx,my+ny,x2,y2,depth-1);
      return [...L,...R.slice(1)];
    }

    function generateBolt() {
      const { cx, cy, r } = getBallPos();
      const ox=cx+rand(-r*0.15,r*0.15), oy=cy+rand(-r*0.25,r*0.10);
      return Array.from({ length: Math.floor(rand(3,7)) }, () => {
        const a=rand(0,Math.PI*2), l=rand(r*0.40,r*0.92);
        return makePath(ox, oy, ox+Math.cos(a)*l, oy+Math.sin(a)*l, 5);
      });
    }

    function strokeArm(pts, w, color, alpha, blur) {
      cbCtx.save();
      cbCtx.globalAlpha=alpha; cbCtx.shadowColor='rgba(160,210,255,1)';
      cbCtx.shadowBlur=blur; cbCtx.strokeStyle=color; cbCtx.lineWidth=w;
      cbCtx.lineCap='round'; cbCtx.lineJoin='round';
      cbCtx.beginPath(); cbCtx.moveTo(pts[0][0],pts[0][1]);
      for(let i=1;i<pts.length;i++) cbCtx.lineTo(pts[i][0],pts[i][1]);
      cbCtx.stroke(); cbCtx.restore();
    }

    /* 단일 RAF 루프 */
    function cbLoop() {
      if (!cbActive) return;
      const { cx, cy, r } = getBallPos();
      cbCtx.clearRect(0, 0, cbCanvas.width, cbCanvas.height);

      cbCtx.save();
      cbCtx.beginPath(); cbCtx.arc(cx, cy, r, 0, Math.PI*2); cbCtx.clip();

      smokeParticles.forEach(p => { p.update(); p.draw(); });

      if (currentBolt && boltAlpha > 0.01) {
        currentBolt.forEach(pts => {
          strokeArm(pts, 14, 'rgba(180,220,255,0.5)', boltAlpha*0.32, 20);
          strokeArm(pts,  5, 'rgba(220,240,255,0.9)', boltAlpha*0.58,  9);
          strokeArm(pts, 1.5, 'white', boltAlpha, 0);
        });
      }

      cbCtx.restore();

      cbCtx.save();
      const grd = cbCtx.createRadialGradient(cx, cy, r*0.55, cx, cy, r);
      grd.addColorStop(0,'rgba(0,0,0,0)'); grd.addColorStop(1,'rgba(0,0,0,1)');
      cbCtx.globalCompositeOperation = 'destination-out';
      cbCtx.fillStyle = grd;
      cbCtx.fillRect(0, 0, cbCanvas.width, cbCanvas.height);
      cbCtx.restore();

      cbAnimId = requestAnimationFrame(cbLoop);
    }

    const PATTERN = [
      {t:0,op:0},{t:35,op:1},{t:130,op:0.18},{t:165,op:0.85},
      {t:310,op:0.38},{t:340,op:0.72},{t:500,op:0},
    ];

    function runFlash(arms, onDone) {
      currentBolt = arms; let i = 0;
      function step() {
        if (!cbActive) { currentBolt=null; boltAlpha=0; return; }
        if (i >= PATTERN.length-1) { currentBolt=null; boltAlpha=0; if(onDone) onDone(); return; }
        boltAlpha = PATTERN[i].op;
        setTimeout(step, PATTERN[i+1].t - PATTERN[i].t);
        i++;
      }
      step();
    }

    function startLoop() {
      if (cbActive) return;
      cbActive = true;
      cbAnimId = requestAnimationFrame(cbLoop);
      (function schedule() {
        if (!cbActive) return;
        setTimeout(() => { if (!cbActive) return; runFlash(generateBolt(), schedule); },
          rand(700, 3200));
      })();
    }

    function stopLoop() {
      cbActive = false; cancelAnimationFrame(cbAnimId);
      currentBolt = null; boltAlpha = 0;
      if (cbCtx) cbCtx.clearRect(0, 0, cbCanvas.width, cbCanvas.height);
    }

    cbCanvas = document.createElement('canvas');
    cbCanvas.style.cssText = ['position:absolute','top:0','left:0','width:100%','height:100%','pointer-events:none'].join(';');
    cbCanvas.width = window.innerWidth; cbCanvas.height = window.innerHeight;
    cbCtx = cbCanvas.getContext('2d');
    smokeParticles = Array.from({ length: SMOKE_COUNT }, () => new CBSmoke());
    flameLayer.appendChild(cbCanvas);

    window.addEventListener('resize', () => {
      cbCanvas.width = window.innerWidth; cbCanvas.height = window.innerHeight;
    });

    window.addEventListener('sceneChange', (e) => {
      if (e.detail.index === 8) startLoop(); else stopLoop();
    });

  })();

  /* ══ 연기 SVG — 모르타르 (2121.5, 1008) ══
     viewBox 좌표계 = 원본 이미지(2816×1536)와 동일.
     stroke-dashoffset 애니메이션으로 아래(모르타르)→위 방향으로 그려지며 피어오름.
     path-len ≈ 500 (S커브 호 길이 근사값) */
  (function () {
    const NS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 2816 1536');
    Object.assign(svg.style, {
      position: 'absolute', inset: '0',
      width: '100%', height: '100%',
      overflow: 'visible', pointerEvents: 'none',
    });

    /* 가우시안 블러 필터 */
    svg.innerHTML = `
      <defs>
        <filter id="cb-smoke-blur" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="22"/>
        </filter>
      </defs>`;

    /* 연기 경로 3개 — 모르타르에서 왼쪽으로 치우쳐 올라가며 좌우로 흐름
       제어점을 ±150~220 units 좌우로 벌려 S커브를 크게 만듦 */
    const SMOKE = [
      { d: 'M 2121 1008 C 1913 918 2156 820 1880 722 C 1603 624 1908 528 1606 430 C 1305 332 1624 236 1348 120', w: 80, dur: 6.3, delay:  0   },
      { d: 'M 2121 1008 C 2218 926 1893 840 2000 748 C 2107 656 1745 566 1768 468 C 1792 370 1519 278 1551 160', w: 60, dur: 5.4, delay: -2.1 },
      { d: 'M 2121 1008 C 2022 946 2098 874 1958 800 C 1818 726 1907 648 1778 568 C 1649 488 1732 405 1601 300', w: 44, dur: 7.5, delay: -4.2 },
    ];

    const PATH_LEN = 1250;

    SMOKE.forEach(({ d, w, dur, delay }) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(215, 208, 200, 0.55)');
      path.setAttribute('stroke-width', w);
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('filter', 'url(#cb-smoke-blur)');
      path.style.strokeDasharray  = PATH_LEN;
      path.style.setProperty('--path-len', PATH_LEN);
      path.style.animation = `cbSmokeRise ${dur}s ease-in-out ${delay}s infinite`;
      svg.appendChild(path);
    });

    imageFrame.appendChild(svg);
  })();

  /* ══ 마스크 레이어 (크리스탈 볼 내부, smoke SVG 아래) ══ */
  const maskLayer = document.createElement('div');
  maskLayer.className = 'cb-mask-layer';

  const maskC = document.createElement('img');
  maskC.src = 'Images/crystal/mask-c.webp';
  maskC.className = 'cb-mask-c';
  maskC.draggable = false;

  const maskT = document.createElement('img');
  maskT.src = 'Images/crystal/mask-t.webp';
  maskT.className = 'cb-mask-t';
  maskT.draggable = false;

  maskLayer.appendChild(maskC);
  maskLayer.appendChild(maskT);
  imageFrame.insertBefore(maskLayer, imageFrame.lastElementChild); /* smoke SVG 앞 */

  const MASK_START = 136;  /* 2:16 */
  const MASK_END   = 153;  /* 2:33 */

  window.addEventListener('audioTimeUpdate', (e) => {
    if (typeof current === 'undefined' || current !== 8) return;
    const t = e.detail.time;
    maskLayer.classList.toggle('cb-mask-active', t >= MASK_START && t <= MASK_END);
  });

  /* ══ 씬 이탈 시 레이어 숨김 + 마스크 스트로브 정리 ══ */
  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 8) {
      flameLayer.style.display = '';
    } else {
      flameLayer.style.display = 'none';
      maskLayer.classList.remove('cb-mask-active');  /* 스트로브 애니메이션 확실히 정지 */
    }
  });

})();
