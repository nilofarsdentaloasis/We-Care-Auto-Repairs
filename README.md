# 🏎️ We Care Auto Repair - Smooth Scroll-Driven Car Transformation

An ultra-smooth, Apple-style frame sequence scroll animation engineered with **HTML5 Canvas**, **sub-pixel LERP physics dampening**, **High-DPI Retina scaling**, and **interactive glassmorphic HUD scrollytelling cards**.

---

## 📁 Project Structure

```
We Care Auto Repair/
├── index.html                  # Full luxury automotive showcase website
├── standalone-embed.html       # Minimal standalone component for embedding anywhere
├── css/
│   ├── scrolly-canvas.css      # Isolated animation container & HUD overlay styling
│   └── style.css               # Full design system, luxury dark mode, calculator, slider
├── js/
│   ├── scrolly-canvas.js       # Core LERP Canvas animation engine & telemetry
│   └── app.js                  # Before/After comparison, dynamic price calculator, booking modal
└── assets/
    └── frames/                 # 300 high-definition transformation image frames
        ├── ezgif-frame-001.jpg
        ├── ...
        └── ezgif-frame-300.jpg
```

---

## 🚀 Key Features

1. **Buttery-Smooth Inertial Scroll (LERP)**:
   - Uses linear interpolation (`target += (scroll - target) * 0.12`) on `requestAnimationFrame` for silky smooth motion regardless of scroll wheel speed.
2. **Zero-Lag Image Preloading**:
   - Asynchronously preloads all 144 frames with an animated high-tech HUD progress bar to eliminate blank-frame flicker.
3. **High-DPI / Retina Canvas Containment**:
   - Automatically handles `devicePixelRatio` scaling and maintains high-res proportional centering on desktop, tablet, and mobile.
4. **4 Scrollytelling Milestones**:
   - **Phase 01 (Frames 1-36)**: Baseline Factory Diagnostics
   - **Phase 02 (Frames 37-75)**: Aero Splitter, Vented Hood & Track Suspension
   - **Phase 03 (Frames 76-115)**: Bespoke Dual-Tone Satin Wrap & Ceramic Matrix
   - **Phase 04 (Frames 116-144)**: Track Ready #42 Unleashed (Open Doors & Dyno Tune)
5. **Interactive Pulsing Hotspots**:
   - Interactive data points on the vehicle that show engineering specs on hover/click.
6. **Timeline Scrubbing & Auto 360° Mode**:
   - Users can drag the timeline scrubber or press **AUTO 360°** for a hands-free presentation loop.
7. **Interactive Before vs After Slider**:
   - Direct interactive comparison between stock baseline and the full race build.
8. **Live Build Estimator**:
   - Real-time customizer calculating total costs for tuning, wraps, and aero kits.

---

## 💻 How to Embed into ANY Existing Website

To use this scroll animation in your existing website, follow these simple 3 steps:

### Step 1: Copy Assets & Stylesheets
Copy `assets/frames/`, `css/scrolly-canvas.css`, and `js/scrolly-canvas.js` to your project folder.

Link the CSS in your `<head>`:
```html
<link rel="stylesheet" href="css/scrolly-canvas.css">
```

### Step 2: Add the HTML Markup
Paste the component container anywhere in your HTML:
```html
<div id="car-scrolly-section" class="scrolly-track" data-phase="1">
  <div class="scrolly-sticky-viewport">
    <div class="scrolly-grid-bg"></div>
    <div class="scrolly-ambient-glow"></div>
    <canvas id="car-canvas" class="scrolly-canvas"></canvas>
    <div class="hotspot-layer"></div>

    <!-- Preloader -->
    <div class="scrolly-preloader">
      <div class="preloader-box">
        <div class="preloader-title">LOADING FRAMES</div>
        <div class="preloader-status">INITIALIZING...</div>
        <div class="preloader-bar-bg"><div class="preloader-bar-fill"></div></div>
      </div>
    </div>

    <!-- HUD Overlay -->
    <div class="scrolly-hud">
      <!-- (See standalone-embed.html for full HUD markup) -->
    </div>
  </div>
</div>
```

### Step 3: Initialize the Engine
Include the script before `</body>`:
```html
<script src="js/scrolly-canvas.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    new ScrollyCarEngine({
      container: '#car-scrolly-section',
      canvas: '#car-canvas',
      track: '.scrolly-track',
      totalFrames: 300,
      framePathPattern: 'assets/frames/ezgif-frame-{INDEX}.jpg',
      lerpFactor: 0.12  // Adjust inertia (0.05 = super smooth/heavy, 0.25 = snappy)
    });
  });
</script>
```

---

## ⚙️ Configuration & Customization Options

| Option | Default | Description |
| :--- | :--- | :--- |
| `totalFrames` | `300` | Total number of frames in your image folder. |
| `framePathPattern` | `'assets/frames/ezgif-frame-{INDEX}.jpg'` | Path pattern where `{INDEX}` will be replaced with 3-digit padded numbers (`001`, `002`, etc.). |
| `lerpFactor` | `0.12` | Physics damping coefficient. Lower values create a more floating/inertial feel. |
| `track.style.height` | `450vh` (in CSS) | Scroll track length. Increase (e.g. `600vh`) for slower, more granular frame steps per scroll unit. |

---

## 🌐 Opening the Project
Simply double-click `index.html` or `standalone-embed.html` in any modern web browser (Google Chrome, Microsoft Edge, Firefox, Safari).
