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

  (function heroImage() {
    var hero = stayById("cleopatra") || D.stays[0];
    var id = hero.photos[0];
    var bg = $("#heroBg");
    var probe = new Image();
    probe.onload = function () {
      bg.style.backgroundImage = "url('" + probe.src + "')";
      bg.classList.add("is-loaded");
    };
    probe.onerror = function () {
      if (!probe.dataset.retried) { probe.dataset.retried = "1"; probe.src = driveFallback(id, 2000); }
    };
    probe.src = driveSrc(id, 2000);
  })();

  /* ---------- Stays ---------- */

  var gallerySets = {};

  function renderStays() {
    var list = $("#stayList");
    D.stays.forEach(function (s) {
      gallerySets[s.id] = s.photos;
      var el = document.createElement("article");
      el.className = "stay reveal";
      el.id = "stay-" + s.id;

      var g = document.createElement("div");
      g.className = "gallery";
      g.innerHTML = '<span class="gallery__tag">' + s.type + '</span><span class="gallery__count">📷 ' + s.photos.length + ' photos</span>';
      s.photos.slice(0, 4).forEach(function (pid, i) {
        if (i === 3) return; // layout shows 3 tiles; the 4th opens in the lightbox
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "View " + s.name + " photo " + (i + 1));
        b.appendChild(driveImg(pid, s.name + " photo " + (i + 1), i === 0 ? 1400 : 700));
        b.addEventListener("click", function () { openLightbox(s.id, i); });
        g.appendChild(b);
      });

      var kidsCap = s.childrenNote ? "Children: on request" : "Up to " + s.children + " children";
      var body = document.createElement("div");
      body.className = "stay__body";
      body.innerHTML =
        '<p class="stay__type">' + s.tagline + "</p>" +
        "<h3>" + s.name + "</h3>" +
        '<p class="stay__story">' + s.description + " " + s.story + "</p>" +
        '<div class="stay__meta">' +
          '<span class="pill">🛏️ ' + s.bedrooms + " bedrooms</span>" +
          '<span class="pill">👤 Up to ' + s.adults + " adults</span>" +
          '<span class="pill">🧒 ' + kidsCap + "</span>" +
        "</div>" +
        '<ul class="amen">' + s.amenities.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" +
        '<div class="stay__foot">' +
          '<div class="price"><small>Starting from</small><strong>' + inr(D.rates.weekday) + '</strong> <span>/ night · weekdays</span></div>' +
          '<button class="btn btn--forest" type="button" data-book="' + s.id + '">Book this stay</button>' +
        "</div>";

      el.appendChild(g);
      el.appendChild(body);
      list.appendChild(el);
    });

    $$("[data-book]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.preselect = b.getAttribute("data-book");
        goStep(1);
        $("#book").scrollIntoView({ behavior: "smooth" });
        setTimeout(function () {
          var name = $("#step1 [name=guestName]");
          if (!name.value) name.focus({ preventScroll: true });
        }, 600);
      });
    });
  }

  /* ---------- Lightbox ---------- */

  var lb = $("#lightbox");
  var lbImg = $("img", lb);
  var lbCap = $(".lightbox__cap", lb);
  var lbSet = null, lbIdx = 0;

  function showLb() {
    var s = stayById(lbSet);
    var id = s.photos[lbIdx];
    lbImg.onerror = function () { lbImg.onerror = null; lbImg.src = driveFallback(id, 2000); };
    lbImg.src = driveSrc(id, 2000);
    lbImg.alt = s.name + " photo " + (lbIdx + 1);
    lbCap.textContent = s.name + " · " + (lbIdx + 1) + " / " + s.photos.length;
  }
  function openLightbox(setId, i) {
    lbSet = setId; lbIdx = i; showLb();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  function stepLb(n) {
    var len = stayById(lbSet).photos.length;
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

  $("#year").textContent = new Date().getFullYear();
  renderStays();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    $$(".reveal, .exp, .policy").forEach(function (el) { el.classList.add("reveal"); io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }
})();
