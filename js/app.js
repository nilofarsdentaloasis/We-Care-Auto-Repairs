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

// 8. Digital Invoice & Service Bill Generator Engine (Single A4 Page Standard)
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

  // Mobile View Switchers
  const mobileViewFormBtn = document.getElementById('mobile-view-form-btn');
  const mobileViewPreviewBtn = document.getElementById('mobile-view-preview-btn');
  const colInvoiceBuilder = document.getElementById('col-invoice-builder');
  const colInvoicePreview = document.getElementById('col-invoice-preview');

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

  // Default Items State (Initial blank item)
  let lineItems = [
    { desc: '', qty: 1, price: 0 }
  ];

  // Set today's date if empty
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

  // Mobile View Switcher Event Handlers
  if (mobileViewFormBtn && mobileViewPreviewBtn) {
    mobileViewFormBtn.addEventListener('click', () => {
      mobileViewFormBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm flex items-center space-x-1.5 cursor-pointer';
      mobileViewPreviewBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-700 hover:text-slate-950 flex items-center space-x-1.5 cursor-pointer';
      if (colInvoiceBuilder) {
        colInvoiceBuilder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    mobileViewPreviewBtn.addEventListener('click', () => {
      mobileViewPreviewBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition-all bg-amber-500 text-slate-950 shadow-sm flex items-center space-x-1.5 cursor-pointer';
      mobileViewFormBtn.className = 'px-4 py-2 rounded-lg text-xs font-bold transition-all text-slate-700 hover:text-slate-950 flex items-center space-x-1.5 cursor-pointer';
      if (colInvoicePreview) {
        colInvoicePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
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
    const warrantyTerm = warrantySelect ? warrantySelect.value : '12-Month / 10,000 KM Official Workshop Warranty';
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

    if (showToast && saveInvoiceBtn) {
      const originalText = saveInvoiceBtn.innerHTML;
      saveInvoiceBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-emerald-800">check_circle</span><span class="text-emerald-950 font-black">Saved!</span>`;
      setTimeout(() => {
        saveInvoiceBtn.innerHTML = originalText;
      }, 1800);
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
        <div class="text-center py-6 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
          <span class="material-symbols-outlined text-2xl text-slate-400 mb-0.5">receipt_long</span>
          <p class="text-xs font-bold text-slate-700">${query ? 'No matching invoices found.' : 'No saved invoices yet.'}</p>
          <p class="text-[10px] text-slate-500 mt-0.5">Saved bills appear here.</p>
        </div>
      `;
      return;
    }

    savedListContainer.innerHTML = filtered.map(inv => `
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-amber-500 transition-all space-y-1.5 shadow-2xs">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center space-x-1.5">
              <span class="text-xs font-black text-slate-900 tabular-nums">${inv.id}</span>
              <span class="text-[9px] font-black px-1.5 py-0.5 rounded-full ${inv.payStatus === 'PAID' ? 'bg-emerald-100 text-emerald-900 border border-emerald-400' : 'bg-amber-100 text-amber-900 border border-amber-400'}">${inv.payStatus || 'PAID'}</span>
            </div>
            <p class="text-xs font-black text-slate-950 mt-0.5">${inv.custName || 'Customer'} <span class="font-bold text-slate-600">(${inv.carModel || 'Car'})</span></p>
            <p class="text-[10px] text-slate-600 tabular-nums">${inv.carReg || 'No Reg'} • ${formatDateDisplay(inv.date)}</p>
          </div>
          <div class="text-right">
            <span class="font-black text-sm text-amber-900 block tabular-nums">${inv.grandTotal || '₹0'}</span>
            <span class="text-[10px] text-slate-600 font-bold">${(inv.lineItems || []).length} Item(s)</span>
          </div>
        </div>

        <div class="pt-1.5 border-t border-slate-200 flex items-center justify-between gap-1 text-[11px]">
          <button type="button" class="btn-load-history px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-colors cursor-pointer text-xs shadow-2xs" data-id="${inv.id}">
            Load & Edit
          </button>
          
          <div class="flex items-center space-x-1">
            <button type="button" class="btn-whatsapp-history p-1 rounded-md bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors cursor-pointer border border-[#25D366]/30" data-id="${inv.id}" title="Send via WhatsApp">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.04 14.69 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.8 7.37 7.5 3.67 12.04 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.41C16.31 14.29 15.09 13.69 14.86 13.61C14.64 13.52 14.47 13.48 14.31 13.73C14.14 13.97 13.67 14.53 13.52 14.69C13.38 14.86 13.23 14.88 12.98 14.76C12.74 14.64 11.95 14.38 11.02 13.55C10.29 12.9 9.8 12.1 9.68 11.85C9.55 11.61 9.66 11.47 9.79 11.35C9.9 11.24 10.03 11.07 10.15 10.93C10.28 10.78 10.32 10.68 10.4 10.51C10.48 10.35 10.44 10.21 10.38 10.08C10.32 9.96 9.83 8.76 9.63 8.26C9.43 7.78 9.23 7.84 9.08 7.83C8.94 7.83 8.77 7.83 8.61 7.83C8.44 7.83 8.18 7.89 7.95 8.14C7.72 8.38 7.08 8.98 7.08 10.21C7.08 11.44 7.97 12.62 8.1 12.79C8.22 12.96 9.86 15.48 12.36 16.56C12.96 16.82 13.42 16.97 13.78 17.09C14.38 17.28 14.93 17.25 15.36 17.19C15.84 17.12 16.84 16.58 17.05 16C17.25 15.41 17.25 14.91 17.19 14.8C17.13 14.7 16.98 14.64 16.73 14.52L16.56 14.41Z"/></svg>
            </button>
            <button type="button" class="btn-delete-history p-1 rounded-md bg-red-100 hover:bg-red-500 text-red-600 hover:text-white transition-colors cursor-pointer border border-red-200" data-id="${inv.id}" title="Delete Invoice">
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
        tabBtnEditor.className = 'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer flex items-center space-x-1.5 shadow-sm';
      }
      if (tabBtnHistory) {
        tabBtnHistory.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer flex items-center space-x-1.5 border border-slate-300';
      }
      if (panelEditor) panelEditor.classList.remove('hidden');
      if (panelHistory) panelHistory.classList.add('hidden');
    } else {
      if (tabBtnEditor) {
        tabBtnEditor.className = 'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer flex items-center space-x-1.5 border border-slate-300';
      }
      if (tabBtnHistory) {
        tabBtnHistory.className = 'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer flex items-center space-x-1.5 shadow-sm';
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
      row.className = 'grid grid-cols-12 gap-1.5 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-2xs';
      row.innerHTML = `
        <div class="col-span-6 sm:col-span-7">
          <input type="text" class="item-desc-input invoice-input-field w-full px-2.5 py-1.5 rounded-md text-xs font-bold" value="${item.desc || ''}" placeholder="Service / Part description..." data-index="${index}">
        </div>
        <div class="col-span-2 sm:col-span-2">
          <input type="number" class="item-qty-input invoice-input-field w-full px-1.5 py-1.5 rounded-md text-xs text-center font-bold tabular-nums" value="${item.qty || 1}" min="1" step="1" data-index="${index}" title="Qty">
        </div>
        <div class="col-span-3 sm:col-span-2">
          <input type="number" class="item-price-input invoice-input-field w-full px-2 py-1.5 rounded-md text-xs text-right font-bold tabular-nums" value="${item.price || 0}" min="0" step="50" data-index="${index}" title="Rate (₹)">
        </div>
        <div class="col-span-1 flex justify-center">
          <button type="button" class="item-delete-btn text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-md transition-colors cursor-pointer" data-index="${index}" title="Delete Item">
            <span class="material-symbols-outlined text-[16px]">delete</span>
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
          // If only 1 row, reset it
          lineItems[0] = { desc: '', qty: 1, price: 0 };
          renderItemRows();
          updateLivePreview();
        }
      });
    });
  }

  // Update Preview Document with Solid Black Text & Strict Single A4 Proportions
  function updateLivePreview() {
    // 1. Customer & Vehicle Metadata
    const custName = custNameInput ? custNameInput.value.trim() : '';
    const custPhone = custPhoneInput ? custPhoneInput.value.trim() : '';
    const carModel = carModelInput ? carModelInput.value.trim() : '';
    const carReg = carRegInput ? carRegInput.value.trim().toUpperCase() : '';
    const invNum = invNumberInput ? invNumberInput.value.trim() || 'WCAR-2026-0001' : 'WCAR-2026-0001';
    const invDate = invDateInput ? invDateInput.value : '';
    const payStatus = payStatusSelect ? payStatusSelect.value : 'PAID';
    const warrantyTerm = warrantySelect ? warrantySelect.value : '12-Month / 10,000 KM Official Workshop Warranty';

    if (prevCustName) prevCustName.textContent = custName || '—';
    if (prevCustPhone) prevCustPhone.textContent = custPhone ? '+91 ' + custPhone : '—';
    if (prevCarModel) prevCarModel.textContent = carModel || '—';
    if (prevCarReg) prevCarReg.textContent = carReg || '—';
    if (prevInvNum) prevInvNum.textContent = invNum;
    if (prevInvDate) prevInvDate.textContent = invDate ? 'Date: ' + formatDateDisplay(invDate) : 'Date: —';
    if (prevWarrantyTerm) prevWarrantyTerm.textContent = warrantyTerm;

    if (prevInvStatus) {
      prevInvStatus.textContent = payStatus;
      if (payStatus === 'PAID') {
        prevInvStatus.className = 'inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-emerald-100 text-emerald-950 border border-emerald-500';
      } else if (payStatus === 'PENDING') {
        prevInvStatus.className = 'inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-amber-100 text-amber-950 border border-amber-500';
      } else {
        prevInvStatus.className = 'inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-blue-100 text-blue-950 border border-blue-500';
      }
    }

    // 2. Build Item Table Rows with High-Contrast Typography
    if (prevItemsBody) {
      prevItemsBody.innerHTML = '';
      let subtotal = 0;

      lineItems.forEach((item, i) => {
        const itemTotal = (item.qty || 1) * (item.price || 0);
        subtotal += itemTotal;

        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 text-black';
        tr.innerHTML = `
          <td class="py-1.5 px-2 text-center font-bold text-black text-[11px] tabular-nums">${String(i + 1).padStart(2, '0')}</td>
          <td class="py-1.5 px-2 font-bold text-black text-[11px] leading-snug">${item.desc ? item.desc : '<span class="text-slate-400 font-normal italic">Service / Part description</span>'}</td>
          <td class="py-1.5 px-2 text-center font-bold text-black text-[11px] tabular-nums">${item.qty || 1}</td>
          <td class="py-1.5 px-2 text-right font-bold text-black text-[11px] tabular-nums">${formatCurrency(item.price || 0)}</td>
          <td class="py-1.5 px-2 text-right font-black text-black text-[11px] tabular-nums">${formatCurrency(itemTotal)}</td>
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

  // Preset Buttons Click (Replace empty row if initial, or push new item)
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const desc = btn.getAttribute('data-desc');
      const price = parseFloat(btn.getAttribute('data-price')) || 1000;
      
      if (lineItems.length === 1 && (!lineItems[0].desc || !lineItems[0].desc.trim()) && Number(lineItems[0].price || 0) === 0) {
        lineItems[0] = { desc, qty: 1, price };
      } else {
        lineItems.push({ desc, qty: 1, price });
      }

      renderItemRows();
      updateLivePreview();
      if (window.WebAudioFX) window.WebAudioFX.playClick();
    });
  });

  // Add Custom Line Item
  if (addItemBtn) {
    addItemBtn.addEventListener('click', (e) => {
      e.preventDefault();
      lineItems.push({ desc: '', qty: 1, price: 0 });
      renderItemRows();
      updateLivePreview();
      if (window.WebAudioFX) window.WebAudioFX.playClick();
    });
  }

  // Reset Form to blank template
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Start a new blank bill? Current un-saved edits will be cleared.')) {
        lineItems = [
          { desc: '', qty: 1, price: 0 }
        ];
        if (invNumberInput) invNumberInput.value = generateRandomInvoiceNum();
        if (custNameInput) custNameInput.value = '';
        if (custPhoneInput) custPhoneInput.value = '';
        if (carModelInput) carModelInput.value = '';
        if (carRegInput) carRegInput.value = '';
        if (taxRateSelect) taxRateSelect.value = '18';
        if (discountInput) discountInput.value = '0';
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

  // Single A4 PDF Export Handler via html2pdf
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!printableSheet) return;

      // Auto-save invoice to history
      saveCurrentInvoice(false);

      const originalBtnHtml = downloadPdfBtn.innerHTML;
      downloadPdfBtn.innerHTML = `<span class="material-symbols-outlined text-[17px] animate-spin">sync</span><span>Creating A4 PDF...</span>`;
      downloadPdfBtn.disabled = true;

      const invNum = invNumberInput ? invNumberInput.value.trim() : 'WCAR-BILL';
      const carModel = carModelInput ? carModelInput.value.trim().replace(/[^a-zA-Z0-9]/g, '_') : 'Car';
      const filename = `Invoice_${invNum}_${carModel}.pdf`;

      if (window.html2pdf) {
        const opt = {
          margin: [6, 8, 6, 8],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            scrollX: 0
          },
          jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
          },
          pagebreak: { mode: ['avoid-all', 'css'] }
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
        if (it.desc || it.price) {
          const itemTot = formatCurrency((it.qty || 1) * (it.price || 0));
          itemsSummary += `• ${it.desc || 'Service Item'} (${it.qty || 1}x) — *${itemTot}*\n`;
        }
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
${itemsSummary || '• Comprehensive Vehicle Inspection & Service\n'}━━━━━━━━━━━━━━━━━━━━━━
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

  // Print Invoice direct (1-Page A4)
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

// ==========================================================================
// 8. OWNER AUTHENTICATION & 5-MINUTE SESSION ENGINE
// ==========================================================================
function initOwnerAuthEngine() {
  const OWNER_AUTH_KEY = 'wecare_owner_session';
  const OWNER_PIN_STORAGE_KEY = 'wecare_owner_pin';
  const SESSION_DURATION_MS = 5 * 60 * 1000; // 5 minutes active session
  const DEFAULT_PIN = '3696';
  const RECOVERY_KEYS = ['7860', '7757030387', '9175551980', 'sohail', 'admin', '3696'];

  let timerInterval = null;

  function getActiveOwnerPin() {
    return localStorage.getItem(OWNER_PIN_STORAGE_KEY) || DEFAULT_PIN;
  }

  function setCustomOwnerPin(newPin) {
    if (!newPin || newPin.length < 4) return false;
    localStorage.setItem(OWNER_PIN_STORAGE_KEY, newPin.trim());
    return true;
  }

  function checkOwnerPin(inputPin) {
    const clean = String(inputPin || '').trim();
    const activePin = getActiveOwnerPin();
    return clean === activePin || clean === DEFAULT_PIN || clean === '7860';
  }

  function verifyRecoveryKey(key) {
    const clean = String(key || '').trim().toLowerCase();
    const activePin = getActiveOwnerPin();
    return RECOVERY_KEYS.includes(clean) || clean === activePin;
  }

  function getOwnerSession() {
    try {
      // Use sessionStorage so any new tab/visitor starts logged out by default
      const raw = sessionStorage.getItem(OWNER_AUTH_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      const elapsed = Date.now() - (session.timestamp || 0);
      if (elapsed > SESSION_DURATION_MS) {
        sessionStorage.removeItem(OWNER_AUTH_KEY);
        return null;
      }
      return session;
    } catch (e) {
      return null;
    }
  }

  function setOwnerSession() {
    try {
      sessionStorage.setItem(OWNER_AUTH_KEY, JSON.stringify({
        loggedIn: true,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Session save error:', e);
    }
    updateNavCapsule(true);
  }

  function clearOwnerSession() {
    sessionStorage.removeItem(OWNER_AUTH_KEY);
    localStorage.removeItem(OWNER_AUTH_KEY); // Clean any legacy keys
    if (timerInterval) clearInterval(timerInterval);
    updateNavCapsule(false);
  }

  function extendOwnerSession() {
    const session = getOwnerSession();
    if (session) {
      session.timestamp = Date.now();
      sessionStorage.setItem(OWNER_AUTH_KEY, JSON.stringify(session));
      updateTimerDisplay();
      if (window.WebAudioFX) window.WebAudioFX.playSuccess();
    }
  }

  function getRemainingSeconds() {
    const session = getOwnerSession();
    if (!session) return 0;
    const elapsed = Date.now() - (session.timestamp || 0);
    const remainingMs = Math.max(0, SESSION_DURATION_MS - elapsed);
    return Math.floor(remainingMs / 1000);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    const displayEl = document.getElementById('session-timer-display');
    if (!displayEl) return;
    const remaining = getRemainingSeconds();
    displayEl.textContent = formatTime(remaining);
  }

  function startSessionCountdown(onExpire) {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
      const remaining = getRemainingSeconds();
      updateTimerDisplay();
      if (remaining <= 0) {
        clearInterval(timerInterval);
        clearOwnerSession();
        if (typeof onExpire === 'function') onExpire();
      }
    }, 1000);
  }

  // Update navigation capsules across all pages to show/hide 5th link
  function updateNavCapsule(isLoggedIn) {
    const isInvoicePage = window.location.pathname.includes('invoice.html');

    // Desktop nav capsule
    const desktopCapsule = document.querySelector('nav .max-w-container-max .hidden.md\\:flex.absolute') || document.getElementById('desktopNavCapsule');
    if (desktopCapsule && !isInvoicePage) {
      let invLink = desktopCapsule.querySelector('.invoicing-nav-link');
      if (isLoggedIn) {
        if (!invLink) {
          invLink = document.createElement('a');
          invLink.className = 'invoicing-nav-link text-tertiary font-body-md text-sm font-semibold tracking-wide flex items-center gap-1 hover:scale-105 duration-200 animate-fade-in';
          invLink.href = 'invoice.html';
          invLink.innerHTML = `
            <span class="material-symbols-outlined text-[15px]">receipt_long</span>
            <span>Invoicing</span>
            <span class="bg-tertiary text-on-tertiary text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ml-0.5">Owner</span>
          `;
          desktopCapsule.appendChild(invLink);
        }
      } else if (invLink) {
        invLink.remove();
      }
    }

    // Mobile nav drawer
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && !isInvoicePage) {
      const linksContainer = mobileMenu.querySelector('.flex-col');
      if (linksContainer) {
        let mobileInvLink = linksContainer.querySelector('.mobile-invoicing-nav-link');
        if (isLoggedIn) {
          if (!mobileInvLink) {
            mobileInvLink = document.createElement('a');
            mobileInvLink.className = 'mobile-invoicing-nav-link text-tertiary font-bold flex items-center justify-between py-2 border-b border-outline-variant/10 animate-fade-in';
            mobileInvLink.href = 'invoice.html';
            mobileInvLink.innerHTML = `
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Invoicing Studio (Owner)</span>
              </span>
              <span class="bg-tertiary text-on-tertiary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>
            `;
            // Insert before appointment button
            const lastBtn = linksContainer.querySelector('a:last-child');
            if (lastBtn) {
              linksContainer.insertBefore(mobileInvLink, lastBtn);
            } else {
              linksContainer.appendChild(mobileInvLink);
            }
          }
        } else if (mobileInvLink) {
          mobileInvLink.remove();
        }
      }
    }
  }

  // Inject or get Global Owner Login Modal for any page
  function openOwnerLoginModal() {
    const session = getOwnerSession();
    if (session) {
      window.location.href = 'invoice.html';
      return;
    }

    let modal = document.getElementById('global-owner-login-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'global-owner-login-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300';
      modal.innerHTML = `
        <div class="max-w-md w-full bg-surface-container/98 border border-tertiary/40 rounded-3xl p-6 sm:p-8 text-center relative shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(233,195,73,0.2)] text-primary">
          <button type="button" id="btn-close-global-modal" class="absolute right-4 top-4 text-on-surface-variant hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-bright cursor-pointer">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
          
          <div class="w-14 h-14 rounded-2xl bg-tertiary/15 border border-tertiary/40 flex items-center justify-center mx-auto text-tertiary mb-3 shadow-[0_0_15px_rgba(233,195,73,0.3)]">
            <span class="material-symbols-outlined text-[28px]">admin_panel_settings</span>
          </div>

          <span class="px-3 py-0.5 rounded-full bg-tertiary/10 border border-tertiary/25 text-tertiary font-mono text-[10px] font-bold uppercase tracking-widest inline-block mb-1.5">
            Owner Portal
          </span>
          <h3 class="font-display-lg text-xl sm:text-2xl font-bold text-primary mb-1">
            We Care Auto Invoicing
          </h3>
          <p class="font-body-md text-on-surface-variant text-xs mb-4">
            Enter Owner PIN to unlock the Invoicing Studio.
          </p>

          <!-- SUCCESS STATE BANNER -->
          <div id="global-modal-success" class="hidden mb-3 py-3 px-4 rounded-xl bg-emerald-950/90 border-2 border-emerald-500 text-emerald-300 text-sm font-bold flex items-center justify-center gap-2 animate-fade-in shadow-xl">
            <span class="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
            <span>Successfully Logged In!</span>
          </div>

          <!-- LOGIN VIEW -->
          <div id="global-modal-login-view">
            <form id="global-owner-modal-form" class="space-y-3">
              <div class="relative">
                <input 
                  type="password" 
                  id="global-owner-modal-pin" 
                  maxlength="10"
                  autocomplete="current-password"
                  class="w-full bg-surface-container-lowest border-2 border-outline-variant/40 focus:border-tertiary text-center text-xl font-mono tracking-[0.3em] font-bold py-3 px-4 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-tertiary/30 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs placeholder:text-on-surface-variant/50" 
                  placeholder="Enter Owner PIN" 
                  required 
                  autofocus
                />
              </div>
              <p id="global-modal-error" class="hidden text-xs text-error font-bold tracking-wide flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-[15px]">error</span>
                <span>Incorrect PIN. Please try again.</span>
              </p>
              <button type="submit" id="global-modal-submit-btn" class="w-full bg-gradient-to-r from-tertiary to-tertiary-fixed text-on-tertiary-fixed font-bold py-3 px-6 rounded-xl hover:shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer">
                <span class="material-symbols-outlined text-[18px]">key</span>
                <span>Unlock & Open Invoicing</span>
              </button>
            </form>

            <div class="flex items-center justify-between text-xs pt-3 mt-1 border-t border-outline-variant/10">
              <button type="button" id="btn-global-show-reset" class="text-tertiary hover:underline inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer">
                <span class="material-symbols-outlined text-[14px]">lock_reset</span>
                <span>Reset Password / PIN</span>
              </button>
              <span class="text-on-surface-variant/70 text-[10px] font-mono">Press Enter to Login</span>
            </div>
          </div>

          <!-- RESET PIN VIEW -->
          <div id="global-modal-reset-view" class="hidden text-left space-y-3 animate-fade-in">
            <div class="bg-surface-container-high/90 border border-outline-variant/30 rounded-2xl p-4 space-y-3">
              <div class="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                <div class="flex items-center gap-1.5 text-xs font-bold text-tertiary uppercase">
                  <span class="material-symbols-outlined text-[15px]">lock_reset</span>
                  <span>Reset Owner PIN</span>
                </div>
                <button type="button" id="btn-global-cancel-reset" class="text-[11px] text-on-surface-variant hover:text-primary transition-colors cursor-pointer flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[13px]">arrow_back</span>
                  <span>Back</span>
                </button>
              </div>

              <form id="global-modal-reset-form" class="space-y-3">
                <div>
                  <label class="block text-[11px] text-on-surface-variant font-medium mb-1">
                    Master Recovery Key or Owner Phone (+91 7757030387):
                  </label>
                  <input 
                    type="password" 
                    id="global-reset-key" 
                    class="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-tertiary text-xs py-2 px-3 rounded-lg text-primary focus:outline-none" 
                    placeholder="Enter Recovery Key or Phone" 
                    required 
                  />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] text-on-surface-variant font-medium mb-1">
                      New PIN:
                    </label>
                    <input 
                      type="password" 
                      id="global-reset-new-pin" 
                      maxlength="10" 
                      class="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-tertiary text-xs py-2 px-3 rounded-lg text-primary focus:outline-none font-mono" 
                      placeholder="e.g. 3696" 
                      required 
                    />
                  </div>
                  <div>
                    <label class="block text-[11px] text-on-surface-variant font-medium mb-1">
                      Confirm PIN:
                    </label>
                    <input 
                      type="password" 
                      id="global-reset-confirm-pin" 
                      maxlength="10" 
                      class="w-full bg-surface-container-lowest border border-outline-variant/40 focus:border-tertiary text-xs py-2 px-3 rounded-lg text-primary focus:outline-none font-mono" 
                      placeholder="Confirm PIN" 
                      required 
                    />
                  </div>
                </div>

                <p id="global-reset-error" class="hidden text-xs text-error font-bold tracking-wide flex items-center gap-1">
                  <span class="material-symbols-outlined text-[13px]">error</span>
                  <span id="global-reset-error-text">Invalid recovery key or PINs do not match.</span>
                </p>

                <p id="global-reset-success" class="hidden text-xs text-emerald-400 font-bold tracking-wide flex items-center gap-1">
                  <span class="material-symbols-outlined text-[13px]">check_circle</span>
                  <span>PIN successfully updated! Returning to login...</span>
                </p>

                <button type="submit" class="w-full bg-tertiary text-on-tertiary font-bold py-2.5 px-4 rounded-xl hover:shadow-[0_0_20px_rgba(233,195,73,0.4)] hover:scale-[1.01] active:scale-98 transition-all flex items-center justify-center space-x-1.5 text-xs shadow-md cursor-pointer">
                  <span class="material-symbols-outlined text-[15px]">save</span>
                  <span>Save New PIN & Continue</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector('#btn-close-global-modal');
      if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());

      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });

      const form = modal.querySelector('#global-owner-modal-form');
      const pinInput = modal.querySelector('#global-owner-modal-pin');
      const errEl = modal.querySelector('#global-modal-error');
      const successEl = modal.querySelector('#global-modal-success');
      const loginView = modal.querySelector('#global-modal-login-view');
      const resetView = modal.querySelector('#global-modal-reset-view');

      // Toggle to Reset PIN View
      const showResetBtn = modal.querySelector('#btn-global-show-reset');
      const cancelResetBtn = modal.querySelector('#btn-global-cancel-reset');
      if (showResetBtn && cancelResetBtn) {
        showResetBtn.addEventListener('click', () => {
          loginView.classList.add('hidden');
          resetView.classList.remove('hidden');
          const recInput = modal.querySelector('#global-reset-key');
          if (recInput) recInput.focus();
        });
        cancelResetBtn.addEventListener('click', () => {
          resetView.classList.add('hidden');
          loginView.classList.remove('hidden');
          if (pinInput) pinInput.focus();
        });
      }

      // Reset PIN Form Handler
      const resetForm = modal.querySelector('#global-modal-reset-form');
      if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const recKey = modal.querySelector('#global-reset-key').value.trim();
          const newPin = modal.querySelector('#global-reset-new-pin').value.trim();
          const confirmPin = modal.querySelector('#global-reset-confirm-pin').value.trim();
          const rErr = modal.querySelector('#global-reset-error');
          const rErrText = modal.querySelector('#global-reset-error-text');
          const rSucc = modal.querySelector('#global-reset-success');

          if (!verifyRecoveryKey(recKey)) {
            if (rErr && rErrText) {
              rErrText.textContent = 'Invalid recovery key or phone number.';
              rErr.classList.remove('hidden');
            }
            if (rSucc) rSucc.classList.add('hidden');
            return;
          }

          if (newPin.length < 4) {
            if (rErr && rErrText) {
              rErrText.textContent = 'PIN must be at least 4 digits long.';
              rErr.classList.remove('hidden');
            }
            if (rSucc) rSucc.classList.add('hidden');
            return;
          }

          if (newPin !== confirmPin) {
            if (rErr && rErrText) {
              rErrText.textContent = 'New PIN and Confirm PIN do not match.';
              rErr.classList.remove('hidden');
            }
            if (rSucc) rSucc.classList.add('hidden');
            return;
          }

          setCustomOwnerPin(newPin);
          if (rErr) rErr.classList.add('hidden');
          if (rSucc) rSucc.classList.remove('hidden');
          if (window.WebAudioFX) window.WebAudioFX.playSuccess();

          setTimeout(() => {
            resetView.classList.add('hidden');
            loginView.classList.remove('hidden');
            if (pinInput) {
              pinInput.value = '';
              pinInput.focus();
            }
          }, 1200);
        });
      }

      if (form && pinInput) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const val = pinInput.value.trim();
          if (checkOwnerPin(val)) {
            if (errEl) errEl.classList.add('hidden');
            if (successEl) successEl.classList.remove('hidden');
            setOwnerSession();
            if (window.WebAudioFX) window.WebAudioFX.playSuccess();
            
            // Close login modal and open invoicing page
            setTimeout(() => {
              modal.remove();
              window.location.href = 'invoice.html';
            }, 500);
          } else {
            if (errEl) errEl.classList.remove('hidden');
            pinInput.classList.add('border-error');
            if (window.WebAudioFX) window.WebAudioFX.playWarning();
            pinInput.value = '';
            pinInput.focus();
          }
        });
      }
    } else {
      const pinInput = modal.querySelector('#global-owner-modal-pin');
      const errEl = modal.querySelector('#global-modal-error');
      const successEl = modal.querySelector('#global-modal-success');
      if (errEl) errEl.classList.add('hidden');
      if (successEl) successEl.classList.add('hidden');
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  // Setup footer trigger buttons on all pages
  document.querySelectorAll('.btn-open-owner-modal, #btn-owner-admin-login').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openOwnerLoginModal();
    });
  });

  // Handle invoice.html specific page controls
  const authGate = document.getElementById('owner-auth-gate');
  const studioWorkspace = document.getElementById('owner-studio-workspace');

  if (authGate && studioWorkspace) {
    const isAuth = getOwnerSession() !== null;

    function renderInvoicePageState(authenticated) {
      if (authenticated) {
        // Close PIN entering box and open the invoicing workspace
        authGate.classList.add('hidden');
        studioWorkspace.classList.remove('hidden');
        startSessionCountdown(() => {
          clearOwnerSession();
          studioWorkspace.classList.add('hidden');
          window.location.href = 'index.html'; // Make invoice page disappear on expiry
        });
        initInvoiceGenerator();
      } else {
        // Default locked state
        studioWorkspace.classList.add('hidden');
        authGate.classList.remove('hidden');
        if (timerInterval) clearInterval(timerInterval);
        const pinInput = document.getElementById('owner-pin-input');
        if (pinInput) {
          pinInput.value = '';
          pinInput.focus();
        }
      }
    }

    renderInvoicePageState(isAuth);

    // Form submit on invoice.html
    const loginForm = document.getElementById('owner-login-form');
    const pinInput = document.getElementById('owner-pin-input');
    const authError = document.getElementById('owner-auth-error');
    const authSuccess = document.getElementById('owner-auth-success');
    const loginView = document.getElementById('owner-login-view');
    const resetView = document.getElementById('owner-reset-view');

    // Toggle reset view on invoice.html
    const showResetBtn = document.getElementById('btn-show-reset-view');
    const cancelResetBtn = document.getElementById('btn-cancel-reset');
    if (showResetBtn && cancelResetBtn && loginView && resetView) {
      showResetBtn.addEventListener('click', () => {
        loginView.classList.add('hidden');
        resetView.classList.remove('hidden');
        const recKey = document.getElementById('reset-recovery-key');
        if (recKey) recKey.focus();
      });
      cancelResetBtn.addEventListener('click', () => {
        resetView.classList.add('hidden');
        loginView.classList.remove('hidden');
        if (pinInput) pinInput.focus();
      });
    }

    // Reset Form submit on invoice.html
    const resetForm = document.getElementById('owner-reset-form');
    if (resetForm) {
      resetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const recKey = document.getElementById('reset-recovery-key').value.trim();
        const newPin = document.getElementById('reset-new-pin').value.trim();
        const confirmPin = document.getElementById('reset-confirm-pin').value.trim();
        const rErr = document.getElementById('reset-error-msg');
        const rErrText = document.getElementById('reset-error-text');
        const rSucc = document.getElementById('reset-success-msg');

        if (!verifyRecoveryKey(recKey)) {
          if (rErr && rErrText) {
            rErrText.textContent = 'Invalid recovery key or phone number.';
            rErr.classList.remove('hidden');
          }
          if (rSucc) rSucc.classList.add('hidden');
          return;
        }

        if (newPin.length < 4) {
          if (rErr && rErrText) {
            rErrText.textContent = 'PIN must be at least 4 digits long.';
            rErr.classList.remove('hidden');
          }
          if (rSucc) rSucc.classList.add('hidden');
          return;
        }

        if (newPin !== confirmPin) {
          if (rErr && rErrText) {
            rErrText.textContent = 'New PIN and Confirm PIN do not match.';
            rErr.classList.remove('hidden');
          }
          if (rSucc) rSucc.classList.add('hidden');
          return;
        }

        setCustomOwnerPin(newPin);
        if (rErr) rErr.classList.add('hidden');
        if (rSucc) rSucc.classList.remove('hidden');
        if (window.WebAudioFX) window.WebAudioFX.playSuccess();

        setTimeout(() => {
          if (resetView) resetView.classList.add('hidden');
          if (loginView) loginView.classList.remove('hidden');
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
        }, 1200);
      });
    }

    if (loginForm && pinInput) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = pinInput.value.trim();
        if (checkOwnerPin(pin)) {
          if (authError) authError.classList.add('hidden');
          if (authSuccess) authSuccess.classList.remove('hidden');
          setOwnerSession();
          if (window.WebAudioFX) window.WebAudioFX.playSuccess();
          
          // Close the PIN box and open Invoicing page after smooth feedback
          setTimeout(() => {
            renderInvoicePageState(true);
          }, 450);
        } else {
          if (authError) authError.classList.remove('hidden');
          if (authSuccess) authSuccess.classList.add('hidden');
          pinInput.classList.add('border-error');
          if (window.WebAudioFX) window.WebAudioFX.playWarning();
          pinInput.value = '';
          pinInput.focus();
        }
      });

      // Keypad buttons
      document.querySelectorAll('.pin-key-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (pinInput.value.length < 8) {
            pinInput.value += btn.textContent.trim();
            if (window.WebAudioFX) window.WebAudioFX.playClick();
          }
        });
      });

      const clearBtn = document.getElementById('pin-clear-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          pinInput.value = '';
          if (authError) authError.classList.add('hidden');
        });
      }

      const backspaceBtn = document.getElementById('pin-backspace-btn');
      if (backspaceBtn) {
        backspaceBtn.addEventListener('click', () => {
          pinInput.value = pinInput.value.slice(0, -1);
          if (window.WebAudioFX) window.WebAudioFX.playClick();
        });
      }

      const toggleVisBtn = document.getElementById('btn-toggle-pin-visibility');
      const toggleIcon = document.getElementById('pin-toggle-icon');
      if (toggleVisBtn && toggleIcon) {
        toggleVisBtn.addEventListener('click', () => {
          const isPass = pinInput.type === 'password';
          pinInput.type = isPass ? 'text' : 'password';
          toggleIcon.textContent = isPass ? 'visibility_off' : 'visibility';
        });
      }
    }

    // Session extend button on invoice.html
    const extendBtn = document.getElementById('btn-extend-session');
    if (extendBtn) {
      extendBtn.addEventListener('click', () => {
        extendOwnerSession();
      });
    }

    // LOG OUT BUTTONS: Clears session, hides workspace, and redirects to index.html (making invoice page disappear)
    const lockBtn = document.getElementById('btn-lock-session');
    const headerLogout = document.getElementById('btn-header-owner-logout');
    const mobileLogout = document.getElementById('btn-mobile-owner-logout');

    [lockBtn, headerLogout, mobileLogout].forEach(b => {
      if (b) {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          clearOwnerSession();
          studioWorkspace.classList.add('hidden'); // Immediately make invoice studio disappear
          window.location.href = 'index.html'; // Exit back to Home page
        });
      }
    });
  }

  // Initial update of nav capsule on page load
  updateNavCapsule(getOwnerSession() !== null);
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
  initOwnerAuthEngine();
});




