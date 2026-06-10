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

/* ─── Patents carousel — sync progress dots + tap-to-scroll (carousel mode only).
   No-op on desktop, where .pcards is a non-scrolling grid. ─────────────────── */
(function () {
  var root = document.querySelector(".patents-list");
  if (!root) return;
  var grid = root.querySelector(".pcards");
  var dots = Array.prototype.slice.call(root.querySelectorAll(".pdots button"));
  var cards = Array.prototype.slice.call(root.querySelectorAll(".pcard"));
  if (!grid || !dots.length || !cards.length) return;

  function activeIndex() {
    var center = grid.scrollLeft + grid.clientWidth / 2, best = 0, bestDist = Infinity;
    cards.forEach(function (c, i) {
      var mid = c.offsetLeft + c.offsetWidth / 2, d = Math.abs(mid - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }
  function sync() {
    var i = activeIndex();
    dots.forEach(function (d, j) { d.classList.toggle("on", j === i); });
  }
  var raf = null;
  grid.addEventListener("scroll", function () {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = null; sync(); });
  }, { passive: true });
  dots.forEach(function (d, i) {
    d.addEventListener("click", function () {
      var target = cards[i].offsetLeft - (grid.clientWidth - cards[i].offsetWidth) / 2;
      grid.scrollTo({ left: target, behavior: "smooth" });
    });
  });
  sync();
})();
