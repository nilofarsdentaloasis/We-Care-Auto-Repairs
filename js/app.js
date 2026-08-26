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

// 6. Sleek Minimalist Chronological Process Ribbon Engine
function initTimelineRibbonEngine() {
  const section = document.getElementById('how-we-work');
  if (!section) return;

  const cards = section.querySelectorAll('.timeline-card[data-step]');
  const progressBar = document.getElementById('timeline-progress-bar');
  const badgeEl = document.getElementById('detail-step-badge');
  const timeEl = document.getElementById('detail-time-tag');
  const titleEl = document.getElementById('detail-title');
  const descEl = document.getElementById('detail-desc');
  const g1 = document.getElementById('detail-guarantee-1');
  const g2 = document.getElementById('detail-guarantee-2');
  const g3 = document.getElementById('detail-guarantee-3');

  if (!cards.length) return;

  const stepDetails = {
    1: {
      badge: 'STEP 01 OF 05',
      time: 'Est. Time: 15–30 Mins',
      title: '1. Comprehensive Laser Inspection & Underbody Audit',
      desc: 'When your car arrives at our Chikhali workshop, Sohail Mulani and our senior diagnostic technicians perform a rigorous 60-point checkup covering brakes, suspension, tire tread depth, battery health, and electronic modules.',
      g1: 'Calibrated Laser Measurements',
      g2: 'WhatsApp Photo Report',
      g3: 'Zero Guesswork Guarantee',
      progress: '20%'
    },
    2: {
      badge: 'STEP 02 OF 05',
      time: 'Est. Time: 20–40 Mins',
      title: '2. ECU & Optical Computer Diagnosis',
      desc: 'We plug in official dealer-level OBD-II diagnostic scanners to decode all electronic control modules (ECU, ABS, Airbags, BCM). We identify exact root causes and sensor voltage faults without blind trial-and-error.',
      g1: 'OEM OBD-II Bus Protocol',
      g2: 'Sensor Telemetry Readout',
      g3: 'Clear Diagnostic Report',
      progress: '40%'
    },
    3: {
      badge: 'STEP 03 OF 05',
      time: 'Est. Time: 10–15 Mins',
      title: '3. Itemized Digital Estimate & Customer Approval',
      desc: 'We generate an itemized price quotation listing genuine OEM part serial numbers, labor costs, and realistic delivery times. We send it directly to your WhatsApp and only proceed once you give your 100% approval.',
      g1: '100% Transparent Pricing',
      g2: 'Genuine OEM Part Numbers',
      g3: 'Strict Zero-Surprise Policy',
      progress: '60%'
    },
    4: {
      badge: 'STEP 04 OF 05',
      time: 'Est. Time: Same-Day / As Quoted',
      title: '4. Master Atelier Repair & Torque Calibration',
      desc: 'Our master mechanics install original factory spare parts, torquing every bolt to manufacturer specifications using calibrated digital torque wrenches. We send continuous photo and video progress updates to your WhatsApp.',
      g1: 'Digital Torque Calibration',
      g2: 'WhatsApp Live Photo Trail',
      g3: '100% Genuine Spare Parts',
      progress: '80%'
    },
    5: {
      badge: 'STEP 05 OF 05',
      time: 'Est. Time: 30–45 Mins',
      title: '5. High-Speed Road Test, Foam Wash & Warranty Handover',
      desc: 'We conduct a high-speed dynamic road test to verify power delivery, braking responsiveness, and suspension silence. Your car receives a complimentary foam wash before delivery with an official 12-Month service warranty.',
      g1: 'Dynamic Road & Brake Test',
      g2: 'Complimentary Foam Wash',
      g3: '12-Month / 10,000 KM Warranty',
      progress: '100%'
    }
  };

  function selectStep(stepNum, playAudio = true) {
    const data = stepDetails[stepNum];
    if (!data) return;

    cards.forEach(card => {
      const cardStep = parseInt(card.getAttribute('data-step'), 10);
      const node = card.querySelector('.timeline-node');
      if (cardStep === stepNum) {
        card.classList.add('active-card');
        if (node) node.classList.add('active-node');
      } else {
        card.classList.remove('active-card');
        if (node) node.classList.remove('active-node');
      }
    });

    if (progressBar) progressBar.style.width = data.progress;
    if (badgeEl) badgeEl.textContent = data.badge;
    if (timeEl) timeEl.innerHTML = `<span class="material-symbols-outlined text-[14px] text-tertiary">schedule</span> <span>${data.time}</span>`;
    if (titleEl) titleEl.textContent = data.title;
    if (descEl) descEl.textContent = data.desc;
    if (g1) g1.textContent = data.g1;
    if (g2) g2.textContent = data.g2;
    if (g3) g3.textContent = data.g3;

    if (playAudio && window.WebAudioFX) {
      window.WebAudioFX.playClick();
    }
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const step = parseInt(card.getAttribute('data-step'), 10);
      selectStep(step, true);
    });
  });
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

    let realIdx = idx - 1;
    if (idx === 0) realIdx = N - 1;
    if (idx === totalWithClones - 1) realIdx = 0;

    if (counterEl) {
      counterEl.textContent = '0' + (realIdx + 1) + ' / 0' + N;
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



