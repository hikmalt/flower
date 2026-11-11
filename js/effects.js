/**
 * High-Performance Magical Atmosphere Engine
 * Optimized for 60 FPS with Single-Canvas & Zero-Lag Shaders
 */

(function () {
  'use strict';

  // --- Single Unified Canvas ---
  const canvas = document.getElementById('magical-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: true }) : null;

  let width = window.innerWidth;
  let height = window.innerHeight;
  let dpr = Math.min(window.devicePixelRatio || 1, 1.5); // Cap at 1.5 for buttery smooth performance

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    if (canvas && ctx) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  window.addEventListener('resize', resizeCanvas);

  // ==========================================================================
  // 1. OPTIMIZED TWINKLING STARS (Zero shadowBlur overhead)
  // ==========================================================================
  const stars = [];
  const STAR_COLORS = ['#ffffff', '#fdf0d5', '#caf0f8', '#ffd6ff'];

  function initStars() {
    stars.length = 0;
    // Balanced star count for visual depth without lag
    const starCount = Math.min(Math.floor((width * height) / 7500), 130);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * (height * 0.82),
        radius: Math.random() * 1.3 + 0.4,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        baseAlpha: Math.random() * 0.5 + 0.25,
        twinkleSpeed: Math.random() * 0.03 + 0.015,
        twinklePhase: Math.random() * Math.PI * 2,
        hasCross: Math.random() < 0.08
      });
    }
  }

  function drawStars(now) {
    if (!ctx) return;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const alpha = s.baseAlpha + Math.sin(now * s.twinkleSpeed + s.twinklePhase) * 0.3;
      const clampedAlpha = Math.max(0.1, Math.min(0.95, alpha));

      ctx.globalAlpha = clampedAlpha;
      ctx.fillStyle = s.color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle cross shine for brightest stars without expensive blur
      if (s.hasCross && clampedAlpha > 0.65) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.6;
        const len = s.radius * 3.5;
        ctx.beginPath();
        ctx.moveTo(s.x - len, s.y);
        ctx.lineTo(s.x + len, s.y);
        ctx.moveTo(s.x, s.y - len);
        ctx.lineTo(s.x, s.y + len);
        ctx.stroke();
      }
    }
  }

  // ==========================================================================
  // 2. OPTIMIZED SHOOTING STARS / METEORS
  // ==========================================================================
  const meteors = [];

  class Meteor {
    constructor() {
      this.angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);
      if (Math.random() > 0.5) {
        this.angle = (3 * Math.PI / 4) + (Math.random() * 0.2 - 0.1);
      }

      const isGoingRight = Math.cos(this.angle) > 0;
      this.x = isGoingRight ? Math.random() * (width * 0.5) : (width * 0.5) + Math.random() * (width * 0.5);
      this.y = Math.random() * (height * 0.3) - 20;

      this.speed = Math.random() * 10 + 16;
      this.length = Math.random() * 120 + 90;
      this.opacity = 1;
      this.fadeSpeed = Math.random() * 0.016 + 0.012;
      this.active = true;
    }

    update() {
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      this.opacity -= this.fadeSpeed;

      if (this.opacity <= 0 || this.x < -80 || this.x > width + 80 || this.y > height + 80) {
        this.active = false;
      }
    }

    draw(ctx) {
      if (!this.active || this.opacity <= 0) return;

      const tailX = this.x - Math.cos(this.angle) * this.length;
      const tailY = this.y - Math.sin(this.angle) * this.length;

      const grad = ctx.createLinearGradient(tailX, tailY, this.x, this.y);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      grad.addColorStop(0.7, `rgba(180, 235, 255, ${this.opacity * 0.6})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${this.opacity})`);

      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.strokeStyle = grad;
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();

      // Radiant head
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  let lastMeteorTime = 0;
  let nextMeteorInterval = 1400;

  function handleMeteors(time) {
    if (time - lastMeteorTime > nextMeteorInterval) {
      meteors.push(new Meteor());
      const r = Math.random();
      if (r < 0.4) {
        setTimeout(() => meteors.push(new Meteor()), 300);
      }
      lastMeteorTime = time;
      nextMeteorInterval = Math.random() * 2200 + 1300; // Continuous natural pace
    }

    for (let i = meteors.length - 1; i >= 0; i--) {
      meteors[i].update();
      meteors[i].draw(ctx);
      if (!meteors[i].active) {
        meteors.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // 3. OPTIMIZED FIREFLIES (Dual-Arc concentric circles, 0ms lag)
  // ==========================================================================
  const fireflies = [];
  const FIREFLY_COUNT = 20;

  function initFireflies() {
    fireflies.length = 0;
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      fireflies.push({
        x: Math.random() * width,
        y: (height * 0.35) + Math.random() * (height * 0.6),
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.8 + 1.2,
        isGolden: Math.random() > 0.35,
        pulseSpeed: Math.random() * 0.035 + 0.02,
        phase: Math.random() * Math.PI * 2,
        wobble: Math.random() * 10
      });
    }
  }

  function updateAndDrawFireflies(now) {
    if (!ctx) return;

    for (let f of fireflies) {
      f.wobble += 0.02;
      f.x += f.vx + Math.sin(f.wobble) * 0.4;
      f.y += f.vy + Math.cos(f.wobble) * 0.4;

      if (f.x < -15) f.x = width + 15;
      if (f.x > width + 15) f.x = -15;
      if (f.y < height * 0.3) f.vy = Math.abs(f.vy);
      if (f.y > height - 20) f.vy = -Math.abs(f.vy);

      const alpha = 0.35 + Math.sin(now * f.pulseSpeed + f.phase) * 0.45;
      if (alpha <= 0.05) continue;

      const r = f.isGolden ? '255, 235, 130' : '110, 255, 225';

      // Outer faint aura
      ctx.globalAlpha = alpha * 0.25;
      ctx.fillStyle = `rgb(${r})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Bright inner core
      ctx.globalAlpha = alpha * 0.9;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ==========================================================================
  // 4. OPTIMIZED FALLING PETALS
  // ==========================================================================
  const petals = [];
  const PETAL_COUNT = 16;

  class Petal {
    constructor(randomY = false) {
      this.reset(randomY);
    }

    reset(randomY = false) {
      this.x = Math.random() * width;
      this.y = randomY ? Math.random() * height : -25;
      this.size = Math.random() * 7 + 6;
      this.speedY = Math.random() * 0.9 + 0.7;
      this.speedX = Math.random() * 0.5 - 0.25;
      this.swingAmp = Math.random() * 1.5 + 0.8;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotSpeed = (Math.random() - 0.5) * 0.025;
      this.flip = Math.random() * Math.PI;
      this.flipSpeed = Math.random() * 0.035 + 0.015;
      this.alpha = Math.random() * 0.35 + 0.55;
      this.color = Math.random() > 0.4 ? '255, 160, 150' : '255, 195, 205';
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.015) * this.swingAmp;
      this.rotation += this.rotSpeed;
      this.flip += this.flipSpeed;

      if (this.y > height + 25) {
        this.reset();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.scale(1, Math.cos(this.flip));
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = `rgb(${this.color})`;

      ctx.beginPath();
      ctx.moveTo(0, -this.size);
      ctx.bezierCurveTo(this.size * 0.75, -this.size * 0.4, this.size * 0.65, this.size * 0.5, 0, this.size);
      ctx.bezierCurveTo(-this.size * 0.65, this.size * 0.5, -this.size * 0.75, -this.size * 0.4, 0, -this.size);
      ctx.fill();

      ctx.restore();
    }
  }

  function initPetals() {
    petals.length = 0;
    for (let i = 0; i < PETAL_COUNT; i++) {
      petals.push(new Petal(true));
    }
  }

  function handlePetals() {
    if (!ctx) return;
    for (let p of petals) {
      p.update();
      p.draw(ctx);
    }
  }

  // ==========================================================================
  // 5. INTERACTIVE PARTICLES (MOUSE & TOUCH)
  // ==========================================================================
  const sparkles = [];

  class Sparkle {
    constructor(x, y, vx, vy, isHeart = false) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.isHeart = isHeart;
      this.alpha = 1;
      this.decay = Math.random() * 0.025 + 0.02;
      this.size = isHeart ? 11 : Math.random() * 2.5 + 1.2;
      this.color = isHeart ? '#ff758f' : '#ffe49e';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.03;
      this.alpha -= this.decay;
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.globalAlpha = Math.max(0, this.alpha);

      if (this.isHeart) {
        ctx.font = '11px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💖', this.x, this.y);
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let lastTrailTime = 0;
  function spawnSparkleTrail(x, y) {
    const now = performance.now();
    if (now - lastTrailTime < 24) return;
    lastTrailTime = now;
    if (sparkles.length > 28) return;
    sparkles.push(new Sparkle(x, y, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2 - 0.3, false));
  }

  function spawnBurst(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      sparkles.push(new Sparkle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, false));
    }
    for (let i = 0; i < 4; i++) {
      sparkles.push(new Sparkle(x, y, (Math.random() - 0.5) * 3, -Math.random() * 3 - 1.5, true));
    }
  }

  function handleSparkles() {
    if (!ctx) return;
    for (let i = sparkles.length - 1; i >= 0; i--) {
      const p = sparkles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) {
        sparkles.splice(i, 1);
      }
    }
  }

  // === [3D-INTERACTION-FEATURE-START] ===
  // 3D Orbital Physics & Interactive Touch/Mouse Drag Engine
  const stage3D = document.getElementById('stage3D');
  let isDragging3D = false;
  let startPointerX = 0;
  let startPointerY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let targetAngleY = 0;
  let targetAngleX = 0;
  let currentAngleY = 0;
  let currentAngleX = 0;
  let totalDragDistance = 0;
  let lastClickTime = 0;

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#soundToggleBtn')) return;

    // Double tap/click detection to smoothly reset orientation to original view
    const now = Date.now();
    if (now - lastClickTime < 320) {
      targetAngleY = 0;
      targetAngleX = 0;
      spawnBurst(e.clientX, e.clientY);
      lastClickTime = 0;
      return;
    }
    lastClickTime = now;

    isDragging3D = true;
    startPointerX = e.clientX;
    startPointerY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
    totalDragDistance = 0;
    if (stage3D) stage3D.classList.add('grabbing');
  }, { passive: true });

  window.addEventListener('pointermove', (e) => {
    spawnSparkleTrail(e.clientX, e.clientY);

    if (!isDragging3D) return;

    const dx = e.clientX - lastPointerX;
    const dy = e.clientY - lastPointerY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;

    totalDragDistance += Math.hypot(dx, dy);

    // Highly responsive 1:1 tactile drag sensitivity
    const sensitivityX = 0.45;
    const sensitivityY = 0.35;

    targetAngleY += dx * sensitivityX;
    targetAngleX -= dy * sensitivityY;

    // Vertical angle clamped to natural safe view range
    targetAngleX = Math.max(-18, Math.min(32, targetAngleX));

    // Continuous 360° horizontal orbit wrap-around
    if (targetAngleY > 180) {
      targetAngleY -= 360;
      currentAngleY -= 360;
    } else if (targetAngleY < -180) {
      targetAngleY += 360;
      currentAngleY += 360;
    }
  }, { passive: true });

  function end3DDrag() {
    if (!isDragging3D) return;
    isDragging3D = false;
    if (stage3D) stage3D.classList.remove('grabbing');
  }

  window.addEventListener('pointerup', (e) => {
    if (isDragging3D && totalDragDistance < 8) {
      spawnBurst(e.clientX, e.clientY);
    }
    end3DDrag();
  });

  window.addEventListener('pointercancel', end3DDrag);

  function update3DStage(now) {
    if (!stage3D) return;

    // Snappy, instant tactile response while dragging (0.35); silky float when released (0.045)
    const lerpFactor = isDragging3D ? 0.35 : 0.045;

    // Gentle natural breathing sway when idle
    const breathingY = Math.sin(now * 0.0012) * 1.5;
    const breathingX = Math.cos(now * 0.0009) * 0.8;

    const prevY = currentAngleY;
    const prevX = currentAngleX;

    currentAngleY += (targetAngleY + (isDragging3D ? 0 : breathingY) - currentAngleY) * lerpFactor;
    currentAngleX += (targetAngleX + (isDragging3D ? 0 : breathingX) - currentAngleX) * lerpFactor;

    // Only update DOM style if there is a measurable change to save GPU/CPU cycles
    if (isDragging3D || Math.abs(currentAngleY - prevY) > 0.005 || Math.abs(currentAngleX - prevX) > 0.005) {
      stage3D.style.transform = `rotateX(${currentAngleX.toFixed(2)}deg) rotateY(${currentAngleY.toFixed(2)}deg)`;
    }
  }
  // === [3D-INTERACTION-FEATURE-END] ===

  // ==========================================================================
  // 6. ANIMATION LOOP & TAB VISIBILITY PAUSE
  // ==========================================================================
  let isPageVisible = true;
  let animFrameId = null;

  function render(timestamp) {
    if (!ctx || !isPageVisible) return;

    // === [3D-INTERACTION-FEATURE-START] ===
    update3DStage(timestamp);
    // === [3D-INTERACTION-FEATURE-END] ===

    ctx.clearRect(0, 0, width, height);

    // Layer 1: Stars
    drawStars(timestamp * 0.001);

    // Layer 2: Shooting Stars
    handleMeteors(timestamp);

    // Layer 3: Fireflies
    updateAndDrawFireflies(timestamp * 0.001);

    // Layer 4: Petals
    handlePetals();

    // Layer 5: Interactive Sparkles
    handleSparkles();

    animFrameId = requestAnimationFrame(render);
  }

  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      if (!animFrameId) animFrameId = requestAnimationFrame(render);
    } else {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }
  });

  // ==========================================================================
  // 7. LIGHTWEIGHT OFFLINE MUSIC BOX SYNTHESIZER
  // ==========================================================================
  let audioCtx = null;
  let isPlayingMusic = false;
  let musicTimer = null;

  const N = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
    C6: 1046.50, D6: 1174.66, E6: 1318.51
  };

  const MELODY_SEQUENCE = [
    { note: N.C4, dur: 0.8 }, { note: N.G4, dur: 0.4 }, { note: N.C5, dur: 0.4 }, { note: N.E5, dur: 0.6 },
    { note: N.G5, dur: 0.4 }, { note: N.B5, dur: 0.8 },
    { note: N.A4, dur: 0.8 }, { note: N.E5, dur: 0.4 }, { note: N.A5, dur: 0.4 }, { note: N.C6, dur: 0.6 },
    { note: N.B5, dur: 0.4 }, { note: N.G5, dur: 0.8 },
    { note: N.F4, dur: 0.8 }, { note: N.C5, dur: 0.4 }, { note: N.F5, dur: 0.4 }, { note: N.A5, dur: 0.6 },
    { note: N.G5, dur: 0.4 }, { note: N.E5, dur: 0.8 },
    { note: N.G4, dur: 0.8 }, { note: N.D5, dur: 0.4 }, { note: N.G5, dur: 0.4 }, { note: N.B5, dur: 0.6 },
    { note: N.A5, dur: 0.4 }, { note: N.D6, dur: 0.8 },
    { note: N.E4, dur: 0.8 }, { note: N.B4, dur: 0.4 }, { note: N.E5, dur: 0.4 }, { note: N.G5, dur: 0.6 },
    { note: N.B5, dur: 0.4 }, { note: N.E6, dur: 0.8 },
    { note: N.F4, dur: 0.8 }, { note: N.A4, dur: 0.4 }, { note: N.C5, dur: 0.4 }, { note: N.E5, dur: 0.6 },
    { note: N.D5, dur: 0.4 }, { note: N.C5, dur: 0.8 }
  ];

  function playTone(freq, duration = 1.0) {
    if (!audioCtx || !isPlayingMusic) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.05);
    } catch (e) {
      // Audio fallback silent
    }
  }

  let stepIdx = 0;
  function scheduleNextNote() {
    if (!isPlayingMusic) return;
    const item = MELODY_SEQUENCE[stepIdx];
    playTone(item.note, item.dur * 1.3);

    stepIdx = (stepIdx + 1) % MELODY_SEQUENCE.length;
    musicTimer = setTimeout(scheduleNextNote, item.dur * 480);
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
  }

  function startMusic() {
    initAudio();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if (!isPlayingMusic) {
      isPlayingMusic = true;
      scheduleNextNote();
      const soundBtn = document.getElementById('soundToggleBtn');
      if (soundBtn) soundBtn.classList.add('playing');
    }
  }

  function toggleMusic() {
    initAudio();
    const soundBtn = document.getElementById('soundToggleBtn');
    if (isPlayingMusic) {
      isPlayingMusic = false;
      clearTimeout(musicTimer);
      if (soundBtn) soundBtn.classList.remove('playing');
    } else {
      startMusic();
    }
  }

  const unlockEvents = ['click', 'touchstart', 'pointerdown', 'keydown', 'scroll'];
  function onGestureUnlock() {
    startMusic();
    unlockEvents.forEach(evt => window.removeEventListener(evt, onGestureUnlock));
  }
  unlockEvents.forEach(evt => window.addEventListener(evt, onGestureUnlock, { passive: true }));

  // ==========================================================================
  // 8. AUTOMATIC THEME CYCLING (BERGANTI-GANTI SENDIRI)
  // ==========================================================================
  const THEMES = [
    { name: 'Original Sunset', filter: 'none' },
    { name: 'Sakura Dream', filter: 'hue-rotate(300deg) saturate(1.2)' },
    { name: 'Cosmic Galaxy', filter: 'hue-rotate(185deg) saturate(1.25)' },
    { name: 'Golden Emerald', filter: 'hue-rotate(55deg) saturate(1.3)' }
  ];
  let currentThemeIdx = 0;

  function autoCycleTheme() {
    currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
    document.documentElement.style.setProperty('--theme-filter', THEMES[currentThemeIdx].filter);
  }

  setInterval(autoCycleTheme, 9000);

  // ==========================================================================
  // 9. PRELOADER & INITIALIZATION
  // ==========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    resizeCanvas();
    initStars();
    initFireflies();
    initPetals();

    // Start single high-performance render loop
    animFrameId = requestAnimationFrame(render);

    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) soundBtn.addEventListener('click', toggleMusic);

    startMusic();

    // Preloader smooth dissolve after warmup (1.1s)
    setTimeout(() => {
      const preloader = document.getElementById('preloader');
      if (preloader) {
        preloader.classList.add('fade-out');
      }
      document.body.classList.remove('container');
    }, 1100);
  });

  window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('fade-out');
    }
    document.body.classList.remove('container');
    startMusic();
  });

})();
