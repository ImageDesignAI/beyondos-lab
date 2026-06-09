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
    cell: 17, density: 0.72, motion: 1, glyphs: "tilemap",
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
    cell: 12, density: 0.5, motion: 1, glyphs: "tilemap",
    accent: rgb("--accent"), ink: rgb("--paper"),
    font: "'Geist Mono', ui-monospace, monospace"
  }) : null;
  window.__mfield = mfield;

  // sticky chrome
  var chrome = document.querySelector("header.chrome");
  var onScroll = function () { chrome.dataset.stuck = window.scrollY > 40 ? "1" : "0"; };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  // top tabs — active-state toggle
  var tabsEl = document.getElementById("tabs");
  if (tabsEl) tabsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (!b) return;
    tabsEl.querySelectorAll(".tab").forEach(function (x) { x.classList.remove("on"); });
    b.classList.add("on");
  });

  // smooth anchor scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var el = document.querySelector(id);
      if (el) { e.preventDefault(); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }); }
    });
  });

  // field settings panel
  var fset = document.getElementById("fset");
  document.getElementById("ftoggle").addEventListener("click", function () {
    fset.dataset.open = fset.dataset.open === "1" ? "0" : "1";
  });
  document.getElementById("fclose").addEventListener("click", function () { fset.dataset.open = "0"; });

  function bind(rangeId, valId, fmt, apply) {
    var r = document.getElementById(rangeId), v = document.getElementById(valId);
    r.addEventListener("input", function () { v.textContent = fmt(r.value); apply(r.value); });
  }
  bind("r-cell", "v-cell", function (x) { return x; }, function (x) { field.set({ cell: +x }); });
  bind("r-den", "v-den", function (x) { return x; }, function (x) { field.set({ density: +x / 100 }); });
  bind("r-mot", "v-mot", function (x) { return x; }, function (x) { field.set({ motion: +x / 100 }); });

  document.getElementById("seg-glyph").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    this.querySelectorAll("button").forEach(function (x) { x.classList.remove("on"); });
    b.classList.add("on");
    field.set({ glyphs: b.dataset.g });
  });

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
