(function () {
  "use strict";

  var D = window.HILLORA;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var state = { trip: null, selected: [], preselect: null };

  /* ---------- Helpers ---------- */

  function driveSrc(id, size) {
    return "https://drive.google.com/thumbnail?id=" + id + "&sz=w" + (size || 1600);
  }
  function driveFallback(id, size) {
    return "https://lh3.googleusercontent.com/d/" + id + "=w" + (size || 1600);
  }

  // Load a Drive image with a fallback host; shows a soft placeholder if both fail.
  function driveImg(id, alt, size) {
    var img = document.createElement("img");
    img.alt = alt;
    img.loading = "lazy";
    img.decoding = "async";
    img.src = driveSrc(id, size);
    img.addEventListener("load", function () { img.classList.add("is-loaded"); });
    img.addEventListener("error", function () {
      if (!img.dataset.retried) {
        img.dataset.retried = "1";
        img.src = driveFallback(id, size);
      } else {
        var ph = document.createElement("span");
        ph.className = "img-fallback";
        ph.textContent = "Hillora Tales";
        img.replaceWith(ph);
      }
    });
    return img;
  }

  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }

  function parseDate(v) {
    if (!v) return null;
    var p = v.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function toInput(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function fmtDate(d) {
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  // Friday and Saturday nights use the weekend rate.
  function nightSplit(checkIn, checkOut) {
    var weekday = 0, weekend = 0;
    for (var d = new Date(checkIn); d < checkOut; d = addDays(d, 1)) {
      var dow = d.getDay();
      if (dow === 5 || dow === 6) weekend++; else weekday++;
    }
    return { weekday: weekday, weekend: weekend, total: weekday + weekend };
  }

  function unitEstimate(split) {
    return split.weekday * D.rates.weekday + split.weekend * D.rates.weekend;
  }

  function guestLine(t) {
    var parts = [t.adults + " adult" + (t.adults > 1 ? "s" : "")];
    if (t.kids612) parts.push(t.kids612 + " child" + (t.kids612 > 1 ? "ren" : "") + " (6–12)");
    if (t.kidsU6) parts.push(t.kidsU6 + " child" + (t.kidsU6 > 1 ? "ren" : "") + " (below 6)");
    return parts.join(", ");
  }

  function stayById(id) {
    for (var i = 0; i < D.stays.length; i++) if (D.stays[i].id === id) return D.stays[i];
    return null;
  }

  /* ---------- Nav ---------- */

  var nav = $(".nav");
  function onScroll() { nav.classList.toggle("is-solid", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = $("#navToggle");
  var links = $("#navLinks");
  function setMenu(open) {
    links.classList.toggle("is-open", open);
    nav.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }
  toggle.addEventListener("click", function () { setMenu(!links.classList.contains("is-open")); });
  $$("a", links).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  /* ---------- Hero ---------- */

  // Crossfading slideshow. Portrait slides are skipped on landscape screens (CSS hides them).
  (function heroSlides() {
    var all = $$("#heroSlides .hero__slide");
    var dotsBox = $("#heroDots");
    var portraitMq = window.matchMedia("(orientation: portrait)");
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var slides = [], idx = 0, timer = null;

    function show(i) {
      idx = (i + slides.length) % slides.length;
      all.forEach(function (s) { s.classList.toggle("is-on", s === slides[idx]); });
      $$("button", dotsBox).forEach(function (d, k) {
        d.classList.toggle("is-on", k === idx);
        d.setAttribute("aria-selected", String(k === idx));
      });
    }
    function play() {
      clearInterval(timer);
      if (!reduced && slides.length > 1) timer = setInterval(function () { show(idx + 1); }, 6000);
    }
    function build() {
      slides = all.filter(function (s) { return portraitMq.matches || !s.classList.contains("hero__slide--portrait"); });
      dotsBox.innerHTML = slides.map(function (s, k) {
        return '<button type="button" role="tab" aria-label="Photo ' + (k + 1) + ": " + s.alt + '"></button>';
      }).join("");
      $$("button", dotsBox).forEach(function (d, k) {
        d.addEventListener("click", function () { show(k); play(); });
      });
      show(0);
      play();
    }
    if (portraitMq.addEventListener) portraitMq.addEventListener("change", build);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) clearInterval(timer); else play();
    });
    build();
  })();

  /* ---------- Lightbox ---------- */

  var lb = $("#lightbox");
  var lbImg = $("img", lb);
  var lbCap = $(".lightbox__cap", lb);
  var lbItems = [], lbIdx = 0;

  // items: [{ src, fallback?, alt, cap }]
  function showLb() {
    var it = lbItems[lbIdx];
    lbImg.onerror = it.fallback ? function () { lbImg.onerror = null; lbImg.src = it.fallback; } : null;
    lbImg.src = it.src;
    lbImg.alt = it.alt;
    lbCap.textContent = it.cap + " · " + (lbIdx + 1) + " / " + lbItems.length;
  }
  function openLightbox(items, i) {
    lbItems = items; lbIdx = i; showLb();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function stayLightbox(s) {
    return s.photos.map(function (id, i) {
      return { src: driveSrc(id, 2000), fallback: driveFallback(id, 2000), alt: altFor(s, i), cap: s.name };
    });
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = pm.hidden ? "" : "hidden"; }
  function stepLb(n) {
    var len = lbItems.length;
    lbIdx = (lbIdx + n + len) % len; showLb();
  }
  $(".lightbox__close", lb).addEventListener("click", closeLb);
  $(".lightbox__prev", lb).addEventListener("click", function () { stepLb(-1); });
  $(".lightbox__next", lb).addEventListener("click", function () { stepLb(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") stepLb(-1);
    if (e.key === "ArrowRight") stepLb(1);
  });

  /* ---------- Stays ---------- */

  var ICON = {
    bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 18v2m18-2v2M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3m0 0V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>',
    user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    kid: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="2.6"/><path d="M7.5 20a4.5 4.5 0 0 1 9 0"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
    grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>',
  };

  function splitAmenity(a) {
    var i = a.indexOf(" ");
    return { icon: a.slice(0, i), label: a.slice(i + 1) };
  }

  function altFor(s, i) {
    return s.name + ", " + s.tagline.toLowerCase() + " at Hillora Tales resort, Vagamon, Kerala (photo " + (i + 1) + ")";
  }

  function kidsText(s) { return s.childrenNote ? "Children on request" : s.children + " children"; }

  function renderStays() {
    var list = $("#stayList");
    D.stays.forEach(function (s) {
      var card = document.createElement("article");
      card.className = "scard reveal";
      card.dataset.type = s.type;

      var media = document.createElement("div");
      media.className = "scard__media";
      var track = document.createElement("div");
      track.className = "scard__track";
      s.photos.forEach(function (pid, i) {
        var slide = document.createElement("button");
        slide.type = "button";
        slide.className = "scard__slide";
        slide.setAttribute("aria-label", "View " + s.name + " details");
        slide.appendChild(driveImg(pid, altFor(s, i), 900));
        slide.addEventListener("click", function () { openProperty(s.id); });
        track.appendChild(slide);
      });
      media.appendChild(track);

      var dots = document.createElement("div");
      dots.className = "scard__dots";
      dots.innerHTML = s.photos.map(function (_, i) { return "<span" + (i === 0 ? ' class="is-on"' : "") + "></span>"; }).join("");
      media.insertAdjacentHTML("beforeend",
        '<span class="scard__badge">' + s.type + "</span>" +
        '<span class="scard__perk">🍳 Breakfast included</span>' +
        '<button class="scard__nav scard__nav--prev" type="button" aria-label="Previous photo">' + ICON.left + "</button>" +
        '<button class="scard__nav scard__nav--next" type="button" aria-label="Next photo">' + ICON.right + "</button>");
      media.appendChild(dots);

      function slideBy(n) { track.scrollBy({ left: n * track.clientWidth, behavior: "smooth" }); }
      $(".scard__nav--prev", media).addEventListener("click", function () { slideBy(-1); });
      $(".scard__nav--next", media).addEventListener("click", function () { slideBy(1); });
      track.addEventListener("scroll", function () {
        var idx = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        $$("span", dots).forEach(function (d, i) { d.classList.toggle("is-on", i === idx); });
      }, { passive: true });

      var amen = s.amenities.slice(0, 4).map(function (a) {
        var x = splitAmenity(a);
        return '<li title="' + x.label + '"><span aria-hidden="true">' + x.icon + "</span>" + x.label + "</li>";
      }).join("");
      var more = s.amenities.length - 4;

      var body = document.createElement("div");
      body.className = "scard__body";
      body.innerHTML =
        '<div class="scard__top">' +
          "<div>" +
            "<h3>" + s.name + "</h3>" +
            '<p class="scard__loc">' + ICON.pin + "Vagamon, Kerala · " + s.tagline + "</p>" +
          "</div>" +
        "</div>" +
        '<p class="scard__desc">' + s.description + "</p>" +
        '<ul class="scard__facts">' +
          "<li>" + ICON.bed + s.bedrooms + " bedrooms</li>" +
          "<li>" + ICON.user + s.adults + " adults</li>" +
          "<li>" + ICON.kid + kidsText(s) + "</li>" +
        "</ul>" +
        '<ul class="scard__amen">' + amen + (more > 0 ? '<li class="more">+' + more + " more</li>" : "") + "</ul>" +
        '<div class="scard__foot">' +
          '<div class="scard__price"><span>From</span> <strong>' + inr(D.rates.weekday) + "</strong> <span>/ night</span></div>" +
          '<div class="scard__cta">' +
            '<button class="btn btn--line btn--sm" type="button" data-view="' + s.id + '">View details</button>' +
            '<button class="btn btn--forest btn--sm" type="button" data-book="' + s.id + '">Reserve</button>' +
          "</div>" +
        "</div>";

      card.appendChild(media);
      card.appendChild(body);
      list.appendChild(card);
    });

    $$("[data-view]").forEach(function (b) {
      b.addEventListener("click", function () { openProperty(b.getAttribute("data-view")); });
    });
    $$("[data-book]").forEach(function (b) {
      b.addEventListener("click", function () { reserve(b.getAttribute("data-book")); });
    });

    // Filters
    $$("#stayFilters .filter").forEach(function (f) {
      f.addEventListener("click", function () {
        var v = f.getAttribute("data-filter");
        $$("#stayFilters .filter").forEach(function (x) {
          var on = x === f;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-selected", String(on));
        });
        $$(".scard").forEach(function (c) { c.hidden = v !== "all" && c.dataset.type !== v; });
      });
    });
  }

  // Jump to the booking flow with this stay preselected.
  function reserve(id, trip) {
    state.preselect = id;
    if (trip) {
      step1.checkIn.value = trip.checkIn || step1.checkIn.value;
      step1.checkOut.value = trip.checkOut || step1.checkOut.value;
      step1.adults.value = trip.adults;
      step1.kids612.value = trip.kids612;
      step1.kidsU6.value = trip.kidsU6;
      if (trip.checkIn) step1.checkOut.min = toInput(addDays(parseDate(trip.checkIn), 1));
      updateNights();
      toggleKidsAges();
    }
    closeProperty();
    goStep(1);
    $("#book").scrollIntoView({ behavior: "smooth" });
    // Skip straight to stay options only when the trip details are already complete.
    var ready = step1.guestName.value && step1.checkIn.value && step1.checkOut.value;
    if (ready) step1.requestSubmit();
    else setTimeout(function () { step1.guestName.focus({ preventScroll: true }); }, 600);
  }

  /* ---------- Property detail ---------- */

  var pm = $("#pmodal");
  var pmBody = $("#pmBody");
  var pmCurrent = null;

  function stepper(name, label, sub, value, min) {
    return '<div class="stepper"><div><b>' + label + "</b><small>" + sub + "</small></div>" +
      '<div class="stepper__ctl"><button type="button" data-dec="' + name + '" aria-label="Fewer ' + label + '">−</button>' +
      '<input name="' + name + '" type="number" min="' + min + '" value="' + value + '" inputmode="numeric" aria-label="' + label + '">' +
      '<button type="button" data-inc="' + name + '" aria-label="More ' + label + '">+</button></div></div>';
  }

  function openProperty(id) {
    var s = stayById(id);
    if (!s) return;
    pmCurrent = id;
    $("#pmBarTitle").textContent = s.name;
    $("#pmWa").href = "https://wa.me/" + D.whatsapp + "?text=" +
      encodeURIComponent("Hi Hillora Tales Vagamon! 🌲 I'm interested in " + s.name + ". Could you share availability and rates?");

    var tiles = s.photos.map(function (_, i) {
      return '<button type="button" class="pm-tile pm-tile--' + (i + 1) + '" data-photo="' + i + '" aria-label="Open photo ' + (i + 1) + '"></button>';
    }).join("");

    var amen = s.amenities.map(function (a) {
      var x = splitAmenity(a);
      return '<li><span aria-hidden="true">' + x.icon + "</span>" + x.label + "</li>";
    }).join("");

    var trip = {
      checkIn: step1.checkIn.value, checkOut: step1.checkOut.value,
      adults: +step1.adults.value || 2, kids612: +step1.kids612.value || 0, kidsU6: +step1.kidsU6.value || 0,
    };

    pmBody.innerHTML =
      '<div class="pm-gwrap"><div class="pm-gallery pm-gallery--' + Math.min(4, s.photos.length) + '">' + tiles +
        '<button type="button" class="pm-all" data-photo="0">' + ICON.grid + "Show all " + s.photos.length + " photos</button>" +
      "</div>" +
      '<span class="pm-count" id="pmCount">1 / ' + s.photos.length + "</span></div>" +
      '<div class="pm-layout">' +
        '<div class="pm-main">' +
          '<p class="pm-kicker">' + s.type + " · Vagamon, Kerala</p>" +
          '<h2 id="pmTitle">' + s.name + "</h2>" +
          '<ul class="pm-facts">' +
            "<li>" + ICON.bed + "<b>" + s.bedrooms + "</b> bedrooms</li>" +
            "<li>" + ICON.user + "Up to <b>" + s.adults + "</b> adults</li>" +
            "<li>" + ICON.kid + (s.childrenNote ? "Children on request" : "Up to <b>" + s.children + "</b> children") + "</li>" +
          "</ul>" +
          '<ul class="pm-high">' +
            '<li><span>🏡</span><div><b>The whole place is yours</b><p>A private ' + s.type.toLowerCase() + ", not shared with other guests.</p></div></li>" +
            '<li><span>🍳</span><div><b>Breakfast included</b><p>Fresh breakfast every morning. Dinner is available at extra cost.</p></div></li>' +
            '<li><span>🏊</span><div><b>Pool access 8 AM – 9 PM</b><p>Swim with views of the mountains.</p></div></li>' +
          "</ul>" +
          '<section class="pm-sec"><h3>About this stay</h3><p>' + s.description + " " + s.story + "</p></section>" +
          '<section class="pm-sec"><h3>What this place offers</h3><ul class="pm-amen">' + amen + "</ul></section>" +
          '<section class="pm-sec"><h3>Good to know</h3><ul class="pm-know">' +
            "<li><b>Check-in</b><span>From " + D.checkIn + "</span></li>" +
            "<li><b>Check-out</b><span>Confirmed with your booking</span></li>" +
            "<li><b>ID proof</b><span>Valid ID for the team leader at check-in</span></li>" +
            "<li><b>Cancellation</b><span>Full refund 15+ days before · 50% retained 7–14 days · No refund under 7 days</span></li>" +
          "</ul></section>" +
        "</div>" +
        '<aside class="pm-widget"><form class="pm-card" id="pmForm" novalidate>' +
          '<div class="pm-card__price"><strong>' + inr(D.rates.weekday) + '</strong> <span>/ night</span><small>' + inr(D.rates.weekend) + " on weekends &amp; holidays</small></div>" +
          '<div class="pm-dates">' +
            '<label>Check-in<input type="date" name="checkIn" value="' + trip.checkIn + '" min="' + toInput(today) + '"></label>' +
            '<label>Check-out<input type="date" name="checkOut" value="' + trip.checkOut + '" min="' + toInput(addDays(today, 1)) + '"></label>' +
          "</div>" +
          '<div class="pm-guests">' +
            stepper("adults", "Adults", "Above 12 years", trip.adults, 1) +
            stepper("kids612", "Children", "6–12 years", trip.kids612, 0) +
            stepper("kidsU6", "Little ones", "Below 6 years", trip.kidsU6, 0) +
          "</div>" +
          '<div class="pm-quote" id="pmQuote"></div>' +
          '<button class="btn btn--forest btn--block" type="submit">Reserve this stay</button>' +
          '<p class="pm-card__note">No payment now. Our team confirms availability and the final rate on WhatsApp.</p>' +
        "</form></aside>" +
      "</div>" +
      '<div class="pm-mbar"><div><strong>' + inr(D.rates.weekday) + '</strong> / night<small>Breakfast included</small></div>' +
        '<button class="btn btn--forest btn--sm" type="button" id="pmJump">Check dates</button></div>';

    // Gallery tiles
    $$(".pm-tile", pmBody).forEach(function (t, i) {
      t.appendChild(driveImg(s.photos[i], altFor(s, i), i === 0 ? 1600 : 900));
    });
    var gal = $(".pm-gallery", pmBody);
    gal.addEventListener("scroll", function () {
      var idx = Math.round(gal.scrollLeft / Math.max(1, gal.clientWidth));
      $("#pmCount").textContent = (idx + 1) + " / " + s.photos.length;
    }, { passive: true });
    $$("[data-photo]", pmBody).forEach(function (b) {
      b.addEventListener("click", function () { openLightbox(stayLightbox(s), +b.getAttribute("data-photo")); });
    });

    $("#pmJump").addEventListener("click", function () {
      $(".pm-card", pmBody).scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var form = $("#pmForm");
    function quote() {
      prepDates(form);
      var ci = parseDate(form.checkIn.value), co = parseDate(form.checkOut.value);
      var a = +form.adults.value || 0, k = (+form.kids612.value || 0) + (+form.kidsU6.value || 0);
      var html = "";
      if (ci && co && co > ci) {
        var sp = nightSplit(ci, co);
        if (sp.weekday) html += "<div><span>" + inr(D.rates.weekday) + " × " + sp.weekday + " weekday night" + (sp.weekday > 1 ? "s" : "") + "</span><span>" + inr(sp.weekday * D.rates.weekday) + "</span></div>";
        if (sp.weekend) html += "<div><span>" + inr(D.rates.weekend) + " × " + sp.weekend + " weekend night" + (sp.weekend > 1 ? "s" : "") + "</span><span>" + inr(sp.weekend * D.rates.weekend) + "</span></div>";
        html += '<div class="pm-quote__total"><span>Indicative total</span><span>' + inr(unitEstimate(sp)) + "</span></div>";
      } else {
        html += '<p class="pm-quote__hint">Add your dates to see an estimate.</p>';
      }
      if (a > s.adults || k > s.children) {
        html += '<p class="pm-quote__warn">This is more than the standard capacity (' + s.adults + " adults). Extra-guest charges may apply, or you can add another stay.</p>";
      }
      $("#pmQuote").innerHTML = html;
    }
    form.checkIn.addEventListener("change", function () {
      var d = parseDate(form.checkIn.value);
      if (!d) return quote();
      form.checkOut.min = toInput(addDays(d, 1));
      var out = parseDate(form.checkOut.value);
      if (!out || out <= d) form.checkOut.value = toInput(addDays(d, 1));
      quote();
    });
    form.addEventListener("input", quote);
    $$("[data-inc],[data-dec]", form).forEach(function (b) {
      b.addEventListener("click", function () {
        var n = b.getAttribute("data-inc") || b.getAttribute("data-dec");
        var inp = form[n];
        var v = (+inp.value || 0) + (b.hasAttribute("data-inc") ? 1 : -1);
        inp.value = Math.max(+inp.min, v);
        quote();
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      reserve(s.id, {
        checkIn: form.checkIn.value, checkOut: form.checkOut.value,
        adults: Math.max(1, +form.adults.value || 1),
        kids612: Math.max(0, +form.kids612.value || 0),
        kidsU6: Math.max(0, +form.kidsU6.value || 0),
      });
    });
    quote();

    pm.hidden = false;
    pm.scrollTop = 0;
    $(".pmodal__sheet", pm).scrollTop = 0;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { pm.classList.add("is-open"); });
    if (location.hash !== "#stay-" + id) history.replaceState(null, "", "#stay-" + id);
  }

  function closeProperty() {
    if (pm.hidden) return;
    pm.classList.remove("is-open");
    pm.hidden = true;
    pmCurrent = null;
    document.body.style.overflow = "";
    if (/^#stay-/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
  }
  $$("[data-pm-close]", pm).forEach(function (b) { b.addEventListener("click", closeProperty); });
  pm.addEventListener("click", function (e) { if (e.target === pm) closeProperty(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && lb.hidden && !pm.hidden) closeProperty();
  });

  /* ---------- Booking steps ---------- */

  var step1 = $("#step1"), step2 = $("#step2"), step3 = $("#step3"), done = $("#stepDone");

  function goStep(n) {
    [step1, step2, step3, done].forEach(function (s) { s.hidden = true; });
    var target = n === 1 ? step1 : n === 2 ? step2 : n === 3 ? step3 : done;
    target.hidden = false;
    $$("#steps li").forEach(function (li) {
      var k = +li.getAttribute("data-step");
      li.classList.toggle("is-active", k === n);
      li.classList.toggle("is-done", k < n || n === 4);
    });
  }

  $$("[data-back]").forEach(function (b) {
    b.addEventListener("click", function () {
      goStep(+b.getAttribute("data-back"));
      $("#book").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Date constraints
  var today = new Date(); today.setHours(0, 0, 0, 0);
  $$('input[name=checkIn]').forEach(function (i) { i.min = toInput(today); });
  $$('input[name=checkOut]').forEach(function (i) { i.min = toInput(addDays(today, 1)); });

  function linkDates(form) {
    var ci = $("[name=checkIn]", form), co = $("[name=checkOut]", form);
    ci.addEventListener("change", function () {
      var d = parseDate(ci.value);
      if (!d) return;
      co.min = toInput(addDays(d, 1));
      var out = parseDate(co.value);
      if (!out || out <= d) co.value = toInput(addDays(d, 1));
      updateNights();
    });
    co.addEventListener("change", updateNights);
  }
  linkDates(step1);
  linkDates($("#quickForm"));

  function updateNights() {
    prepDates(document);
    var ci = parseDate(step1.checkIn.value), co = parseDate(step1.checkOut.value);
    var badge = $("#nightsBadge");
    if (ci && co && co > ci) {
      var n = nightSplit(ci, co).total;
      badge.textContent = "🌙 " + n + " night" + (n > 1 ? "s" : "");
    } else badge.textContent = "";
  }

  function toggleKidsAges() {
    var kids = (+step1.kids612.value || 0) + (+step1.kidsU6.value || 0);
    $("#kidsAgesWrap").hidden = kids === 0;
  }
  step1.kids612.addEventListener("input", toggleKidsAges);
  step1.kidsU6.addEventListener("input", toggleKidsAges);

  // Quick search in hero → prefill step 1
  $("#quickForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var q = e.target;
    step1.checkIn.value = q.checkIn.value;
    step1.checkOut.value = q.checkOut.value;
    step1.adults.value = q.adults.value || 2;
    step1.kids612.value = q.kids.value || 0;
    if (q.checkIn.value) step1.checkOut.min = toInput(addDays(parseDate(q.checkIn.value), 1));
    updateNights();
    toggleKidsAges();
    goStep(1);
    $("#book").scrollIntoView({ behavior: "smooth" });
    setTimeout(function () { step1.guestName.focus({ preventScroll: true }); }, 600);
  });

  // Step 1 → 2
  step1.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#step1Error");
    $$(".is-invalid", step1).forEach(function (i) { i.classList.remove("is-invalid"); });

    function fail(field, msg) {
      if (field) { field.classList.add("is-invalid"); field.focus(); }
      err.textContent = msg;
    }

    var name = step1.guestName.value.trim();
    var ci = parseDate(step1.checkIn.value), co = parseDate(step1.checkOut.value);
    var adults = parseInt(step1.adults.value, 10) || 0;
    var rooms = parseInt(step1.rooms.value, 10) || 0;

    if (!name) return fail(step1.guestName, "Please tell us your name.");
    if (!ci) return fail(step1.checkIn, "Please choose your check-in date.");
    if (ci < today) return fail(step1.checkIn, "Check-in can't be in the past.");
    if (!co) return fail(step1.checkOut, "Please choose your check-out date.");
    if (co <= ci) return fail(step1.checkOut, "Check-out must be after check-in.");
    if (rooms < 1 || rooms > D.stays.length) return fail(step1.rooms, "Choose between 1 and " + D.stays.length + " units.");
    if (adults < 1) return fail(step1.adults, "At least one adult (above 12) is needed.");

    err.textContent = "";
    state.trip = {
      name: name,
      phone: step1.phone.value.trim(),
      checkIn: ci,
      checkOut: co,
      rooms: rooms,
      adults: adults,
      kids612: Math.max(0, parseInt(step1.kids612.value, 10) || 0),
      kidsU6: Math.max(0, parseInt(step1.kidsU6.value, 10) || 0),
      kidsAges: step1.kidsAges.value.trim(),
      requirement: step1.requirement.value,
      pool: step1.pool.value,
      split: nightSplit(ci, co),
    };

    renderOptions();
    goStep(2);
    $("#book").scrollIntoView({ behavior: "smooth" });
  });

  function renderOptions() {
    var t = state.trip;
    var kids = t.kids612 + t.kidsU6;
    var perRoomAdults = Math.ceil(t.adults / t.rooms);
    var perRoomKids = Math.ceil(kids / t.rooms);

    var hint = "Hi <b>" + t.name.split(" ")[0] + "</b>! 😊 For <b>" + t.split.total + " night" + (t.split.total > 1 ? "s" : "") +
      "</b> (" + fmtDate(t.checkIn) + " → " + fmtDate(t.checkOut) + "), " + guestLine(t) + ". ";
    hint += t.rooms > 1 ? "Pick <b>" + t.rooms + " stays</b>." : "Pick the stay you love.";
    if (t.pool === "Without Pool") hint += " Note: every stay comes with pool access. You don't have to use it!";
    if (t.requirement === "Homestay") hint += " Hillora Tales is a resort-style property, but each stay is fully private, like a homestay.";
    hint += " Our team will confirm availability on WhatsApp.";
    $("#step2Hint").innerHTML = hint;

    // Rank: stays that fit the per-room party first, snuggest fit next.
    var ranked = D.stays.map(function (s) {
      var fits = s.adults >= perRoomAdults && s.children >= perRoomKids;
      return { s: s, fits: fits, slack: (s.adults - perRoomAdults) + (s.children - perRoomKids) };
    }).sort(function (a, b) {
      if (a.fits !== b.fits) return a.fits ? -1 : 1;
      return a.fits ? a.slack - b.slack : b.slack - a.slack;
    });

    if (state.preselect) {
      state.selected = [state.preselect];
      state.preselect = null;
    } else {
      state.selected = state.selected.filter(function (id) { return stayById(id); }).slice(0, t.rooms);
    }

    var est = unitEstimate(t.split);
    var wrap = $("#optionList");
    wrap.innerHTML = "";
    ranked.forEach(function (r) {
      var s = r.s;
      var lbl = document.createElement("label");
      lbl.className = "option";
      lbl.dataset.id = s.id;

      var imgBox = document.createElement("div");
      imgBox.className = "option__img";
      imgBox.innerHTML = '<span class="option__check">✓</span>';
      imgBox.appendChild(driveImg(s.photos[0], s.name, 400));

      var info = document.createElement("div");
      info.innerHTML =
        (r.fits
          ? '<span class="option__badge option__badge--fit">Fits your group</span>'
          : '<span class="option__badge option__badge--warn">Over standard capacity</span>') +
        "<h4>" + s.name + "</h4>" +
        "<p>" + s.type + " · " + s.bedrooms + " bedrooms · up to " + s.adults + " adults" +
        (s.childrenNote ? "" : " + " + s.children + " children") + "</p>" +
        '<p class="option__price"><strong>' + inr(est) + "</strong> indicative · " + t.split.total + " night" + (t.split.total > 1 ? "s" : "") + "</p>";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = s.id;

      lbl.appendChild(input);
      lbl.appendChild(imgBox);
      lbl.appendChild(info);
      input.addEventListener("change", function () { toggleSelect(s.id); });
      wrap.appendChild(lbl);
    });
    syncSelected();
  }

  function toggleSelect(id) {
    var t = state.trip;
    var i = state.selected.indexOf(id);
    if (i >= 0) state.selected.splice(i, 1);
    else {
      state.selected.push(id);
      while (state.selected.length > t.rooms) state.selected.shift();
    }
    $("#step2Error").textContent = "";
    syncSelected();
  }

  function syncSelected() {
    $$(".option").forEach(function (o) {
      var on = state.selected.indexOf(o.dataset.id) >= 0;
      o.classList.toggle("is-selected", on);
      $("input", o).checked = on;
    });
  }

  function capacityOf(ids) {
    return ids.reduce(function (acc, id) {
      var s = stayById(id);
      acc.adults += s.adults; acc.children += s.children;
      if (s.childrenNote) acc.unsure = true;
      return acc;
    }, { adults: 0, children: 0, unsure: false });
  }

  // Step 2 → 3
  $("#toStep3").addEventListener("click", function () {
    var t = state.trip;
    if (state.selected.length !== t.rooms) {
      $("#step2Error").textContent = t.rooms === 1
        ? "Please select a stay to continue."
        : "Please select " + t.rooms + " stays (" + state.selected.length + " selected).";
      return;
    }
    renderReview();
    goStep(3);
    $("#book").scrollIntoView({ behavior: "smooth" });
  });

  function renderReview() {
    var t = state.trip;
    var stays = state.selected.map(stayById);
    var cap = capacityOf(state.selected);
    var kids = t.kids612 + t.kidsU6;
    var over = t.adults > cap.adults || kids > cap.children;
    var total = unitEstimate(t.split) * stays.length;
    t.estimate = total;
    t.overCapacity = over;

    var nightsTxt = t.split.total + " (" +
      [t.split.weekday ? t.split.weekday + " weekday" : "", t.split.weekend ? t.split.weekend + " weekend" : ""].filter(Boolean).join(" + ") + ")";

    var rows = [
      ["Guest name", t.name],
      ["Stay", stays.map(function (s) { return s.name; }).join(" + ")],
      ["Room / stay type", stays.map(function (s) { return s.type; }).join(" + ")],
      ["Check-in", fmtDate(t.checkIn) + ", " + D.checkIn],
      ["Check-out", fmtDate(t.checkOut)],
      ["Nights", nightsTxt],
      ["Rooms / units", String(t.rooms)],
      ["Guests", guestLine(t)],
      ["Pool", t.pool],
    ];

    var html = "<h3>Booking details 🌲</h3><dl>" +
      rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + escapeHtml(r[1]) + "</dd>"; }).join("") +
      "</dl>" +
      '<div class="review__total"><span>Indicative estimate</span><strong>' + inr(total) + "</strong></div>" +
      '<p class="review__note">Based on ' + inr(D.rates.weekday) + " weekday / " + inr(D.rates.weekend) +
      " weekend & holiday rates per unit per night. Includes breakfast &amp; pool access. Dinner, taxes (if any) and extra-guest charges are not included. " +
      "<b>Our team confirms availability and the final payable amount on WhatsApp before you pay.</b></p>";
    if (over) {
      html += '<p class="review__note">⚠️ Your group is larger than the standard capacity of the selected stay' + (stays.length > 1 ? "s" : "") +
        ". Extra-guest charges (" + inr(D.rates.extraGuest) + "/person, subject to confirmation) may apply. Our team will confirm.</p>";
    } else if (cap.unsure && kids > 0) {
      html += '<p class="review__note">ℹ️ Our team will confirm the children\'s capacity for this stay.</p>';
    }
    $("#reviewCard").innerHTML = html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function buildMessage() {
    var t = state.trip;
    var stays = state.selected.map(stayById);
    var L = [];
    L.push("Greetings Hillora Tales Vagamon 🌲😊");
    L.push("I'd like to book a stay. My details are below:");
    L.push("");
    L.push("*Booking Request*");
    L.push("Name: " + t.name);
    if (t.phone) L.push("Phone: " + t.phone);
    if (t.email) L.push("Email: " + t.email);
    L.push("Stay: " + stays.map(function (s) { return s.name + " (" + s.type + ")"; }).join(" + "));
    L.push("Check-in: " + fmtDate(t.checkIn));
    L.push("Check-out: " + fmtDate(t.checkOut));
    L.push("Nights: " + t.split.total);
    L.push("How many rooms: " + t.rooms);
    L.push("Requirement: " + t.requirement);
    L.push("Pool Preference: " + t.pool);
    L.push("Adults (Above 12 years): " + t.adults);
    L.push("Age 6–12 years: " + t.kids612);
    L.push("Below 6 years: " + t.kidsU6);
    if (t.kidsAges) L.push("Children's ages: " + t.kidsAges);
    L.push("");
    L.push("Website estimate: " + inr(t.estimate) + " (indicative)");
    if (t.overCapacity) L.push("Note: group may exceed standard capacity. Please advise on extra-guest charges.");
    if (t.notes) { L.push(""); L.push("Special requests: " + t.notes); }
    L.push("");
    L.push("I've read and accept the cancellation & stay policy. Please confirm availability, the final amount and payment details. Thank you!");
    return L.join("\n");
  }

  // Step 3 → WhatsApp
  step3.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#step3Error");
    var email = step3.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      step3.email.classList.add("is-invalid"); step3.email.focus();
      err.textContent = "That email doesn't look right.";
      return;
    }
    step3.email.classList.remove("is-invalid");
    if (!step3.agree.checked) {
      err.textContent = "Please confirm your details and accept the policy to continue.";
      return;
    }
    err.textContent = "";
    state.trip.email = email;
    state.trip.notes = step3.notes.value.trim();

    var url = "https://wa.me/" + D.whatsapp + "?text=" + encodeURIComponent(buildMessage());
    $("#waAgain").href = url;
    goStep(4);
    window.open(url, "_blank", "noopener");
  });

  $("#startOver").addEventListener("click", function () {
    step1.reset(); step3.reset();
    state = { trip: null, selected: [], preselect: null };
    updateNights(); toggleKidsAges();
    goStep(1);
  });

  /* ---------- Misc ---------- */

  // iOS shows empty date inputs as blank boxes; give them a visible placeholder.
  function markDate(i) { i.classList.toggle("has-value", !!i.value); }
  document.addEventListener("input", function (e) { if (e.target.type === "date") markDate(e.target); });
  document.addEventListener("change", function (e) { if (e.target.type === "date") markDate(e.target); });
  function prepDates(root) {
    $$('input[type="date"]', root).forEach(function (i) {
      if (!i.dataset.placeholder) i.dataset.placeholder = "Add date";
      markDate(i);
    });
  }
  prepDates(document);
  new MutationObserver(function () { prepDates(document); }).observe(document.body, { childList: true, subtree: true });

  function renderScenery() {
    var grid = $("#sceneGrid");
    if (!grid || !D.scenery) return;
    var items = D.scenery.map(function (p) {
      return { src: p.src, alt: p.caption + ", Vagamon, Kerala", cap: p.caption };
    });
    D.scenery.forEach(function (p, i) {
      var tile = document.createElement("button");
      tile.type = "button";
      tile.className = "g-tile reveal" + (p.shape ? " g-tile--" + p.shape : "");
      tile.setAttribute("aria-label", "View photo: " + p.caption);
      tile.innerHTML = '<img src="' + p.src + '" alt="' + escapeHtml(items[i].alt) + '" loading="lazy" decoding="async">' +
        '<span class="g-tile__cap">' + escapeHtml(p.caption) + "</span>";
      tile.addEventListener("click", function () { openLightbox(items, i); });
      grid.appendChild(tile);
    });
  }

  $("#year").textContent = new Date().getFullYear();
  renderStays();
  renderScenery();
  var deep = /^#stay-(.+)$/.exec(location.hash);
  if (deep && stayById(deep[1])) openProperty(deep[1]);

  // App tab bar (mobile): highlight the section in view.
  var tabs = $$("#tabbar [data-tab]");
  if ("IntersectionObserver" in window && tabs.length) {
    var tabIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.classList.contains("hero") ? "top" : en.target.id;
        tabs.forEach(function (t) { t.classList.toggle("is-active", t.getAttribute("data-tab") === id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["hero", "stays", "book", "faq"].forEach(function (id) {
      var el = id === "hero" ? $(".hero") : document.getElementById(id);
      if (el) tabIo.observe(el);
    });
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal, .exp, .policy, .why__item, .tcard").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
})();
