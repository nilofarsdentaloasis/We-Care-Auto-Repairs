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

// 8. Digital Invoice & Service Bill Generator Engine (Persistence & Dealership Standard)
function initInvoiceGenerator() {
  const section = document.getElementById('invoice-generator');
  if (!section) return;

  const STORAGE_KEY = 'wcar_invoices_v1';

  // Tabs & Panels
  const tabBtnEditor = document.getElementById('tab-btn-editor');
  const tabBtnHistory = document.getElementById('tab-btn-history');
  const panelEditor = document.getElementById('panel-invoice-editor');
  const panelHistory = document.getElementById('panel-invoice-history');
  const savedBadge = document.getElementById('saved-invoices-badge');
  const savedListContainer = document.getElementById('saved-invoices-list');
  const searchHistoryInput = document.getElementById('search-saved-invoices');
  const clearAllHistoryBtn = document.getElementById('btn-clear-all-history');

  // Form Inputs
  const custNameInput = document.getElementById('inv-cust-name');
  const custPhoneInput = document.getElementById('inv-cust-phone');
  const carModelInput = document.getElementById('inv-car-model');
  const carRegInput = document.getElementById('inv-car-reg');
  const invNumberInput = document.getElementById('inv-number');
  const invDateInput = document.getElementById('inv-date');
  const taxRateSelect = document.getElementById('inv-tax-rate');
  const discountInput = document.getElementById('inv-discount');
  const payStatusSelect = document.getElementById('inv-pay-status');
  const warrantySelect = document.getElementById('inv-warranty');
  const itemsContainer = document.getElementById('invoice-items-list');
  const addItemBtn = document.getElementById('btn-add-line-item');
  const resetBtn = document.getElementById('btn-reset-invoice');
  const presetBtns = section.querySelectorAll('.preset-item-btn');

  // Action Buttons
  const saveInvoiceBtn = document.getElementById('btn-save-invoice');
  const downloadPdfBtn = document.getElementById('btn-download-pdf');
  const sendWhatsAppBtn = document.getElementById('btn-send-whatsapp');
  const printInvoiceBtn = document.getElementById('btn-print-invoice');

  // Preview Elements
  const prevCustName = document.getElementById('prev-cust-name');
  const prevCustPhone = document.getElementById('prev-cust-phone');
  const prevCarModel = document.getElementById('prev-car-model');
  const prevCarReg = document.getElementById('prev-car-reg');
  const prevInvNum = document.getElementById('prev-inv-num');
  const prevInvDate = document.getElementById('prev-inv-date');
  const prevInvStatus = document.getElementById('prev-inv-status');
  const prevItemsBody = document.getElementById('prev-items-body');
  const prevSubtotal = document.getElementById('prev-subtotal');
  const prevTaxRow = document.getElementById('prev-tax-row');
  const prevTaxLabel = document.getElementById('prev-tax-label');
  const prevTaxAmount = document.getElementById('prev-tax-amount');
  const prevDiscountRow = document.getElementById('prev-discount-row');
  const prevDiscountAmount = document.getElementById('prev-discount-amount');
  const prevGrandTotal = document.getElementById('prev-grand-total');
  const prevWordsAmount = document.getElementById('prev-words-amount');
  const prevWarrantyTerm = document.getElementById('prev-warranty-term');
  const printableSheet = document.getElementById('printable-invoice-paper');

  // Default Items State
  let lineItems = [
    { desc: 'Synthetic Engine Oil (5W-40) & OEM Filter', qty: 1, price: 4500 },
    { desc: '60-Point Electronic Laser Chassis & Safety Audit', qty: 1, price: 1200 },
    { desc: 'Front Brake Pads Replacement (OEM Factory Spec)', qty: 1, price: 3800 }
  ];

  // Set today's date
  if (invDateInput && !invDateInput.value) {
    const today = new Date().toISOString().split('T')[0];
    invDateInput.value = today;
  }

  function formatCurrency(num) {
    return '₹' + Number(num || 0).toLocaleString('en-IN');
  }

  function formatDateDisplay(dateStr) {
    if (!dateStr) return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return dateStr;
  }

  function generateRandomInvoiceNum() {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `WCAR-2026-${rand}`;
  }

  // Convert Number to Words in Indian Rupees
  function numberToWordsINR(num) {
    num = Math.round(Number(num) || 0);
    if (num <= 0) return 'Rupees Zero Only';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    function convertGroup(n) {
      let str = '';
      if (n >= 100) {
        str += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n >= 20) {
        str += b[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 0) {
        str += a[n] + ' ';
      }
      return str.trim();
    }

    let crore = Math.floor(num / 10000000);
    num %= 10000000;
    let lakh = Math.floor(num / 100000);
    num %= 100000;
    let thousand = Math.floor(num / 1000);
    num %= 1000;
    let remaining = num;

    let res = 'Rupees ';
    if (crore > 0) res += convertGroup(crore) + ' Crore ';
    if (lakh > 0) res += convertGroup(lakh) + ' Lakh ';
    if (thousand > 0) res += convertGroup(thousand) + ' Thousand ';
    if (remaining > 0) res += convertGroup(remaining);
    return res.trim() + ' Only';
  }

  // ==========================================
  // STORAGE & HISTORY SYSTEM (localStorage)
  // ==========================================
  function getSavedInvoices() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCurrentInvoice(showToast = true) {
    const custName = custNameInput ? custNameInput.value.trim() || 'Valued Customer' : 'Valued Customer';
    const custPhone = custPhoneInput ? custPhoneInput.value.trim() : '';
    const carModel = carModelInput ? carModelInput.value.trim() || 'Vehicle' : 'Vehicle';
    const carReg = carRegInput ? carRegInput.value.trim().toUpperCase() : '';
    const invNum = invNumberInput ? invNumberInput.value.trim() || 'WCAR-BILL' : 'WCAR-BILL';
    const invDate = invDateInput ? invDateInput.value : new Date().toISOString().split('T')[0];
    const taxRate = taxRateSelect ? parseFloat(taxRateSelect.value) || 0 : 18;
    const discount = discountInput ? Math.max(0, parseFloat(discountInput.value) || 0) : 0;
    const payStatus = payStatusSelect ? payStatusSelect.value : 'PAID';
    const warrantyTerm = warrantySelect ? warrantySelect.value : '12-Month / 10,000 KM Warranty';
    const grandTotal = prevGrandTotal ? prevGrandTotal.textContent : '₹0';

    const invoiceRecord = {
      id: invNum,
      date: invDate,
      custName,
      custPhone,
      carModel,
      carReg,
      taxRate,
      discount,
      payStatus,
      warrantyTerm,
      lineItems: JSON.parse(JSON.stringify(lineItems)),
      grandTotal,
      savedAt: new Date().toISOString()
    };

    let invoices = getSavedInvoices();
    const existingIdx = invoices.findIndex(it => it.id === invNum);
    if (existingIdx >= 0) {
      invoices[existingIdx] = invoiceRecord;
    } else {
      invoices.unshift(invoiceRecord);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }

    updateHistoryBadge();
    renderSavedInvoicesList();

    if (showToast) {
      if (saveInvoiceBtn) {
        const originalText = saveInvoiceBtn.innerHTML;
        saveInvoiceBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span><span class="text-emerald-400">Saved to Records!</span>`;
        setTimeout(() => {
          saveInvoiceBtn.innerHTML = originalText;
        }, 1800);
      }
    }
  }

  function deleteSavedInvoice(invId) {
    if (confirm(`Delete invoice ${invId} from saved records?`)) {
      let invoices = getSavedInvoices();
      invoices = invoices.filter(it => it.id !== invId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
      updateHistoryBadge();
      renderSavedInvoicesList(searchHistoryInput ? searchHistoryInput.value : '');
    }
  }

  function loadSavedInvoice(invId) {
    const invoices = getSavedInvoices();
    const inv = invoices.find(it => it.id === invId);
    if (!inv) return;

    if (custNameInput) custNameInput.value = inv.custName || '';
    if (custPhoneInput) custPhoneInput.value = inv.custPhone || '';
    if (carModelInput) carModelInput.value = inv.carModel || '';
    if (carRegInput) carRegInput.value = inv.carReg || '';
    if (invNumberInput) invNumberInput.value = inv.id || '';
    if (invDateInput) invDateInput.value = inv.date || '';
    if (taxRateSelect) taxRateSelect.value = String(inv.taxRate ?? 18);
    if (discountInput) discountInput.value = String(inv.discount ?? 0);
    if (payStatusSelect) payStatusSelect.value = inv.payStatus || 'PAID';
    if (warrantySelect) warrantySelect.value = inv.warrantyTerm || '12-Month / 10,000 KM Official Workshop Warranty';

    if (Array.isArray(inv.lineItems) && inv.lineItems.length > 0) {
      lineItems = JSON.parse(JSON.stringify(inv.lineItems));
    }

    renderItemRows();
    updateLivePreview();
    switchTab('editor');

    if (window.WebAudioFX) window.WebAudioFX.playClick();
  }

  function updateHistoryBadge() {
    const count = getSavedInvoices().length;
    if (savedBadge) savedBadge.textContent = count;
  }

  function renderSavedInvoicesList(filter = '') {
    if (!savedListContainer) return;
    const invoices = getSavedInvoices();
    const query = filter.trim().toLowerCase();

    const filtered = invoices.filter(it => {
      if (!query) return true;
      return (
        (it.id && it.id.toLowerCase().includes(query)) ||
        (it.custName && it.custName.toLowerCase().includes(query)) ||
        (it.carModel && it.carModel.toLowerCase().includes(query)) ||
        (it.carReg && it.carReg.toLowerCase().includes(query)) ||
        (it.custPhone && it.custPhone.includes(query))
      );
    });

    if (!filtered.length) {
      savedListContainer.innerHTML = `
        <div class="text-center py-8 px-4 bg-surface-container-low/50 rounded-xl border border-white/5 text-slate-400">
          <span class="material-symbols-outlined text-3xl text-slate-500 mb-1">receipt_long</span>
          <p class="text-xs font-semibold">${query ? 'No matching invoices found.' : 'No saved invoices yet.'}</p>
          <p class="text-[11px] text-slate-500 mt-1">Generated bills will be saved here automatically.</p>
        </div>
      `;
      return;
    }

    savedListContainer.innerHTML = filtered.map(inv => `
      <div class="p-3 bg-surface-container-low/90 rounded-xl border border-white/5 hover:border-tertiary/30 transition-all space-y-2">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-2">
              <span class="font-mono text-xs font-bold text-tertiary">${inv.id}</span>
              <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${inv.payStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${inv.payStatus || 'PAID'}</span>
            </div>
            <p class="text-xs font-bold text-slate-100 mt-0.5">${inv.custName} <span class="font-normal text-slate-400">(${inv.carModel})</span></p>
            <p class="text-[10px] font-mono text-slate-400">${inv.carReg || 'No Reg'} • Date: ${formatDateDisplay(inv.date)}</p>
          </div>
          <div class="text-right">
            <span class="font-mono font-black text-sm text-amber-300 block">${inv.grandTotal || '₹0'}</span>
            <span class="text-[10px] text-slate-400 font-mono">${(inv.lineItems || []).length} Item(s)</span>
          </div>
        </div>

        <div class="pt-2 border-t border-white/5 flex items-center justify-between gap-1 text-[11px]">
          <button type="button" class="btn-load-history px-2.5 py-1 rounded-lg bg-tertiary/15 hover:bg-tertiary hover:text-on-tertiary text-tertiary font-bold transition-colors cursor-pointer" data-id="${inv.id}">
            Load & Edit
          </button>
          
          <div class="flex items-center space-x-1">
            <button type="button" class="btn-whatsapp-history p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors cursor-pointer" data-id="${inv.id}" title="Send via WhatsApp">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.41C16.31 14.29 15.09 13.69 14.86 13.61C14.64 13.52 14.47 13.48 14.31 13.73C14.14 13.97 13.67 14.53 13.52 14.69C13.38 14.86 13.23 14.88 12.98 14.76C12.74 14.64 11.95 14.38 11.02 13.55C10.29 12.9 9.8 12.1 9.68 11.85C9.55 11.61 9.66 11.47 9.79 11.35C9.9 11.24 10.03 11.07 10.15 10.93C10.28 10.78 10.32 10.68 10.4 10.51C10.48 10.35 10.44 10.21 10.38 10.08C10.32 9.96 9.83 8.76 9.63 8.26C9.43 7.78 9.23 7.84 9.08 7.83C8.94 7.83 8.77 7.83 8.61 7.83C8.44 7.83 8.18 7.89 7.95 8.14C7.72 8.38 7.08 8.98 7.08 10.21C7.08 11.44 7.97 12.62 8.1 12.79C8.22 12.96 9.86 15.48 12.36 16.56C12.96 16.82 13.42 16.97 13.78 17.09C14.38 17.28 14.93 17.25 15.36 17.19C15.84 17.12 16.84 16.58 17.05 16C17.25 15.41 17.25 14.91 17.19 14.8C17.13 14.7 16.98 14.64 16.73 14.52L16.56 14.41Z"/></svg>
            </button>
            <button type="button" class="btn-delete-history p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer" data-id="${inv.id}" title="Delete Invoice">
              <span class="material-symbols-outlined text-[15px]">delete</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach row events
    savedListContainer.querySelectorAll('.btn-load-history').forEach(btn => {
      btn.addEventListener('click', () => {
        loadSavedInvoice(btn.dataset.id);
      });
    });

    savedListContainer.querySelectorAll('.btn-whatsapp-history').forEach(btn => {
      btn.addEventListener('click', () => {
        loadSavedInvoice(btn.dataset.id);
        if (sendWhatsAppBtn) sendWhatsAppBtn.click();
      });
    });

    savedListContainer.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', () => {
        deleteSavedInvoice(btn.dataset.id);
      });
    });
  }

  // Switch Tab function
  function switchTab(tab) {
    if (tab === 'editor') {
      if (tabBtnEditor) {
        tabBtnEditor.className = 'px-3 py-1.5 rounded-lg text-xs font-[\'Plus_Jakarta_Sans\',sans-serif] font-bold transition-all bg-tertiary text-on-tertiary cursor-pointer flex items-center space-x-1.5 shadow-sm';
      }
      if (tabBtnHistory) {
        tabBtnHistory.className = 'px-3 py-1.5 rounded-lg text-xs font-[\'Plus_Jakarta_Sans\',sans-serif] font-bold transition-all bg-surface-container-high hover:bg-surface-bright text-slate-300 hover:text-tertiary cursor-pointer flex items-center space-x-1.5 border border-white/5';
      }
      if (panelEditor) panelEditor.classList.remove('hidden');
      if (panelHistory) panelHistory.classList.add('hidden');
    } else {
      if (tabBtnEditor) {
        tabBtnEditor.className = 'px-3 py-1.5 rounded-lg text-xs font-[\'Plus_Jakarta_Sans\',sans-serif] font-bold transition-all bg-surface-container-high hover:bg-surface-bright text-slate-300 hover:text-tertiary cursor-pointer flex items-center space-x-1.5 border border-white/5';
      }
      if (tabBtnHistory) {
        tabBtnHistory.className = 'px-3 py-1.5 rounded-lg text-xs font-[\'Plus_Jakarta_Sans\',sans-serif] font-bold transition-all bg-tertiary text-on-tertiary cursor-pointer flex items-center space-x-1.5 shadow-sm';
      }
      if (panelEditor) panelEditor.classList.add('hidden');
      if (panelHistory) panelHistory.classList.remove('hidden');
      renderSavedInvoicesList(searchHistoryInput ? searchHistoryInput.value : '');
    }
  }

  if (tabBtnEditor) tabBtnEditor.addEventListener('click', () => switchTab('editor'));
  if (tabBtnHistory) tabBtnHistory.addEventListener('click', () => switchTab('history'));
  if (searchHistoryInput) {
    searchHistoryInput.addEventListener('input', (e) => {
      renderSavedInvoicesList(e.target.value);
    });
  }

  if (clearAllHistoryBtn) {
    clearAllHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all stored invoices? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        updateHistoryBadge();
        renderSavedInvoicesList();
      }
    });
  }

  // ==========================================
  // FORM ROW BUILDER & PREVIEW ENGINE
  // ==========================================

  // Render Form Row Inputs
  function renderItemRows() {
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';

    lineItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'grid grid-cols-12 gap-2 items-center bg-surface-container-low/90 p-2.5 rounded-xl border border-white/5';
      row.innerHTML = `
        <div class="col-span-6 sm:col-span-7">
          <input type="text" class="item-desc-input invoice-input-field w-full px-2.5 py-1.5 rounded-lg text-xs" value="${item.desc}" placeholder="Service / Part description..." data-index="${index}">
        </div>
        <div class="col-span-2 sm:col-span-2">
          <input type="number" class="item-qty-input invoice-input-field w-full px-2 py-1.5 rounded-lg text-xs text-center font-mono font-bold" value="${item.qty}" min="1" step="1" data-index="${index}" title="Qty">
        </div>
        <div class="col-span-3 sm:col-span-2">
          <input type="number" class="item-price-input invoice-input-field w-full px-2 py-1.5 rounded-lg text-xs text-right font-mono font-bold" value="${item.price}" min="0" step="50" data-index="${index}" title="Price (₹)">
        </div>
        <div class="col-span-1 flex justify-center">
          <button type="button" class="item-delete-btn text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer" data-index="${index}" title="Delete Item">
            <span class="material-symbols-outlined text-[17px]">delete</span>
          </button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });

    // Attach listeners to input fields in rows
    itemsContainer.querySelectorAll('.item-desc-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        lineItems[idx].desc = e.target.value;
        updateLivePreview();
      });
    });

    itemsContainer.querySelectorAll('.item-qty-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        lineItems[idx].qty = Math.max(1, parseInt(e.target.value, 10) || 1);
        updateLivePreview();
      });
    });

    itemsContainer.querySelectorAll('.item-price-input').forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        lineItems[idx].price = Math.max(0, parseFloat(e.target.value) || 0);
        updateLivePreview();
      });
    });

    itemsContainer.querySelectorAll('.item-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        if (lineItems.length > 1) {
          lineItems.splice(idx, 1);
          renderItemRows();
          updateLivePreview();
        } else {
          alert('Invoice must have at least one service or part item.');
        }
      });
    });
  }

  // Update Preview Document with Solid Black Text & Crisp Alignment
  function updateLivePreview() {
    // 1. Customer & Vehicle Metadata
    const custName = custNameInput ? custNameInput.value.trim() || 'Valued Customer' : 'Valued Customer';
    const custPhone = custPhoneInput ? custPhoneInput.value.trim() || '9876543210' : '9876543210';
    const carModel = carModelInput ? carModelInput.value.trim() || 'Vehicle' : 'Vehicle';
    const carReg = carRegInput ? carRegInput.value.trim().toUpperCase() || 'MH 14 XX 0000' : 'MH 14 XX 0000';
    const invNum = invNumberInput ? invNumberInput.value.trim() || 'WCAR-2026-0001' : 'WCAR-2026-0001';
    const invDate = invDateInput ? invDateInput.value : '';
    const payStatus = payStatusSelect ? payStatusSelect.value : 'PAID';
    const warrantyTerm = warrantySelect ? warrantySelect.value : '12-Month / 10,000 KM Official Workshop Warranty';

    if (prevCustName) prevCustName.textContent = custName;
    if (prevCustPhone) prevCustPhone.textContent = '+91 ' + custPhone;
    if (prevCarModel) prevCarModel.textContent = carModel;
    if (prevCarReg) prevCarReg.textContent = carReg;
    if (prevInvNum) prevInvNum.textContent = invNum;
    if (prevInvDate) prevInvDate.textContent = 'Date: ' + formatDateDisplay(invDate);
    if (prevWarrantyTerm) prevWarrantyTerm.textContent = warrantyTerm;

    if (prevInvStatus) {
      prevInvStatus.textContent = payStatus;
      if (payStatus === 'PAID') {
        prevInvStatus.className = 'inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-900 border border-emerald-400';
      } else if (payStatus === 'PENDING') {
        prevInvStatus.className = 'inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-100 text-amber-900 border border-amber-400';
      } else {
        prevInvStatus.className = 'inline-block px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-100 text-blue-900 border border-blue-400';
      }
    }

    // 2. Build Item Table Rows with Solid Black Typography
    if (prevItemsBody) {
      prevItemsBody.innerHTML = '';
      let subtotal = 0;

      lineItems.forEach((item, i) => {
        const itemTotal = (item.qty || 1) * (item.price || 0);
        subtotal += itemTotal;

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 text-black';
        tr.innerHTML = `
          <td class="py-2.5 px-2.5 text-center font-mono font-bold inv-text-black text-xs">${String(i + 1).padStart(2, '0')}</td>
          <td class="py-2.5 px-3 font-bold inv-text-black text-xs leading-snug">${item.desc || 'Service / Part'}</td>
          <td class="py-2.5 px-3 text-center font-mono font-bold inv-text-black text-xs">${item.qty}</td>
          <td class="py-2.5 px-3 text-right font-mono font-bold inv-text-black text-xs">${formatCurrency(item.price)}</td>
          <td class="py-2.5 px-3 text-right font-mono font-black inv-text-black text-xs">${formatCurrency(itemTotal)}</td>
        `;
        prevItemsBody.appendChild(tr);
      });

      // 3. Totals & Taxes
      const taxRate = taxRateSelect ? parseFloat(taxRateSelect.value) || 0 : 18;
      const taxAmount = (subtotal * taxRate) / 100;
      const discount = discountInput ? Math.max(0, parseFloat(discountInput.value) || 0) : 0;
      const grandTotal = Math.max(0, subtotal + taxAmount - discount);

      if (prevSubtotal) prevSubtotal.textContent = formatCurrency(subtotal);

      if (prevTaxRow && prevTaxAmount && prevTaxLabel) {
        if (taxRate > 0) {
          prevTaxRow.style.display = 'flex';
          prevTaxLabel.textContent = `GST (${taxRate}%):`;
          prevTaxAmount.textContent = formatCurrency(taxAmount);
        } else {
          prevTaxRow.style.display = 'none';
        }
      }

      if (prevDiscountRow && prevDiscountAmount) {
        if (discount > 0) {
          prevDiscountRow.style.display = 'flex';
          prevDiscountAmount.textContent = '-' + formatCurrency(discount);
        } else {
          prevDiscountRow.style.display = 'none';
        }
      }

      if (prevGrandTotal) prevGrandTotal.textContent = formatCurrency(grandTotal);

      // 4. Amount in Words (INR)
      if (prevWordsAmount) {
        prevWordsAmount.textContent = numberToWordsINR(grandTotal);
      }
    }
  }

  // Preset Buttons Click
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const desc = btn.getAttribute('data-desc');
      const price = parseFloat(btn.getAttribute('data-price')) || 1000;
      lineItems.push({ desc, qty: 1, price });
      renderItemRows();
      updateLivePreview();
      if (window.WebAudioFX) window.WebAudioFX.playClick();
    });
  });

  // Add Custom Line Item
  if (addItemBtn) {
    addItemBtn.addEventListener('click', (e) => {
      e.preventDefault();
      lineItems.push({ desc: 'Custom Mechanical Service / Diagnostic', qty: 1, price: 1500 });
      renderItemRows();
      updateLivePreview();
      if (window.WebAudioFX) window.WebAudioFX.playClick();
    });
  }

  // Reset Form
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Start a new blank bill? Current un-saved edits will be cleared.')) {
        lineItems = [
          { desc: 'Synthetic Engine Oil (5W-40) & OEM Filter', qty: 1, price: 4500 },
          { desc: '60-Point Electronic Laser Chassis & Safety Audit', qty: 1, price: 1200 },
          { desc: 'Front Brake Pads Replacement (OEM Factory Spec)', qty: 1, price: 3800 }
        ];
        if (invNumberInput) invNumberInput.value = generateRandomInvoiceNum();
        if (custNameInput) custNameInput.value = 'Rahul Sharma';
        if (custPhoneInput) custPhoneInput.value = '9876543210';
        if (carModelInput) carModelInput.value = 'Mahindra Scorpio-N';
        if (carRegInput) carRegInput.value = 'MH 14 AB 1234';
        if (taxRateSelect) taxRateSelect.value = '18';
        if (discountInput) discountInput.value = '500';
        if (payStatusSelect) payStatusSelect.value = 'PAID';
        renderItemRows();
        updateLivePreview();
        switchTab('editor');
      }
    });
  }

  // Save to Storage Button
  if (saveInvoiceBtn) {
    saveInvoiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveCurrentInvoice(true);
      if (window.WebAudioFX) window.WebAudioFX.playSuccess();
    });
  }

  // Bind Form Change Events
  [custNameInput, custPhoneInput, carModelInput, carRegInput, invNumberInput, invDateInput, discountInput].forEach(el => {
    if (el) {
      el.addEventListener('input', updateLivePreview);
      el.addEventListener('change', updateLivePreview);
    }
  });

  [taxRateSelect, payStatusSelect, warrantySelect].forEach(el => {
    if (el) el.addEventListener('change', updateLivePreview);
  });

  // PDF Export Handler via html2pdf with auto-save
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!printableSheet) return;

      // Auto-save invoice to history
      saveCurrentInvoice(false);

      const originalBtnHtml = downloadPdfBtn.innerHTML;
      downloadPdfBtn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>Generating PDF...</span>`;
      downloadPdfBtn.disabled = true;

      const invNum = invNumberInput ? invNumberInput.value.trim() : 'WCAR-BILL';
      const carModel = carModelInput ? carModelInput.value.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Car';
      const filename = `Invoice_${invNum}_${carModel}.pdf`;

      if (window.html2pdf) {
        const opt = {
          margin: [8, 8, 8, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        try {
          await window.html2pdf().set(opt).from(printableSheet).save();
        } catch (err) {
          console.error('html2pdf generation error:', err);
          window.print();
        } finally {
          downloadPdfBtn.innerHTML = originalBtnHtml;
          downloadPdfBtn.disabled = false;
        }
      } else {
        window.print();
        downloadPdfBtn.innerHTML = originalBtnHtml;
        downloadPdfBtn.disabled = false;
      }
    });
  }

  // Send to WhatsApp Handler with auto-save
  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Auto-save invoice to history
      saveCurrentInvoice(false);

      const custName = custNameInput ? custNameInput.value.trim() || 'Valued Customer' : 'Valued Customer';
      let phone = custPhoneInput ? custPhoneInput.value.trim().replace(/\D/g, '') : '';
      const carModel = carModelInput ? carModelInput.value.trim() || 'Vehicle' : 'Vehicle';
      const carReg = carRegInput ? carRegInput.value.trim().toUpperCase() : '';
      const invNum = invNumberInput ? invNumberInput.value.trim() || 'WCAR-BILL' : 'WCAR-BILL';
      const invDate = invDateInput ? formatDateDisplay(invDateInput.value) : new Date().toLocaleDateString('en-GB');
      const payStatus = payStatusSelect ? payStatusSelect.value : 'PAID';
      const warrantyTerm = warrantySelect ? warrantySelect.value : '12-Month / 10,000 KM Warranty';
      const grandTotal = prevGrandTotal ? prevGrandTotal.textContent : '₹0';
      const subtotal = prevSubtotal ? prevSubtotal.textContent : '₹0';
      const inWords = prevWordsAmount ? prevWordsAmount.textContent : '';

      // Format WhatsApp number
      if (phone.length === 10) {
        phone = '91' + phone;
      } else if (!phone) {
        phone = '917757030387'; // Default to workshop lead
      }

      // Build Itemized Text
      let itemsSummary = '';
      lineItems.forEach((it, idx) => {
        const itemTot = formatCurrency((it.qty || 1) * (it.price || 0));
        itemsSummary += `• ${it.desc} (${it.qty}x) — *${itemTot}*\n`;
      });

      const message = 
`🏎️ *WE CARE AUTO REPAIR — OFFICIAL TAX INVOICE*
━━━━━━━━━━━━━━━━━━━━━━
📋 *Invoice #:* ${invNum}
👤 *Customer:* ${custName}
🚘 *Vehicle:* ${carModel} ${carReg ? '(' + carReg + ')' : ''}
📅 *Date:* ${invDate}
📌 *Status:* ${payStatus}

🔧 *ITEMIZED SERVICES & SPARES:*
${itemsSummary}
━━━━━━━━━━━━━━━━━━━━━━
💵 *Subtotal:* ${subtotal}
💰 *GRAND TOTAL:* *${grandTotal}*
📝 *Amount in Words:* ${inWords}
━━━━━━━━━━━━━━━━━━━━━━
🛡️ *Warranty:* ${warrantyTerm}
📍 *Workshop:* Gat No 1079, Newali Wasti, Chikhali, Pune 411062
📞 *Lead Engineer:* +91 7757030387 (Sohail Mulani)
━━━━━━━━━━━━━━━━━━━━━━
_Thank you for choosing We Care Auto Repair for your vehicle service!_`;

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    });
  }

  // Print Invoice direct
  if (printInvoiceBtn) {
    printInvoiceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      saveCurrentInvoice(false);
      window.print();
    });
  }

  // Initial Boot
  renderItemRows();
  updateLivePreview();
  updateHistoryBadge();
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
  initInvoiceGenerator();
});



