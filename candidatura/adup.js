/* ADUP — configurazione, consenso cookie e tracciamento (condiviso da index.html e grazie.html)
   ─────────────────────────────────────────────────────────────────────────────────────────────
   PRIMA DI PUBBLICARE compila ADUP_CONFIG. Finché PIXEL_ID è vuoto il Pixel non viene mai caricato
   e il banner cookie non compare (il sito resta senza cookie di tracciamento).                     */
window.ADUP_CONFIG = {
  PIXEL_ID: "1373273428337053",            // ID del Pixel Meta (solo numeri). Vuoto = nessun tracciamento.
  FORM_ENDPOINT: "https://script.google.com/macros/s/AKfycbwXQQQkNqdqGQzhRGpl7hnjfDrdODifTMSOebcQ_B0Wyn3qoJs-wCQohPf11uKp9e2Hpg/exec",       // URL della Web App di Google Apps Script (vedi TRACCIAMENTO.md). Vuoto = nessun invio.
  CALENDLY_URL: "https://calendly.com/adupagencymeta/analisi-gratuita",
  WHATSAPP: "393791577035",
  VIDEO_HERO: "",          // es. "media/vsl.mp4": il video «come funziona», circa 3 minuti (script in VSL-SCRIPT.md). Vuoto = solo foto.
  VIDEO_PRECALL: "",       // es. "media/scuse-v2.mp4" quando è rimontato (senza «800 al mese» e «scrivicela nel modulo»). Vuoto = sezione nascosta.
  MOSTRA_PROVVISORI: false // true = mostra i blocchi provvisori (equivale ad aprire la pagina con ?bozza=1)
};

(function () {
  var C = window.ADUP_CONFIG, CHIAVE = "adup_consenso_v1", SEI_MESI = 1000 * 60 * 60 * 24 * 182;
  var coda = [], pixelCaricato = false;
  /* La coda sopravvive al cambio pagina: se il consenso arriva sulla pagina di ringraziamento gli eventi non si perdono */
  try { coda = JSON.parse(sessionStorage.getItem("adup_coda") || "[]"); } catch (e) { coda = []; }
  function salvaCoda() { try { sessionStorage.setItem("adup_coda", JSON.stringify(coda)); } catch (e) {} }

  function leggi() {
    try {
      var v = JSON.parse(localStorage.getItem(CHIAVE) || "null");
      if (v && Date.now() - v.t < SEI_MESI) return v.s;   // "si" | "no"
    } catch (e) {}
    return null;
  }
  function salva(s) { try { localStorage.setItem(CHIAVE, JSON.stringify({ s: s, t: Date.now() })); } catch (e) {} }

  function caricaPixel() {
    if (pixelCaricato || !C.PIXEL_ID) return;
    pixelCaricato = true;
    /* Snippet standard Meta Pixel: caricato SOLO dopo il consenso (Linee guida Garante 10/6/2021). */
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("consent", "grant");
    fbq("init", C.PIXEL_ID);
    fbq("track", "PageView");
    coda.forEach(function (a) { fbq.apply(null, a); });
    coda = []; salvaCoda();
  }

  /* API pubblica: ADUP.evento("Lead", {...}) per eventi standard, ADUP.evento("Nome", {...}, true) per eventi personalizzati */
  var ADUP = window.ADUP = {
    evento: function (nome, dati, personalizzato) {
      var a = [personalizzato ? "trackCustom" : "track", nome, dati || {}];
      if (window.console && /[?&]debug=1/.test(location.search)) console.log("[ADUP evento]", a);
      if (!C.PIXEL_ID) return;
      if (pixelCaricato) fbq.apply(null, a);
      else if (leggi() !== "no") { coda.push(a); salvaCoda(); }   // in attesa di consenso; se rifiuta la coda viene svuotata
    },
    consenso: leggi,
    apriPreferenze: function () { mostraBanner(true); },
    utm: function () {
      var out = {}, p = new URLSearchParams(location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) { if (p.get(k)) out[k] = p.get(k).slice(0, 120); });
      try {
        var salvati = JSON.parse(sessionStorage.getItem("adup_utm") || "{}");
        for (var k in salvati) if (!out[k]) out[k] = salvati[k];
        sessionStorage.setItem("adup_utm", JSON.stringify(out));
      } catch (e) {}
      return out;
    },
    wa: function (testo) { return "https://wa.me/" + C.WHATSAPP + "?text=" + encodeURIComponent(testo); }
  };

  function mostraBanner(forza) {
    var b = document.getElementById("cookie");
    if (!b) return;
    if (!C.PIXEL_ID && !forza) return;       // niente Pixel = niente da chiedere
    b.classList.add("vis");
  }
  function chiudiBanner(scelta) {
    salva(scelta);
    var b = document.getElementById("cookie");
    if (b) b.classList.remove("vis");
    if (scelta === "si") caricaPixel();
    else {
      coda = []; salvaCoda();
      /* Revoca dopo un precedente sì: ferma il Pixel e ricarica la pagina senza */
      if (pixelCaricato) { try { fbq("consent", "revoke"); } catch (e) {} location.reload(); }
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (C.MOSTRA_PROVVISORI || /[?&]bozza=1/.test(location.search)) document.body.classList.add("bozza");
    ADUP.utm();
    var b = document.getElementById("cookie");
    if (b) {
      b.querySelector("[data-cookie=si]").addEventListener("click", function () { chiudiBanner("si"); });
      b.querySelector("[data-cookie=no]").addEventListener("click", function () { chiudiBanner("no"); });
      b.querySelector(".chiudi").addEventListener("click", function () { chiudiBanner("no"); });
    }
    document.querySelectorAll("[data-preferenze]").forEach(function (el) {
      el.addEventListener("click", function (e) { e.preventDefault(); mostraBanner(true); });
    });
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      el.href = ADUP.wa(el.getAttribute("data-wa"));
      el.addEventListener("click", function () { ADUP.evento("Contact", { metodo: "whatsapp" }); });
    });
    var s = leggi();
    if (s === "si") caricaPixel();
    else if (s === null) mostraBanner(false);
  });
})();
