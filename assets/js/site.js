/* Aedify · demo 2026 — interazioni. Senza JavaScript il sito resta leggibile e completo. */
(function () {
  "use strict";
  var doc = document, html = doc.documentElement, body = doc.body;
  var ridotto = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var euro = function (n, dec) { return "€ " + Number(n).toLocaleString("it-IT", { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }); };

  /* ---------- menu a tendina (desktop) ---------- */
  var voci = $$(".nav-voce");
  function chiudiTutte(tranne) {
    voci.forEach(function (v) { if (v !== tranne) { v.classList.remove("aperta"); $("button", v).setAttribute("aria-expanded", "false"); } });
  }
  voci.forEach(function (v) {
    var b = $("button", v), timer;
    var apri = function () { clearTimeout(timer); chiudiTutte(v); v.classList.add("aperta"); b.setAttribute("aria-expanded", "true"); };
    var chiudi = function () { v.classList.remove("aperta"); b.setAttribute("aria-expanded", "false"); };
    b.addEventListener("click", function () { v.classList.contains("aperta") ? chiudi() : apri(); });
    if (matchMedia("(hover: hover)").matches) {
      v.addEventListener("mouseenter", apri);
      v.addEventListener("mouseleave", function () { timer = setTimeout(chiudi, 180); });
    }
  });
  doc.addEventListener("click", function (e) { if (!e.target.closest(".nav-voce")) chiudiTutte(); });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { chiudiTutte(); if (body.classList.contains("menu-aperto")) apriMenu(false); }
  });

  /* ---------- menu telefono ---------- */
  var menuBtn = $(".menu-btn");
  function apriMenu(si) {
    body.classList.toggle("menu-aperto", si);
    menuBtn.setAttribute("aria-expanded", si ? "true" : "false");
    menuBtn.setAttribute("aria-label", si ? "Chiudi il menu" : "Apri il menu");
    html.style.overflow = si ? "hidden" : "";
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", function () { apriMenu(!body.classList.contains("menu-aperto")); });
    $$(".menu-mobile a").forEach(function (a) { a.addEventListener("click", function () { apriMenu(false); }); });
    matchMedia("(min-width: 1101px)").addEventListener("change", function (m) { if (m.matches) apriMenu(false); });
  }

  /* ---------- comparsa allo scroll ---------- */
  var osservati = ".rivela,.barre,.barra-ore,.funnel,.grafico,.pila-notifiche,[data-conta]";
  if ("IntersectionObserver" in window && !ridotto) {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("visto"); if (v.target.hasAttribute("data-conta")) conta(v.target); io.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
    $$(osservati).forEach(function (el) { io.observe(el); });
  } else {
    $$(osservati).forEach(function (el) { el.classList.add("visto"); });
  }

  /* ---------- numeri che contano (il valore vero è già scritto nell'HTML) ---------- */
  function conta(el) {
    var fine = parseFloat(el.getAttribute("data-conta")), dec = (el.getAttribute("data-conta").split(".")[1] || "").length;
    var t0 = null, durata = 1600;
    function passo(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / durata, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = (fine * e).toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* ---------- manifesto: le parole si accendono mentre scorri ---------- */
  var manifesti = $$(".manifesto");
  if (manifesti.length && !ridotto) {
    var aggiornaManifesti = function () {
      manifesti.forEach(function (m) {
        var r = m.getBoundingClientRect(), vh = innerHeight;
        var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
        var parole = m._parole || (m._parole = $$(".parola", m));
        var n = Math.round(Math.max(0, Math.min(1, p)) * parole.length);
        parole.forEach(function (w, i) { w.classList.toggle("accesa", i < n); });
      });
    };
    addEventListener("scroll", aggiornaManifesti, { passive: true });
    addEventListener("resize", aggiornaManifesti);
    aggiornaManifesti();
  }

  /* ---------- barra "prenota" su telefono ---------- */
  var barra = $(".barra-demo");
  if (barra) {
    var aggiornaBarra = function () {
      var piede = $(".piede").getBoundingClientRect().top, cta = $(".cta-finale");
      var vicinoCta = cta && cta.getBoundingClientRect().top < innerHeight && cta.getBoundingClientRect().bottom > 0;
      barra.classList.toggle("vista", scrollY > innerHeight * 0.8 && piede > innerHeight && !vicinoCta);
    };
    addEventListener("scroll", aggiornaBarra, { passive: true });
    aggiornaBarra();
  }

  /* ---------- quando un elemento è sullo schermo (per le animazioni in loop) ---------- */
  function quandoVisibile(el, entra, esce) {
    if (!("IntersectionObserver" in window)) { entra(); return; }
    new IntersectionObserver(function (v) { v.forEach(function (x) { x.isIntersecting ? entra() : esce && esce(); }); }, { threshold: 0.3 }).observe(el);
  }
  var attendi = function (ms) { return new Promise(function (r) { setTimeout(r, ridotto ? 0 : ms); }); };

  /* ---------- chat WhatsApp simulate ---------- */
  $$("[data-wa]").forEach(function (box) {
    var passi = JSON.parse($("script", box).textContent), chat = $(".wa-chat", box), giro = 0, attivo = false, inCorso = false;
    function bolla(p) {
      var d = doc.createElement("div");
      if (p.t === "agg") { d.className = "aggiornamento"; d.innerHTML = p.h; return d; }
      d.className = "bolla " + ({ io: "io", vocale: "io vocale", doc: "io doc", lui: "lui", scrive: "lui scrive" })[p.t];
      if (p.t === "scrive") d.innerHTML = "<i></i><i></i><i></i>";
      else if (p.t === "vocale") d.innerHTML = '<span class="play">▶</span><span class="onda"></span><small>' + (p.d || "0:12") + " · " + (p.o || "08:14") + "</small>";
      else if (p.t === "doc") d.innerHTML = '<span class="pdf">PDF</span><span><b>' + p.h + "</b><small>" + (p.d || "1 pagina · 84 kB") + "</small></span>";
      else d.innerHTML = p.h + "<small>" + (p.o || "") + (p.t === "io" ? " ✓✓" : "") + "</small>";
      return d;
    }
    async function gira() {
      if (inCorso) return; inCorso = true;
      var mio = ++giro;
      while (attivo && mio === giro) {
        chat.innerHTML = "";
        for (var i = 0; i < passi.length && attivo && mio === giro; i++) {
          var p = passi[i];
          if (p.t === "lui") { var s = bolla({ t: "scrive" }); chat.appendChild(s); await attendi(900); s.remove(); }
          chat.appendChild(bolla(p));
          chat.scrollTop = chat.scrollHeight;
          await attendi(p.attesa || 1300);
        }
        await attendi(3200);
        if (ridotto) break;
      }
      inCorso = false;
    }
    quandoVisibile(box, function () { if (!attivo) { attivo = true; gira(); } }, function () { attivo = false; giro++; });
  });

  /* ---------- margine del cantiere in tempo reale ---------- */
  $$("[data-margine]").forEach(function (box) {
    var COMMESSA = 84000, SAL = 65, MATURATO = COMMESSA * SAL / 100, COSTI0 = 38000, SOGLIA = 25, MAX = 40;
    var arrivi = [
      { l: "Materiale · Edilforniture", v: 2400 },
      { l: "Ore squadra · 3 operai", v: 1560 },
      { l: "Nolo gru · 2 giorni", v: 1900 }
    ];
    var elCosti = $("[data-costi]", box), elMarg = $("[data-marg]", box), elUtile = $("[data-utile]", box), barraM = $(".barra i", box),
        att = $(".margine-attuale", box), lista = $(".costi-lista ul", box), giro = 0, attivo = false;
    $(".soglia", box).style.left = (SOGLIA / MAX * 100) + "%";
    function mostra(costi) {
      var utile = MATURATO - costi, m = utile / MATURATO * 100;
      elCosti.textContent = euro(costi);
      elMarg.textContent = m.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
      elUtile.textContent = euro(utile) + " di utile";
      barraM.style.width = Math.max(0, Math.min(100, m / MAX * 100)) + "%";
      att.classList.toggle("sotto", m < SOGLIA);
    }
    async function gira() {
      var mio = ++giro;
      while (attivo && mio === giro) {
        var costi = COSTI0; mostra(costi);
        lista.innerHTML = '<li class="attesa">In attesa di nuovi costi…</li>';
        await attendi(1400);
        for (var i = 0; i < arrivi.length && attivo && mio === giro; i++) {
          if (i === 0) lista.innerHTML = "";
          var li = doc.createElement("li");
          li.innerHTML = "<span>" + arrivi[i].l + "</span><b>+" + euro(arrivi[i].v) + "</b>";
          lista.appendChild(li);
          costi += arrivi[i].v; mostra(costi);
          await attendi(1600);
        }
        await attendi(3000);
        if (ridotto) break;
      }
    }
    mostra(COSTI0);
    quandoVisibile(box, function () { if (!attivo) { attivo = true; gira(); } }, function () { attivo = false; giro++; });
  });

  /* ---------- AEDIFY AI: chat che si scrive da sola ---------- */
  $$("[data-ai-auto]").forEach(function (box) {
    var dati = JSON.parse($("script", box).textContent), chat = $(".ai-chat", box), giro = 0, attivo = false;
    async function gira() {
      var mio = ++giro;
      while (attivo && mio === giro) {
        for (var i = 0; i < dati.length && attivo && mio === giro; i++) {
          chat.innerHTML = "";
          var q = doc.createElement("div"); q.className = "msg utente"; q.textContent = dati[i].q; chat.appendChild(q);
          await attendi(900);
          var s = doc.createElement("div"); s.className = "msg ai"; s.innerHTML = '<span class="bolla scrive" style="box-shadow:none;padding:4px 0;background:none"><i></i><i></i><i></i></span>'; chat.appendChild(s);
          await attendi(1200);
          s.innerHTML = dati[i].a;
          await attendi(4200);
        }
        if (ridotto) break;
      }
    }
    quandoVisibile(box, function () { if (!attivo) { attivo = true; gira(); } }, function () { attivo = false; giro++; });
  });

  /* ---------- AEDIFY AI: prova tu ---------- */
  $$("[data-ai]").forEach(function (box) {
    var dati = JSON.parse($("script", box).textContent), chat = $(".ai-chat", box), form = $("form", box), input = $("input", form);
    // la scadenza della fattura si calcola da oggi: niente più date passate nella demo
    var tra = new Date(); tra.setDate(tra.getDate() + 12);
    var dataFattura = String(tra.getDate()).padStart(2, "0") + "/" + String(tra.getMonth() + 1).padStart(2, "0");
    function aggiungi(cls, h) {
      var v = $(".msg.vuoto", chat); if (v) v.remove();
      var m = doc.createElement("div"); m.className = "msg " + cls; m.innerHTML = h; chat.appendChild(m); chat.scrollTop = chat.scrollHeight; return m;
    }
    async function rispondi(domanda, voce) {
      aggiungi("utente", domanda.replace(/</g, "&lt;"));
      var s = aggiungi("ai", '<span class="bolla scrive" style="box-shadow:none;padding:4px 0;background:none"><i></i><i></i><i></i></span>');
      await attendi(1000);
      var testo = voce ? voce.a : dati.ripiego;
      s.innerHTML = testo.replace("{DATA}", dataFattura).replace(/\{G\+(\d+)\}/g, function (_, n) { var d = new Date(); d.setDate(d.getDate() + Number(n)); return d.toLocaleDateString("it-IT", { day: "numeric", month: "long" }); });
      chat.scrollTop = chat.scrollHeight;
    }
    $$(".ai-domande button", box).forEach(function (b, i) {
      b.addEventListener("click", function () { b.disabled = true; rispondi(dati.domande[i].q, dati.domande[i]); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return; input.value = "";
      var t = q.toLowerCase(), trovata = null;
      dati.domande.forEach(function (d) { if (!trovata && d.k.some(function (k) { return t.indexOf(k) > -1; })) trovata = d; });
      rispondi(q, trovata);
    });
  });

  /* ---------- niente parole orfane: lega l'ultima parola alla precedente, se ci sta ---------- */
  var legati = [], sciolti = [], rimpiccioliti = [];
  function metti(x, ch) { x.n.textContent = x.n.textContent.slice(0, x.i) + ch + x.n.textContent.slice(x.i + 1); }
  function slega(x) { metti(x, " "); }
  function sborda(el) {
    var box = el.getBoundingClientRect(), lim = box.right - parseFloat(getComputedStyle(el).paddingRight) + 1;
    var rr = doc.createRange(); rr.selectNodeContents(el);
    if (box.right > html.clientWidth + 1 || html.scrollWidth > html.clientWidth) return true;
    return Array.prototype.some.call(rr.getClientRects(), function (q) { return q.right > lim; });
  }
  function nbspPrima(nodi, da) {
    // il primo spazio indivisibile prima della penultima parola (legame messo dal generatore)
    var k = nodi.indexOf(da.n), i = da.i - 1;
    while (k >= 0) {
      var c = nodi[k].textContent.charAt(i);
      if (c === " ") return { n: nodi[k], i: i };
      if (c === " " || c === "\n") return null;
      i--; if (i < 0) { k--; if (k >= 0) i = nodi[k].textContent.length - 1; }
    }
    return null;
  }
  function antiOrfane() {
    legati.forEach(slega);
    sciolti.forEach(function (x) { metti(x, " "); });
    rimpiccioliti.forEach(function (el) { el.style.fontSize = ""; });
    legati = []; sciolti = []; rimpiccioliti = [];
    $$("h1,h2,h3,h4,p,li,blockquote,summary,figcaption,small,.carta-foto h3").forEach(function (el) {
      if (!el.offsetParent || el.closest(".manifesto,.piede-gigante,.tendina,.menu-mobile,.ai-chat,.wa-chat")) return;
      if (el.textContent.trim().split(/\s+/).length < 3) return;
      var tw = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT), n, nodi = [];
      while ((n = tw.nextNode())) if (n.textContent.length) nodi.push(n);
      if (!nodi.length) return;
      // dalla fine: salta gli spazi finali, poi l'ultima parola, fino allo spazio normale che la separa
      var k = nodi.length - 1, i = nodi[k].textContent.length - 1, fase = 0, primo = null, spazio = null;
      while (k >= 0) {
        var c = nodi[k].textContent.charAt(i);
        var bianco = c === " " || c === "\n" || c === "\t" || c === "\r";
        if (fase === 0) { if (!bianco && c !== " ") { fase = 1; primo = { n: nodi[k], i: i }; } }
        else if (bianco) { spazio = { n: nodi[k], i: i }; break; }
        else { primo = { n: nodi[k], i: i }; }
        i--;
        if (i < 0) { k--; if (k >= 0) i = nodi[k].textContent.length - 1; }
      }
      if (!spazio || spazio.i === 0) return;
      var r1 = doc.createRange(); r1.setStart(primo.n, primo.i); r1.setEnd(primo.n, primo.i + 1);
      var r0 = doc.createRange(); r0.setStart(spazio.n, spazio.i - 1); r0.setEnd(spazio.n, spazio.i);
      var a = r1.getClientRects()[0], b = r0.getClientRects()[0];
      if (!a || !b || a.top <= b.top + 3) return;
      var t = spazio.n.textContent;
      spazio.n.textContent = t.slice(0, spazio.i) + " " + t.slice(spazio.i + 1);
      legati.push(spazio);
      if (!sborda(el)) return;
      // 1) sciolgo il legame della parolina prima ("di qualsiasi" → "di / qualsiasi spiegazione")
      var nb = nbspPrima(nodi, spazio);
      if (nb) { metti(nb, " "); sciolti.push(nb); if (!sborda(el)) return; }
      // 2) solo nei titoli grandi: rimpicciolisco il carattere fino al 20% perché la coppia ci stia
      if (/^H[12]$/.test(el.tagName)) {
        var base = parseFloat(getComputedStyle(el).fontSize);
        for (var f = 0.96; f >= (el.tagName === "H1" ? 0.72 : 0.8); f -= 0.04) {
          el.style.fontSize = (base * f) + "px";
          if (!sborda(el)) { rimpiccioliti.push(el); return; }
        }
        el.style.fontSize = "";
      }
      // niente da fare: torno com'era
      slega(legati.pop());
      if (nb) { metti(nb, " "); sciolti.pop(); }
    });
  }
  var timerOrfane;
  function programmaOrfane() { clearTimeout(timerOrfane); timerOrfane = setTimeout(antiOrfane, 120); }
  antiOrfane();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(programmaOrfane);
  addEventListener("resize", programmaOrfane);
  addEventListener("load", programmaOrfane);

  /* ---------- modulo demo ---------- */
  var modulo = $("[data-modulo-demo]");
  if (modulo) {
    var form = $("form", modulo), tel = $("#telefono", form);
    tel.addEventListener("input", function () { tel.value = tel.value.replace(/[^\d+\s]/g, ""); });
    function controlla(campo) {
      var el = $("input,select", campo), ok = true;
      if (el.required && !el.value.trim()) ok = false;
      if (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value)) ok = false;
      if (el.id === "telefono" && el.value && el.value.replace(/\D/g, "").length < 8) ok = false;
      campo.classList.toggle("non-valido", !ok);
      return ok;
    }
    $$(".campo", form).forEach(function (c) { $("input,select", c).addEventListener("blur", function () { controlla(c); }); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = $$(".campo", form).map(controlla).every(Boolean);
      var consenso = $("#consenso", form);
      if (!consenso.checked) { ok = false; consenso.focus(); consenso.closest(".consenso").style.color = "#a33d2d"; }
      if (!ok) { var primo = $(".non-valido input,.non-valido select", form); if (primo) primo.focus(); return; }
      // DEMO: nessun invio reale. Sul sito vero qui parte la richiesta a Resend.
      modulo.classList.add("inviato");
      modulo.scrollIntoView({ behavior: ridotto ? "auto" : "smooth", block: "center" });
    });
  }

  /* ---------- sfondo animato dell'apertura: pennellate in WebGL ---------- */
  var tela = $(".eroe canvas");
  if (tela) (function () {
    var gl = tela.getContext("webgl", { antialias: false, alpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    if (!gl) return;
    var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fs = [
      "precision mediump float;uniform vec2 r;uniform float t;uniform vec2 m;",
      "float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
      "float fbm(vec2 p){float v=0.,a=.5;mat2 R=mat2(.8,.6,-.6,.8);for(int i=0;i<5;i++){v+=a*n(p);p=R*p*2.03;a*=.5;}return v;}",
      "void main(){vec2 uv=gl_FragCoord.xy/r;vec2 p=(gl_FragCoord.xy-.5*r)/r.y;",
      "float a=-.42;p=mat2(cos(a),-sin(a),sin(a),cos(a))*p;p*=vec2(1.1,3.2);p+=m*.06;",
      "float T=t*.035;vec2 q=vec2(fbm(p+vec2(0.,T)),fbm(p+vec2(5.2,1.3)-T));",
      "vec2 w=vec2(fbm(p+3.4*q+vec2(1.7,9.2)+T*.8),fbm(p+3.4*q+vec2(8.3,2.8)-T*.6));",
      "float f=fbm(p+3.2*w);",
      "float st=n(vec2(p.x*1.2+w.x*2.,p.y*26.+w.y*9.));",
      "vec3 c0=vec3(.035,.055,.085),c1=vec3(.12,.16,.2),c2=vec3(.33,.33,.32),c3=vec3(.68,.6,.5),cg=vec3(.18,.45,.33);",
      "vec3 col=mix(c0,c1,smoothstep(.15,.65,f));",
      "col=mix(col,c2,smoothstep(.45,.85,f*w.y+.15)*.85);",
      "col=mix(col,cg,smoothstep(.55,.95,q.x*w.x*1.6)*.55);",
      "col+=c3*pow(smoothstep(.5,1.,f+st*.2),2.2)*1.05;",
      "col*=.82+.32*st;",
      "float v=smoothstep(1.25,.25,length((uv-vec2(.55,.62))*vec2(1.,1.3)));col*=.62+.5*v;",
      "col*=mix(.68,1.,smoothstep(0.,.5,uv.y));",
      "col+=(h(gl_FragCoord.xy+t)-.5)*.035;",
      "gl_FragColor=vec4(col,1.);}"
    ].join("\n");
    function sh(tipo, src) { var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return;
    var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var uR = gl.getUniformLocation(pr, "r"), uT = gl.getUniformLocation(pr, "t"), uM = gl.getUniformLocation(pr, "m");
    var scala = Math.min(devicePixelRatio || 1, 1.5) * (innerWidth < 700 ? 0.6 : 0.75);
    var mx = 0, my = 0, tx = 0, ty = 0, visibile = true, t0 = performance.now(), primo = true;
    function misura() {
      var w = Math.round(tela.clientWidth * scala), hh = Math.round(tela.clientHeight * scala);
      if (tela.width !== w || tela.height !== hh) { tela.width = w; tela.height = hh; gl.viewport(0, 0, w, hh); }
    }
    function disegna(ora) {
      if (!visibile) return;
      misura();
      mx += (tx - mx) * 0.03; my += (ty - my) * 0.03;
      gl.uniform2f(uR, tela.width, tela.height);
      gl.uniform1f(uT, ridotto ? 20 : (ora - t0) / 1000 + 20);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (primo) { primo = false; tela.classList.add("pronto"); }
      if (!ridotto) requestAnimationFrame(disegna);
    }
    addEventListener("pointermove", function (e) { tx = e.clientX / innerWidth - 0.5; ty = 0.5 - e.clientY / innerHeight; }, { passive: true });
    quandoVisibile(tela, function () { if (!visibile) { visibile = true; requestAnimationFrame(disegna); } }, function () { visibile = false; });
    addEventListener("resize", misura);
    requestAnimationFrame(disegna);
  })();
})();
