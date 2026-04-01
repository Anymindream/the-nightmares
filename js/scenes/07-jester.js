/* ─────────────────────────────────────────────
   SCENE 07 — Nightmare Jester
   Effect: Dark melting drips — the opposite of
   Scene 06's mirrorball. Darkness dissolving
   downward, grand and hollow.
───────────────────────────────────────────── */

(function () {
  const sceneEl = document.getElementById('scene-7');

  let canvas, ctx, animId;
  let active = false;

  /* ── 어두운 색상 팔레트 ── */
  const COLORS = [
    [ 18,  4,  38],   /* deep purple-black  */
    [ 45,  5,  18],   /* dark crimson       */
    [ 10,  4,  28],   /* near-black violet  */
    [ 65,  8,  25],   /* dark blood red     */
    [ 20,  5,  55],   /* dark violet        */
    [ 35, 10,  42],   /* bruised purple     */
    [ 55,  4,  12],   /* dark burgundy      */
    [  8,  6,  28],   /* shadow blue-black  */
    [ 80, 15,  30],   /* deep ruby          */
    [ 25,  4,  48],   /* ink purple         */
  ];

  /* ── 블롭 모양 정의 ────────────────────────────────────────
     각 배열 = 꼭짓점 목록. 꼭짓점 수는 자유롭게 추가/삭제 가능.
     각 꼭짓점: [rx, ry]
       rx: 가로 반지름 배율 (1.0 = 기본, 1.5 = 더 넓게, 0.5 = 더 좁게)
       ry: 세로 반지름 배율 (1.0 = 기본, 1.5 = 더 길게, 0.5 = 더 짧게)
     꼭짓점 순서: 12시 방향부터 시계 방향
  ─────────────────────────────────────────────────────────── */
  const BLOB_SHAPES = [
    // 0: 세로로 늘어진 불규칙
    [[0.7, 1.4], [1.2, 1.0], [0.6, 1.5], [1.1, 0.8], [0.8, 1.3], [1.3, 1.1]],
    // 1: 한쪽으로 쏠린 모양
    [[1.4, 0.9], [0.6, 1.3], [1.1, 1.2], [0.8, 0.7], [1.3, 1.4], [0.7, 1.0]],
    // 2: 뭉툭하고 넓적한
    [[1.2, 0.7], [0.9, 1.1], [1.4, 0.8], [1.0, 1.3], [0.8, 0.9], [1.3, 0.7]],
    // 3: 날카로운 돌기 있는 형태
    [[0.5, 1.6], [1.4, 0.7], [0.6, 1.2], [1.5, 0.9], [0.7, 1.4], [1.2, 0.6]],
    // 4: 아메바형
    [[1.1, 1.2], [0.7, 0.8], [1.3, 1.4], [0.9, 0.7], [1.2, 1.1], [0.6, 1.3], [1.4, 0.9]],
    // 5: 세로 길쭉
    [[0.6, 1.5], [0.9, 1.2], [0.7, 1.6], [1.0, 1.1], [0.8, 1.4], [1.1, 1.3]],
  ];

  const NUM_DRIPS  = 70;
  const NUM_SPLATS = 35;   /* 번쩍 효과의 반대: 어두운 얼룩 */
  let drips  = [];
  let splats = [];

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ── 흘러내리는 방울 ── */
  class Drip {
    constructor() { this.init(true); }

    init(cold) {
      const W = canvas.width, H = canvas.height;

      this.x           = rand(0, W);
      this.speed       = rand(0.35, 2.8);
      this.w           = rand(7, 50);
      this.h           = rand(28, 130);
      this.stretchRate = rand(0.0005, 0.002);
      this.rot         = rand(-0.25, 0.25);
      this.sway        = rand(-0.15, 0.15);
      this.swayAcc     = rand(-0.003, 0.003);

      const c = COLORS[Math.floor(rand(0, COLORS.length))];
      this.r = c[0]; this.g = c[1]; this.b = c[2];

      this.maxOp = rand(0.55, 0.90);

      /* BLOB_SHAPES 중 랜덤 픽업 + 미세 변형(±12%) */
      const shape = BLOB_SHAPES[Math.floor(rand(0, BLOB_SHAPES.length))];
      const N = shape.length;
      this.blobPts = [];
      for (let i = 0; i < N; i++) {
        const a  = (i / N) * Math.PI * 2 - Math.PI / 2;
        const rx = shape[i][0] * rand(0.88, 1.12);  /* 미세 변형 */
        const ry = shape[i][1] * rand(0.88, 1.12);
        this.blobPts.push({ a, rx, ry });
      }

      if (cold) {
        this.y = rand(-H * 0.3, H * 1.1);
      } else {
        this.y = rand(-180, -10);
      }
    }

    _drawBlob(rw, rh) {
      const pts = this.blobPts, N = pts.length;
      const vx = pts.map(p => Math.cos(p.a) * rw * p.rx);
      const vy = pts.map(p => Math.sin(p.a) * rh * p.ry);
      ctx.beginPath();
      ctx.moveTo((vx[0] + vx[N-1]) / 2, (vy[0] + vy[N-1]) / 2);
      for (let i = 0; i < N; i++) {
        const nx = (vx[i] + vx[(i+1) % N]) / 2;
        const ny = (vy[i] + vy[(i+1) % N]) / 2;
        ctx.quadraticCurveTo(vx[i], vy[i], nx, ny);
      }
      ctx.closePath();
    }

    update() {
      this.speed += 0.008;
      this.y     += this.speed;
      this.sway  += this.swayAcc;
      this.x     += this.sway * 0.3;
      this.h     += this.stretchRate * this.h;

      if (this.y - this.h > canvas.height + 50) this.init(false);
    }

    draw() {
      const H  = canvas.height;
      let   op = this.maxOp;
      if (this.y < 80)     op *= Math.max(0, this.y / 80);
      if (this.y > H - 60) op *= Math.max(0, (H - this.y + this.h * 0.5) / 60);
      if (op < 0.02) return;

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);

      ctx.shadowColor = `rgba(${this.r+30},${this.g+5},${this.b+20},${op * 0.5})`;
      ctx.shadowBlur  = 18;

      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${op})`;
      this._drawBlob(this.w / 2, this.h / 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${Math.max(0,this.r-10)},${this.g},${Math.max(0,this.b-5)},${op * 0.6})`;
      ctx.save();
      ctx.translate(0, this.h * 0.28);
      this._drawBlob(this.w * 0.28, this.h * 0.28);
      ctx.restore();
      ctx.fill();

      ctx.restore();
    }
  }

  /* ── 어두운 얼룩 (Scene 06 스파클의 반대) ── */
  class Splat {
    constructor() { this.init(true); }

    init(cold) {
      const W = canvas.width, H = canvas.height;
      this.x       = rand(0, W);
      this.y       = rand(0, H);
      this.size    = rand(6, 28);
      this.life    = 0;
      this.maxLife = Math.floor(rand(12, 45));

      const c = COLORS[Math.floor(rand(0, COLORS.length))];
      this.r = c[0]; this.g = c[1]; this.b = c[2];

      if (cold) this.life = Math.floor(rand(0, this.maxLife));
    }

    update() {
      this.life++;
      if (this.life >= this.maxLife) this.init(false);
    }

    draw() {
      const t  = this.life / this.maxLife;
      const op = Math.sin(t * Math.PI) * 0.75;
      if (op < 0.02) return;

      const s  = this.size * (0.6 + op * 0.6);
      const sw = s * 0.22;

      ctx.save();
      ctx.globalAlpha = op;

      ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},0.8)`;
      ctx.shadowBlur  = s * 2;

      ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},1)`;
      ctx.fillRect(this.x - sw / 2, this.y - s, sw, s * 2);
      ctx.fillRect(this.x - s,      this.y - sw / 2, s * 2, sw);

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(Math.PI / 4);
      const ds = s * 0.6;
      ctx.fillRect(-sw * 0.7 / 2, -ds, sw * 0.7, ds * 2);
      ctx.fillRect(-ds, -sw * 0.7 / 2, ds * 2, sw * 0.7);
      ctx.restore();

      /* 중심 흡수점 — 빛 대신 어둠 */
      ctx.fillStyle = `rgba(0,0,0,${op * 0.9})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, sw * 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  /* ── 초기화 ── */
  function init() {
    canvas = document.createElement('canvas');
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

    drips  = Array.from({ length: NUM_DRIPS  }, () => new Drip());
    splats = Array.from({ length: NUM_SPLATS }, () => new Splat());
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
    for (let i = 0; i < drips.length;  i++) { drips[i].update();  drips[i].draw();  }
    for (let i = 0; i < splats.length; i++) { splats[i].update(); splats[i].draw(); }
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
    if (e.detail.index === 7) start();
    else stop();
  });

})();
