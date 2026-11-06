(function(){
  "use strict";
  var CFG = window.GYM_CONFIG;

  /* ---------- Contact links (correo + Facebook) ---------- */
  function buildMailUrl(){
    var email = CFG.contactEmail || "";
    var subject = encodeURIComponent(CFG.contactSubject || "");
    var body = encodeURIComponent(CFG.contactMessage || "");
    return "mailto:" + email + "?subject=" + subject + "&body=" + body;
  }
  var mailUrl = buildMailUrl();
  var fbUrl = CFG.facebookUrl || "#";

  var emailLink = document.getElementById("contactEmailLink");
  var fbLink = document.getElementById("contactFbLink");
  if(emailLink) emailLink.setAttribute("href", mailUrl);
  if(fbLink) fbLink.setAttribute("href", fbUrl);

  var footerEmailLink = document.getElementById("footerEmailLink");
  var footerFbLink = document.getElementById("footerFbLink");
  if(footerEmailLink) footerEmailLink.setAttribute("href", mailUrl);
  if(footerFbLink) footerFbLink.setAttribute("href", fbUrl);

  /* ---------- Modal de contacto ---------- */
  var contactModal = document.getElementById("contactModal");
  var contactModalClose = document.getElementById("contactModalClose");
  var lastFocusedElement = null;
  var focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
  var pageSiblings = Array.prototype.filter.call(document.body.children, function(child){
    return child !== contactModal;
  });
  var previousAriaHidden = new Map();

  function openContactModal(e){
    if(e) e.preventDefault();
    lastFocusedElement = document.activeElement;
    pageSiblings.forEach(function(child){
      previousAriaHidden.set(child, child.getAttribute("aria-hidden"));
      child.setAttribute("aria-hidden", "true");
    });
    contactModal.classList.add("open");
    contactModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    contactModalClose.focus();
  }
  function closeContactModal(){
    contactModal.classList.remove("open");
    contactModal.setAttribute("aria-hidden", "true");
    pageSiblings.forEach(function(child){
      var previous = previousAriaHidden.get(child);
      if(previous === null) child.removeAttribute("aria-hidden");
      else child.setAttribute("aria-hidden", previous);
    });
    previousAriaHidden.clear();
    document.body.style.overflow = "";
    if(lastFocusedElement && typeof lastFocusedElement.focus === "function"){
      lastFocusedElement.focus();
    }
  }
  document.querySelectorAll(".contact-trigger").forEach(function(el){
    el.addEventListener("click", openContactModal);
  });
  if(contactModalClose) contactModalClose.addEventListener("click", closeContactModal);
  if(contactModal){
    contactModal.addEventListener("click", function(e){
      if(e.target === contactModal) closeContactModal();
    });
  }
  document.addEventListener("keydown", function(e){
    if(!contactModal.classList.contains("open")) return;
    if(e.key === "Escape"){
      closeContactModal();
      return;
    }
    if(e.key !== "Tab") return;
    var focusable = Array.prototype.slice.call(contactModal.querySelectorAll(focusableSelector));
    if(!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if(e.shiftKey && document.activeElement === first){
      e.preventDefault();
      last.focus();
    } else if(!e.shiftKey && document.activeElement === last){
      e.preventDefault();
      first.focus();
    }
  });
  // Cerrar el modal al elegir una opción (deja que el navegador siga el enlace)
  document.querySelectorAll(".contact-option").forEach(function(a){
    a.addEventListener("click", function(){ closeContactModal(); });
  });

  /* ---------- Google Maps link ---------- */
  var mapsBtn = document.getElementById("mapsBtn");
  if(mapsBtn){
    mapsBtn.href = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(CFG.address);
  }

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll(){
    if(window.scrollY > 40){ header.classList.add("scrolled"); }
    else{ header.classList.remove("scrolled"); }
  }
  document.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = document.getElementById("menuToggle");
  var mobileNav = document.getElementById("mobileNav");
  function toggleMenu(){
    var isOpen = mobileNav.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  }
  toggle.addEventListener("click", toggleMenu);
  toggle.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); toggleMenu(); } });
  mobileNav.querySelectorAll("a, button").forEach(function(a){
    a.addEventListener("click", function(){
      toggleMenu();
      if(a.classList.contains("contact-trigger")) document.body.style.overflow = "hidden";
    });
  });

  /* ---------- Dynamic open/closed status ---------- */
  var DAY_NAMES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];

  function toMinutes(hhmm){
    var parts = hhmm.split(":");
    return parseInt(parts[0],10) * 60 + parseInt(parts[1],10);
  }

  function getRangesForDay(dayIndex){
    // 0 = domingo … 6 = sábado
    if(dayIndex === 0) return CFG.schedule.sunday;
    if(dayIndex === 6) return CFG.schedule.saturday;
    return CFG.schedule.weekday;
  }

  function nextOpening(now){
    // Search forward up to 7 days to find the next opening time.
    for(var offset = 0; offset < 8; offset++){
      var d = new Date(now);
      d.setDate(d.getDate() + offset);
      var dayIndex = d.getDay();
      var ranges = getRangesForDay(dayIndex);
      for(var i=0; i<ranges.length; i++){
        var startMin = toMinutes(ranges[i].start);
        var dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        var candidate = new Date(dayStart.getTime() + startMin*60000);
        if(candidate.getTime() > now.getTime()){
          return { time: candidate, dayIndex: dayIndex, isToday: offset === 0, sameDayStart: ranges[i].start };
        }
      }
    }
    return null;
  }

  function updateStatus(){
    var now = new Date();
    var dayIndex = now.getDay();
    var nowMin = now.getHours()*60 + now.getMinutes();
    var ranges = getRangesForDay(dayIndex);

    var isOpen = ranges.some(function(r){
      return nowMin >= toMinutes(r.start) && nowMin < toMinutes(r.end);
    });

    var pills = [document.getElementById("statusPill"), document.getElementById("statusPillBig")];
    var texts = [document.getElementById("statusText"), document.getElementById("statusTextBig")];
    var note = document.getElementById("statusNote");

    pills.forEach(function(p){ if(p){ p.classList.remove("open","closed"); p.classList.add(isOpen ? "open" : "closed"); } });
    texts.forEach(function(t){ if(t){ t.textContent = isOpen ? "Abierto ahora" : "Cerrado"; } });

    if(!note) return;

    if(isOpen){
      // find end of current range
      var current = ranges.find(function(r){ return nowMin >= toMinutes(r.start) && nowMin < toMinutes(r.end); });
      note.textContent = "Cerramos hoy a las " + current.end + " hrs.";
    } else {
      var next = nextOpening(now);
      if(!next){
        note.textContent = "Consulta nuestro horario.";
        return;
      }
      if(next.isToday){
        note.textContent = "Abrimos hoy a las " + next.sameDayStart + " hrs.";
      } else {
        var dayLabel = next.dayIndex === (dayIndex + 1) % 7 ? "mañana" : "el " + DAY_NAMES[next.dayIndex];
        note.textContent = "Abrimos " + dayLabel + " a las " + next.sameDayStart + " hrs.";
      }
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Highlight today's row in schedule ---------- */
  (function highlightToday(){
    var today = new Date().getDay();
    document.querySelectorAll(".schedule-row").forEach(function(row){
      if(parseInt(row.getAttribute("data-day"),10) === today){
        row.classList.add("today");
      }
    });
  })();

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll(".reveal, .line-expand");
  if("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold:0.15, rootMargin:"0px 0px -40px 0px" });
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

})();
