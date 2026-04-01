/* ─────────────────────────────────────────────
   SCENE 06 — Between Dreams and Reality
   Effect: Mirrorball — colorful light flecks
   sweeping across the entire screen
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-6');

  let canvas, ctx, animId;
  let active = false;

  /* ── 색상 팔레트 (vivid, playful) ── */
  const COLORS = [
    [255, 210,  80],   /* warm gold    */
    [255, 120, 160],   /* hot pink     */
    [100, 220, 255],   /* sky cyan     */
    [200, 100, 255],   /* purple       */
    [255, 145,  60],   /* coral orange */
    [100, 255, 190],   /* mint green   */
    [255, 240, 160],   /* cream yellow */
    [220, 140, 255],   /* lilac        */
    [255,  80, 120],   /* rose red     */
    [ 80, 200, 255],   /* electric blue*/
    [255, 255, 200],   /* bright white */
    [255, 180,  50],   /* amber        */
    [ 50, 255, 230],   /* aqua         */
    [255,  60, 200],   /* magenta      */
    [160, 255, 100],   /* lime green   */
    [255, 200, 220],   /* pastel pink  */
  ];

  const NUM_FLECKS = 130;
  let flecks = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ── 빛 조각 클래스 ── */
  class Fleck {
    constructor(stagger) {
      this._stagger = stagger || false;
      this.init();
    }

    init() {
      const W = canvas.width;
      const H = canvas.height;
      const D = Math.hypot(W, H);

      /* 궤도 중심: 화면 안/밖 더 넓게 */
      this.ocx = rand(-W * 0.5, W * 1.5);
      this.ocy = rand(-H * 0.5, H * 1.5);

      /* 궤도 반지름: 더 극단적인 범위 */
      this.or  = rand(D * 0.05, D * 1.1);

      /* 시작 각도 */
      this.angle = rand(0, Math.PI * 2);

      /* 각속도: 빠르고 다양 (±방향) */
      this.speed = rand(0.0008, 0.003) * (Math.random() < 0.5 ? 1 : -1);

      /* 타일 크기: 더 다양하게 (아주 작은 것 ~ 큰 것) */
      this.tw = rand(6, 58);
      this.th = this.tw * rand(0.3, 1.1);

      /* 타일 자체 회전 */
      this.rot      = rand(0, Math.PI * 2);
      this.rotSpeed = rand(-0.006, 0.006);

      /* 색상 */
      const c   = COLORS[Math.floor(rand(0, COLORS.length))];
      this.r = c[0]; this.g = c[1]; this.b = c[2];

      /* 투명도 라이프사이클 */
      this.maxOp       = rand(0.5, 0.98);
      this.fadeFrames  = Math.floor(rand(20, 80));
      this.holdFrames  = Math.floor(rand(30, 200));
      this.phase       = 'fadein';
      this.timer       = 0;
      this.opacity     = 0;

      /* 스태거: 처음부터 이미 진행 중인 것처럼 시작 */
      if (this._stagger) {
        this._stagger = false;
        const skip = Math.floor(rand(0, this.fadeFrames + this.holdFrames));
        for (let i = 0; i < skip; i++) this._step();
      }
    }

    /* 내부 step (스태거용, 화면 밖에서 실행) */
    _step() {
      this.angle += this.speed;
      this.rot   += this.rotSpeed;
      this.timer++;
      if (this.phase === 'fadein') {
        this.opacity = Math.min(this.opacity + this.maxOp / this.fadeFrames, this.maxOp);
        if (this.timer >= this.fadeFrames) { this.phase = 'hold'; this.timer = 0; }
      } else if (this.phase === 'hold') {
        if (this.timer >= this.holdFrames) { this.phase = 'fadeout'; this.timer = 0; }
      } else {
        this.opacity = Math.max(this.opacity - this.maxOp / this.fadeFrames, 0);
        if (this.timer >= this.fadeFrames) this.init();
      }
    }

    update() {
      this._step();
    }

    draw() {
      const x = this.ocx + Math.cos(this.angle) * this.or;
      const y = this.ocy + Math.sin(this.angle) * this.or;
      if (this.opacity < 0.01) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(this.rot);

      /* 글로우 */
      ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},${this.opacity * 0.75})`;
      ctx.shadowBlur  = 22;

      /* 본체 */
      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.opacity})`;
      ctx.fillRect(-this.tw / 2, -this.th / 2, this.tw, this.th);

      /* 중앙 하이라이트 (반짝임) */
      ctx.shadowBlur = 0;
      ctx.fillStyle  = `rgba(255,255,255,${this.opacity * 0.35})`;
      ctx.fillRect(-this.tw * 0.28, -this.th * 0.28, this.tw * 0.56, this.th * 0.56);

      ctx.restore();
    }
  }

  /* ── 번쩍 스파클 클래스 ── */
  const NUM_SPARKS = 55;
  let sparks = [];

  class Spark {
    constructor() { this.init(true); }

    init(cold) {
      const W = canvas.width, H = canvas.height;
      this.x   = rand(0, W * 0.5);
      this.y   = rand(0, H);
      this.size = rand(4, 22);          /* 십자 길이 */
      this.life = 0;
      this.maxLife = Math.floor(rand(8, 28));
      /* 랜덤 색상 (흰색 섞기) */
      const c = COLORS[Math.floor(rand(0, COLORS.length))];
      this.r = c[0]; this.g = c[1]; this.b = c[2];
      /* cold start: 이미 진행 중인 것처럼 */
      if (cold) this.life = Math.floor(rand(0, this.maxLife));
    }

    update() {
      this.life++;
      if (this.life >= this.maxLife) this.init(false);
    }

    draw() {
      /* 삶의 중간(50%)에서 최대 밝기, 양끝에서 0 */
      const t  = this.life / this.maxLife;
      const op = Math.sin(t * Math.PI);   /* 0 → 1 → 0 */
      if (op < 0.02) return;

      const s  = this.size * (0.5 + op * 0.5);
      const sw = s * 0.12;               /* 십자 두께 */

      ctx.save();
      ctx.globalAlpha = op;

      /* 외곽 글로우 */
      ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},0.9)`;
      ctx.shadowBlur  = s * 1.8;

      /* 십자 (수직 + 수평) */
      ctx.fillStyle = `rgba(255,255,255,1)`;
      ctx.fillRect(this.x - sw / 2, this.y - s, sw, s * 2);
      ctx.fillRect(this.x - s,      this.y - sw / 2, s * 2, sw);

      /* 대각선 (45°) — 더 작게 */
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI / 4);
      const ds = s * 0.55;
      ctx.fillRect(-sw * 0.6 / 2, -ds, sw * 0.6, ds * 2);
      ctx.fillRect(-ds, -sw * 0.6 / 2, ds * 2, sw * 0.6);
      ctx.restore();

      /* 중심 빛점 */
      ctx.shadowBlur = s * 3;
      ctx.fillStyle  = `rgba(${this.r},${this.g},${this.b},0.8)`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, sw * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  /* ── 왼쪽 텍스트 가독성 그라데이션 ── */
  const leftGrad = document.createElement('div');
  leftGrad.className = 'bt-left-grad';
  sceneEl.appendChild(leftGrad);

  /* ── 초기화 ── */
  function init() {
    canvas           = document.createElement('canvas');
    canvas.style.cssText = [
      'position:absolute',
      'top:0',
      'left:0',
      'width:100%',
      'height:100%',
      'z-index:4',
      'pointer-events:none',
    ].join(';');
    resize();
    ctx = canvas.getContext('2d');

    flecks = Array.from({ length: NUM_FLECKS }, () => new Fleck(true));
    sparks = Array.from({ length: NUM_SPARKS  }, () => new Spark());
    sceneEl.appendChild(canvas);
  }

  function resize() {
    if (!canvas) return;
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /* ── 애니메이션 루프 ── */
  function loop() {
    if (!active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < flecks.length; i++) {
      flecks[i].update();
      flecks[i].draw();
    }
    for (let i = 0; i < sparks.length; i++) {
      sparks[i].update();
      sparks[i].draw();
    }
    animId = requestAnimationFrame(loop);
  }

  function start() {
    if (active) return;
    active = true;
    loop();
  }

  function stop() {
    active = false;
    cancelAnimationFrame(animId);
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize);

  init();

  window.addEventListener('sceneChange', (e) => {
    if (e.detail.index === 6) start();
    else stop();
  });

})();
