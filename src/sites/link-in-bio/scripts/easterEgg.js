class PhysicsParticleRain {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.sparks = [];
    this.animId = null;
    this.isDragging = false;
    this.draggedParticle = null;
    this.mouse = { x: 0, y: 0 };
    this.lastMouse = { x: 0, y: 0 };
    this.mouseVel = { x: 0, y: 0 };
    this.boundPointerMove = null;
    this.boundPointerUp = null;
    this.resizeHandler = null;
  }

  init() {
    if (document.getElementById('easter-egg-canvas')) return;

    // Create Canvas Overlay
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'easter-egg-canvas';
    Object.assign(this.canvas.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: '9999',
      pointerEvents: 'auto',
      background: 'rgba(8, 8, 12, 0.55)',
      backdropFilter: 'blur(5px)',
      webkitBackdropFilter: 'blur(5px)',
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Floor sentinel element for exact mobile safe-area ground measurement
    if (!document.getElementById('easter-egg-floor-sentinel')) {
      this.sentinel = document.createElement('div');
      this.sentinel.id = 'easter-egg-floor-sentinel';
      Object.assign(this.sentinel.style, {
        position: 'fixed',
        bottom: '0',
        left: '0',
        width: '100%',
        height: '1px',
        paddingBottom: 'max(90px, env(safe-area-inset-bottom, 90px))',
        pointerEvents: 'none',
        zIndex: '9998',
        visibility: 'hidden',
      });
      document.body.appendChild(this.sentinel);
    } else {
      this.sentinel = document.getElementById('easter-egg-floor-sentinel');
    }

    this.resize();

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.resizeHandler);
      window.visualViewport.addEventListener('scroll', this.resizeHandler);
    }

    // Spawn 45 Kins physics particles
    this.particles = [];
    this.sparks = [];
    for (let i = 0; i < 45; i++) {
      this.particles.push(this.createParticle());
    }

    // Pointer Event Handlers
    const getPoint = (e) => (e.touches && e.touches.length ? e.touches[0] : e);

    this.canvas.addEventListener('mousedown', (e) => this.handlePointerDown(getPoint(e)));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handlePointerDown(getPoint(e));
    }, { passive: false });

    this.boundPointerMove = (e) => this.handlePointerMove(getPoint(e));
    this.boundPointerUp = () => this.handlePointerUp();

    window.addEventListener('mousemove', this.boundPointerMove);
    window.addEventListener('touchmove', this.boundPointerMove, { passive: true });
    window.addEventListener('mouseup', this.boundPointerUp);
    window.addEventListener('touchend', this.boundPointerUp);

    this.createPlaygroundHeader();
    this.loop();
  }

  getEffectiveViewportHeight() {
    if (window.visualViewport) {
      return window.visualViewport.height;
    }
    return window.innerHeight;
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = this.getEffectiveViewportHeight();
  }

  createParticle() {
    const isPick = Math.random() > 0.45; // 55% picks, 45% vinyl records
    const colorThemes = ['#1DB854', '#00E5FF', '#F59E0B', '#E5E5E5'];
    const accentColor = colorThemes[Math.floor(Math.random() * colorThemes.length)];

    return {
      x: Math.random() * (window.innerWidth - 80) + 40,
      y: -Math.random() * 450 - 60,
      vx: (Math.random() - 0.5) * 7,
      vy: Math.random() * 3.5 + 2,
      radius: isPick ? 22 : 26,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
      type: isPick ? 'pick' : 'vinyl',
      accentColor: accentColor,
      bounce: 0.72,
    };
  }

  spawnSparks(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.sparks.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 1.5,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.03,
        size: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.5 ? '#1DB854' : '#FFFFFF',
      });
    }
  }

  createPlaygroundHeader() {
    const header = document.createElement('div');
    header.id = 'easter-egg-header';
    header.innerHTML = `
      <div class="easter-pill-left">
        <span class="easter-live-dot"></span>
        <span class="easter-title">🎸 KINS PLAYGROUND</span>
      </div>
      <div class="easter-pill-right">
        <button class="easter-action-btn easter-redo-btn" id="easter-egg-redo" aria-label="Redo Particle Rain">
          <i class="fa-solid fa-rotate-right"></i>
          <span>REDO</span>
        </button>
        <button class="easter-action-btn easter-close-btn" id="easter-egg-close" aria-label="Exit Playground">
          <i class="fa-solid fa-xmark"></i>
          <span>EXIT</span>
        </button>
      </div>
    `;

    Object.assign(header.style, {
      position: 'fixed',
      top: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '10002',
      padding: '8px 14px 8px 18px',
      background: 'rgba(14, 14, 18, 0.94)',
      color: '#FFFFFF',
      border: '1px solid rgba(29, 185, 84, 0.4)',
      borderRadius: '30px',
      fontFamily: 'var(--font-secondary, sans-serif)',
      fontWeight: '800',
      fontSize: '0.74rem',
      letterSpacing: '0.08em',
      backdropFilter: 'blur(16px)',
      webkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 10px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(29, 185, 84, 0.35)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '16px',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    if (!document.getElementById('easter-egg-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'easter-egg-styles';
      styleEl.innerHTML = `
        .easter-pill-left, .easter-pill-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .easter-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #1DB854;
          box-shadow: 0 0 10px #1DB854;
          animation: easterDotPulse 1.4s ease-in-out infinite alternate;
        }
        @keyframes easterDotPulse {
          from { transform: scale(0.85); opacity: 0.7; }
          to { transform: scale(1.25); opacity: 1; box-shadow: 0 0 14px #1DB854; }
        }
        .easter-title {
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #FFFFFF;
        }
        .easter-action-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px 13px;
          border-radius: 18px;
          font-family: inherit;
          font-weight: 800;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .easter-redo-btn:hover {
          background: #1DB854;
          color: #000000;
          border-color: #1DB854;
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(29, 185, 84, 0.5);
        }
        .easter-close-btn:hover {
          background: #CF142B;
          color: #FFFFFF;
          border-color: #CF142B;
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(207, 20, 43, 0.5);
        }
      `;
      document.head.appendChild(styleEl);
    }

    document.body.appendChild(header);

    const closeBtn = document.getElementById('easter-egg-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.destroy();
    }

    const redoBtn = document.getElementById('easter-egg-redo');
    if (redoBtn) {
      redoBtn.onclick = () => {
        this.particles = [];
        this.sparks = [];
        for (let i = 0; i < 45; i++) {
          this.particles.push(this.createParticle());
        }
      };
    }
  }

  handlePointerDown(point) {
    if (!point) return;
    this.mouse.x = point.clientX;
    this.mouse.y = point.clientY;
    this.lastMouse.x = point.clientX;
    this.lastMouse.y = point.clientY;

    for (let p of this.particles) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < p.radius * 1.5) {
        this.isDragging = true;
        this.draggedParticle = p;
        break;
      }
    }
  }

  handlePointerMove(point) {
    if (!point) return;
    this.mouseVel.x = point.clientX - this.lastMouse.x;
    this.mouseVel.y = point.clientY - this.lastMouse.y;

    if (this.isDragging && this.draggedParticle) {
      this.draggedParticle.x = point.clientX;
      this.draggedParticle.y = point.clientY;
      this.draggedParticle.vx = this.mouseVel.x * 0.7;
      this.draggedParticle.vy = this.mouseVel.y * 0.7;
    }

    this.mouse.x = point.clientX;
    this.mouse.y = point.clientY;
    this.lastMouse.x = point.clientX;
    this.lastMouse.y = point.clientY;
  }

  handlePointerUp() {
    if (this.isDragging && this.draggedParticle) {
      this.draggedParticle.vx = this.mouseVel.x * 0.85;
      this.draggedParticle.vy = this.mouseVel.y * 0.85;
    }
    this.isDragging = false;
    this.draggedParticle = null;
  }

  drawGuitarPick(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);

    // Pick Body Gradient
    const pickGrad = this.ctx.createLinearGradient(0, -p.radius, 0, p.radius);
    pickGrad.addColorStop(0, '#24242A');
    pickGrad.addColorStop(1, '#121216');

    // Pick Bevel Outline
    this.ctx.fillStyle = pickGrad;
    this.ctx.strokeStyle = p.accentColor;
    this.ctx.lineWidth = 1.8;

    // Curved Triangle Pick Path
    this.ctx.beginPath();
    this.ctx.moveTo(0, -p.radius * 1.05);
    this.ctx.quadraticCurveTo(p.radius * 1.05, -p.radius * 0.45, p.radius * 0.75, p.radius * 0.85);
    this.ctx.quadraticCurveTo(0, p.radius * 1.35, -p.radius * 0.75, p.radius * 0.85);
    this.ctx.quadraticCurveTo(-p.radius * 1.05, -p.radius * 0.45, 0, -p.radius * 1.05);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();

    // Top Gloss Highlight
    this.ctx.beginPath();
    this.ctx.arc(0, -p.radius * 0.3, p.radius * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.fill();

    // KINS Brand Mark printed on Pick
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 10px Montserrat, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('KINS', 0, 1);

    this.ctx.restore();
  }

  drawVinyl(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);

    // Outer Vinyl Disc
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#111115';
    this.ctx.fill();
    this.ctx.strokeStyle = '#282830';
    this.ctx.lineWidth = 1.4;
    this.ctx.stroke();

    // Shiny Vinyl Reflection Sheen
    const sheenGrad = this.ctx.createLinearGradient(-p.radius, -p.radius, p.radius, p.radius);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    sheenGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.12)');
    this.ctx.fillStyle = sheenGrad;
    this.ctx.fill();

    // Grooves
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.78, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.58, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    this.ctx.stroke();

    // Red Center Label
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.4, 0, Math.PI * 2);
    this.ctx.fillStyle = '#CF142B';
    this.ctx.fill();
    this.ctx.strokeStyle = '#FFD700'; // Gold ring around red label
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // KINS Text on Vinyl Label
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = '900 8px Montserrat, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('KINS', 0, 0);

    // Center Spindle Hole
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    this.ctx.restore();
  }

  drawSparks() {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;

      if (s.life <= 0) {
        this.sparks.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.life;
      this.ctx.fillStyle = s.color;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  getFloorLimit() {
    if (this.sentinel) {
      const rect = this.sentinel.getBoundingClientRect();
      if (rect.top > 0) return rect.top;
    }
    const vpHeight = this.getEffectiveViewportHeight();
    const bottomSafeArea = window.innerWidth < 768 ? 95 : 30;
    return vpHeight - bottomSafeArea;
  }

  update() {
    const gravity = 0.3;
    const friction = 0.985;

    for (let p of this.particles) {
      if (p === this.draggedParticle) continue;

      p.vy += gravity;
      p.vx *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      // Floor bounce - exact mobile ground measurement via sentinel bounding rect
      const floorY = this.getFloorLimit();

      if (p.y + p.radius > floorY) {
        p.y = floorY - p.radius;
        if (Math.abs(p.vy) > 2) {
          this.spawnSparks(p.x, p.y + p.radius, 4);
        }
        p.vy *= -p.bounce;
        p.vx *= 0.82;
      }

      // Wall bounce
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        if (Math.abs(p.vx) > 2) this.spawnSparks(p.x, p.y, 3);
        p.vx *= -p.bounce;
      } else if (p.x + p.radius > window.innerWidth) {
        p.x = window.innerWidth - p.radius;
        if (Math.abs(p.vx) > 2) this.spawnSparks(p.x, p.y, 3);
        p.vx *= -p.bounce;
      }
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let p of this.particles) {
      if (p.type === 'pick') {
        this.drawGuitarPick(p);
      } else {
        this.drawVinyl(p);
      }
    }

    this.drawSparks();
  }

  loop() {
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.resizeHandler);
        window.visualViewport.removeEventListener('scroll', this.resizeHandler);
      }
    }
    if (this.boundPointerMove) {
      window.removeEventListener('mousemove', this.boundPointerMove);
      window.removeEventListener('touchmove', this.boundPointerMove);
    }
    if (this.boundPointerUp) {
      window.removeEventListener('mouseup', this.boundPointerUp);
      window.removeEventListener('touchend', this.boundPointerUp);
    }
    if (this.canvas) this.canvas.remove();
    const header = document.getElementById('easter-egg-header');
    if (header) header.remove();
    const sentinel = document.getElementById('easter-egg-floor-sentinel');
    if (sentinel) sentinel.remove();

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.sparks = [];
    this.sentinel = null;
  }
}

export const rainEffect = new PhysicsParticleRain();
