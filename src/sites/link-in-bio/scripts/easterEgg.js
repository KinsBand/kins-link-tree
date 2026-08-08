class PhysicsParticleRain {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animId = null;
    this.isDragging = false;
    this.draggedParticle = null;
    this.mouse = { x: 0, y: 0 };
    this.boundPointerMove = null;
    this.boundPointerUp = null;
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
      background: 'rgba(10, 10, 14, 0.45)',
      backdropFilter: 'blur(4px)',
      webkitBackdropFilter: 'blur(4px)',
      userSelect: 'none',
      webkitUserSelect: 'none',
    });

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resize();

    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler);

    // Spawn 42 physics particles
    this.particles = [];
    for (let i = 0; i < 42; i++) {
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

    this.createCloseButton();
    this.loop();
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle() {
    const isPick = Math.random() > 0.4; // 60% picks, 40% vinyl records
    return {
      x: Math.random() * (window.innerWidth - 60) + 30,
      y: -Math.random() * 400 - 50,
      vx: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      radius: isPick ? 16 : 20,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.12,
      type: isPick ? 'pick' : 'vinyl',
      color: isPick ? '#E2E8F0' : '#111115',
      bounce: 0.68,
    };
  }

  createCloseButton() {
    const btn = document.createElement('button');
    btn.id = 'easter-egg-close';
    btn.innerHTML = `<i class="fa-solid fa-xmark"></i> <span>CLOSE PLAYGROUND</span>`;
    Object.assign(btn.style, {
      position: 'fixed',
      bottom: '36px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '10000',
      padding: '10px 22px',
      background: 'rgba(18, 18, 22, 0.92)',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      borderRadius: '24px',
      fontFamily: 'var(--font-secondary, monospace)',
      fontWeight: '800',
      fontSize: '0.72rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      backdropFilter: 'blur(12px)',
      webkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.7), 0 0 16px rgba(29,185,84,0.3)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    });

    btn.onmouseenter = () => {
      btn.style.background = '#1DB854';
      btn.style.color = '#000000';
      btn.style.borderColor = '#1DB854';
      btn.style.transform = 'translateX(-50%) scale(1.06)';
    };
    btn.onmouseleave = () => {
      btn.style.background = 'rgba(18, 18, 22, 0.92)';
      btn.style.color = '#FFFFFF';
      btn.style.borderColor = 'rgba(255, 255, 255, 0.25)';
      btn.style.transform = 'translateX(-50%) scale(1)';
    };

    btn.onclick = () => this.destroy();
    document.body.appendChild(btn);
  }

  handlePointerDown(point) {
    if (!point) return;
    this.mouse.x = point.clientX;
    this.mouse.y = point.clientY;

    for (let p of this.particles) {
      const dx = p.x - this.mouse.x;
      const dy = p.y - this.mouse.y;
      if (Math.sqrt(dx * dx + dy * dy) < p.radius * 1.6) {
        this.isDragging = true;
        this.draggedParticle = p;
        break;
      }
    }
  }

  handlePointerMove(point) {
    if (!point) return;
    if (this.isDragging && this.draggedParticle) {
      this.draggedParticle.vx = (point.clientX - this.mouse.x) * 0.65;
      this.draggedParticle.vy = (point.clientY - this.mouse.y) * 0.65;
      this.draggedParticle.x = point.clientX;
      this.draggedParticle.y = point.clientY;
    }
    this.mouse.x = point.clientX;
    this.mouse.y = point.clientY;
  }

  handlePointerUp() {
    this.isDragging = false;
    this.draggedParticle = null;
  }

  drawGuitarPick(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    this.ctx.fillStyle = p.color;
    this.ctx.strokeStyle = '#222225';
    this.ctx.lineWidth = 1.5;

    // Curved Triangle Pick
    this.ctx.beginPath();
    this.ctx.moveTo(0, -p.radius);
    this.ctx.quadraticCurveTo(p.radius, -p.radius * 0.5, p.radius * 0.72, p.radius * 0.82);
    this.ctx.quadraticCurveTo(0, p.radius * 1.35, -p.radius * 0.72, p.radius * 0.82);
    this.ctx.quadraticCurveTo(-p.radius, -p.radius * 0.5, 0, -p.radius);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Center K logo mark
    this.ctx.fillStyle = '#0F0F12';
    this.ctx.font = '900 9px Montserrat, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('K', 0, 1);

    this.ctx.restore();
  }

  drawVinyl(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);

    // Outer Vinyl Disc
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = p.color;
    this.ctx.fill();
    this.ctx.strokeStyle = '#2A2A30';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();

    // Inner Concentric Grooves
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.72, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#222228';
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.5, 0, Math.PI * 2);
    this.ctx.strokeStyle = '#1D1D22';
    this.ctx.stroke();

    // Red Center Label
    this.ctx.beginPath();
    this.ctx.arc(0, 0, p.radius * 0.36, 0, Math.PI * 2);
    this.ctx.fillStyle = '#CF142B';
    this.ctx.fill();

    // Center Spindle Hole
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fill();

    this.ctx.restore();
  }

  update() {
    const gravity = 0.28;
    const friction = 0.985;

    for (let p of this.particles) {
      if (p === this.draggedParticle) continue;

      p.vy += gravity;
      p.vx *= friction;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;

      // Floor bounce
      if (p.y + p.radius > window.innerHeight) {
        p.y = window.innerHeight - p.radius;
        p.vy *= -p.bounce;
        p.vx *= 0.82;
      }

      // Wall bounce
      if (p.x - p.radius < 0) {
        p.x = p.radius;
        p.vx *= -p.bounce;
      } else if (p.x + p.radius > window.innerWidth) {
        p.x = window.innerWidth - p.radius;
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
  }

  loop() {
    this.update();
    this.render();
    this.animId = requestAnimationFrame(() => this.loop());
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    if (this.boundPointerMove) {
      window.removeEventListener('mousemove', this.boundPointerMove);
      window.removeEventListener('touchmove', this.boundPointerMove);
    }
    if (this.boundPointerUp) {
      window.removeEventListener('mouseup', this.boundPointerUp);
      window.removeEventListener('touchend', this.boundPointerUp);
    }
    if (this.canvas) this.canvas.remove();
    const btn = document.getElementById('easter-egg-close');
    if (btn) btn.remove();

    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }
}

export const rainEffect = new PhysicsParticleRain();
