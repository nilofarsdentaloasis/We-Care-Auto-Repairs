/**
 * WE CARE AUTO REPAIR & TUNING - MAIN APPLICATION LOGIC
 * Interactive UI Modules: WebAudio FX, Before/After Slider, Price Estimator & Booking
 */

// 1. Web Audio Synthesizer (No external MP3 files needed)
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initAudio() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.initAudio();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playMilestone() {
    if (!this.enabled) return;
    this.initAudio();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }
}

window.WebAudioFX = new SoundFX();

// 2. Before vs After Comparison Slider
function initBeforeAfterSlider() {
  const wrapper = document.querySelector('.image-compare-wrapper');
  const sliderLine = document.querySelector('.compare-slider-line');
  const afterImg = document.querySelector('.compare-img-after');

  if (!wrapper || !sliderLine || !afterImg) return;

  let isDragging = false;

  const setPosition = (clientX) => {
    const rect = wrapper.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(rect.width, x));
    const percentage = (x / rect.width) * 100;

    sliderLine.style.left = `${percentage}%`;
    afterImg.style.clipPath = `polygon(0 0, ${percentage}% 0, ${percentage}% 100%, 0 100%)`;
  };

  const onPointerDown = (e) => {
    isDragging = true;
    setPosition(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    setPosition(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  sliderLine.addEventListener('mousedown', onPointerDown);
  sliderLine.addEventListener('touchstart', onPointerDown, { passive: true });
  wrapper.addEventListener('mousedown', onPointerDown);
  wrapper.addEventListener('touchstart', onPointerDown, { passive: true });

  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('mouseup', onPointerUp);
  window.addEventListener('touchend', onPointerUp);
}

// 3. Interactive Pricing Estimator & Build Customizer
function initPricingCalculator() {
  const optionItems = document.querySelectorAll('.calc-option-item');
  const summaryList = document.querySelector('#summary-list');
  const totalAmountEl = document.querySelector('#calc-total-amount');
  const bookBuildBtn = document.querySelector('#btn-book-build');

  if (!optionItems.length || !summaryList || !totalAmountEl) return;

  const basePrice = 250; // Base diagnostics & setup fee

  function updateCalculator() {
    let total = basePrice;
    let selectedItems = [];

    optionItems.forEach(item => {
      if (item.classList.contains('selected')) {
        const name = item.dataset.name;
        const price = parseInt(item.dataset.price, 10);
        total += price;
        selectedItems.push({ name, price });
      }
    });

    // Update Summary List
    summaryList.innerHTML = `
      <div class="summary-row">
        <span>Baseline Dyno & Multi-Point Scan</span>
        <span>$${basePrice}</span>
      </div>
    `;

    selectedItems.forEach(item => {
      const row = document.createElement('div');
      row.className = 'summary-row';
      row.innerHTML = `
        <span>${item.name}</span>
        <span>+$${item.price}</span>
      `;
      summaryList.appendChild(row);
    });

    // Animate counter
    totalAmountEl.textContent = `$${total.toLocaleString()}`;

    // Pass data to booking modal
    if (bookBuildBtn) {
      bookBuildBtn.dataset.total = total;
      bookBuildBtn.dataset.build = selectedItems.map(i => i.name).join(', ') || 'Standard Inspection';
    }
  }

  optionItems.forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('selected');
      window.WebAudioFX.playClick();
      updateCalculator();
    });
  });

  updateCalculator();
}

// 4. Booking Dialog Modal
function initBookingModal() {
  const modal = document.querySelector('#booking-modal');
  const openBtns = document.querySelectorAll('.btn-open-booking');
  const closeBtn = document.querySelector('.modal-close-btn');
  const form = document.querySelector('#booking-form');
  const notesField = document.querySelector('#booking-notes');

  if (!modal) return;

  const openModal = (customBuildInfo = '') => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (notesField && customBuildInfo) {
      notesField.value = `Selected Package / Configuration: ${customBuildInfo}`;
    }
    window.WebAudioFX.playMilestone();
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  openBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const buildInfo = btn.dataset.build || '';
      openModal(buildInfo);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.textContent = 'CONFIRMING APPOINTMENT...';
      submitBtn.disabled = true;

      setTimeout(() => {
        alert('🎉 Booking Received! Our Master Technician will contact you within 15 minutes to confirm your garage slot.');
        submitBtn.textContent = 'SUBMIT BOOKING REQUEST';
        submitBtn.disabled = false;
        form.reset();
        closeModal();
      }, 1000);
    });
  }
}

// 5. Sticky Navbar Shadow on Scroll
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });
}

// 6. Precision Process Holographic Telemetry Engine
function initPrecisionProcessEngine() {
  const section = document.getElementById('how-we-work');
  if (!section) return;

  const pods = section.querySelectorAll('.telemetry-pod[data-stage]');
  const indicator = document.getElementById('hud-stage-indicator');
  const centerIcon = document.getElementById('hud-center-icon');
  const centerMetric = document.getElementById('hud-center-metric');
  const centerSub = document.getElementById('hud-center-sub');
  const titleEl = document.getElementById('hud-telemetry-title');
  const pillEl = document.getElementById('hud-telemetry-pill');
  const descEl = document.getElementById('hud-telemetry-desc');
  const busStatusEl = document.getElementById('hud-bus-status');
  const simBtn = document.getElementById('btn-run-simulation');

  if (!pods.length) return;

  const stageData = {
    1: {
      indicator: 'STAGE 01 // INTAKE & SCAN',
      icon: 'sensors',
      metric: '360° LASER',
      sub: 'TOL: ±0.01mm',
      title: 'Laser Chassis & Underbody Audit',
      pill: 'SCANNING 100%',
      desc: 'Comprehensive bumper-to-bumper check. Calibrated electronic laser measurements for brake disc thickness, suspension geometry, and structural alignment.',
      busStatus: 'OBD_BUS: LINKED // STAGE 1 ACTIVE'
    },
    2: {
      indicator: 'STAGE 02 // ECU & OPTICAL SCAN',
      icon: 'memory',
      metric: 'ECU DECODE',
      sub: 'DTC_STATUS: 0 ERRORS',
      title: 'Optical Diagnostic & ECU Decoding',
      pill: 'LIVE TELEMETRY',
      desc: 'Dealer-grade OBD-II bus scanner interrogates all powertrain, airbag, ABS, and comfort modules to decode exact sensor voltages and fault origins without blind guessing.',
      busStatus: 'ECU_BUS: ONLINE // STAGE 2 ACTIVE'
    },
    3: {
      indicator: 'STAGE 03 // TRANSPARENT QUOTE',
      icon: 'receipt_long',
      metric: '₹ 0 HIDDEN',
      sub: 'WHATSAPP DISPATCH',
      title: '100% Transparent Itemized Quote',
      pill: 'PRICE LOCK GUARANTEE',
      desc: 'Itemized digital estimate with genuine part serial numbers, labor breakdown, and clear timeline delivered to your WhatsApp. Work begins only upon your approval.',
      busStatus: 'QUOTE_LOCK: VERIFIED // STAGE 3 ACTIVE'
    },
    4: {
      indicator: 'STAGE 04 // ATELIER ASSEMBLY',
      icon: 'precision_manufacturing',
      metric: '480 Nm LOCK',
      sub: 'DIGITAL TORQUE SPEC',
      title: 'Master Mechanical Assembly & Torque Lock',
      pill: 'OEM CLEAN-ROOM',
      desc: 'Certified master mechanics assemble 100% genuine factory parts using calibrated digital torque wrenches with real-time WhatsApp photo and video updates.',
      busStatus: 'TORQUE_SPEC: LOCKED // STAGE 4 ACTIVE'
    },
    5: {
      indicator: 'STAGE 05 // ROAD & DYNO TEST',
      icon: 'workspace_premium',
      metric: '7,500 RPM',
      sub: 'DYNO TEST PASS',
      title: 'High-Speed Dyno Road Test & Handover',
      pill: '12-MO WARRANTY SIGNED',
      desc: 'High-speed dynamometer calibration, suspension damping test, complimentary foam wash, and delivery with an official 12-Month / 10,000 KM warranty card.',
      busStatus: 'FINAL_GATE: CLEARED // STAGE 5 ACTIVE'
    }
  };

  let currentStage = 1;
  let isSimulating = false;
  let autoCycleTimer = null;

  function setStage(stageNum, playAudio = true) {
    currentStage = stageNum;
    const data = stageData[stageNum];
    if (!data) return;

    // Update active class on pods
    pods.forEach(pod => {
      const podStage = parseInt(pod.getAttribute('data-stage'), 10);
      if (podStage === stageNum) {
        pod.classList.add('active-pod');
      } else {
        pod.classList.remove('active-pod');
      }
    });

    // Update HUD elements
    if (indicator) indicator.textContent = data.indicator;
    if (centerIcon) centerIcon.innerHTML = `<span class="material-symbols-outlined text-[24px]">${data.icon}</span>`;
    if (centerMetric) centerMetric.textContent = data.metric;
    if (centerSub) centerSub.textContent = data.sub;
    if (titleEl) titleEl.textContent = data.title;
    if (pillEl) pillEl.textContent = data.pill;
    if (descEl) descEl.textContent = data.desc;
    if (busStatusEl) busStatusEl.textContent = data.busStatus;

    if (playAudio && window.WebAudioFX) {
      window.WebAudioFX.playClick();
    }
  }

  // Click handlers for pods
  pods.forEach(pod => {
    pod.addEventListener('click', () => {
      if (isSimulating) return;
      const stage = parseInt(pod.getAttribute('data-stage'), 10);
      setStage(stage, true);
      resetAutoCycle();
    });
  });

  // Auto-cycle stages every 4.5 seconds when visible
  function startAutoCycle() {
    stopAutoCycle();
    autoCycleTimer = setInterval(() => {
      if (!isSimulating) {
        const next = currentStage >= 5 ? 1 : currentStage + 1;
        setStage(next, false);
      }
    }, 4500);
  }

  function stopAutoCycle() {
    if (autoCycleTimer) {
      clearInterval(autoCycleTimer);
      autoCycleTimer = null;
    }
  }

  function resetAutoCycle() {
    stopAutoCycle();
    startAutoCycle();
  }

  // Pause on hover
  section.addEventListener('mouseenter', stopAutoCycle);
  section.addEventListener('mouseleave', startAutoCycle);
  startAutoCycle();

  // Run Simulation Button Handler
  if (simBtn) {
    simBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isSimulating) return;
      isSimulating = true;
      stopAutoCycle();

      simBtn.classList.add('opacity-90', 'scale-95');
      simBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> <span>Executing Pipeline...</span>';

      let stageIdx = 1;
      setStage(1, true);

      const interval = setInterval(() => {
        stageIdx++;
        if (stageIdx <= 5) {
          setStage(stageIdx, true);
        } else {
          clearInterval(interval);
          if (window.WebAudioFX) {
            window.WebAudioFX.playMilestone();
          }
          simBtn.classList.remove('opacity-90', 'scale-95');
          simBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">verified</span> <span>Simulation Passed!</span>';

          setTimeout(() => {
            isSimulating = false;
            simBtn.innerHTML = '<span class="material-symbols-outlined text-[18px] group-hover:rotate-45 transition-transform">play_circle</span> <span>Simulate Atelier Workflow</span>';
            startAutoCycle();
          }, 2500);
        }
      }, 1200);
    });
  }
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize canvas scrolly engine
  if (window.ScrollyCarEngine && document.querySelector('#car-canvas')) {
    window.carEngineInstance = new window.ScrollyCarEngine({
      container: document.querySelector('#transformation') ? '#transformation' : '#car-scrolly-section',
      canvas: '#car-canvas',
      track: '.scrolly-track',
      totalFrames: 144,
      framePathPattern: 'assets/frames/ezgif-frame-{INDEX}.jpg',
      lerpFactor: 0.12
    });
  }

  // Initialize other modules
  initBeforeAfterSlider();
  initPricingCalculator();
  initBookingModal();
  initNavbarScroll();
  initPrecisionProcessEngine();
});

