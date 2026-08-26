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

// 6. Redesigned Service Workflow: Luxury Automotive HUD Stepper Engine
function initTimelineRibbonEngine() {
  const section = document.getElementById('how-we-work');
  if (!section) return;

  const stepBtns = section.querySelectorAll('.workflow-step-btn[data-step], .timeline-card[data-step]');
  const prevBtn = document.getElementById('workflow-prev-btn');
  const nextBtn = document.getElementById('workflow-next-btn');
  const indicatorEl = document.getElementById('workflow-step-indicator');
  const progressBar = document.getElementById('timeline-progress-bar');
  const badgeEl = document.getElementById('detail-step-badge');
  const timeEl = document.getElementById('detail-time-tag');
  const protocolEl = document.getElementById('detail-protocol-tag');
  const titleEl = document.getElementById('detail-title');
  const descEl = document.getElementById('detail-desc');
  const g1 = document.getElementById('detail-guarantee-1');
  const g2 = document.getElementById('detail-guarantee-2');
  const g3 = document.getElementById('detail-guarantee-3');
  const sub1 = document.getElementById('detail-sub-1');
  const sub2 = document.getElementById('detail-sub-2');
  const sub3 = document.getElementById('detail-sub-3');
  const hudStatusTitle = document.getElementById('hud-status-title');
  const hudModuleCode = document.getElementById('hud-module-code');
  const hudDynamicContent = document.getElementById('hud-dynamic-content');
  const hudFooterNote = document.getElementById('hud-footer-note');

  if (!stepBtns.length) return;

  const totalSteps = 5;
  let currentStep = 1;
  let autoTimer = null;
  let isPaused = false;

  const stepDetails = {
    1: {
      badge: 'PHASE 01 // INTAKE & OPTICAL AUDIT',
      time: 'Est. Time: 15–30 Mins',
      protocol: 'Tool: Laser Micro-Scanner',
      title: '1. Comprehensive Laser Inspection & Underbody Audit',
      desc: 'When your car arrives at our Chikhali atelier, Sohail Mulani and senior diagnostic engineers conduct an exhaustive 60-point electronic scan covering brake rotor depth, suspension arm play, tire tread micrometer mapping, and underbody chassis integrity.',
      g1: '±0.01mm Precision', sub1: 'Calibrated laser depth mapping',
      g2: 'WhatsApp 4K Report', sub2: 'Live photo & video evidence',
      g3: 'Zero Guesswork', sub3: 'Evidence-based assessment',
      hudStatus: 'OPTICAL SCAN // CALIBRATED',
      hudCode: 'MOD-01: AUDIT',
      hudItems: [
        { label: 'Brake Rotor Wear', val: '28.4 mm [NOMINAL]', color: 'text-amber-300' },
        { label: 'Chassis Laser Alignment', val: '0.02° [PERFECT]', color: 'text-emerald-400' },
        { label: 'Tire Tread Depth', val: '6.8 mm [HEALTHY]', color: 'text-amber-300' },
        { label: 'Battery Health (CCA)', val: '98% [640 CCA]', color: 'text-emerald-400' }
      ],
      hudFooter: '60-Point Audit Complete',
      progress: '20%'
    },
    2: {
      badge: 'PHASE 02 // ELECTRONIC DIAGNOSTICS',
      time: 'Est. Time: 20–40 Mins',
      protocol: 'Tool: OEM OBD-II Protocol Scanner',
      title: '2. ECU & Optical Computer Diagnosis',
      desc: 'We connect dealer-level OBD-II scanning terminals to decode every electronic control module (Engine ECM, Transmission TCM, ABS/ESP, Airbags, BCM). We pinpoint exact root sensor faults and CAN-bus telemetry without trial-and-error.',
      g1: 'OEM Bus Protocol', sub1: 'Direct CAN-Bus communication',
      g2: 'Live Telemetry Readout', sub2: 'Millivolt sensor precision',
      g3: 'Clear DTC Report', sub3: 'Root cause pinpointed',
      hudStatus: 'OBD-II CAN-BUS // CONNECTED',
      hudCode: 'MOD-02: ECU',
      hudItems: [
        { label: 'ECM Module (Engine)', val: 'ONLINE [0 DTC FAULTS]', color: 'text-emerald-400' },
        { label: 'TCM Module (Gearbox)', val: 'SYNCHRONIZED [NORMAL]', color: 'text-emerald-400' },
        { label: 'ABS / ESP Dynamic Bus', val: 'RESPONSE: 12ms [PASS]', color: 'text-emerald-400' },
        { label: 'Fuel Rail Pressure', val: '350 Bar [CALIBRATED]', color: 'text-amber-300' }
      ],
      hudFooter: '100% Computerized Telemetry',
      progress: '40%'
    },
    3: {
      badge: 'PHASE 03 // TRANSPARENT QUOTATION',
      time: 'Est. Time: 10–15 Mins',
      protocol: 'Tool: Digital WhatsApp ERP',
      title: '3. Itemized Digital Estimate & Customer Approval',
      desc: 'We generate an itemized price quotation listing genuine OEM part serial numbers, exact labor charges, and guaranteed completion time. Delivered straight to your WhatsApp — work begins strictly after your approval.',
      g1: '100% Upfront Pricing', sub1: 'Zero hidden fees or surprises',
      g2: 'OEM Part Numbers', sub2: 'Manufacturer verifiable',
      g3: 'One-Tap Approval', sub3: 'Complete control in your hands',
      hudStatus: 'QUOTE ERP // DISPATCHED',
      hudCode: 'MOD-03: ESTIMATE',
      hudItems: [
        { label: 'OEM Spare Parts Serial', val: 'VERIFIED [100% GENUINE]', color: 'text-emerald-400' },
        { label: 'Labor & Calibration', val: 'FIXED PRICE [ITEMIZED]', color: 'text-amber-300' },
        { label: 'Estimated Delivery', val: 'TODAY BY 6:00 PM', color: 'text-amber-300' },
        { label: 'Approval Status', val: 'PENDING CLIENT 1-TAP', color: 'text-emerald-400' }
      ],
      hudFooter: 'Zero-Surprise Guarantee',
      progress: '60%'
    },
    4: {
      badge: 'PHASE 04 // PRECISION ASSEMBLY',
      time: 'Est. Time: Same-Day / As Quoted',
      protocol: 'Tool: Digital Torque Wrenches & OEM Jigs',
      title: '4. Master Atelier Repair & Torque Calibration',
      desc: 'Our master technicians execute precision mechanical repairs and tuning using only original factory spare parts. Every fastener is torqued strictly to factory NM specifications with ongoing WhatsApp photo updates.',
      g1: 'Digital Torque Specs', sub1: 'Exact factory Nm calibration',
      g2: 'Live WhatsApp Trail', sub2: 'Step-by-step progress snaps',
      g3: 'Original Factory Spares', sub3: 'Zero counterfeit policy',
      hudStatus: 'ATELIER ASSEMBLY // ACTIVE',
      hudCode: 'MOD-04: REPAIR',
      hudItems: [
        { label: 'Digital Torque Setting', val: '140 Nm [CALIBRATED LOCK]', color: 'text-emerald-400' },
        { label: 'Fluid Flush Protocol', val: 'DOT 4 / 5W-40 SYNTHETIC', color: 'text-amber-300' },
        { label: 'Filter Replacement', val: 'OEM MICRO-SYNTHETIC [NEW]', color: 'text-emerald-400' },
        { label: 'WhatsApp Media Log', val: '8 PHOTOS SENT TO OWNER', color: 'text-amber-300' }
      ],
      hudFooter: 'Master Mechanic Certified',
      progress: '80%'
    },
    5: {
      badge: 'PHASE 05 // ROAD TEST & WARRANTY',
      time: 'Est. Time: 30–45 Mins',
      protocol: 'Tool: Dynamic Road Test & Dyno Log',
      title: '5. High-Speed Road Test, Foam Wash & Warranty Handover',
      desc: 'We conduct dynamic road and acceleration testing to verify throttle response, braking distance, and suspension silence. Your car receives a complimentary high-pressure foam wash before handover with an official 12-Month warranty.',
      g1: 'Dynamic Road Test', sub1: 'High-speed vibration audit',
      g2: 'Complimentary Wash', sub2: 'Showroom gloss finish',
      g3: '12-Month Warranty', sub3: '10,000 KM comprehensive cover',
      hudStatus: 'ROAD TEST PASSED // READY',
      hudCode: 'MOD-05: COMPLETE',
      hudItems: [
        { label: 'Dynamic Brake Test', val: '100-0 KM/H [EXCELLENT]', color: 'text-emerald-400' },
        { label: 'Suspension Acoustic Audit', val: '0 NOISE DETECTED [PASS]', color: 'text-emerald-400' },
        { label: 'Ceramic Foam Wash', val: 'COMPLETED [SHOWROOM GLOSS]', color: 'text-emerald-400' },
        { label: 'Warranty Certificate', val: '12-MO / 10,000 KM ACTIVE', color: 'text-amber-300' }
      ],
      hudFooter: 'Handover Ready with Certificate',
      progress: '100%'
    }
  };

  function renderHudItems(items) {
    if (!items || !items.length) return '';
    return items.map(item => `
      <div class="bg-surface-container-lowest/80 p-3.5 rounded-xl border border-white/5 flex items-center justify-between transition-all duration-300 hover:border-tertiary/20">
        <span class="text-slate-400">${item.label}</span>
        <span class="${item.color} font-bold">${item.val}</span>
      </div>
    `).join('');
  }

  function selectStep(stepNum, playAudio = true) {
    const data = stepDetails[stepNum];
    if (!data) return;
    currentStep = stepNum;

    // Update active button classes
    stepBtns.forEach(btn => {
      const step = parseInt(btn.getAttribute('data-step'), 10);
      const numBadge = btn.querySelector('.workflow-step-num');
      const textSpan = btn.querySelector('span.text-slate-300, span.text-primary');
      const phaseSpan = btn.querySelector('span.text-tertiary, span.text-tertiary\\/70');
      
      if (step === stepNum) {
        btn.classList.add('active-step', 'active-card');
        if (textSpan) {
          textSpan.classList.remove('text-slate-300');
          textSpan.classList.add('text-primary');
        }
        if (phaseSpan) {
          phaseSpan.classList.remove('text-tertiary/70');
          phaseSpan.classList.add('text-tertiary');
        }
      } else {
        btn.classList.remove('active-step', 'active-card');
        if (textSpan) {
          textSpan.classList.remove('text-primary');
          textSpan.classList.add('text-slate-300');
        }
        if (phaseSpan) {
          phaseSpan.classList.remove('text-tertiary');
          phaseSpan.classList.add('text-tertiary/70');
        }
      }
    });

    if (progressBar) progressBar.style.width = data.progress;
    if (indicatorEl) indicatorEl.textContent = `STEP 0${stepNum} / 05`;
    if (badgeEl) badgeEl.textContent = data.badge;
    if (timeEl) timeEl.innerHTML = `<span class="material-symbols-outlined text-[15px] text-tertiary">schedule</span> <span>${data.time}</span>`;
    if (protocolEl) protocolEl.innerHTML = `<span class="material-symbols-outlined text-[15px] text-tertiary">precision_manufacturing</span> <span>${data.protocol}</span>`;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (g1) g1.textContent = data.g1;
    if (g2) g2.textContent = data.g2;
    if (g3) g3.textContent = data.g3;
    if (sub1) sub1.textContent = data.sub1;
    if (sub2) sub2.textContent = data.sub2;
    if (sub3) sub3.textContent = data.sub3;

    if (hudStatusTitle) hudStatusTitle.textContent = data.hudStatus;
    if (hudModuleCode) hudModuleCode.textContent = data.hudCode;
    if (hudDynamicContent) hudDynamicContent.innerHTML = renderHudItems(data.hudItems);
    if (hudFooterNote) hudFooterNote.textContent = data.hudFooter;

    if (playAudio && window.WebAudioFX) {
      window.WebAudioFX.playClick();
    }
  }

  // Event Listeners for Step Buttons
  stepBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const step = parseInt(btn.getAttribute('data-step'), 10);
      selectStep(step, true);
      isPaused = true;
    });
  });

  // Prev / Next Navigation Controls
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let nextStep = currentStep - 1;
      if (nextStep < 1) nextStep = totalSteps;
      selectStep(nextStep, true);
      isPaused = true;
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      let nextStep = currentStep + 1;
      if (nextStep > totalSteps) nextStep = 1;
      selectStep(nextStep, true);
      isPaused = true;
    });
  }

  // Smooth Auto-Cycle (Rotates every 4.5 seconds unless user hovers)
  section.addEventListener('mouseenter', () => { isPaused = true; });
  section.addEventListener('mouseleave', () => { isPaused = false; });

  autoTimer = setInterval(() => {
    if (isPaused) return;
    let nextStep = currentStep + 1;
    if (nextStep > totalSteps) nextStep = 1;
    selectStep(nextStep, false);
  }, 4500);

  // Initialize at step 1
  selectStep(1, false);
}

// 7. Featured Projects 3D Round Turntable Horizontal Carousel (Seamless Infinite 2s Loop)
function initFeaturedProjectCarousel() {
  const container = document.getElementById('project-carousel-container');
  const track = document.getElementById('project-carousel-track');
  if (!container || !track) return;

  const realSlides = Array.from(track.querySelectorAll('.featured-project-slide:not(.carousel-clone)'));
  const prevBtn = document.getElementById('project-prev-btn');
  const nextBtn = document.getElementById('project-next-btn');
  const counterEl = document.getElementById('project-slide-counter');
  const timerFill = document.getElementById('project-timer-fill');
  const navPills = document.querySelectorAll('.project-nav-pill');

  if (!realSlides.length) return;

  const N = realSlides.length;
  const slideDuration = 2000; // 2 seconds

  // Clean any existing clones
  track.querySelectorAll('.carousel-clone').forEach(el => el.remove());

  // Prepend clone of last slide & Append clone of first slide
  const firstClone = realSlides[0].cloneNode(true);
  firstClone.classList.add('carousel-clone');
  const lastClone = realSlides[N - 1].cloneNode(true);
  lastClone.classList.add('carousel-clone');

  track.insertBefore(lastClone, realSlides[0]);
  track.appendChild(firstClone);

  const allSlides = track.querySelectorAll('.featured-project-slide');
  const totalWithClones = allSlides.length;

  track.style.display = 'flex';
  track.style.flexDirection = 'row';
  track.style.flexWrap = 'nowrap';
  track.style.width = (totalWithClones * 100) + '%';
  track.style.willChange = 'transform';

  allSlides.forEach((slide) => {
    slide.style.width = (100 / totalWithClones) + '%';
    slide.style.flex = '0 0 ' + (100 / totalWithClones) + '%';
    slide.style.minWidth = (100 / totalWithClones) + '%';
    slide.style.maxWidth = (100 / totalWithClones) + '%';
    slide.style.boxSizing = 'border-box';
  });

  let currentTrackIdx = 1;
  let isTransitioning = false;
  let isPaused = false;
  let timerInterval = null;
  let startTime = Date.now();

  function setTrackPosition(idx, animated = true) {
    if (animated) {
      track.style.transition = 'transform 0.75s cubic-bezier(0.25, 1, 0.5, 1)';
      isTransitioning = true;
    } else {
      track.style.transition = 'none';
      isTransitioning = false;
    }

    const shiftPercent = (idx * 100) / totalWithClones;
    track.style.transform = 'translateX(-' + shiftPercent + '%)';

    // Animate slide opacity and subtle scale for smooth fade in/out at stage edges
    allSlides.forEach((slide, i) => {
      if (i === idx) {
        slide.style.opacity = '1';
        slide.style.transform = 'scale(1)';
      } else {
        slide.style.opacity = '0.35';
        slide.style.transform = 'scale(0.96)';
      }
      slide.style.transition = animated ? 'opacity 0.75s cubic-bezier(0.25, 1, 0.5, 1), transform 0.75s cubic-bezier(0.25, 1, 0.5, 1)' : 'none';
    });

    let realIdx = idx - 1;
    if (idx === 0) realIdx = N - 1;
    if (idx === totalWithClones - 1) realIdx = 0;

    if (counterEl) {
      counterEl.textContent = String(realIdx + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    }

    // Update Mobile Single Model Name Badge
    const carNames = [
      'Mahindra Scorpio-N',
      'Audi A4',
      'Kia Seltos',
      'Volkswagen Polo',
      'BMW M5 ///M',
      'Jaguar XF',
      'Toyota Fortuner',
      'Honda Accord',
      'Mercedes GLE Coupe',
      'Maruti Ertiga',
      'Innova Crysta',
      'Mahindra Thar'
    ];

    const mobileNameEl = document.getElementById('mobile-active-model-name');
    if (mobileNameEl && carNames[realIdx]) {
      if (animated && mobileNameEl.textContent !== carNames[realIdx]) {
        mobileNameEl.style.opacity = '0';
        mobileNameEl.style.transform = 'translateY(3px)';
        setTimeout(() => {
          mobileNameEl.textContent = carNames[realIdx];
          mobileNameEl.style.opacity = '1';
          mobileNameEl.style.transform = 'translateY(0)';
        }, 120);
      } else {
        mobileNameEl.textContent = carNames[realIdx];
        mobileNameEl.style.opacity = '1';
        mobileNameEl.style.transform = 'translateY(0)';
      }
    }

    navPills.forEach((pill, i) => {
      if (i === realIdx) {
        pill.classList.add('active-pill');
      } else {
        pill.classList.remove('active-pill');
      }
    });
  }

  track.addEventListener('transitionend', () => {
    isTransitioning = false;
    if (currentTrackIdx === 0) {
      currentTrackIdx = N;
      setTrackPosition(currentTrackIdx, false);
    } else if (currentTrackIdx === totalWithClones - 1) {
      currentTrackIdx = 1;
      setTrackPosition(currentTrackIdx, false);
    }
  });

  function startTimer() {
    clearInterval(timerInterval);
    startTime = Date.now();

    timerInterval = setInterval(() => {
      if (isPaused) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / slideDuration, 1);

      if (timerFill) {
        timerFill.style.width = (progress * 100) + '%';
      }

      if (elapsed >= slideDuration) {
        slideNext();
        startTime = Date.now();
        if (timerFill) timerFill.style.width = '0%';
      }
    }, 40);
  }

  function slideNext() {
    if (isTransitioning) return;
    currentTrackIdx++;
    setTrackPosition(currentTrackIdx, true);
    if (timerFill) timerFill.style.width = '0%';
    startTimer();
  }

  function slidePrev() {
    if (isTransitioning) return;
    currentTrackIdx--;
    setTrackPosition(currentTrackIdx, true);
    if (timerFill) timerFill.style.width = '0%';
    startTimer();
  }

  function goToRealSlide(realIdx) {
    currentTrackIdx = realIdx + 1;
    setTrackPosition(currentTrackIdx, true);
    if (window.WebAudioFX) window.WebAudioFX.playClick();
    if (timerFill) timerFill.style.width = '0%';
    startTimer();
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      slideNext();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      slidePrev();
    });
  }

  navPills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const targetIdx = parseInt(pill.getAttribute('data-target-idx'), 10);
      if (!isNaN(targetIdx)) {
        goToRealSlide(targetIdx);
      }
    });
  });

  container.addEventListener('mouseenter', () => { isPaused = true; });
  container.addEventListener('mouseleave', () => { 
    isPaused = false; 
    startTime = Date.now(); 
  });

  let touchStartX = 0;
  container.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  container.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) slideNext();
      else slidePrev();
    }
  }, { passive: true });

  setTrackPosition(1, false);
  startTimer();
}

// Global initialization on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize canvas scrolly engine
  if (window.ScrollyCarEngine && document.querySelector('#car-canvas')) {
    window.carEngineInstance = new window.ScrollyCarEngine({
      container: document.querySelector('#transformation') ? '#transformation' : '#car-scrolly-section',
      canvas: '#car-canvas',
      track: '.scrolly-track',
      totalFrames: 300,
      framePathPattern: 'assets/frames/ezgif-frame-{INDEX}.jpg',
      lerpFactor: 0.12
    });
  }

  // Initialize other modules
  initBeforeAfterSlider();
  initPricingCalculator();
  initBookingModal();
  initNavbarScroll();
  initTimelineRibbonEngine();
  initFeaturedProjectCarousel();
});



