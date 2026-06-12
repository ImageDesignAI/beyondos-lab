/* =========================================================================
   BeyondOS Lab — page bootstrap
   Mounts the generative scenes (hero pixel world, mission flappy panel) and
   the glyph field, wires the sticky header, top tabs, smooth-scroll anchors,
   and the diegetic "Field" settings panel.
   Depends on: beyond-scene.js, beyond-flappy.js, beyond-field.js
   ========================================================================= */
(function () {
  "use strict";
  var root = document.documentElement;
  function rgb(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }

  var field = BeyondField.mount(document.getElementById("field"), {
    cell: 17, density: 0.72, motion: 1, glyphs: "binary",
    accent: rgb("--accent"), ink: rgb("--paper"),
    font: "'Geist Mono', ui-monospace, monospace"
  });
  window.__field = field;

  // hero pixel scene (original 8-bit world, below the field)
  var accentHex = "#6abb8d";
  var scene = BeyondScene.mount(document.getElementById("hero-scene"), { accent: accentHex });
  window.__scene = scene;

  // mission panel: original flappy-genre scene + a faint glyph overlay
  var msEl = document.getElementById("mission-scene");
  var mscene = msEl ? BeyondFlappy.mount(msEl, { accent: "#6abb8d" }) : null;
  window.__mscene = mscene;
  var mfEl = document.getElementById("mission-field");
  var mfield = mfEl ? BeyondField.mount(mfEl, {
    cell: 12, density: 0.5, motion: 1, glyphs: "binary",
    accent: rgb("--accent"), ink: rgb("--paper"),
    font: "'Geist Mono', ui-monospace, monospace"
  }) : null;
  window.__mfield = mfield;

  // top tabs — active-state toggle on click + scrollspy
  var tabsEl = document.getElementById("tabs");
  var spy = [];
  if (tabsEl) {
    tabsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".tab"); if (!b) return;
      tabsEl.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("on"); });
      b.classList.add("on");
    });
    // build the scrollspy map from tabs that point at a real section
    tabsEl.querySelectorAll(".tab").forEach(function (t) {
      var href = t.getAttribute("href") || "";
      if (href.charAt(0) === "#" && href.length > 1) {
        var sec = document.getElementById(href.slice(1));
        if (sec) spy.push({ tab: t, el: sec });
      }
    });
  }
  function syncSpy() {
    if (!spy.length) return;
    var line = window.scrollY + 100;          // a touch below the fixed header
    var cur = null;                            // no tab highlighted until a section passes the line (hero = none)
    spy.forEach(function (s) { if (s.el.offsetTop <= line) cur = s; });
    var active = cur ? cur.tab : null;
    tabsEl.querySelectorAll(".tab").forEach(function (x) { x.classList.toggle("on", x === active); });
  }

  // sticky chrome + scrollspy
  var chrome = document.querySelector("header.chrome");
  var raf = null;
  var onScroll = function () {
    chrome.dataset.stuck = window.scrollY > 40 ? "1" : "0";
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; syncSpy(); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  syncSpy();

  // smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) { e.preventDefault(); return; }   // inert "#" placeholder
      var el = document.querySelector(id);
      if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }); }
    });
  });

  // toast + "coming soon" for the Enterprise pill
  var toastEl = document.getElementById("toast");
  var toastMsg = toastEl ? toastEl.querySelector(".toast__msg") : null;
  var toastTimer = null;
  function showToast(msg) {
    if (!toastEl) return;
    toastMsg.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 2600);
  }
  var entBtn = document.querySelector('.pill[data-tab="enterprise"]');
  if (entBtn) entBtn.addEventListener("click", function (e) { e.preventDefault(); showToast("Coming soon"); });

  // theming hooks — programmatic mode/accent control across the page + scenes.
  var fieldCanvas = document.getElementById("field");
  window.__fieldBaseOpacity = function () { return root.dataset.mode === "light" ? 0.3 : 0.9; };
  window.__applyMode = function (mode) {
    root.dataset.mode = mode;
    field.set({ accent: rgb("--accent"), ink: rgb("--paper") });
    if (mfield) mfield.set({ accent: rgb("--accent"), ink: rgb("--paper") });
    if (fieldCanvas.style.opacity !== "0") fieldCanvas.style.opacity = String(window.__fieldBaseOpacity());
  };
  window.__applyAccent = function (triplet) {
    root.style.setProperty("--accent", triplet);
    field.set({ accent: triplet });
    if (mfield) mfield.set({ accent: triplet });
    var q = triplet.split(/\s+/).map(Number);
    if (q.length === 3) {
      var hex = "rgb(" + q[0] + "," + q[1] + "," + q[2] + ")";
      if (mscene) mscene.setAccent(hex);
      if (scene) scene.setAccent(hex);
    }
  };
})();

/* ─── Research carousel — infinite arched scroll. Clones the card set on both
   sides so it loops seamlessly; starts centred on card 001. The card nearest
   the centre sits upright and tallest, neighbours curve down and tilt away.
   Flat (no arch) on mobile. ──────────────────────────────────────────────── */
(function () {
  var root = document.querySelector(".patents-sec");
  if (!root) return;
  var grid = root.querySelector(".pcards");
  var navs = grid ? Array.prototype.slice.call(root.querySelectorAll(".pnav")) : [];
  if (!grid) return;
  var originals = Array.prototype.slice.call(grid.querySelectorAll(".pcard"));
  if (originals.length < 2) return;

  // [clone set] [originals] [clone set]  → seamless loop, room to centre 001
  var lead = document.createDocumentFragment(), trail = document.createDocumentFragment();
  originals.forEach(function (c) {
    var a = c.cloneNode(true); a.setAttribute("aria-hidden", "true"); a.dataset.clone = "1"; lead.appendChild(a);
    var b = c.cloneNode(true); b.setAttribute("aria-hidden", "true"); b.dataset.clone = "1"; trail.appendChild(b);
  });
  grid.insertBefore(lead, originals[0]);
  grid.appendChild(trail);
  var cards = Array.prototype.slice.call(grid.querySelectorAll(".pcard"));
  var firstReal = cards[originals.length];   // the real card 001

  var setStride = 0, home = 0, inited = false;
  function metrics() {
    setStride = firstReal.offsetLeft - cards[0].offsetLeft;             // width of one full set
    home = firstReal.offsetLeft + firstReal.offsetWidth / 2 - grid.clientWidth / 2;  // centres 001
  }
  function wrap() {
    if (setStride <= 0) return;
    if (grid.scrollLeft >= home + setStride) grid.scrollLeft -= setStride;
    else if (grid.scrollLeft < home) grid.scrollLeft += setStride;
  }
  function arch() {
    var mobile = window.innerWidth <= 760;
    var half = grid.clientWidth / 2;
    var center = grid.scrollLeft + half;
    // gentler coefficients on mobile, where neighbours sit much further from centre
    var rotK = mobile ? 4 : 5, tyK = mobile ? 14 : 46, scK = mobile ? 0.04 : 0.05;
    cards.forEach(function (c) {
      var mid = c.offsetLeft + c.offsetWidth / 2;
      var dx = (mid - center) / half;
      if (dx < -1.8) dx = -1.8; else if (dx > 1.8) dx = 1.8;
      var rot = dx * rotK, ty = dx * dx * tyK, sc = 1 - Math.abs(dx) * scK;
      c.style.transform = "translateY(" + ty.toFixed(1) + "px) rotate(" + rot.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      c.style.zIndex = String(Math.round(100 - Math.abs(dx) * 40));
    });
  }

  function step() {
    var w = firstReal.getBoundingClientRect().width || grid.clientWidth * 0.8;
    var gapStr = getComputedStyle(grid).columnGap || getComputedStyle(grid).gap || "20px";
    return w + (parseFloat(gapStr) || 20);
  }
  navs.forEach(function (b) {
    b.addEventListener("click", function () {
      var dir = parseInt(b.getAttribute("data-dir"), 10) || 1;
      grid.scrollBy({ left: dir * step(), behavior: "smooth" });
    });
  });

  var raf = null;
  grid.addEventListener("scroll", function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; wrap(); arch(); });
  }, { passive: true });

  function init() {
    metrics();
    if (!inited && setStride > 0) { grid.scrollLeft = home; inited = true; }
    arch();
  }
  window.addEventListener("resize", function () {
    var prev = setStride ? (grid.scrollLeft - home) : 0;
    metrics();
    if (setStride > 0) grid.scrollLeft = home + ((prev % setStride) + setStride) % setStride;
    arch();
  });
  window.addEventListener("load", init);
  init();
  requestAnimationFrame(init);
})();
