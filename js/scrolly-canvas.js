/**
 * High-Performance Scroll-Driven Automotive Transformation Engine
 * We Care Auto Repair
 * 
 * Features:
 * - Preloaded 144 high-res frames with HUD progress
 * - Physics LERP dampening for buttery smooth transitions
 * - Retina/High-DPI canvas buffer support with containment & auto-centering
 * - Scrollytelling milestone triggers & phase detection
 * - Pulsing vehicle hotspots with specs
 * - Scrub bar & chapter navigation
 * - Auto-play showcase mode
 */

class ScrollyCarEngine {
  constructor(options = {}) {
    this.container = document.querySelector(options.container || '#car-scrolly-section');
    this.canvas = document.querySelector(options.canvas || '#car-canvas');
    this.track = document.querySelector(options.track || '.scrolly-track');
    
    if (!this.container || !this.canvas || !this.track) {
      console.warn('ScrollyCarEngine: Required DOM elements missing.');
      return;
    }

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    
    // Configuration
    this.totalFrames = options.totalFrames || 300;
    this.framePathPattern = options.framePathPattern || 'assets/frames/ezgif-frame-{INDEX}.jpg';
    this.lerpFactor = options.lerpFactor || (window.innerWidth < 768 ? 0.16 : 0.12); // Responsive touch smoothness
    
    // State
    this.images = [];
    this.loadedImages = 0;
    this.isLoaded = false;
    this.targetProgress = 0;
    this.currentProgress = 0;
    this.renderedFrameIndex = -1;
    this.currentPhase = 1;
    this.isAutoPlaying = false;
    this.autoPlaySpeed = 0.0015;
    this.autoPlayDirection = 1;
    this.isScrubbing = false;

    // Hotspot definitions mapped to normalized scroll ranges [startProgress, endProgress]
    this.hotspots = [
      {
        id: 'splitter',
        name: 'Aero Carbon Splitter & Vented Hood',
        desc: 'Downforce-optimized front carbon splitter with dual aerodynamic hood extraction vents.',
        x: 48, // % from left
        y: 64, // % from top
        phase: [0.28, 0.70]
      },
      {
        id: 'wheels',
        name: 'Forged Ultralight Alloys & Michelin Pilot Sport',
        desc: '18-inch forged monoblock racing wheels wrapped in ultra-high-grip Michelin competition rubber.',
        x: 71,
        y: 72,
        phase: [0.38, 0.95]
      },
      {
        id: 'livery',
        name: 'Bespoke Satin Gunmetal Wrap & Race Livery',
        desc: 'Precision dual-tone vinyl wrap with ceramic protective layer and Michelin motorsports decals.',
        x: 52,
        y: 48,
        phase: [0.65, 1.0]
      },
      {
        id: 'doors',
        name: 'Cockpit Race Prep & Open Access Doors',
        desc: 'Track-ready door modification, reinforced chassis stiffening, and race telemetry integration.',
        x: 82,
        y: 42,
        phase: [0.85, 1.0]
      }
    ];

    // Phases metadata
    this.phases = [
      { id: 1, range: [0.00, 0.25], name: 'Baseline Diagnostics', tag: '01 / BASELINE SCAN' },
      { id: 2, range: [0.25, 0.55], name: 'Aero & Performance Suspension', tag: '02 / AERO & TUNING' },
      { id: 3, range: [0.55, 0.85], name: 'Bespoke Dual-Tone Livery', tag: '03 / SATIN WRAP' },
      { id: 4, range: [0.85, 1.00], name: 'Track-Ready Unleashed', tag: '04 / RACE SPEC #42' }
    ];

    this.init();
  }

  init() {
    this.bindUI();
    this.setupResize();
    this.preloadFrames();
    this.setupScrollListener();
    this.setupScrubBar();
    this.setupHotspots();
    this.startRenderLoop();
  }

  bindUI() {
    this.preloader = document.querySelector('.scrolly-preloader');
    this.preloaderFill = document.querySelector('.preloader-bar-fill');
    this.preloaderStatus = document.querySelector('.preloader-status');
    this.frameCounter = document.querySelector('.frame-counter');
    this.storyCards = document.querySelectorAll('.story-card');
    this.chapterBtns = document.querySelectorAll('.chapter-btn');
    this.scrubProgress = document.querySelector('.scrub-progress');
    this.scrubThumb = document.querySelector('.scrub-thumb');
    this.scrubTrack = document.querySelector('.scrub-track');
    this.autoPlayBtn = document.querySelector('#btn-autoplay');
    this.hotspotContainer = document.querySelector('.hotspot-layer');

    if (this.autoPlayBtn) {
      this.autoPlayBtn.addEventListener('click', () => this.toggleAutoPlay());
    }

    if (this.chapterBtns.length > 0) {
      this.chapterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const targetPhase = parseInt(e.currentTarget.dataset.targetPhase, 10);
          this.jumpToPhase(targetPhase);
        });
      });
    }
  }

  getFrameUrl(index) {
    const formattedNum = String(index).padStart(3, '0');
    return this.framePathPattern.replace('{INDEX}', formattedNum);
  }

  preloadFrames() {
    let loaded = 0;
    const total = this.totalFrames;

    for (let i = 1; i <= total; i++) {
      const img = new Image();
      let attemptedFallback = false;
      const primaryUrl = this.getFrameUrl(i);
      img.src = primaryUrl;
      
      const onImageLoad = () => {
        loaded++;
        this.loadedImages = loaded;
        const percent = Math.floor((loaded / total) * 100);

        if (this.preloaderFill) {
          this.preloaderFill.style.width = `${percent}%`;
        }
        if (this.preloaderStatus) {
          this.preloaderStatus.textContent = `OPTIMIZING FRAMES: ${loaded} / ${total} (${percent}%)`;
        }

        // When the first frame is ready, paint it immediately
        if (i === 1 && !this.isLoaded) {
          this.drawFrame(0);
        }

        if (loaded === total) {
          this.onAllFramesLoaded();
        }
      };

      img.onload = onImageLoad;
      img.onerror = () => {
        if (!attemptedFallback) {
          attemptedFallback = true;
          // Try fallback without assets/frames/ prefix or vice versa
          const formattedNum = String(i).padStart(3, '0');
          if (primaryUrl.includes('assets/frames/')) {
            img.src = `ezgif-frame-${formattedNum}.jpg`;
            return;
          } else {
            img.src = `assets/frames/ezgif-frame-${formattedNum}.jpg`;
            return;
          }
        }
        console.error(`Failed to load frame ${i} at ${img.src}`);
        onImageLoad(); // Keep counter moving to prevent stall
      };

      this.images.push(img);
    }
  }

  onAllFramesLoaded() {
    this.isLoaded = true;
    setTimeout(() => {
      if (this.preloader) {
        this.preloader.classList.add('loaded');
      }
      this.updateDimensions();
      this.drawFrame(0);
    }, 300);
  }

  setupResize() {
    this.updateDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for max performance
      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
        this.renderedFrameIndex = -1; // Force repaint
      }
    };

    window.addEventListener('resize', this.updateDimensions, { passive: true });
    this.updateDimensions();
  }

  setupScrollListener() {
    const calculateProgress = () => {
      if (this.isScrubbing || this.isAutoPlaying) return;

      const trackRect = this.track.getBoundingClientRect();
      const trackTop = trackRect.top;
      const trackHeight = trackRect.height - window.innerHeight;

      if (trackHeight <= 0) return;

      // Progress from 0 (at start of section) to 1 (at end of section)
      let progress = -trackTop / trackHeight;
      progress = Math.max(0, Math.min(1, progress));
      this.targetProgress = progress;
    };

    window.addEventListener('scroll', calculateProgress, { passive: true });
    calculateProgress();
  }

  setupScrubBar() {
    if (!this.scrubTrack) return;

    const onScrub = (clientX) => {
      const rect = this.scrubTrack.getBoundingClientRect();
      let fraction = (clientX - rect.left) / rect.width;
      fraction = Math.max(0, Math.min(1, fraction));
      this.targetProgress = fraction;
      
      // Also sync actual window scroll if user drags scrubber
      const trackRect = this.track.getBoundingClientRect();
      const trackTopDoc = window.scrollY + trackRect.top;
      const scrollableDist = this.track.offsetHeight - window.innerHeight;
      window.scrollTo({
        top: trackTopDoc + fraction * scrollableDist,
        behavior: 'auto'
      });
    };

    const handlePointerDown = (e) => {
      this.isScrubbing = true;
      if (this.isAutoPlaying) this.toggleAutoPlay(false);
      onScrub(e.clientX || (e.touches && e.touches[0].clientX));

      const handlePointerMove = (moveEvent) => {
        if (!this.isScrubbing) return;
        const clientX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
        onScrub(clientX);
      };

      const handlePointerUp = () => {
        this.isScrubbing = false;
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
        window.removeEventListener('touchmove', handlePointerMove);
        window.removeEventListener('touchend', handlePointerUp);
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: true });
      window.addEventListener('touchend', handlePointerUp);
    };

    this.scrubTrack.addEventListener('mousedown', handlePointerDown);
    this.scrubTrack.addEventListener('touchstart', handlePointerDown, { passive: true });
  }

  setupHotspots() {
    if (!this.hotspotContainer) return;
    this.hotspotContainer.innerHTML = '';

    this.hotspotElements = this.hotspots.map(h => {
      const pin = document.createElement('div');
      pin.className = 'hotspot-pin';
      pin.style.left = `${h.x}%`;
      pin.style.top = `${h.y}%`;
      pin.dataset.id = h.id;

      pin.innerHTML = `
        <div class="hotspot-ring"></div>
        <div class="hotspot-core"></div>
        <div class="hotspot-tooltip">
          <div class="hotspot-tooltip-title">${h.name}</div>
          <div class="hotspot-tooltip-desc">${h.desc}</div>
        </div>
      `;

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        pin.classList.toggle('active');
        if (window.WebAudioFX) window.WebAudioFX.playClick();
      });

      this.hotspotContainer.appendChild(pin);
      return { el: pin, data: h };
    });
  }

  jumpToPhase(phaseNumber) {
    const phase = this.phases.find(p => p.id === phaseNumber);
    if (!phase) return;

    if (this.isAutoPlaying) this.toggleAutoPlay(false);

    const midProgress = (phase.range[0] + phase.range[1]) / 2;
    const trackRect = this.track.getBoundingClientRect();
    const trackTopDoc = window.scrollY + trackRect.top;
    const scrollableDist = this.track.offsetHeight - window.innerHeight;

    window.scrollTo({
      top: trackTopDoc + midProgress * scrollableDist,
      behavior: 'smooth'
    });

    if (window.WebAudioFX) window.WebAudioFX.playMilestone();
  }

  toggleAutoPlay(forceState) {
    this.isAutoPlaying = forceState !== undefined ? forceState : !this.isAutoPlaying;

    if (this.autoPlayBtn) {
      if (this.isAutoPlaying) {
        this.autoPlayBtn.classList.add('active');
        this.autoPlayBtn.querySelector('span').textContent = 'PAUSE 360°';
      } else {
        this.autoPlayBtn.classList.remove('active');
        this.autoPlayBtn.querySelector('span').textContent = 'AUTO 360°';
      }
    }
  }

  startRenderLoop() {
    const render = () => {
      // Auto play update
      if (this.isAutoPlaying) {
        this.targetProgress += this.autoPlaySpeed * this.autoPlayDirection;
        if (this.targetProgress >= 1) {
          this.targetProgress = 1;
          this.autoPlayDirection = -1;
        } else if (this.targetProgress <= 0) {
          this.targetProgress = 0;
          this.autoPlayDirection = 1;
        }
      }

      // Smooth Physics LERP Interpolation
      const diff = this.targetProgress - this.currentProgress;
      if (Math.abs(diff) > 0.0001) {
        this.currentProgress += diff * this.lerpFactor;
      } else {
        this.currentProgress = this.targetProgress;
      }

      // Calculate Target Frame Index
      const frameIdx = Math.min(
        this.totalFrames - 1,
        Math.max(0, Math.floor(this.currentProgress * (this.totalFrames - 1)))
      );

      // Repaint frame only when index changes or canvas invalidated
      if (frameIdx !== this.renderedFrameIndex) {
        this.drawFrame(frameIdx);
        this.renderedFrameIndex = frameIdx;
        this.updateHUD(this.currentProgress, frameIdx);
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  drawFrame(index) {
    const img = this.images[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    // High performance proportional contain / cover math
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const imgAspect = imgW / imgH;
    const canvasAspect = width / height;

    let renderW, renderH, offsetX, offsetY;
    const isMobile = width < 768;

    if (!isMobile) {
      if (canvasAspect > imgAspect) {
        renderW = width;
        renderH = width / imgAspect;
        offsetX = 0;
        offsetY = (height - renderH) / 2;
      } else {
        renderH = height;
        renderW = height * imgAspect;
        offsetX = (width - renderW) / 2;
        offsetY = 0;
      }
      this.ctx.fillStyle = '#080b11';
      this.ctx.fillRect(0, 0, width, height);
      this.ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
    } else {
      // 1. Studio atmosphere backdrop
      const bgGrad = this.ctx.createRadialGradient(
        width / 2, height * 0.44, 20,
        width / 2, height * 0.44, Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, '#161d28');
      bgGrad.addColorStop(0.45, '#0b0f15');
      bgGrad.addColorStop(1, '#05070a');
      this.ctx.fillStyle = bgGrad;
      this.ctx.fillRect(0, 0, width, height);

      // 2. Pass 1: Ambient background
      const bgCoverScale = Math.max(width / imgW, height / imgH);
      const bgW = Math.round(imgW * bgCoverScale);
      const bgH = Math.round(imgH * bgCoverScale);
      const bgX = Math.round((width - bgW) / 2);
      const bgY = Math.round((height - bgH) / 2);
      this.ctx.globalAlpha = 0.32;
      this.ctx.drawImage(img, bgX, bgY, bgW, bgH);
      this.ctx.globalAlpha = 1.0;

      // 3. Pass 2: Foreground Car Frame
      const fgScale = (width * 0.98) / imgW;
      const fgW = Math.round(imgW * fgScale);
      const fgH = Math.round(imgH * fgScale);
      const fgX = Math.round((width - fgW) / 2);
      const fgY = Math.round((height - fgH) * 0.44);

      // Floor Shadow
      const shadowGrad = this.ctx.createRadialGradient(
        width / 2, fgY + fgH * 0.88, 10,
        width / 2, fgY + fgH * 0.88, fgW * 0.48
      );
      shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
      shadowGrad.addColorStop(0.6, 'rgba(5, 7, 10, 0.4)');
      shadowGrad.addColorStop(1, 'rgba(5, 7, 10, 0)');
      this.ctx.fillStyle = shadowGrad;
      this.ctx.fillRect(0, fgY + fgH * 0.65, width, fgH * 0.45);

      // Draw complete car
      this.ctx.drawImage(img, fgX, fgY, fgW, fgH);
    }
  }

  updateHUD(progress, frameIndex) {
    // 1. Update frame counter text
    if (this.frameCounter) {
      const cur = String(frameIndex + 1).padStart(3, '0');
      const total = String(this.totalFrames).padStart(3, '0');
      const pct = Math.round(progress * 100);
      this.frameCounter.textContent = `${cur} / ${total} [${pct}%]`;
    }

    // 2. Update scrub bar UI
    const pctStr = `${(progress * 100).toFixed(1)}%`;
    if (this.scrubProgress) this.scrubProgress.style.width = pctStr;
    if (this.scrubThumb) this.scrubThumb.style.left = pctStr;

    // 3. Determine current phase
    let activePhase = 1;
    for (const p of this.phases) {
      if (progress >= p.range[0] && progress <= p.range[1]) {
        activePhase = p.id;
        break;
      }
    }

    if (activePhase !== this.currentPhase) {
      this.currentPhase = activePhase;
      this.track.dataset.phase = activePhase;

      // Update Story Cards
      if (this.storyCards.length > 0) {
        this.storyCards.forEach(card => {
          const cardPhase = parseInt(card.dataset.phase, 10);
          if (cardPhase === activePhase) {
            card.classList.add('active');
          } else {
            card.classList.remove('active');
          }
        });
      }

      // Update Chapter Buttons
      if (this.chapterBtns.length > 0) {
        this.chapterBtns.forEach(btn => {
          const btnPhase = parseInt(btn.dataset.targetPhase, 10);
          if (btnPhase === activePhase) {
            btn.classList.add('active');
          } else {
            btn.classList.remove('active');
          }
        });
      }
    }

    // 4. Update Hotspots visibility
    if (this.hotspotElements) {
      this.hotspotElements.forEach(item => {
        const [start, end] = item.data.phase;
        if (progress >= start && progress <= end) {
          item.el.classList.add('visible');
        } else {
          item.el.classList.remove('visible');
          item.el.classList.remove('active');
        }
      });
    }
  }
}

// Global hook
window.ScrollyCarEngine = ScrollyCarEngine;
