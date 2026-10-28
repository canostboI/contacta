/* =====================================================================
   Contacta — app de proveedores de Bosch Pascual, RECOP y Munné
   Vanilla JS + Supabase. Un solo archivo para que sea fácil de mantener
   desde la web de GitHub.
   ===================================================================== */
(function () {
  'use strict';

  const CFG = window.CONTACTA_CONFIG;
  const IMG = window.IMG;
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const APP_URL = location.origin + location.pathname.replace(/index\.html$/, '');
  const CLAVE_DATOS = 'contacta-datos-v1';
  const CLAVE_VISTA = 'contacta-vista-en';
  const UNA_HORA = 60 * 60 * 1000;
  const DIAS_PAPELERA = 30;
  const $app = document.getElementById('app');

  /* ---------------- Utilidades ---------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').toLowerCase().replace(/l·l/g, 'll').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ@.+]+/g, ' ').replace(/\s+/g, ' ').trim();
  const partes = (s) => String(s || '').split(/;/).map((x) => x.trim()).filter(Boolean);
  const digitos = (s) => String(s || '').replace(/\D/g, '');
  const tel9 = (s) => { let d = digitos(s); if (d.startsWith('0034')) d = d.slice(4); else if (d.startsWith('34') && d.length === 11) d = d.slice(2); return d; };
  const telBonito = (s) => { const d = tel9(s); return d.length === 9 ? `+34 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : String(s || '').trim(); };
  const telLink = (s) => { const d = tel9(s); return d.length === 9 ? '+34' + d : digitos(s); };
  const hace = (iso) => {
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'ahora'; if (m < 60) return `hace ${m} min`;
    const h = Math.round(m / 60); if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24); if (d < 31) return `hace ${d} día${d === 1 ? '' : 's'}`;
    return new Date(iso).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };
  const fecha = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const ancho = () => window.matchMedia('(min-width: 960px)').matches;
  const enLinea = () => navigator.onLine !== false;

  /* ---------------- Iconos ---------------- */
  const P = {
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    atras: '<path d="M15 5l-7 7 7 7"/>',
    chev: '<path d="M9 6l6 6-6 6"/>',
    tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    copiar: '<path d="M9 9h11v11H9zM5 15V5a2 2 0 012-2h10"/>',
    copiar2: '<rect x="9" y="9" width="12" height="12" rx="3"/><path d="M15 9V6a3 3 0 00-3-3H6a3 3 0 00-3 3v6a3 3 0 003 3h3"/>',
    ok: '<path d="M5 12l5 5 9-10"/>',
    wa: '<path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-4.1-1.1z"/>',
    correo: '<path d="M3 5h18v14H3zM3 6l9 7 9-7"/>',
    contacto: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0M19 3v6M16 6h6"/>',
    compartir: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
    papelera: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
    salir: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
    pegar: '<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5"/>',
    camara: '<path d="M4 7h4l2-3h4l2 3h4v13H4z"/><circle cx="12" cy="13" r="4"/>',
    restaurar: '<path d="M4 12a8 8 0 108-8 8 8 0 00-6 2.7M4 4v4h4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>'
  };
  const ico = (n, sz = 20, color = 'currentColor', w = 2) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  const estrella = (fill, sz = 13) => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="${fill}" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
  const estrellas = (n, sz = 13) => `<span class="estrellas" aria-label="${n} de 5 estrellas">${[1, 2, 3, 4, 5].map((k) => estrella(k <= n ? '#E8A317' : '#E6E1DC', sz)).join('')}</span>`;
  const ICO_FAM = {
    'Demoliciones y movimiento de tierras': 'M14 6l4 4M4 20l10-10M12 4l8 8',
    'Cimentaciones y contenciones': 'M3 20h18M6 20V10M12 20V6M18 20V12M4 10h4M10 6h4M16 12h4',
    'Estructuras': 'M4 21V8l8-5 8 5v13M4 13h16M9 21v-8M15 21v-8',
    'Cubiertas e impermeabilización': 'M3 12a9 9 0 0118 0zM12 12v7a2 2 0 01-4 0',
    'Fachadas': 'M4 21V3h16v18M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2',
    'Carpinterías y cerrajería': 'M4 3h16v18H4zM12 3v18M4 12h16',
    'Vidrio, lucernarios y protección solar': 'M5 3h14v18H5zM9 7l-2 2M14 7l-5 5',
    'Albañilería, tabiquería y revocos': 'M3 6h18v12H3zM3 12h18M9 6v6M15 12v6',
    'Pavimentos y revestimientos': 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
    'Instalaciones': 'M13 2L4 14h7l-1 8 9-12h-7z',
    'Equipamiento y mobiliario': 'M4 10h16v6H4zM6 16v4M18 16v4M6 10V6h12v4',
    'Urbanización, jardinería y exteriores': 'M12 22V12M12 12c-4 0-7-3-7-7 4 0 7 3 7 7zM12 12c0-4 3-7 7-7 0 4-3 7-7 7',
    'Medios auxiliares y alquileres': 'M6 21V3M6 3h12l-4 4M6 9h8M4 21h8',
    'Materiales y suministros': 'M3 7l9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10',
    'Servicios técnicos y control': 'M4 20h16M7 20V10l5-6 5 6v10M10 14h4',
    'Seguridad, limpieza y residuos': 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'
  };
  const icoFam = (famNombre, sz = 20, color = 'currentColor') => `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICO_FAM[famNombre] || 'M4 4h16v16H4z'}"/></svg>`;

  /* ---------------- Avisos y hojas ---------------- */
  let tAviso;
  function aviso(txt, conOk = true) {
    const el = document.getElementById('aviso');
    el.innerHTML = (conOk ? ico('ok', 16, '#fff', 2.6) : '') + `<span>${esc(txt)}</span>`;
    el.hidden = false; clearTimeout(tAviso);
    tAviso = setTimeout(() => { el.hidden = true; }, 2200);
  }
  const capa = document.getElementById('hoja-capa');
  function abrirHoja(html, alMontar) {
    capa.innerHTML = `<div class="hoja" role="dialog" aria-modal="true">${html}</div>`;
    capa.hidden = false;
    capa.onclick = (e) => { if (e.target === capa) cerrarHoja(); };
    if (alMontar) alMontar(capa.firstElementChild);
    const f = capa.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 50);
  }
  function cerrarHoja() { capa.hidden = true; capa.innerHTML = ''; }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !capa.hidden) cerrarHoja(); });
  function confirmar(titulo, texto, botonTxt, peligro) {
    return new Promise((res) => {
      abrirHoja(`<div class="hoja-asa"></div>
        <div style="padding:8px 20px 0"><div class="hoja-titulo" style="text-align:left;font-size:20px">${esc(titulo)}</div></div>
        <p>${texto}</p>
        <div style="display:flex;gap:8px;padding:8px 20px 0">
          <button class="btn-blanco" data-r="0">Cancelar</button>
          <button class="btn-lleno ancho" data-r="1" style="${peligro ? 'background:#B4151B' : ''}">${esc(botonTxt)}</button>
        </div>`, (h) => {
        h.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => { cerrarHoja(); res(b.dataset.r === '1'); });
      });
      capa.onclick = (e) => { if (e.target === capa) { cerrarHoja(); res(false); } };
    });
  }

  /* ---------------- Portapapeles ---------------- */
  async function copiarTexto(txt, html) {
    try {
      if (html && window.ClipboardItem && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({
          'text/plain': new Blob([txt], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })]);
      } else {
        await navigator.clipboard.writeText(txt);
      }
      return true;
    } catch (e) {
      const t = document.createElement('textarea'); t.value = txt; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
      t.remove(); return ok;
    }
  }
  function marcarCopiado(btn, conTexto) {
    if (!btn) return;
    btn.classList.add('ok');
    const antes = btn.innerHTML;
    btn.innerHTML = ico('ok', 16, '#2F6B3C', 2.4) + (conTexto ? '<span>Copiado</span>' : '');
    setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = antes; }, 1500);
  }
  // Columnas de la plantilla de comparativo: EMPRESA · PERSONA · E-MAIL · TELÈFON · POBLACIÓ
  function filaComparativo(p) {
    const telf = partes(p.moviles)[0] || partes(p.fijos)[0] || '';
    return [p.nombre, p.personas || '', partes(p.emails)[0] || '', telf, p.poblacion || ''];
  }
  function copiarProveedores(lista) {
    const filas = lista.map(filaComparativo);
    const txt = filas.map((f) => f.map((c) => String(c).replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
    const html = '<table>' + filas.map((f) => '<tr>' + f.map((c) => `<td>${esc(c)}</td>`).join('') + '</tr>').join('') + '</table>';
    return copiarTexto(txt, html);
  }

  /* ---------------- Datos ---------------- */
  const D = { familias: [], oficios: [], prov: [], links: [], vals: [], usuarios: [], munis: [], alias: [], cargado: false, desde: null };
  let IDX = null; // índices derivados
  let yo = null; // fila de usuarios del usuario actual

  async function leerTodo(tabla, columnas = '*', orden = 'id') {
    const out = []; const N = 1000;
    for (let i = 0; ; i += N) {
      const { data, error } = await sb.from(tabla).select(columnas).order(orden, { ascending: true }).range(i, i + N - 1);
      if (error) throw error;
      out.push(...data); if (data.length < N) break;
    }
    return out;
  }
  async function cargarDatos() {
    const [familias, oficios, prov, links, vals, usuarios, munis, alias] = await Promise.all([
      leerTodo('familias'), leerTodo('oficios'), leerTodo('proveedores'),
      leerTodo('proveedor_oficios', 'proveedor_id,oficio_id', 'proveedor_id'),
      leerTodo('valoraciones'), leerTodo('usuarios', 'id,email,nombre,empresa,rol,bloqueado,created_at'),
      leerTodo('municipios', 'ine,nombre,lat,lon', 'ine').catch(() => []),
      leerTodo('poblaciones_alias', 'texto,ine', 'texto').catch(() => [])
    ]);
    Object.assign(D, { familias, oficios, prov, links, vals, usuarios, munis, alias, cargado: true, desde: new Date().toISOString() });
    try { localStorage.setItem(CLAVE_DATOS, JSON.stringify(D)); } catch (_) {}
    indexar();
  }
  function cargarCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CLAVE_DATOS) || 'null');
      if (c && c.prov) { Object.assign(D, c); indexar(); return true; }
    } catch (_) {}
    return false;
  }
  const refrescar = debounce(async () => {
    try { await cargarDatos(); pintar(); } catch (e) { console.warn(e); }
  }, 150);

  const VACIAS = new Set(['sl', 's', 'l', 'sa', 'slu', 'sau', 'scp', 'cb', 'sll', 'y', 'i', 'de', 'del', 'la', 'el', 'les', 'los', 'las', 'd', 'e']);
  const palabras = (s) => norm(s).split(' ').filter((w) => w && !VACIAS.has(w));

  function indexar() {
    const fam = new Map(D.familias.map((f) => [f.id, f]));
    const of = new Map(D.oficios.map((o) => [o.id, o]));
    const usu = new Map(D.usuarios.map((u) => [u.id, u]));
    const ofsDe = new Map(); D.links.forEach((l) => { if (!ofsDe.has(l.proveedor_id)) ofsDe.set(l.proveedor_id, []); ofsDe.get(l.proveedor_id).push(l.oficio_id); });
    const valsDe = new Map(); D.vals.forEach((v) => { if (!valsDe.has(v.proveedor_id)) valsDe.set(v.proveedor_id, []); valsDe.get(v.proveedor_id).push(v); });
    const porId = new Map();
    // v1.12.0 — Coordenadas de cada proveedor según su población (tablas municipios y poblaciones_alias)
    const geoClave = (t) => String(t || '').trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const muniIne = new Map((D.munis || []).map((m) => [m.ine, m]));
    const geo = new Map();
    (D.munis || []).forEach((m) => geo.set(geoClave(m.nombre), m));
    (D.alias || []).forEach((a) => { const m = muniIne.get(a.ine); if (m) geo.set(a.texto, m); });
    D.prov.forEach((p) => {
      const g = p.poblacion ? geo.get(geoClave(p.poblacion)) : null;
      p._lat = g ? g.lat : null; p._lon = g ? g.lon : null; p._muni = g ? g.nombre : '';
      const ofs = (ofsDe.get(p.id) || []).map((id) => of.get(id)).filter(Boolean);
      const vs = (valsDe.get(p.id) || []).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
      const media = vs.length ? vs.reduce((s, v) => s + v.estrellas, 0) / vs.length : 0;
      const famP = ofs.length ? fam.get(ofs[0].familia_id) : null;
      p._ofs = ofs; p._vals = vs; p._media = media; p._n = vs.length; p._trab = vs.length > 0;
      p._fam = famP ? famP.nombre : '';
      p._wNombre = palabras(p.nombre);
      p._wOf = palabras(ofs.map((o) => o.nombre + ' ' + (o.sinonimos || []).join(' ')).join(' '));
      p._wResto = palabras([p.personas, p.emails, p.web, p.poblacion, p.provincia, p.notas, p.cif, p.recomendado_por, vs.map((v) => v.obra || '').join(' ')].join(' '));
      p._tels = [...partes(p.moviles), ...partes(p.fijos)].map(tel9);
      porId.set(p.id, p);
    });
    IDX = { fam, of, usu, porId, geo };
    yo = sesion ? usu.get(sesion.user.id) || yo : null;
  }
  const esAdmin = () => yo && yo.rol === 'admin' && !yo.bloqueado;
  const nombreUsuario = (id, texto) => (id && IDX && IDX.usu.get(id) ? IDX.usu.get(id).nombre : (texto || 'alguien'));
  const vivos = () => D.prov.filter((p) => !p.eliminado_en);
  const oficiosVivos = () => D.oficios.filter((o) => !o.redirige_a);

  /* ---------------- Búsqueda tolerante ---------------- */
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let minFila = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < minFila) minFila = cur[j];
      }
      if (minFila > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  function puntuaToken(t, ws) {
    let best = 0;
    const max = t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0;
    for (const w of ws) {
      if (w === t) return 4;
      if (w.startsWith(t)) { best = Math.max(best, 3); continue; }
      if (t.length >= 3 && w.includes(t)) { best = Math.max(best, 2); continue; }
      if (max && w[0] === t[0]) {
        const d = Math.min(lev(t, w, max), w.length > t.length ? lev(t, w.slice(0, t.length), max) : max + 1);
        if (d <= max) best = Math.max(best, 1.5);
      }
    }
    return best;
  }
  function buscar(q, lista) {
    const toks = palabras(q); const dq = digitos(q);
    if (!toks.length && dq.length < 3) return [];
    const out = [];
    for (const p of lista) {
      let total = 0; let ok = true;
      if (dq.length >= 3 && toks.every((t) => /^\d+$/.test(t))) {
        if (p._tels.some((t) => t.includes(dq))) out.push({ p, s: 10 });
        continue;
      }
      for (const t of toks) {
        const s = Math.max(puntuaToken(t, p._wNombre) * 3, puntuaToken(t, p._wOf) * 2, puntuaToken(t, p._wResto));
        if (!s) { ok = false; break; }
        total += s;
      }
      if (ok) out.push({ p, s: total + (p._trab ? 0.5 : 0) + p._media * 0.05 });
    }
    return out.sort((a, b) => b.s - a.s || a.p.nombre.localeCompare(b.p.nombre)).map((x) => x.p);
  }

  /* ---------------- Sesión ---------------- */
  let sesion = null;
  async function iniciar() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
    portadaSiToca();
    const { data } = await sb.auth.getSession();
    sesion = data.session;
    sb.auth.onAuthStateChange((ev, s) => {
      sesion = s;
      if (ev === 'PASSWORD_RECOVERY') { hojaNuevaContrasena(); return; }
      if (ev === 'SIGNED_OUT') { D.cargado = false; try { localStorage.removeItem(CLAVE_DATOS); } catch (_) {} pintar(); }
      if (ev === 'SIGNED_IN' && !D.cargado) arrancarDatos();
    });
    if (sesion) arrancarDatos(); else pintar();
    window.addEventListener('hashchange', pintar);
    programarSaludo();
    window.addEventListener('online', () => { pintar(); refrescar(); });
    window.addEventListener('offline', pintar);
    let anchoPrev = ancho();
    window.addEventListener('resize', debounce(() => { if (ancho() !== anchoPrev) { anchoPrev = ancho(); } }, 200));
  }
  async function arrancarDatos() {
    const conCache = cargarCache();
    if (conCache) pintar(); else $app.innerHTML = `<div class="vacio" style="min-height:60vh;justify-content:center"><p>Cargando proveedores…</p></div>`;
    if (!enLinea()) { if (!conCache) $app.innerHTML = `<div class="vacio"><h2>Sin conexión</h2><p>La primera vez hace falta conexión para descargar los proveedores.</p></div>`; return; }
    try { await cargarDatos(); } catch (e) {
      console.warn(e);
      if (!conCache) { $app.innerHTML = `<div class="vacio"><h2>No se han podido cargar los datos</h2><p>${esc(e.message || e)}</p><button class="btn-lleno" onclick="location.reload()">Reintentar</button></div>`; return; }
    }
    if (yo && yo.bloqueado) { await sb.auth.signOut(); aviso('Tu cuenta está bloqueada. Habla con el administrador.', false); return; }
    pintar();
  }

  /* ---------------- Saludo de los logos (cada 2-3 minutos) ---------------- */
  // Un pequeño gesto de los logos de la cabecera para que la herramienta se sienta viva
  function programarSaludo() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const espera = (120 + Math.random() * 60) * 1000;
    setTimeout(() => { if (document.visibilityState === 'visible') saludarLogos(); programarSaludo(); }, espera);
  }
  function saludarLogos() {
    const tipos = ['salto', 'balanceo', 'latido'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    const els = [...document.querySelectorAll('.logos-mini img, .logo-cab, .barra-inicio .marca')];
    els.forEach((el, i) => {
      el.classList.remove('saludo-salto', 'saludo-balanceo', 'saludo-latido');
      void el.offsetWidth; // reinicia la animación
      el.style.animationDelay = (i * 0.12) + 's';
      el.classList.add('saludo-' + tipo);
      el.addEventListener('animationend', () => { el.classList.remove('saludo-' + tipo); el.style.animationDelay = ''; }, { once: true });
    });
  }
  window.contactaSaludo = saludarLogos; // para probarlo desde la consola

  /* ---------------- Portada animada ---------------- */
  function portadaSiToca() {
    let ultima = 0;
    try { ultima = parseInt(localStorage.getItem(CLAVE_VISTA) || '0', 10) || 0; localStorage.setItem(CLAVE_VISTA + '-t', '1'); } catch (_) { return; }
    const apuntar = () => { try { localStorage.setItem(CLAVE_VISTA, String(Date.now())); } catch (_) {} };
    if (!ultima || Date.now() - ultima > UNA_HORA) mostrarPortada(apuntar); else apuntar();
    let oculta = null;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { oculta = Date.now(); apuntar(); }
      else if (oculta && Date.now() - oculta > UNA_HORA) { oculta = null; mostrarPortada(apuntar); }
    });
    setInterval(() => { if (document.visibilityState === 'visible') apuntar(); }, 5 * 60 * 1000);
  }
  // Al tocar el logo de Contacta: los logos de empresa de la cabecera se deshacen en puntos
  // que vuelan hasta el globo y forman la «C»; luego los logos vuelven a aparecer.
  let miniEnCurso = false;
  function miniPortada() {
    if (miniEnCurso) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const logo = document.querySelector('.logo-cab');
    const imgs = [...document.querySelectorAll('.cabecera .logos-mini img')];
    if (!logo || !imgs.length || !logo.getBoundingClientRect().width) return;
    miniEnCurso = true;
    try {
      const L = logo.getBoundingClientRect();
      // Coordenadas del logo horizontal (viewBox 3.3 13 344 91): «C» al 86 % centrada en (52,54)
      const k = L.height / 91;
      const aPantalla = (u, v) => [L.left + (u - 3.3) * k, L.top + (v - 13) * k];
      const R1 = 22 * 0.86, R2 = 36 * 0.86;
      const capa = document.createElement('div'); capa.className = 'mini-capa';
      const [mx, my] = aPantalla(56, 54);
      const mascara = document.createElement('div'); mascara.className = 'mini-mascara';
      Object.assign(mascara.style, { left: (mx - 34 * k) + 'px', top: (my - 34 * k) + 'px', width: (68 * k) + 'px', height: (68 * k) + 'px' });
      capa.appendChild(mascara);
      const grupos = [[51, 129, '#0BB4D2'], [139, 221, '#B4BD1F'], [231, 311, '#F7334A']];
      const parts = [];
      imgs.forEach((im) => {
        const r = im.getBoundingClientRect(); if (!r.width) return;
        const cv = document.createElement('canvas'); const W = Math.round(r.width), H = Math.round(r.height);
        cv.width = W; cv.height = H; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, W, H);
        let px; try { px = cx.getImageData(0, 0, W, H).data; } catch (_) { return; }
        const pts = [];
        for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { const i = (y * W + x) * 4; if (px[i + 3] > 140) pts.push([r.left + x, r.top + y, `rgb(${px[i]},${px[i + 1]},${px[i + 2]})`]); }
        for (let n = 0; n < Math.min(110, pts.length); n++) parts.push(pts.splice(Math.floor(Math.random() * pts.length), 1)[0]);
      });
      parts.forEach((p, i) => {
        let tx, ty, c1;
        if (i % 9 === 0) { const a = Math.random() * 6.283, rr = Math.sqrt(Math.random()) * 5.5 * 0.86; [tx, ty] = aPantalla(52 + 23.6 + rr * Math.cos(a), 54 + rr * Math.sin(a)); c1 = '#35383E'; }
        else { const g = grupos[i % 3]; const a = (g[0] + Math.random() * (g[1] - g[0])) * Math.PI / 180, rr = R1 + Math.random() * (R2 - R1); [tx, ty] = aPantalla(52 + rr * Math.cos(a), 54 - rr * Math.sin(a)); c1 = g[2]; }
        const d = document.createElement('i'); d.className = 'mini-part';
        Object.assign(d.style, { left: p[0] + 'px', top: p[1] + 'px', background: p[2] });
        capa.appendChild(d);
        const dx = tx - p[0], dy = ty - p[1];
        const giro = (Math.random() - 0.5) * 60;
        const retraso = Math.max(0, (p[0] - (imgs[0].getBoundingClientRect().left)) / 900) * 0.5 + Math.random() * 0.15;
        d.animate([
          { transform: 'translate(0,0)', background: p[2], opacity: 1 },
          { offset: 0.35, transform: `translate(${dx * 0.35 + giro}px,${dy * 0.35 - 30 - Math.random() * 25}px) rotate(90deg)`, background: p[2], opacity: 1 },
          { offset: 0.85, transform: `translate(${dx}px,${dy}px) rotate(180deg)`, background: c1, opacity: 1 },
          { transform: `translate(${dx}px,${dy}px) rotate(180deg)`, background: c1, opacity: 0 }
        ], { duration: 1500, delay: retraso * 1000, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'both' });
      });
      document.body.appendChild(capa);
      imgs.forEach((im) => im.classList.add('mini-fuera'));
      setTimeout(() => mascara.classList.add('fuera'), 1550);
      setTimeout(() => imgs.forEach((im) => { im.classList.remove('mini-fuera'); im.classList.add('mini-vuelve'); }), 1900);
      setTimeout(() => { capa.remove(); imgs.forEach((im) => im.classList.remove('mini-vuelve')); miniEnCurso = false; }, 2600);
    } catch (e) { console.warn(e); miniEnCurso = false; document.querySelectorAll('.mini-capa').forEach((x) => x.remove()); }
  }
  const lanzarMini = () => setTimeout(miniPortada, 60);
  function mostrarPortada(apuntar) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = document.getElementById('portada');
    let fin = false;
    const terminar = () => { if (fin) return; fin = true; apuntar(); el.classList.add('fuera'); setTimeout(() => { el.hidden = true; el.innerHTML = ''; }, 400); };
    el.className = ''; el.hidden = false; el.innerHTML = '<div class="p-escena"></div>';
    el.onclick = terminar;
    const cargar = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
    Promise.all([cargar(IMG.bp), cargar(IMG.munne), cargar(IMG.recop)]).then((ims) => {
      if (fin) return;
      let html = '';
      try { html = escenaPortada(ims); } catch (e) { console.warn(e); html = ''; }
      if (!html) { terminar(); return; }
      el.querySelector('.p-escena').innerHTML = html;
      el.querySelectorAll('canvas.p-logo').forEach((c, i) => { c.getContext('2d').drawImage(ims[i], 0, 0, c.width, c.height); });
      setTimeout(terminar, 3700);
    });
    setTimeout(() => { if (!fin) terminar(); }, 6000);
  }
  // Los tres logos se deshacen en partículas y se recomponen en la «C» del icono de Contacta.
  function escenaPortada(ims) {
    if (ims.some((im) => !im)) return '';
    const AN = 160, HUECO = 18, CX = 195, CY = 270, ESC = 180 / 108;
    let s = 7; const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const altos = ims.map((im) => Math.round(im.naturalHeight * AN / im.naturalWidth));
    let y = Math.round(290 - (altos.reduce((a, b) => a + b, 0) + HUECO * 2) / 2);
    const logos = [], fuente = { bp: [], muR: [], muG: [], rc: [] };
    ['bp', 'mu', 'rc'].forEach((k, i) => {
      const h = altos[i], x = CX - AN / 2, paso = k === 'mu' ? 3 : 4;
      logos.push({ x, y, h });
      const c = document.createElement('canvas'); c.width = AN; c.height = h;
      const cx = c.getContext('2d'); cx.drawImage(ims[i], 0, 0, AN, h);
      const d = cx.getImageData(0, 0, AN, h).data;
      for (let yy = 1; yy < h; yy += paso) for (let xx = 1; xx < AN; xx += paso) {
        const j = (yy * AN + xx) * 4; if (d[j + 3] < 150) continue;
        const p = [x + xx - 2, y + yy - 2, `rgb(${d[j]},${d[j + 1]},${d[j + 2]})`];
        if (k === 'mu') ((d[j] > 150 && d[j + 1] < 110) ? fuente.muR : fuente.muG).push(p); else fuente[k].push(p);
      }
      y += h + HUECO;
    });
    Object.values(fuente).forEach((l) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(azar() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } });
    // Puntos de destino dentro del icono (anillo de radio 22–36 centrado en 52,52 y punto en 80,52)
    // La «C» del icono está reducida al 86 % dentro del globo (marca/*.svg, grupo c-int)
    const enIcono = (u, v) => { const uu = 52 + (u - 52.5) * 0.86, vv = 54 + (v - 52) * 0.86; return [CX + (uu - 54) * ESC, CY + (vv - 54) * ESC]; };
    const arco = (a0, a1) => { const a = (a0 + azar() * (a1 - a0)) * Math.PI / 180, r = 23.5 + azar() * 11; return enIcono(52 + r * Math.cos(a), 52 - r * Math.sin(a)); };
    const punto = () => { const a = azar() * 6.283, r = Math.sqrt(azar()) * 5.6; return enIcono(80 + r * Math.cos(a), 52 + r * Math.sin(a)); };
    const N = 190, rojos = fuente.muR.slice(0, 130), abajo = rojos.concat(fuente.muG.slice(50, 50 + N - rojos.length));
    const grupos = [
      [fuente.bp.slice(0, N), () => arco(51, 129), '#0BB4D2'],
      [fuente.rc.slice(0, N), () => arco(139, 221), '#B4BD1F'],
      [abajo, () => arco(231, 311), '#F7334A'],
      [fuente.muG.slice(0, 50), punto, '#35383E']
    ];
    const minX = CX - AN / 2, INI = 0.55, BARRIDO = 0.6, FIN = 2.35;
    let parts = '';
    grupos.forEach(([lista, destino, c1]) => lista.forEach(([x, y, c0]) => {
      const [tx, ty] = destino();
      const rel = INI + (1 - (x - minX) / AN) * BARRIDO + azar() * 0.05;
      const dx = x + 50 + azar() * 100, dy = y - 60 + azar() * 85;
      const ang = (-115 + (azar() - 0.5) * 50) * Math.PI / 180, k = 1.45 + azar() * 0.4, vx = tx - CX, vy = ty - CY;
      const sx = CX + (vx * Math.cos(ang) - vy * Math.sin(ang)) * k, sy = CY + (vx * Math.sin(ang) + vy * Math.cos(ang)) * k;
      const t = azar() > 0.06 ? [3, 3, 4, 4, 4, 5][Math.floor(azar() * 6)] : 7;
      parts += `<i class="p-part" style="--x0:${x}px;--y0:${y}px;--x1:${dx | 0}px;--y1:${dy | 0}px;--x2:${sx | 0}px;--y2:${sy | 0}px;--x3:${(tx - 2) | 0}px;--y3:${(ty - 2) | 0}px;--c0:${c0};--c1:${c1};width:${t}px;height:${t}px;border-radius:${t === 7 ? '50%' : '1px'};animation-delay:${rel.toFixed(2)}s;animation-duration:${(FIN - rel).toFixed(2)}s"></i>`;
    }));
    const lienzos = logos.map((l) => `<canvas class="p-logo" width="${AN * 2}" height="${l.h * 2}" style="left:${l.x}px;top:${l.y}px;width:${AN}px;height:${l.h}px;animation-delay:0s,${INI}s;animation-duration:.35s,${BARRIDO}s"></canvas>`).join('');
    return `<div class="p-capa">${parts}</div>${lienzos}
      <img class="p-icono" src="marca/contacta_icono_blanco.svg" alt="" style="left:${CX - 90}px;top:${CY - 90}px">
      <div class="p-nombre"><div class="p-marco"><span class="p-palabra"><b style="color:#35383E">Con</b><b style="color:#0A9FC4">ta</b><b style="color:#9DA51A">c</b><b style="color:#F4324E">ta</b></span></div><div class="p-linea"></div></div>`;
  }

  /* ---------------- Pantalla de acceso ---------------- */
  let modoAcceso = 'entrar';
  function pintarAcceso() {
    listaMontada = false;
    const titulos = { entrar: 'Entrar', registro: 'Crear cuenta', olvido: 'Recuperar contraseña' };
    $app.innerHTML = `<main class="acceso">
      <div class="acceso-logos">
        <img src="${IMG.bp}" alt="Bosch Pascual" style="height:48px">
        <img src="${IMG.recop}" alt="RECOP" style="height:40px">
        <img src="${IMG.munne}" alt="Munné" style="height:34px">
      </div>
      <div style="text-align:center"><h1 class="titulo logo-titulo"><img src="marca/contacta_horizontal_blanco.svg" alt="Contacta" class="logo-acceso"></h1><div style="color:var(--sec);margin-top:6px">Proveedores de Bosch Pascual, RECOP y Munné</div></div>
      <form class="acceso-caja" id="f-acceso" novalidate>
        <div class="form-grupo">
          <div class="campo"><label for="a-email" class="oculto-vis">Correo de empresa</label><input id="a-email" type="email" autocomplete="username" placeholder="nombre@boschpascual.com" required></div>
          ${modoAcceso !== 'olvido' ? `<div class="campo"><label for="a-pass" class="oculto-vis">Contraseña</label><input id="a-pass" type="password" autocomplete="${modoAcceso === 'registro' ? 'new-password' : 'current-password'}" placeholder="Contraseña${modoAcceso === 'registro' ? ' (mínimo 8 caracteres)' : ''}" required></div>` : ''}
        </div>
        <div id="a-error" class="error-txt" style="padding:0 4px" hidden></div>
        <button class="btn-lleno ancho" type="submit">${titulos[modoAcceso]}</button>
        ${modoAcceso === 'entrar' ? `<button type="button" class="enlace" data-m="registro">¿Es tu primera vez? Crear cuenta</button><button type="button" class="enlace" data-m="olvido">He olvidado la contraseña</button>` : `<button type="button" class="enlace" data-m="entrar">Ya tengo cuenta: entrar</button>`}
        <div class="ayuda" style="padding:4px;text-align:center">Solo con correo @boschpascual.com, @recop.net o @cmunne.com.</div>
      </form></main>`;
    $app.querySelectorAll('[data-m]').forEach((b) => b.onclick = () => { modoAcceso = b.dataset.m; pintarAcceso(); });
    const err = (t) => { const e = document.getElementById('a-error'); e.textContent = t; e.hidden = !t; };
    document.getElementById('f-acceso').onsubmit = async (ev) => {
      ev.preventDefault(); err('');
      const email = document.getElementById('a-email').value.trim().toLowerCase();
      const pass = (document.getElementById('a-pass') || {}).value || '';
      if (!CFG.dominios.includes(email.split('@')[1] || '')) return err('Usa tu correo de empresa: @boschpascual.com, @recop.net o @cmunne.com.');
      const btn = ev.submitter || ev.target.querySelector('[type=submit]'); btn.disabled = true;
      try {
        if (modoAcceso === 'entrar') {
          const { error } = await sb.auth.signInWithPassword({ email, password: pass });
          if (error) throw new Error(/confirm/i.test(error.message) ? 'Aún no has confirmado tu correo. Busca el mensaje de confirmación en tu bandeja de entrada.' : 'Correo o contraseña incorrectos.');
        } else if (modoAcceso === 'registro') {
          if (pass.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
          const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: APP_URL } });
          if (error) throw new Error(/already|registered/i.test(error.message) ? 'Ese correo ya tiene cuenta. Entra o recupera la contraseña.' : /rate|limit/i.test(error.message) ? 'Se han enviado demasiados correos. Prueba dentro de un rato.' : 'No se ha podido crear la cuenta: ' + error.message);
          if (!data.session) { modoAcceso = 'entrar'; pintarAcceso(); aviso('Te hemos enviado un correo para confirmar la cuenta'); }
        } else {
          const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: APP_URL });
          if (error) throw new Error('No se ha podido enviar el correo: ' + error.message);
          modoAcceso = 'entrar'; pintarAcceso(); aviso('Te hemos enviado un correo para cambiar la contraseña');
        }
      } catch (e) { err(e.message); btn.disabled = false; }
    };
  }
  function hojaNuevaContrasena() {
    abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra"><span></span><div class="hoja-titulo">Nueva contraseña</div><span></span></div>
      <form id="f-np" style="padding:12px 0 0"><div class="form-grupo"><div class="campo"><label for="np">Contraseña</label><input id="np" type="password" autocomplete="new-password" minlength="8" placeholder="Mínimo 8" autofocus></div></div>
      <div style="padding:14px 20px 0"><button class="btn-lleno ancho">Guardar</button></div></form>`, (h) => {
      h.querySelector('#f-np').onsubmit = async (e) => {
        e.preventDefault(); const v = h.querySelector('#np').value;
        if (v.length < 8) return aviso('Mínimo 8 caracteres', false);
        const { error } = await sb.auth.updateUser({ password: v });
        if (error) return aviso(error.message, false);
        cerrarHoja(); aviso('Contraseña cambiada');
      };
    });
  }

  /* ---------------- Enrutado ---------------- */
  // #/            → inicio: buscador + categorías
  // #/f/FAM[/OF]  → una categoría (familia) y, si acaso, un oficio dentro
  // #/p/ID        → ficha de un proveedor (pantalla completa)
  const ruta = () => (location.hash.replace(/^#\/?/, '') || '').split('/');
  const ir = (h) => { location.hash = h; };
  let listaMontada = false; // se mantiene por compatibilidad con otras pantallas
  let ultimaLista = '#/';

  function pintar() {
    if (!sesion) return pintarAcceso();
    if (!D.cargado) return;
    const [r, id, id2] = ruta();
    listaMontada = false;
    if (r === 'p' && id) return pantallaSimple((el) => pintarFicha(el, IDX.porId.get(Number(id))));
    if (r === 'alta') return pantallaSimple((el) => pintarFormulario(el, null));
    if (r === 'editar' && id) return pantallaSimple((el) => pintarFormulario(el, IDX.porId.get(Number(id))));
    if (r === 'papelera') return pantallaSimple(pintarPapelera);
    if (r === 'admin' && esAdmin()) return pantallaSimple(pintarAdmin);
    if (r === 'cuenta') return pantallaSimple(pintarCuenta);
    E.fam = r === 'f' && id ? Number(id) : 0;
    E.of = r === 'f' && id2 ? Number(id2) : 0;
    ultimaLista = location.hash || '#/';
    const yaEstaba = document.getElementById('resultados') && document.getElementById('q');
    if (yaEstaba) { pintarResultados(); window.scrollTo(0, 0); return; }
    $app.innerHTML = `<div class="columna" id="pl"></div>`;
    pintarBuscador(document.getElementById('pl'));
  }
  function pantallaSimple(fn) {
    $app.innerHTML = `<div class="barra-inicio"><a class="a-inicio" href="#/" title="Ir al inicio"><span class="logos-mini"><img src="${IMG.bpLinea}" alt="Bosch Pascual" style="height:11px"><img src="${IMG.recop}" alt="RECOP" style="height:16px"><img src="${IMG.munne}" alt="Munné" style="height:13px"></span><img class="marca" src="marca/contacta_horizontal_blanco.svg" alt="Contacta"></a></div><div class="pantalla" id="ps"></div>`;
    $app.querySelector('.a-inicio').onclick = (e) => { e.preventDefault(); irInicio(); if (e.target.closest('.marca')) lanzarMini(); };
    fn(document.getElementById('ps')); window.scrollTo(0, 0);
  }
  // Vuelve al inicio de todo: sin búsqueda ni categoría, rueda arriba
  function irInicio() {
    E.q = ''; E.limite = 60; E.rueda = 0;
    const inp = document.getElementById('q'); if (inp) { inp.value = ''; const xb = document.getElementById('q-x'); if (xb) xb.hidden = true; }
    if (location.hash && location.hash !== '#/' && location.hash !== '#') ir('#/'); else pintarResultados();
    window.scrollTo(0, 0);
  }

  /* ---------------- Buscador ---------------- */
  const E = { q: '', fam: 0, of: 0, rueda: 0, prov: '', orden: 'rec', soloTrab: false, verInact: false, limite: 60 };
  function familiasOrden() { return D.familias.slice().sort((a, b) => a.orden - b.orden); }
  function oficiosDeFam(famId) { return oficiosVivos().filter((o) => o.familia_id === famId).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')); }

  // Color suave por familia para avatares e iconos
  const TONOS = [['#E6F0E8', '#2F6B3C'], ['#E4EEF8', '#2C5A85'], ['#FBEFD9', '#8A5A12'], ['#F6E3E3', '#9A2F2F'], ['#ECE6F6', '#5B3F8C'], ['#E3F2F1', '#256B66'], ['#F3EBE3', '#6E4F33'], ['#EFEFEA', '#5A5A4A']];
  function tono(famNombre) {
    const fams = familiasOrden(); const i = fams.findIndex((f) => f.nombre === famNombre);
    return TONOS[(i < 0 ? 0 : i) % TONOS.length];
  }
  const iniciales = (s) => palabras(s).filter((w) => !/^\d+$/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '·';

  function pintarBuscador(el) {
    const offline = !enLinea();
    el.innerHTML = `
      <header class="cabecera">
        <div class="cab-fila">
          <span class="cab-hueco" aria-hidden="true"></span>
          <a class="logos-mini a-inicio" href="#/" title="Ir al inicio"><img src="${IMG.bpLinea}" alt="Bosch Pascual" style="height:12px"><img src="${IMG.recop}" alt="RECOP" style="height:18px"><img src="${IMG.munne}" alt="Munné" style="height:15px"></a>
          <div style="display:flex;gap:4px;align-items:center">
            ${esAdmin() ? `<a class="btn-redondo" href="#/admin" aria-label="Administración" title="Administración">${ico('ajustes', 20, '#736A63', 1.8)}</a>` : `<a class="btn-redondo" href="#/cuenta" aria-label="Mi cuenta" title="Mi cuenta">${ico('salir', 20, '#736A63', 1.8)}</a>`}
            <a class="btn-redondo" href="#/papelera" aria-label="Papelera" title="Papelera">${ico('papelera', 20, '#736A63', 1.8)}</a>
            <a class="btn-anadir" href="#/alta" aria-label="Añadir proveedor" title="Añadir proveedor">${ico('mas', 18, '#fff', 2.4)}<span>Añadir</span></a>
          </div>
        </div>
        <h1 class="titulo logo-titulo"><a class="a-inicio" href="#/" title="Ir al inicio"><img class="logo-cab" src="marca/contacta_horizontal_blanco.svg" alt="Contacta"></a></h1>
        <div class="buscador">
          <div class="caja-busca">${ico('buscar', 20, '#736A63', 2.2)}
            <label for="q" class="oculto-vis">Buscar</label>
            <input id="q" type="text" placeholder="Buscar oficio, empresa, persona, obra…" autocomplete="off" enterkeyhint="search" value="${esc(E.q)}">
            <button class="borrar-busca" id="q-x" aria-label="Borrar búsqueda" ${E.q ? '' : 'hidden'}>${ico('x', 12, '#fff', 3)}</button>
          </div>
        </div>
        ${offline ? `<div class="aviso-offline">Sin conexión: estás viendo los datos guardados. Para añadir o editar hace falta conexión.</div>` : ''}
      </header>
      <div id="resultados"></div>`;
    const inp = el.querySelector('#q');
    const xb = el.querySelector('#q-x');
    const alEscribir = debounce(() => { E.q = inp.value; E.limite = 60; xb.hidden = !E.q; pintarResultados(); }, 120);
    inp.oninput = alEscribir;
    inp.onkeydown = (e) => { if (e.key === 'Escape') { inp.value = ''; alEscribir(); } };
    xb.onclick = () => { inp.value = ''; E.q = ''; xb.hidden = true; pintarResultados(); inp.focus(); };
    el.querySelectorAll('.a-inicio').forEach((a) => a.onclick = (e) => { e.preventDefault(); irInicio(); if (a.querySelector('.logo-cab')) lanzarMini(); });
    pintarResultados();
    if (ancho() && !E.fam) setTimeout(() => inp.focus({ preventScroll: true }), 50);
  }

  function filtrosHTML() {
    return `<div class="filtros">
          <button class="chip ${E.soloTrab ? 'on' : ''}" id="f-trab" aria-pressed="${E.soloTrab}">Trabajado con nosotros</button>
          <button class="chip ${E.verInact ? 'on' : ''}" id="f-inact" aria-pressed="${E.verInact}">Ver cerrados</button>
          <label class="sel-chip ${E.prov ? 'on' : ''}" title="Filtrar por provincia"><span class="oculto-vis">Provincia</span>
            <select id="f-prov"><option value="">Todas las provincias</option>${provincias().map((x) => `<option value="${esc(x.k)}" ${E.prov === x.k ? 'selected' : ''}>${esc(x.n)} (${x.c})</option>`).join('')}</select></label>
          <label class="sel-chip ${E.orden !== 'rec' ? 'on' : ''}" title="Ordenar la lista"><span class="oculto-vis">Ordenar</span>
            <select id="f-orden"><option value="rec" ${E.orden === 'rec' ? 'selected' : ''}>Orden: recomendados</option><option value="est" ${E.orden === 'est' ? 'selected' : ''}>Orden: más estrellas</option><option value="az" ${E.orden === 'az' ? 'selected' : ''}>Orden: nombre A-Z</option></select></label>
        </div>`;
  }
  function engancharFiltros(z) {
    const q = (s) => z.querySelector(s); if (!q('#f-trab')) return;
    q('#f-trab').onclick = () => { E.soloTrab = !E.soloTrab; pintarResultados(); };
    q('#f-inact').onclick = () => { E.verInact = !E.verInact; pintarResultados(); };
    q('#f-prov').onchange = (e) => { E.prov = e.target.value; pintarResultados(); };
    q('#f-orden').onchange = (e) => { E.orden = e.target.value; pintarResultados(); };
  }
  function listaFiltrada() {
    let l = D.prov.filter((p) => !p.eliminado_en && (E.verInact || p.estado === 'activo'));
    if (E.soloTrab) l = l.filter((p) => p._trab);
    if (E.prov) l = l.filter((p) => norm(p.provincia) === E.prov);
    return l;
  }
  // Provincias que hay en la base (sin distinguir mayúsculas ni acentos), de más a menos proveedores
  function provincias() {
    const m = new Map();
    D.prov.forEach((p) => { if (p.eliminado_en || !p.provincia) return; const k = norm(p.provincia); if (!k) return;
      if (!m.has(k)) m.set(k, { k, n: p.provincia.trim().toLowerCase().replace(/(^|[\s\-\/'·])(\p{L})/gu, (s, a, b) => a + b.toUpperCase()), c: 0 }); m.get(k).c++; });
    return [...m.values()].sort((a, b) => b.c - a.c || a.n.localeCompare(b.n, 'es'));
  }
  const ordenProv = (a, b) => {
    if (E.orden === 'est') return (b._media - a._media) || (b._n - a._n) || a.nombre.localeCompare(b.nombre, 'es');
    if (E.orden === 'az') return a.nombre.localeCompare(b.nombre, 'es');
    return (b._trab - a._trab) || (b._media - a._media) || a.nombre.localeCompare(b.nombre, 'es');
  };
  function cuentas(base) {
    const porOf = new Map(); const porFam = new Map();
    base.forEach((p) => {
      const fams = new Set();
      p._ofs.forEach((o) => { porOf.set(o.id, (porOf.get(o.id) || 0) + 1); fams.add(o.familia_id); });
      fams.forEach((f) => porFam.set(f, (porFam.get(f) || 0) + 1));
    });
    return { porOf, porFam };
  }

  function pintarResultados() {
    const z = document.getElementById('resultados'); if (!z) return;
    const base = listaFiltrada();
    const C = cuentas(base);
    if (E.q.trim()) return pintarBusqueda(z, base, C);
    if (E.fam && IDX.fam.get(E.fam)) return pintarCategoria(z, base, C);
    // Inicio: rueda de familias (filtra) + fichas de oficios con proveedores
    const fams = familiasOrden();
    const opciones = [{ id: 0, nombre: 'Todas las familias' }, ...fams];
    E.rueda = Math.min(E.rueda, opciones.length - 1);
    const ofs = [];
    fams.forEach((f) => oficiosDeFam(f.id).forEach((o) => { if (C.porOf.get(o.id)) ofs.push({ o, f }); }));
    z.innerHTML = `<div class="rueda-cab"><span class="etiqueta-sec">Familias · ${fams.length}</span><span style="font-size:13px;color:var(--sec)">Gira la rueda para filtrar los oficios</span></div><div id="rueda"></div>
      ${filtrosHTML()}
      <div class="seccion-cab"><h2 id="of-tit">Oficios</h2><span id="of-n"></span></div>
      <div class="rejilla">${ofs.map(({ o, f }) => {
        const [bg, fg] = tono(f.nombre); const n = C.porOf.get(o.id) || 0;
        return `<a class="cat cat-color" href="#/f/${f.id}/${o.id}" data-fam="${f.id}" title="${esc(f.nombre)}" style="background:${bg}"><span class="cat-ico" style="background:#fff">${icoFam(f.nombre, 24, fg)}</span>
          <span class="cat-nombre">${esc(o.nombre)}</span><span class="cat-n" style="color:${fg}">${n} proveedor${n === 1 ? '' : 'es'}</span></a>`;
      }).join('')}</div><div style="height:32px"></div>`;
    const filtrar = (i) => {
      const op = opciones[i]; let n = 0;
      z.querySelectorAll('.cat').forEach((c) => { const ver = !op.id || Number(c.dataset.fam) === op.id; c.hidden = !ver; if (ver) n++; });
      z.querySelector('#of-tit').textContent = op.id ? op.nombre : 'Oficios';
      z.querySelector('#of-n').textContent = n;
    };
    montarRueda(z.querySelector('#rueda'), opciones.map((x) => ({ label: x.nombre, icon: x.id ? icoFam(x.nombre, 20, '#575049') : '' })), E.rueda, true,
      (i) => { E.rueda = i; filtrar(i); }, (i) => { E.rueda = i; filtrar(i); });
    filtrar(E.rueda);
    engancharFiltros(z);
  }

  function pintarCategoria(z, base, C) {
    const f = IDX.fam.get(E.fam);
    const ofs = oficiosDeFam(f.id).filter((o) => C.porOf.get(o.id) || o.id === E.of);
    const [bg, fg] = tono(f.nombre);
    const elegidos = E.of ? ofs.filter((o) => o.id === E.of) : ofs;
    const grupos = elegidos.map((o) => ({ titulo: o.nombre, fam: f.nombre, items: base.filter((p) => p._ofs.some((x) => x.id === o.id)).sort(ordenProv) })).filter((g) => g.items.length);
    z.innerHTML = `
      <div class="cat-banda" style="background:${bg}">
      <div class="cat-cab">
        <a class="volver" href="#/">${ico('atras', 18, '#00879A', 2.2)}Categorías</a>
        <div class="cat-titulo"><span class="cat-ico" style="background:#fff">${icoFam(f.nombre, 26, fg)}</span><h2>${esc(f.nombre)}</h2></div>
      </div>
      <div class="oficios">
        <a class="chip ${E.of ? '' : 'on'}" href="#/f/${f.id}">Todos <span class="chip-n">${C.porFam.get(f.id) || 0}</span></a>
        ${ofs.map((o) => `<a class="chip ${E.of === o.id ? 'on' : ''}" href="#/f/${f.id}/${o.id}">${esc(o.nombre)} <span class="chip-n">${C.porOf.get(o.id) || 0}</span></a>`).join('')}
      </div>
      </div>
      ${filtrosHTML()}
      ${grupos.length ? gruposHTML(grupos) : `<div class="vacio"><p>No hay proveedores aquí${E.soloTrab ? ' con los que hayamos trabajado' : ''}.</p><a class="btn-lleno" href="#/alta">Añadir proveedor</a></div>`}
      <div style="height:32px"></div>`;
    engancharFiltros(z);
    engancharGrupos(z, grupos);
  }

  function pintarBusqueda(z, base, C) {
    const toks = palabras(E.q);
    // 1. Categorías: oficios y familias cuyo nombre o sinónimos coinciden
    const casa = (ws) => toks.length && toks.every((t) => puntuaToken(t, ws) >= 2);
    const ofsHit = oficiosVivos().filter((o) => casa(palabras(o.nombre + ' ' + (o.sinonimos || []).join(' ')))).filter((o) => C.porOf.get(o.id));
    const famsHit = familiasOrden().filter((f) => casa(palabras(f.nombre)) && C.porFam.get(f.id));
    const idsOf = new Set(ofsHit.map((o) => o.id));
    // 2. Proveedores de esas categorías  ·  3. Otras coincidencias con proveedores
    const res = buscar(E.q, base);
    const deCat = base.filter((p) => p._ofs.some((o) => idsOf.has(o.id)));
    const setCat = new Set(deCat.map((p) => p.id));
    const otros = res.filter((p) => !setCat.has(p.id));
    if (E.orden !== 'rec') otros.sort(ordenProv);
    const grupos = ofsHit.map((o) => ({ titulo: o.nombre, fam: (IDX.fam.get(o.familia_id) || {}).nombre, items: deCat.filter((p) => p._ofs.some((x) => x.id === o.id)).sort(ordenProv) })).filter((g) => g.items.length);
    const vistaOtros = otros.slice(0, E.limite);
    if (!famsHit.length && !ofsHit.length && !otros.length) {
      z.innerHTML = `<div class="vacio"><h2>Sin resultados</h2><p>Nada coincide con «${esc(E.q)}». ¿Lo conoces? Añádelo para el resto del equipo.</p><a class="btn-lleno" href="#/alta">Añadir proveedor</a></div>` + (E.soloTrab || E.verInact || E.prov ? filtrosHTML() : '');
      engancharFiltros(z);
      return;
    }
    const tarjetasCat = [
      ...famsHit.map((f) => ({ href: `#/f/${f.id}`, nombre: f.nombre, sub: 'Categoría', n: C.porFam.get(f.id), fam: f.nombre })),
      ...ofsHit.map((o) => { const f = IDX.fam.get(o.familia_id) || {}; return { href: `#/f/${f.id}/${o.id}`, nombre: o.nombre, sub: f.nombre || '', n: C.porOf.get(o.id), fam: f.nombre }; })
    ];
    z.innerHTML = `
      ${tarjetasCat.length ? `<div class="seccion-cab"><h2>Categorías</h2></div>
        <div class="rejilla">${tarjetasCat.map((c) => { const [bg, fg] = tono(c.fam); return `<a class="cat" href="${c.href}"><span class="cat-ico" style="background:${bg}">${icoFam(c.fam, 24, fg)}</span>
          <span class="cat-nombre">${esc(c.nombre)}</span><span class="cat-n">${c.n || 0}${c.sub ? ' · ' + esc(c.sub) : ''}</span></a>`; }).join('')}</div>` : ''}
      ${filtrosHTML()}
      ${grupos.length ? gruposHTML(grupos) : ''}
      ${vistaOtros.length ? `<div class="seccion-cab"><h2>${grupos.length ? 'Otras coincidencias' : 'Proveedores'}</h2><span>${otros.length}</span></div>
        <div class="tarjeta">${vistaOtros.map((p) => filaHTML(p)).join('')}</div>` : ''}
      ${otros.length > E.limite ? `<div class="mas"><button class="btn-blanco" id="ver-mas">Ver ${Math.min(otros.length - E.limite, 60)} más</button></div>` : ''}
      <div style="height:32px"></div>`;
    const vm = z.querySelector('#ver-mas'); if (vm) vm.onclick = () => { E.limite += 60; pintarResultados(); };
    z.querySelectorAll('a.cat').forEach((a) => a.addEventListener('click', () => {
      E.q = ''; E.limite = 60;
      const inp = document.getElementById('q'); if (inp) inp.value = '';
      const xb = document.getElementById('q-x'); if (xb) xb.hidden = true;
    }));
    engancharFiltros(z);
    engancharGrupos(z, grupos);
  }

  function gruposHTML(grupos) {
    return grupos.map((g, gi) => `
      <div class="seccion-cab"><h2>${esc(g.titulo)}</h2><span>${g.items.length}</span>
        <button class="copiar-todos" data-g="${gi}">${ico('copiar', 16, '#00879A')}<span>Copiar todos</span></button></div>
      <div class="tarjeta">${g.items.map((p) => filaHTML(p, g.fam)).join('')}</div>`).join('');
  }
  function engancharGrupos(z, grupos) {
    z.querySelectorAll('.copiar-todos').forEach((b) => b.onclick = async () => {
      const g = grupos[Number(b.dataset.g)];
      if (await copiarProveedores(g.items)) { b.innerHTML = ico('ok', 16, '#2F6B3C', 2.4) + '<span>Copiados</span>'; setTimeout(() => { b.innerHTML = ico('copiar', 16, '#00879A') + '<span>Copiar todos</span>'; }, 1500); aviso(`${g.items.length} proveedores copiados. Pégalos en el comparativo.`); }
    });
    engancharFilas(z);
  }

  function filaHTML(p, famNombre) {
    const fam = famNombre || p._fam;
    const [bg, fg] = tono(fam);
    const moviles = partes(p.moviles);
    const telf = moviles[0] || partes(p.fijos)[0];
    const lugar = [p.poblacion, p.provincia && p.poblacion && norm(p.provincia) === norm(p.poblacion) ? '' : p.provincia].filter(Boolean).join(' · ');
    const oficios = p._ofs.map((o) => o.nombre).join(' · ');
    return `<div class="fila" data-id="${p.id}">
      <div class="fila-enlace" data-abrir="${p.id}" role="link" tabindex="0" title="Ver ficha">
        <span class="avatar" style="background:${bg};color:${fg}">${esc(iniciales(p.nombre))}</span>
        <span class="fila-txt">
          <span class="fila-nombre">${esc(p.nombre)}${btnCp(p.nombre, 'el nombre')}</span>
          ${oficios ? `<span class="fila-oficio">${esc(oficios)}</span>` : ''}
          ${datosFila(p)}
          <span class="fila-meta">
            ${lugar ? `<span class="lugar">${esc(lugar)}</span>` : ''}
            ${p.estado === 'inactivo' ? '<span class="pastilla inact">Cerrado</span>' : p._trab ? '<span class="pastilla trab">Trabajado con nosotros</span>' : ''}
          </span>
          <span class="fila-val">
            ${p._n ? `${estrellas(Math.round(p._media), 16)}<span class="val-num">${p._media.toFixed(1).replace('.', ',')}</span><span class="val-cuantas">(${p._n} valoraci${p._n === 1 ? 'ón' : 'ones'})</span>` : '<span class="val-cuantas">Sin valoraciones</span>'}
            ${p.eliminado_en ? '' : (() => { const mia = p._vals.find((v) => sesion && v.usuario_id === sesion.user.id); return `<button class="btn-valorar" data-valorar="${p.id}" title="${mia ? 'Cambiar mi valoración' : 'Valorar este proveedor'}">${mia ? `${estrella('#E8A317', 13)} Mi nota: ${mia.estrellas}` : `${ico('mas', 14, '#575049', 2.4)} Valorar`}</button>`; })()}
          </span>
        </span>
      </div>
      <button class="btn-circ solo-ancho" data-copiar="${p.id}" aria-label="Copiar ${esc(p.nombre)}">${ico('copiar', 18, '#575049')}</button>
      <a class="btn-circ" ${moviles[0] ? `href="https://wa.me/${telLink(moviles[0]).replace('+', '')}" target="_blank" rel="noopener"` : 'aria-disabled="true"'} aria-label="WhatsApp a ${esc(p.nombre)}">${ico('wa', 19, '#2F6B3C')}</a>
      <a class="btn-circ rojo" ${telf ? `href="tel:${esc(telLink(telf))}"` : 'aria-disabled="true"'} aria-label="Llamar a ${esc(p.nombre)}">${ico('tel', 19, '#fff')}</a>
    </div>`;
  }
  // Botón pequeño para copiar un dato suelto (nombre, persona, teléfono, correo).
  function btnCp(valor, que) {
    return `<button class="cp" data-cp="${esc(valor)}" title="Copiar ${que}" aria-label="Copiar ${que}: ${esc(valor)}">${ico('copiar2', 15, '#8A817A', 2)}</button>`;
  }
  function datosFila(p) {
    const d = [];
    if (p.personas) d.push(`<span class="fd">${ico('contacto', 14, '#8A817A', 2)}<span>${esc(p.personas)}</span>${btnCp(p.personas, 'la persona de contacto')}</span>`);
    [...partes(p.moviles), ...partes(p.fijos)].forEach((x) => d.push(`<span class="fd"><a class="fd-link" href="tel:${esc(telLink(x))}">${ico('tel', 14, '#8A817A', 2)}<span>${esc(telBonito(x))}</span></a>${btnCp(telBonito(x), 'el teléfono')}</span>`));
    partes(p.emails).forEach((m) => d.push(`<span class="fd"><a class="fd-link" href="mailto:${esc(m)}">${ico('correo', 14, '#8A817A', 2)}<span>${esc(m)}</span></a>${btnCp(m, 'el correo')}</span>`));
    if (p.web) d.push(`<a class="fd fd-link" href="${esc(/^https?:/i.test(p.web) ? p.web : 'https://' + p.web)}" target="_blank" rel="noopener">${ico('web', 14, '#8A817A', 2)}<span>${esc(p.web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''))}</span></a>`);
    return d.length ? `<span class="fila-datos">${d.join('')}</span>` : '';
  }
  function engancharFilas(z) {
    z.querySelectorAll('.fila[data-id]').forEach((f) => {
      f.addEventListener('click', (e) => {
        if (e.target.closest('a, button, [data-abrir]')) return;
        const sel = window.getSelection && String(window.getSelection()); if (sel && sel.length > 1) return;
        ir('#/p/' + f.dataset.id);
      });
    });
    z.querySelectorAll('[data-abrir]').forEach((b) => {
      b.onclick = (e) => {
        if (e.target.closest('a, button')) return; // teléfono, correo, web o valorar: actúan solos
        const sel = window.getSelection && String(window.getSelection()); if (sel && sel.length > 1) return; // seleccionando texto
        ir('#/p/' + b.dataset.abrir);
      };
      b.onkeydown = (e) => { if (e.key === 'Enter' && e.target === b) ir('#/p/' + b.dataset.abrir); };
    });
    z.querySelectorAll('[data-valorar]').forEach((b) => b.onclick = (e) => {
      e.stopPropagation();
      const p = IDX.porId.get(Number(b.dataset.valorar)); if (!p) return;
      if (!enLinea()) return aviso('Sin conexión: para valorar hace falta conexión', false);
      hojaValorar(p, p._vals.find((v) => sesion && v.usuario_id === sesion.user.id));
    });
    z.querySelectorAll('[data-cp]').forEach((b) => b.onclick = async (e) => {
      e.preventDefault(); e.stopPropagation();
      const v = b.dataset.cp;
      if (await copiarTexto(v)) {
        b.classList.add('hecho'); b.innerHTML = ico('ok', 15, '#2F6B3C', 2.6);
        setTimeout(() => { b.classList.remove('hecho'); b.innerHTML = ico('copiar2', 15, '#8A817A', 2); }, 1400);
        aviso('Copiado: ' + v);
      } else aviso('No se ha podido copiar', false);
    });
    z.querySelectorAll('[data-copiar]').forEach((b) => b.onclick = async () => {
      const p = IDX.porId.get(Number(b.dataset.copiar));
      if (await copiarProveedores([p])) marcarCopiado(b, false);
    });
  }

  // Rueda tipo selector de iPhone: lista con «snap», difuminada arriba y abajo, infinita si loop.
  function montarRueda(cont, items, sel, loop, alCambiar, alEntrar) {
    const H = 46; const n = items.length; const rep = loop ? 3 : 1; const base = loop ? n : 0;
    cont.className = 'rueda';
    let html = '<div class="rueda-sel"></div><div class="rueda-lista" role="listbox" tabindex="0"><div class="rueda-pad"></div>';
    for (let r = 0; r < rep; r++) items.forEach((it, i) => { html += `<button class="rueda-item" role="option" data-i="${i}" data-k="${r * n + i}" tabindex="-1"><span class="ico-rueda">${it.icon || ''}</span><span>${esc(it.label)}</span>${it.chev ? `<span class="chev">${ico('chev', 16, '#A39A93', 2.4)}</span>` : ''}</button>`; });
    html += '<div class="rueda-pad"></div></div>';
    cont.innerHTML = html;
    const lista = cont.querySelector('.rueda-lista');
    const els = [...lista.querySelectorAll('.rueda-item')];
    let actual = sel; let raf = 0; let tFin;
    const pintarRot = () => {
      raf = 0; const c = lista.scrollTop / H;
      els.forEach((b, k) => {
        const d = k - c; const a = Math.abs(d);
        if (a > 5) { b.style.opacity = '0'; return; }
        b.style.transform = `perspective(500px) rotateX(${(-d * 17).toFixed(1)}deg) scale(${(1 - Math.min(a, 4) * 0.05).toFixed(3)})`;
        b.style.opacity = String(Math.max(0, 1 - a * 0.22).toFixed(2));
        b.classList.toggle('sel', a < 0.5); b.setAttribute('aria-selected', a < 0.5);
      });
    };
    const fin = () => {
      let k = Math.round(lista.scrollTop / H);
      const i = ((k % n) + n) % n;
      if (loop && (k < n || k >= 2 * n)) { k = n + i; lista.scrollTop = k * H; pintarRot(); }
      if (i !== actual) { actual = i; alCambiar(i); }
    };
    lista.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(pintarRot); clearTimeout(tFin); tFin = setTimeout(fin, 130); }, { passive: true });
    lista.scrollTop = (base + sel) * H; pintarRot();
    lista.addEventListener('click', (e) => {
      const b = e.target.closest('.rueda-item'); if (!b) return;
      const k = Number(b.dataset.k); const i = Number(b.dataset.i);
      if (b.classList.contains('sel')) { if (alEntrar) alEntrar(i); }
      else lista.scrollTo({ top: k * H, behavior: 'smooth' });
    });
    lista.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); lista.scrollBy({ top: e.key === 'ArrowDown' ? H : -H, behavior: 'smooth' }); }
      if (e.key === 'Enter' && alEntrar) alEntrar(actual);
    });
  }

  /* ---------------- Ficha ---------------- */
  const abiertas = new Set();
  function pintarFicha(el, p) {
    if (!p || (p.eliminado_en && !esAdmin() && Date.now() - new Date(p.eliminado_en) > DIAS_PAPELERA * 864e5)) {
      el.innerHTML = `<div class="barra-nav"><a class="btn-texto" href="#/">${ico('atras', 22, '#575049', 2.2)}Contacta</a></div><div class="vacio"><h2>Este proveedor no existe</h2><p>Puede que lo hayan eliminado.</p></div>`; return;
    }
    const famN = p._fam; const moviles = partes(p.moviles); const fijos = partes(p.fijos); const emails = partes(p.emails);
    const telf = moviles[0] || fijos[0]; const mia = p._vals.find((v) => sesion && v.usuario_id === sesion.user.id);
    const datos = [];
    if (p.personas) datos.push(`<div class="dato"><div class="dato-txt"><span class="k">Persona de contacto</span><span class="v">${esc(p.personas)}</span></div></div>`);
    moviles.forEach((t) => datos.push(datoCopiable('Móvil', telBonito(t), `tel:${telLink(t)}`)));
    fijos.forEach((t) => datos.push(datoCopiable('Teléfono fijo', telBonito(t), `tel:${telLink(t)}`)));
    emails.forEach((m) => datos.push(datoCopiable('Correo', m, `mailto:${m}`)));
    if (p.web) datos.push(`<div class="dato"><div class="dato-txt"><span class="k">Web</span><a class="v" href="${esc(/^https?:/i.test(p.web) ? p.web : 'https://' + p.web)}" target="_blank" rel="noopener">${esc(p.web.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''))}</a></div>${ico('web', 18, '#A39A93', 1.8)}</div>`);
    if (p.poblacion || p.provincia) datos.push(`<div class="dato"><div class="dato-txt"><span class="k">Población</span><span class="v">${esc([p.poblacion, p.provincia].filter(Boolean).join(' · '))}</span></div></div>`);
    if (p.cif) datos.push(datoCopiable('CIF', p.cif));
    if (p.recomendado_por) datos.push(`<div class="dato"><div class="dato-txt"><span class="k">Recomendado por</span><span class="v">${esc(p.recomendado_por)}</span></div></div>`);
    const borrado = !!p.eliminado_en;
    el.innerHTML = `
      <div class="barra-nav"><a class="btn-texto" href="${esc(ultimaLista)}">${ico('atras', 22, '#575049', 2.2)}Volver</a><span></span>
        ${borrado ? '' : `<a class="btn-texto" href="#/editar/${p.id}">Editar</a>`}</div>
      ${borrado ? `<div class="marca-sinv" style="border-style:solid;background:#FFF4D6;color:#6B5310">${ico('papelera', 18, '#6B5310', 1.8)}<span>Está en la papelera. <a href="#/papelera" style="text-decoration:underline">Ver papelera</a></span></div>` : ''}
      <div class="identidad ficha-color" style="background:${tono(famN)[0]}">
        <div class="ficha-avatar" style="color:${tono(famN)[1]}">${esc(iniciales(p.nombre))}<span class="ficha-fam" title="${esc(famN || '')}">${icoFam(famN, 16, tono(famN)[1])}</span></div>
        <h1 class="nombre-grande">${esc(p.nombre)}</h1>
        <div class="subtitulo ficha-oficios">${p._ofs.length ? p._ofs.map((o) => `<span class="ficha-of" style="color:${tono(famN)[1]}">${esc(o.nombre)}</span>`).join('') : '<span>Sin oficio</span>'}</div>
        <div class="subtitulo">${p.estado === 'inactivo' ? '<span class="pastilla inact">Empresa cerrada</span>' : p._trab ? '<span class="pastilla trab">Trabajado con nosotros</span>' : '<span class="pastilla ref">Referencia</span>'}
          ${p.sin_verificar ? '<span class="pastilla sinv" title="No se pudo confirmar que siga activa">Sin verificar</span>' : ''}</div>
      </div>
      <div class="acciones">
        <a class="accion rojo" ${telf ? `href="tel:${esc(telLink(telf))}"` : 'aria-disabled="true"'}><span class="acc-ico">${ico('tel', 20, '#fff')}</span>Llamar</a>
        <a class="accion" ${moviles[0] ? `href="https://wa.me/${telLink(moviles[0]).replace('+', '')}" target="_blank" rel="noopener"` : 'aria-disabled="true"'}><span class="acc-ico" style="background:#E3F5EA">${ico('wa', 20, '#1E8E4E')}</span>WhatsApp</a>
        <a class="accion" ${emails[0] ? `href="mailto:${esc(emails[0])}"` : 'aria-disabled="true"'}><span class="acc-ico" style="background:#E3F8FA">${ico('correo', 20, '#00879A')}</span>Correo</a>
        <button class="accion" id="a-copiar"><span class="acc-ico" style="background:#F3F5D9">${ico('copiar', 20, '#7E8A12')}</span><span>Copiar</span></button>
        <button class="accion" id="a-vcf"><span class="acc-ico" style="background:#E2EEF8">${ico('contacto', 20, '#007BAC')}</span><span>Guardar en contactos</span></button>
        <button class="accion" id="a-compartir"><span class="acc-ico" style="background:#FDE6EA">${ico('compartir', 20, '#E0284F')}</span><span>Compartir</span></button>
      </div>
      ${p.sin_verificar ? `<div class="marca-sinv" style="margin-top:12px">${ico('info', 18, '#736A63', 1.8)}<span>No pudimos confirmar que siga activa. Si hablas con ellos, edita o valora la ficha y la marca desaparece.</span></div>` : ''}
      ${datos.length ? `<div class="seccion"><span class="etiqueta-sec">Contacto</span></div><div class="tarjeta">${datos.join('')}</div>` : ''}
      <div class="seccion"><span class="etiqueta-sec">Valoraciones</span>
        ${p._n ? `<span style="display:flex;align-items:center;gap:4px;font-size:15px;font-weight:600">${estrella('#E8A317', 14)}${p._media.toFixed(1).replace('.', ',')}<span style="font-weight:400;color:var(--sec)">· ${p._n}</span></span>` : ''}</div>
      ${p._n ? `<div class="tarjeta">${p._vals.map((v) => valoracionHTML(v)).join('')}</div>` : `<div class="ayuda" style="padding-top:0">Nadie la ha valorado todavía.</div>`}
      ${borrado ? '' : `<div style="margin:10px 20px 0"><button class="btn-blanco" id="a-valorar">${ico(mia ? 'ok' : 'mas', 18, '#575049')}${mia ? 'Cambiar mi valoración' : 'Añadir valoración'}</button></div>`}
      ${p.notas ? `<div class="seccion"><span class="etiqueta-sec">Notas</span></div><div class="tarjeta"><div class="texto-bloque">${esc(p.notas)}</div></div>` : ''}
      <div class="pie">Añadido por ${esc(nombreUsuario(p.creado_por, p.creado_por_texto))} · ${fecha(p.created_at)}${p.updated_at && p.updated_at !== p.created_at ? ` · Última edición ${hace(p.updated_at)}` : ''}</div>
      ${borrado ? '' : `<div style="margin:22px 20px 0"><button class="btn-blanco btn-peligro" id="a-eliminar">${ico('papelera', 18, '#B4151B', 1.8)}Eliminar proveedor</button></div>`}
      <div style="height:32px"></div>`;
    el.querySelectorAll('[data-copia]').forEach((b) => b.onclick = async () => { if (await copiarTexto(b.dataset.copia)) marcarCopiado(b, true); });
    el.querySelector('#a-copiar').onclick = async (e) => { if (await copiarProveedores([p])) { marcarCopiado(e.currentTarget, true); aviso('Copiado. Pégalo en el comparativo.'); } };
    el.querySelector('#a-vcf').onclick = () => descargarVcf(p);
    el.querySelector('#a-compartir').onclick = () => compartir(p);
    const bv = el.querySelector('#a-valorar'); if (bv) bv.onclick = () => hojaValorar(p, mia);
    const be = el.querySelector('#a-eliminar'); if (be) be.onclick = () => eliminar(p);
    el.querySelectorAll('.valoracion > button').forEach((b) => b.onclick = () => {
      const v = b.parentElement; const id = v.dataset.v;
      if (abiertas.has(id)) abiertas.delete(id); else abiertas.add(id);
      v.classList.toggle('abierta'); v.querySelector('.val-det').hidden = !v.classList.contains('abierta');
      b.setAttribute('aria-expanded', v.classList.contains('abierta'));
    });
    el.querySelectorAll('[data-borrar-val]').forEach((b) => b.onclick = async () => {
      if (!await confirmar('¿Borrar esta valoración?', 'Se quitará de la ficha.', 'Borrar', true)) return;
      if (!enLinea()) return aviso('Sin conexión', false);
      const { error } = await sb.from('valoraciones').delete().eq('id', Number(b.dataset.borrarVal));
      if (error) return aviso('No se ha podido borrar: ' + error.message, false);
      aviso('Valoración borrada'); await cargarDatos(); pintar();
    });
  }
  function datoCopiable(k, v, href) {
    return `<div class="dato"><div class="dato-txt"><span class="k">${esc(k)}</span>${href ? `<a class="v" href="${esc(href)}">${esc(v)}</a>` : `<span class="v">${esc(v)}</span>`}</div>
      <button class="btn-copiar" data-copia="${esc(v)}" aria-label="Copiar ${esc(k.toLowerCase())}">${ico('copiar', 16, '#575049')}<span>Copiar</span></button></div>`;
  }
  function valoracionHTML(v) {
    const ab = abiertas.has(String(v.id));
    const puedo = sesion && (v.usuario_id === sesion.user.id || esAdmin());
    return `<div class="valoracion ${ab ? 'abierta' : ''}" data-v="${v.id}">
      <button aria-expanded="${ab}"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <span style="font-size:16px;font-weight:600">${esc(v.obra || nombreUsuario(v.usuario_id))}</span>
        <span style="font-size:13px;color:var(--sec)">${esc(nombreUsuario(v.usuario_id))}${v.empresa ? ' · ' + esc(v.empresa) : ''} · ${fecha(v.updated_at || v.created_at)}</span></div>
        ${estrellas(v.estrellas)}<span class="chev-rot">${ico('chev', 16, '#A39A93', 2.2)}</span></button>
      <div class="val-det" ${ab ? '' : 'hidden'}>
        ${v.comentario ? `<div>${esc(v.comentario)}</div>` : '<div style="color:var(--sec)">Sin comentario.</div>'}
        ${puedo ? `<div><button class="btn-texto btn-peligro" style="padding:0;font-size:14px" data-borrar-val="${v.id}">Borrar valoración</button></div>` : ''}
      </div></div>`;
  }

  /* --- Contactos, compartir --- */
  function vcfDe(p) {
    const l = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
    const persona = (p.personas || '').split(/\s*[\/;,]\s*/)[0] || '';
    const v = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${l(persona ? persona + ' (' + p.nombre + ')' : p.nombre)}`, `N:${l(persona || p.nombre)};;;;`, `ORG:${l(p.nombre)}`];
    if (p._ofs.length) v.push(`TITLE:${l(p._ofs.map((o) => o.nombre).join(', '))}`);
    partes(p.moviles).forEach((t) => v.push(`TEL;TYPE=CELL:${telLink(t)}`));
    partes(p.fijos).forEach((t) => v.push(`TEL;TYPE=WORK:${telLink(t)}`));
    partes(p.emails).forEach((m) => v.push(`EMAIL;TYPE=WORK:${l(m)}`));
    if (p.web) v.push(`URL:${l(p.web)}`);
    if (p.poblacion || p.provincia) v.push(`ADR;TYPE=WORK:;;;${l(p.poblacion)};${l(p.provincia)};;España`);
    v.push(`NOTE:${l('Proveedor de Contacta' + (p.personas ? ' · Contacto: ' + p.personas : ''))}`, 'END:VCARD');
    return v.join('\r\n');
  }
  const archivoVcf = (p) => new File([vcfDe(p)], (p.nombre.replace(/[^\w\- ]+/g, '').trim() || 'proveedor') + '.vcf', { type: 'text/vcard' });
  function descargarVcf(p) {
    const f = archivoVcf(p); const url = URL.createObjectURL(f);
    const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    aviso('Abre el archivo para guardarlo en tus contactos');
  }
  function textoFicha(p) {
    const t = [p.nombre];
    if (p._ofs.length) t.push(p._ofs.map((o) => o.nombre).join(', '));
    if (p.personas) t.push('Contacto: ' + p.personas);
    [...partes(p.moviles), ...partes(p.fijos)].forEach((x) => t.push('Tel: ' + telBonito(x)));
    partes(p.emails).forEach((x) => t.push('Email: ' + x));
    if (p.web) t.push('Web: ' + p.web);
    if (p.poblacion || p.provincia) t.push([p.poblacion, p.provincia].filter(Boolean).join(', '));
    return t.join('\n');
  }
  async function compartir(p) {
    const texto = textoFicha(p);
    if (navigator.share) {
      try {
        const f = archivoVcf(p);
        if (navigator.canShare && navigator.canShare({ files: [f] })) await navigator.share({ title: p.nombre, text: texto, files: [f] });
        else await navigator.share({ title: p.nombre, text: texto });
        return;
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra"><span></span><div class="hoja-titulo">Compartir</div><button class="btn-texto" data-c>Cerrar</button></div>
      <div class="tarjeta" style="margin-top:10px"><div class="texto-bloque">${esc(texto)}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 20px 0">
        <button class="btn-blanco" id="sh-copiar">${ico('copiar', 18, '#575049')}Copiar</button>
        <a class="btn-blanco" href="mailto:?subject=${encodeURIComponent('Proveedor: ' + p.nombre)}&body=${encodeURIComponent(texto)}">${ico('correo', 18, '#575049')}Enviar por correo</a>
      </div>`, (h) => {
      h.querySelector('[data-c]').onclick = cerrarHoja;
      h.querySelector('#sh-copiar').onclick = async (e) => { if (await copiarTexto(texto)) marcarCopiado(e.currentTarget, true); };
    });
  }

  /* --- Valorar --- */
  function hojaValorar(p, mia) {
    let n = mia ? mia.estrellas : 0;
    const obras = [...new Set(D.vals.map((v) => (v.obra || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    abrirHoja(`<div class="hoja-asa"></div>
      <div class="hoja-barra"><button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Valorar</div><button class="btn-texto fuerte" id="v-pub" disabled>Publicar</button></div>
      <div style="text-align:center;padding:8px 20px 0;font-size:15px;color:var(--sec)">${esc(p.nombre)}</div>
      <div class="selector-estrellas" role="radiogroup" aria-label="Estrellas">${[1, 2, 3, 4, 5].map((k) => `<button data-n="${k}" aria-label="${k} estrella${k > 1 ? 's' : ''}">${estrella('#E6E1DC', 34)}</button>`).join('')}</div>
      <div class="form-grupo">
        <div class="campo"><label for="v-obra">Obra</label><input id="v-obra" list="obras-dl" placeholder="Opcional" maxlength="120" value="${esc(mia ? mia.obra || '' : '')}"></div>
        <div class="campo col"><label for="v-com">Comentario</label><textarea id="v-com" rows="3" maxlength="500" placeholder="¿Qué tal fue? Calidad, plazos, precio…">${esc(mia ? mia.comentario || '' : '')}</textarea></div>
      </div>
      <datalist id="obras-dl">${obras.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>
      <div class="ayuda">Valora el trabajo de la empresa, no a personas. Se publica con tu nombre (${esc(yo ? yo.nombre : '')}) y la fecha de hoy.</div>`, (h) => {
      const pub = h.querySelector('#v-pub');
      const pintarE = () => { h.querySelectorAll('[data-n]').forEach((b) => { b.innerHTML = estrella(Number(b.dataset.n) <= n ? '#E8A317' : '#E6E1DC', 34); }); pub.disabled = !n; };
      h.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { n = Number(b.dataset.n); pintarE(); });
      pintarE();
      h.querySelector('[data-c]').onclick = cerrarHoja;
      pub.onclick = async () => {
        if (!enLinea()) return aviso('Sin conexión', false);
        pub.disabled = true;
        const fila = { proveedor_id: p.id, usuario_id: sesion.user.id, estrellas: n, obra: h.querySelector('#v-obra').value.trim() || null, comentario: h.querySelector('#v-com').value.trim() || null };
        const { error } = mia ? await sb.from('valoraciones').update({ estrellas: fila.estrellas, obra: fila.obra, comentario: fila.comentario }).eq('id', mia.id)
          : await sb.from('valoraciones').insert(fila);
        if (error) { pub.disabled = false; return aviso('No se ha podido guardar: ' + error.message, false); }
        cerrarHoja(); aviso('Valoración publicada'); await cargarDatos(); pintar();
      };
    });
  }

  /* --- Eliminar --- */
  async function eliminar(p) {
    const ofs = p._ofs.map((o) => o.nombre);
    abrirHoja(`<div class="hoja-asa"></div>
      <div style="padding:8px 20px 0"><div class="hoja-titulo" style="text-align:left;font-size:20px">¿Eliminar ${esc(p.nombre)}?</div></div>
      <p>${ofs.length > 1 ? `Aparece en <b>${ofs.length} oficios</b>: ${esc(ofs.join(', '))}. Se eliminará de todos.` : `Aparece en ${esc(ofs[0] || 'ningún oficio')}.`}
        Si solo quieres quitarle un oficio, usa «Editar».</p>
      <div class="form-grupo"><div class="campo"><label for="e-mot">Motivo</label><select id="e-mot">
        <option>Ha cerrado</option><option>Se ha jubilado</option><option>El teléfono no existe</option><option>Duplicado</option><option>No es un proveedor</option><option>Otro</option></select></div></div>
      <div class="ayuda">Quedará 30 días en la papelera y cualquiera podrá recuperarlo.</div>
      <div style="display:flex;gap:8px;padding:14px 20px 0"><button class="btn-blanco" data-c>Cancelar</button><button class="btn-lleno ancho" id="e-ok" style="background:#B4151B">Eliminar</button></div>`, (h) => {
      h.querySelector('[data-c]').onclick = cerrarHoja;
      h.querySelector('#e-ok').onclick = async () => {
        if (!enLinea()) return aviso('Sin conexión', false);
        const { error } = await sb.from('proveedores').update({ eliminado_en: new Date().toISOString(), motivo_eliminacion: h.querySelector('#e-mot').value }).eq('id', p.id);
        if (error) return aviso('No se ha podido eliminar: ' + error.message, false);
        cerrarHoja(); aviso('Movido a la papelera'); await cargarDatos(); ir('#/');
      };
    });
  }

  /* ---------------- Alta y edición ---------------- */
  const GENERICOS = new Set(['gmail.com', 'hotmail.com', 'hotmail.es', 'yahoo.es', 'yahoo.com', 'outlook.com', 'outlook.es', 'live.com', 'icloud.com', 'telefonica.net', 'movistar.es', 'terra.es', 'msn.com', 'gmx.es', 'orange.es', 'ono.com']);
  function pintarFormulario(el, p) {
    if (p === undefined) { el.innerHTML = '<div class="vacio"><h2>No existe</h2></div>'; return; }
    const editar = !!p;
    const st = { ofs: editar ? p._ofs.map((o) => o.id) : [], estrellas: 0 };
    const v = (k) => esc(editar ? p[k] || '' : '');
    el.innerHTML = `
      <form id="f-prov" novalidate>
      <div class="barra-nav"><a class="btn-texto" href="${editar ? '#/p/' + p.id : '#/'}">Cancelar</a><div class="hoja-titulo">${editar ? 'Editar proveedor' : 'Nuevo proveedor'}</div><button class="btn-texto fuerte" type="submit" id="g-btn">Guardar</button></div>
      ${editar ? '' : `<div class="etiqueta-sec" style="padding:14px 36px 6px">Rellenar automáticamente</div>
      <div class="relleno"><button type="button" class="btn-blanco" id="b-pegar">${ico('pegar', 18, '#575049')}Pegar texto o imagen</button>
        <button type="button" class="btn-blanco" id="b-foto">${ico('camara', 18, '#575049')}Pantallazo</button>
        <input type="file" id="b-foto-in" accept="image/*" hidden></div>
      <div class="ayuda">Pega un mensaje de WhatsApp, una firma de correo o una tarjeta, o sube un pantallazo, y la IA rellena los datos. Revísalos antes de guardar.</div>`}
      <div class="etiqueta-sec" style="padding:18px 36px 6px">Datos</div>
      <div class="form-grupo">
        <div class="campo"><label for="c-nombre" class="oblig">Nombre</label><input id="c-nombre" required maxlength="160" placeholder="Empresa" value="${v('nombre')}"></div>
        <div class="chips-oficio" id="chips"></div>
        <div class="campo"><label for="c-moviles" class="${editar ? '' : 'oblig'}">Móvil</label><input id="c-moviles" type="tel" inputmode="tel" placeholder="600 000 000" value="${esc(editar ? partes(p.moviles).map(telBonito).join('; ') : '')}"></div>
        <div class="campo"><label for="c-fijos">Fijo</label><input id="c-fijos" type="tel" inputmode="tel" placeholder="930 000 000" value="${esc(editar ? partes(p.fijos).map(telBonito).join('; ') : '')}"></div>
        <div class="campo"><label for="c-personas">Contacto</label><input id="c-personas" placeholder="Persona de contacto" value="${v('personas')}"></div>
        <div class="campo"><label for="c-emails">Correo</label><input id="c-emails" type="email" inputmode="email" placeholder="correo@empresa.com" value="${v('emails')}"></div>
      </div>
      <div class="ayuda">Puedes poner varios teléfonos o correos separados por «;».</div>
      <div class="etiqueta-sec" style="padding:18px 36px 6px">Más datos</div>
      <div class="form-grupo">
        <div class="campo"><label for="c-web">Web</label><input id="c-web" inputmode="url" placeholder="www.empresa.com" value="${v('web')}"></div>
        <div class="campo"><label for="c-poblacion">Población</label><input id="c-poblacion" value="${v('poblacion')}"></div>
        <div class="campo"><label for="c-provincia">Provincia</label><input id="c-provincia" value="${v('provincia')}"></div>
        <div class="campo"><label for="c-cif">CIF</label><input id="c-cif" maxlength="12" value="${v('cif')}"></div>
        <div class="campo"><label for="c-rec">Recomendado</label><input id="c-rec" placeholder="¿Quién lo recomienda?" value="${v('recomendado_por')}"></div>
        <div class="campo col"><label for="c-notas">Notas</label><textarea id="c-notas" rows="3" placeholder="Observaciones para el equipo">${v('notas')}</textarea></div>
        ${editar ? `<div class="campo"><label for="c-estado">Estado</label><select id="c-estado"><option value="activo" ${p.estado === 'activo' ? 'selected' : ''}>Activa</option><option value="inactivo" ${p.estado === 'inactivo' ? 'selected' : ''}>Cerrada</option></select></div>` : ''}
      </div>
      ${editar ? '' : `<div class="etiqueta-sec" style="padding:18px 36px 6px">¿Has trabajado con él?</div>
      <div class="tarjeta" style="padding:4px 0 10px"><div class="selector-estrellas" id="alta-est">${[1, 2, 3, 4, 5].map((k) => `<button type="button" data-n="${k}" aria-label="${k} estrellas">${estrella('#E6E1DC', 32)}</button>`).join('')}</div>
        <div id="alta-obra" hidden><div class="campo" style="border-top:.5px solid var(--linea)"><label for="c-obra">Obra</label><input id="c-obra" placeholder="Opcional"></div>
        <div class="ayuda" style="padding:6px 16px 0">Contará como tu valoración. Valora el trabajo de la empresa, no a personas.</div></div></div>`}
      <div id="f-error" class="error-txt" hidden></div>
      ${editar ? '' : `<div class="ayuda" style="padding-top:18px">Lo verá todo el equipo de Bosch Pascual, RECOP y Munné.</div>`}
      <div style="padding:18px 20px 0"><button class="btn-lleno ancho" type="submit">Guardar</button></div>
      </form><div style="height:40px"></div>`;
    const pintarChips = () => {
      const c = el.querySelector('#chips');
      c.innerHTML = `<span class="oblig" style="font-size:16px;margin-right:6px">Oficio</span>` + st.ofs.map((id) => {
        const o = IDX.of.get(id); return o ? `<span class="chip-of">${esc(o.nombre)}<button type="button" data-q="${id}" aria-label="Quitar ${esc(o.nombre)}">${ico('x', 12, '#736A63', 2.6)}</button></span>` : '';
      }).join('') + `<button type="button" class="chip" id="add-of">${ico('mas', 14, '#575049', 2.4)}${st.ofs.length ? 'Otro' : 'Elegir oficio'}</button>`;
      c.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { st.ofs = st.ofs.filter((x) => x !== Number(b.dataset.q)); pintarChips(); });
      c.querySelector('#add-of').onclick = () => hojaOficio((id) => { if (!st.ofs.includes(id)) st.ofs.push(id); pintarChips(); });
    };
    pintarChips();
    if (!editar) {
      // Rellena solo los campos vacíos y añade el oficio sugerido.
      const aplicar = (d) => {
        const pon = (id, val) => { const i = el.querySelector('#' + id); if (val && i && !i.value.trim()) i.value = val; };
        const tels = (l) => (l || []).map((x) => tel9(x)).filter((x) => x.length === 9).map(telBonito).join('; ');
        pon('c-nombre', d.nombre); pon('c-moviles', tels(d.moviles)); pon('c-fijos', tels(d.fijos));
        pon('c-personas', (d.personas || []).join('; ') || d.persona); pon('c-emails', (d.emails || []).join('; '));
        pon('c-web', d.web); pon('c-cif', d.cif); pon('c-poblacion', d.poblacion); pon('c-provincia', d.provincia); pon('c-notas', d.notas);
        let ofTxt = '';
        if (d.oficio) {
          const o = oficiosVivos().find((x) => x.nombre.toLowerCase() === String(d.oficio).toLowerCase());
          if (o && !st.ofs.includes(o.id)) { st.ofs.push(o.id); pintarChips(); }
          if (o) ofTxt = ' Oficio sugerido: ' + o.nombre + '.';
        }
        aviso('Datos rellenados.' + (ofTxt || ' Elige el oficio.') + ' Revísalos antes de guardar.');
      };
      el.querySelector('#b-pegar').onclick = () => hojaPegar(aplicar);
      const fIn = el.querySelector('#b-foto-in');
      el.querySelector('#b-foto').onclick = () => { if (!enLinea()) return aviso('Sin conexión: el pantallazo necesita internet.', false); fIn.click(); };
      fIn.onchange = async () => { const f = fIn.files[0]; fIn.value = ''; if (f) await leerConIA({ archivo: f }, aplicar); };
      const pintarE = () => { el.querySelectorAll('#alta-est [data-n]').forEach((b) => { b.innerHTML = estrella(Number(b.dataset.n) <= st.estrellas ? '#E8A317' : '#E6E1DC', 32); }); el.querySelector('#alta-obra').hidden = !st.estrellas; };
      el.querySelectorAll('#alta-est [data-n]').forEach((b) => b.onclick = () => { const k = Number(b.dataset.n); st.estrellas = st.estrellas === k ? 0 : k; pintarE(); });
    }
    el.querySelector('#f-prov').onsubmit = async (ev) => {
      ev.preventDefault();
      const g = (id) => el.querySelector('#' + id).value.trim();
      const err = (t) => { const e = el.querySelector('#f-error'); e.textContent = t; e.hidden = !t; if (t) e.scrollIntoView({ block: 'center' }); };
      const normT = (s) => partes(s.replace(/,|\//g, ';')).map(telBonito).join('; ') || null;
      const fila = {
        nombre: g('c-nombre'), moviles: normT(g('c-moviles')), fijos: normT(g('c-fijos')), personas: g('c-personas') || null,
        emails: partes(g('c-emails').replace(/,|\s+/g, ';')).map((x) => x.toLowerCase()).join('; ') || null,
        web: g('c-web') || null, poblacion: g('c-poblacion') || null, provincia: g('c-provincia') || null,
        cif: g('c-cif').toUpperCase().replace(/[\s.-]/g, '') || null, recomendado_por: g('c-rec') || null, notas: g('c-notas') || null
      };
      if (editar) fila.estado = el.querySelector('#c-estado').value;
      if (!fila.nombre) return err('Falta el nombre.');
      if (!st.ofs.length) return err('Elige al menos un oficio.');
      if (!editar && !fila.moviles && !fila.fijos) return err('Pon al menos un teléfono.');
      if (!enLinea()) return err('Sin conexión: no se puede guardar ahora.');
      const btns = el.querySelectorAll('[type=submit]'); btns.forEach((b) => { b.disabled = true; });
      try {
        if (editar) {
          const { error } = await sb.from('proveedores').update(fila).eq('id', p.id); if (error) throw error;
          const antes = p._ofs.map((o) => o.id);
          const quitar = antes.filter((x) => !st.ofs.includes(x)); const poner = st.ofs.filter((x) => !antes.includes(x));
          if (quitar.length) { const r = await sb.from('proveedor_oficios').delete().eq('proveedor_id', p.id).in('oficio_id', quitar); if (r.error) throw r.error; }
          if (poner.length) { const r = await sb.from('proveedor_oficios').insert(poner.map((o) => ({ proveedor_id: p.id, oficio_id: o }))); if (r.error) throw r.error; }
          aviso('Cambios guardados'); await cargarDatos(); ir('#/p/' + p.id);
        } else {
          const dups = posiblesDuplicados(fila);
          if (dups.length) {
            const decision = await hojaDuplicados(dups);
            if (decision === 'cancelar') { btns.forEach((b) => { b.disabled = false; }); return; }
            if (decision !== 'crear') { btns.forEach((b) => { b.disabled = false; }); return; }
            fila.revisar_duplicado = true;
          }
          const { data, error } = await sb.from('proveedores').insert(fila).select('id').single(); if (error) throw error;
          const r = await sb.from('proveedor_oficios').insert(st.ofs.map((o) => ({ proveedor_id: data.id, oficio_id: o }))); if (r.error) throw r.error;
          if (st.estrellas) await sb.from('valoraciones').insert({ proveedor_id: data.id, usuario_id: sesion.user.id, estrellas: st.estrellas, obra: (el.querySelector('#c-obra').value.trim() || null) });
          aviso('Proveedor añadido'); await cargarDatos(); ir('#/p/' + data.id);
        }
      } catch (e) { err('No se ha podido guardar: ' + (e.message || e)); btns.forEach((b) => { b.disabled = false; }); }
    };
  }
  function posiblesDuplicados(f) {
    const tels = [...partes(f.moviles), ...partes(f.fijos)].map(tel9).filter((t) => t.length === 9);
    const mails = partes(f.emails); const dominios = mails.map((m) => m.split('@')[1]).filter((d) => d && !GENERICOS.has(d));
    const wn = palabras(f.nombre).join(' ');
    return D.prov.filter((p) => {
      if (tels.some((t) => p._tels.includes(t))) return true;
      const pm = partes(p.emails).map((x) => x.toLowerCase());
      if (mails.some((m) => pm.includes(m))) return true;
      if (dominios.length && pm.some((m) => dominios.includes(m.split('@')[1]))) return true;
      if (f.cif && p.cif && f.cif === p.cif.replace(/[\s.-]/g, '').toUpperCase()) return true;
      const pn = p._wNombre.join(' ');
      return wn.length >= 4 && (pn === wn || (wn.length >= 6 && (pn.includes(wn) || wn.includes(pn) && pn.length >= 6)));
    }).slice(0, 6);
  }
  function hojaDuplicados(dups) {
    return new Promise((res) => {
      abrirHoja(`<div class="hoja-asa"></div><div style="padding:8px 20px 0"><div class="hoja-titulo" style="text-align:left;font-size:20px">¿Es alguno de estos?</div></div>
        <p>Ya hay proveedores con el mismo teléfono, correo o un nombre parecido.</p>
        <div class="tarjeta">${dups.map((p) => `<div class="fila"><div class="fila-txt"><div class="fila-nombre">${esc(p.nombre)}</div>
          <div class="fila-meta">${esc(p._ofs.map((o) => o.nombre).join(', '))}${p.eliminado_en ? ' · <b>En la papelera</b>' : ''}</div></div>
          ${p.eliminado_en ? `<button class="chip" data-rest="${p.id}">Restaurar</button>` : `<button class="chip" data-ver="${p.id}">Es este</button>`}</div>`).join('')}</div>
        <div style="display:flex;gap:8px;padding:14px 20px 0"><button class="btn-blanco" data-r="cancelar">Volver</button><button class="btn-lleno ancho" data-r="crear">No, crear nuevo</button></div>
        <div class="ayuda">Si lo creas igualmente, el administrador lo revisará.</div>`, (h) => {
        h.querySelectorAll('[data-r]').forEach((b) => b.onclick = () => { cerrarHoja(); res(b.dataset.r); });
        h.querySelectorAll('[data-ver]').forEach((b) => b.onclick = () => { cerrarHoja(); res('ver'); ir('#/p/' + b.dataset.ver); });
        h.querySelectorAll('[data-rest]').forEach((b) => b.onclick = async () => { cerrarHoja(); res('ver'); await restaurar(Number(b.dataset.rest)); ir('#/p/' + b.dataset.rest); });
      });
      capa.onclick = (e) => { if (e.target === capa) { cerrarHoja(); res('cancelar'); } };
    });
  }

  // Elegir oficio: buscador + rueda en dos niveles (familia → oficio) + crear nuevo.
  function hojaOficio(alElegir) {
    const fams = familiasOrden(); let nivel = 'fam'; let fi = 0; let oi = 0;
    const pintarH = (h) => {
      const cuerpo = h.querySelector('#ho-cuerpo'); const q = h.querySelector('#ho-q').value.trim();
      const bar = h.querySelector('#ho-bar');
      if (q) {
        const nq = palabras(q);
        const res = oficiosVivos().map((o) => ({ o, s: nq.reduce((s, t) => s + Math.max(puntuaToken(t, palabras(o.nombre)) * 2, puntuaToken(t, palabras((o.sinonimos || []).join(' ')))), 0), ok: nq.every((t) => puntuaToken(t, palabras(o.nombre + ' ' + (o.sinonimos || []).join(' ')))) }))
          .filter((x) => x.ok).sort((a, b) => b.s - a.s).slice(0, 12);
        bar.innerHTML = `<button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Oficio</div><span></span>`;
        cuerpo.innerHTML = `<div class="tarjeta" style="margin-top:8px">${res.map((x) => `<div class="fila"><button class="fila-enlace" data-of="${x.o.id}"><div class="fila-txt"><div class="fila-nombre">${esc(x.o.nombre)}</div><div class="fila-meta">${esc((IDX.fam.get(x.o.familia_id) || {}).nombre || '')}</div></div></button></div>`).join('') || '<div class="texto-bloque" style="color:var(--sec)">Ningún oficio coincide.</div>'}</div>
          <div style="margin:10px 20px 0"><button class="btn-blanco" id="ho-nuevo">${ico('mas', 18, '#575049')}Añadir oficio nuevo: «${esc(q)}»</button></div>`;
        cuerpo.querySelectorAll('[data-of]').forEach((b) => b.onclick = () => { cerrarHoja(); alElegir(Number(b.dataset.of)); });
        cuerpo.querySelector('#ho-nuevo').onclick = () => crearOficio(q, fams[fi]);
      } else if (nivel === 'fam') {
        bar.innerHTML = `<button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Familia</div><button class="btn-texto fuerte" id="ho-sig">Siguiente</button>`;
        cuerpo.innerHTML = '<div id="ho-rueda"></div>';
        montarRueda(cuerpo.querySelector('#ho-rueda'), fams.map((f) => ({ label: f.nombre, icon: icoFam(f.nombre, 20, '#575049'), chev: true })), fi, true, (i) => { fi = i; }, (i) => { fi = i; nivel = 'of'; oi = 0; pintarH(h); });
        bar.querySelector('#ho-sig').onclick = () => { nivel = 'of'; oi = 0; pintarH(h); };
      } else {
        const ofs = oficiosDeFam(fams[fi].id);
        bar.innerHTML = `<button class="btn-texto" id="ho-atr">${ico('atras', 20, '#575049', 2.2)}Familias</button><div class="hoja-titulo" style="font-size:15px">${esc(fams[fi].nombre)}</div><button class="btn-texto fuerte" id="ho-ok">Hecho</button>`;
        cuerpo.innerHTML = '<div id="ho-rueda"></div><div style="margin:4px 20px 0"><button class="btn-texto" id="ho-nuevo2" style="font-size:15px">¿No está? Añadir oficio nuevo</button></div>';
        montarRueda(cuerpo.querySelector('#ho-rueda'), ofs.map((o) => ({ label: o.nombre, icon: icoFam(fams[fi].nombre, 20, '#575049') })), oi, ofs.length >= 6, (i) => { oi = i; }, (i) => { cerrarHoja(); alElegir(ofs[i].id); });
        bar.querySelector('#ho-atr').onclick = () => { nivel = 'fam'; pintarH(h); };
        bar.querySelector('#ho-ok').onclick = () => { cerrarHoja(); if (ofs[oi]) alElegir(ofs[oi].id); };
        cuerpo.querySelector('#ho-nuevo2').onclick = () => { h.querySelector('#ho-q').focus(); aviso('Escribe el nombre del oficio arriba', false); };
      }
      const c = bar.querySelector('[data-c]'); if (c) c.onclick = cerrarHoja;
    };
    const crearOficio = async (nombre, famDef) => {
      const opciones = fams.map((f, i) => `<option value="${f.id}" ${f === famDef ? 'selected' : ''}>${esc(f.nombre)}</option>`).join('');
      abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra"><button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Oficio nuevo</div><button class="btn-texto fuerte" id="on-ok">Crear</button></div>
        <div class="form-grupo" style="margin-top:12px"><div class="campo"><label for="on-n">Nombre</label><input id="on-n" value="${esc(nombre.charAt(0).toUpperCase() + nombre.slice(1))}"></div>
        <div class="campo"><label for="on-f">Familia</label><select id="on-f">${opciones}</select></div></div>
        <div class="ayuda">El administrador lo revisará. Antes, comprueba que no exista con otro nombre.</div>`, (h2) => {
        h2.querySelector('[data-c]').onclick = cerrarHoja;
        h2.querySelector('#on-ok').onclick = async () => {
          const n = h2.querySelector('#on-n').value.trim(); if (!n) return;
          if (!enLinea()) return aviso('Sin conexión', false);
          const { data, error } = await sb.from('oficios').insert({ nombre: n, familia_id: Number(h2.querySelector('#on-f').value) }).select('id').single();
          if (error) return aviso(/duplicate|unique/i.test(error.message) ? 'Ese oficio ya existe' : 'No se ha podido crear: ' + error.message, false);
          await cargarDatos(); cerrarHoja(); alElegir(data.id); aviso('Oficio creado');
        };
      });
    };
    abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra" id="ho-bar"></div>
      <div class="buscador" style="padding:10px 20px 4px"><div class="caja-busca">${ico('buscar', 17, '#736A63', 2.2)}<label for="ho-q" class="oculto-vis">Buscar oficio</label><input id="ho-q" type="text" placeholder="Buscar oficio (manyà, lampista…)" autocomplete="off"></div></div>
      <div id="ho-cuerpo"></div>`, (h) => {
      h.querySelector('#ho-q').oninput = debounce(() => pintarH(h), 120);
      pintarH(h);
    });
  }

  // «Pegar texto»: la IA separa los datos; sin conexión o si falla, se hace sin IA.
  // En ordenador también se puede pegar aquí una imagen (Ctrl+V) y se lee como pantallazo.
  function hojaPegar(aplicar) {
    abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra"><button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Pegar texto o imagen</div><button class="btn-texto fuerte" id="pg-ok">Rellenar</button></div>
      <div class="form-grupo" style="margin-top:12px"><div class="campo col"><label for="pg-t">Texto</label><textarea id="pg-t" rows="7" placeholder="Pega aquí un mensaje, una firma de correo, una tarjeta de contacto… o una imagen" autofocus></textarea></div></div>
      <div class="ayuda">Lo lee la IA. Solo se envía lo que pegues aquí.</div>`, (h) => {
      h.querySelector('[data-c]').onclick = cerrarHoja;
      h.querySelector('#pg-t').addEventListener('paste', (e) => {
        const it = [...(e.clipboardData && e.clipboardData.items || [])].find((x) => x.type.startsWith('image/'));
        if (!it) return;
        e.preventDefault(); const f = it.getAsFile(); cerrarHoja(); leerConIA({ archivo: f }, aplicar);
      });
      h.querySelector('#pg-ok').onclick = async () => {
        const t = h.querySelector('#pg-t').value.trim(); if (!t) return;
        cerrarHoja();
        if (!enLinea()) { aplicar(sinIA(t)); return; }
        await leerConIA({ texto: t }, aplicar);
      };
    });
  }
  function sinIA(t) { const d = analizarTexto(t); return { ...d, personas: d.persona ? [d.persona] : [] }; }

  // Reduce la imagen (lado mayor 1568 px, JPEG) para que pese poco y salga barato.
  function imagenAJpeg(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file); const img = new Image();
      img.onload = () => {
        const k = Math.min(1, 1568 / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('No se puede abrir la imagen')); };
      img.src = url;
    });
  }

  // Llama a la función «leer-proveedor» de Supabase (la clave de la IA nunca está en la web).
  async function leerConIA({ texto, archivo }, aplicar) {
    abrirHoja(`<div class="hoja-asa"></div><div class="ia-cargando"><div class="ia-puntos"><span></span><span></span><span></span></div>
      <div class="hoja-titulo">Leyendo ${archivo ? 'el pantallazo' : 'el texto'}…</div><div class="ayuda" style="padding:6px 0 0">Unos segundos.</div></div>`);
    capa.onclick = null;
    try {
      const cuerpo = texto ? { texto } : { imagen: await imagenAJpeg(archivo), tipo: 'image/jpeg' };
      const { data, error } = await sb.functions.invoke('leer-proveedor', { body: cuerpo });
      if (error) {
        let msg = '';
        try { msg = (await error.context.json()).error; } catch (_) { /* sin cuerpo */ }
        throw new Error(msg || 'La IA no ha podido leerlo ahora.');
      }
      cerrarHoja(); aplicar(data.datos || {});
      if (data.quedan !== undefined && data.quedan <= 5) setTimeout(() => aviso(`Te quedan ${data.quedan} lecturas con IA hoy.`, false), 2400);
    } catch (e) {
      cerrarHoja();
      if (texto) { aplicar(sinIA(texto)); setTimeout(() => aviso((e.message || 'La IA no responde.') + ' Se ha rellenado sin IA.', false), 2400); }
      else aviso(e.message || 'No se ha podido leer el pantallazo.', false);
    }
  }
  function analizarTexto(t) {
    t = String(t || '');
    const out = { nombre: '', persona: '', moviles: [], fijos: [], emails: [], web: '', cif: '' };
    const vc = /BEGIN:VCARD/i.test(t);
    if (vc) {
      const get = (k) => (t.match(new RegExp('^' + k + '[^:]*:(.*)$', 'im')) || [])[1] || '';
      out.nombre = get('ORG').split(';')[0].trim(); out.persona = get('FN').trim();
    }
    out.emails = [...new Set((t.match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g) || []).map((x) => x.toLowerCase()))];
    const tels = t.match(/(\+?34[\s.-]?)?(\d[\s.-]?){8}\d/g) || [];
    tels.forEach((x) => { const d = tel9(x); if (d.length !== 9) return; const b = telBonito(d); if (/^[67]/.test(d)) { if (!out.moviles.includes(b)) out.moviles.push(b); } else if (/^[89]/.test(d) && !out.fijos.includes(b)) out.fijos.push(b); });
    const w = t.match(/\b(?:https?:\/\/)?(?:www\.)[\w-]+(\.[\w-]+)+[^\s]*/i) || t.match(/https?:\/\/[^\s]+/i);
    if (w) out.web = w[0].replace(/[.,;)]+$/, '');
    else if (out.emails[0]) { const dom = out.emails[0].split('@')[1]; if (!GENERICOS.has(dom)) out.web = 'www.' + dom; }
    const c = t.toUpperCase().match(/\b[ABCDEFGHJNPQRSUVW]-?\d{7}[0-9A-J]\b/); if (c) out.cif = c[0].replace('-', '');
    if (!out.nombre) {
      const lineas = t.split(/\n/).map((l) => l.replace(/^[\s*_~>\-–•]+|[\s*_~]+$/g, '').trim()).filter((l) => l && !/@|https?:|www\.|\d{3}/.test(l) && l.length < 70);
      const empresa = lineas.find((l) => /\b(s\.?l\.?u?|s\.?a\.?|sl|sa|slu|construc|instal|serveis|servicios|grup|group|hnos|germans)\b/i.test(l));
      out.nombre = empresa || lineas[0] || '';
      if (!out.persona) { const otra = lineas.find((l) => l !== out.nombre && /^[A-ZÁÉÍÓÚÑÇ][a-záéíóúñç]+(\s[A-ZÁÉÍÓÚÑÇ][a-záéíóúñç]+){1,3}$/.test(l)); if (otra) out.persona = otra; }
    }
    return out;
  }

  /* ---------------- Papelera ---------------- */
  async function restaurar(id) {
    if (!enLinea()) return aviso('Sin conexión', false);
    const { error } = await sb.from('proveedores').update({ eliminado_en: null }).eq('id', id);
    if (error) return aviso('No se ha podido restaurar: ' + error.message, false);
    aviso('Restaurado'); await cargarDatos();
  }
  function pintarPapelera(el) {
    const l = D.prov.filter((p) => p.eliminado_en).sort((a, b) => b.eliminado_en.localeCompare(a.eliminado_en));
    el.innerHTML = `<div class="barra-nav"><a class="btn-texto" href="#/">${ico('atras', 22, '#575049', 2.2)}Contacta</a></div>
      <div style="padding:4px 20px 12px"><h1 class="titulo">Papelera</h1><div style="color:var(--sec);margin-top:6px;font-size:15px;line-height:1.4">Proveedores eliminados en los últimos 30 días. Cualquiera puede restaurarlos; después, solo el administrador.</div></div>
      ${l.length ? `<div class="tarjeta">${l.map((p) => {
        const dias = DIAS_PAPELERA - Math.floor((Date.now() - new Date(p.eliminado_en)) / 864e5);
        return `<div class="fila"><div class="ico-caja" style="opacity:.6">${icoFam(p._fam, 20, '#575049')}</div><div class="fila-txt">
          <div class="fila-nombre">${esc(p.nombre)}</div>
          <div class="fila-meta" style="white-space:normal;flex-wrap:wrap">${esc(nombreUsuario(p.eliminado_por))} · ${hace(p.eliminado_en)}${p.motivo_eliminacion ? ' · ' + esc(p.motivo_eliminacion) : ''}
            <span class="pastilla" style="${dias <= 5 ? 'background:#FBE3E1;color:#9C1C1C' : 'background:var(--suave)'}">${dias > 0 ? `Quedan ${dias} días` : 'Solo administrador'}</span></div></div>
          <div style="display:flex;flex-direction:column;gap:4px"><button class="chip" data-rest="${p.id}">${ico('restaurar', 14, '#575049', 2)}Restaurar</button>
          ${esAdmin() ? `<button class="chip btn-peligro" data-borrar="${p.id}">Borrar</button>` : ''}</div></div>`;
      }).join('')}</div>` : `<div class="vacio">${ico('papelera', 40, '#B5ADA6', 1.4)}<p>La papelera está vacía.</p></div>`}
      <div class="ayuda" style="padding-top:12px">Al restaurar, la ficha vuelve con sus oficios y valoraciones.</div>`;
    el.querySelectorAll('[data-rest]').forEach((b) => b.onclick = async () => { await restaurar(Number(b.dataset.rest)); pintar(); });
    el.querySelectorAll('[data-borrar]').forEach((b) => b.onclick = async () => {
      const p = IDX.porId.get(Number(b.dataset.borrar));
      if (!await confirmar(`¿Borrar definitivamente ${p.nombre}?`, 'Se borra para siempre, con sus valoraciones. Queda una copia en el historial.', 'Borrar para siempre', true)) return;
      const { error } = await sb.from('proveedores').delete().eq('id', p.id);
      if (error) return aviso('No se ha podido borrar: ' + error.message, false);
      aviso('Borrado definitivamente'); await cargarDatos(); pintar();
    });
  }

  /* ---------------- Cuenta ---------------- */
  function pintarCuenta(el) {
    el.innerHTML = `<div class="barra-nav"><a class="btn-texto" href="#/">${ico('atras', 22, '#575049', 2.2)}Contacta</a></div>
      <div style="padding:4px 20px 12px"><h1 class="titulo">Mi cuenta</h1></div>
      <div class="tarjeta"><div class="dato"><div class="dato-txt"><span class="k">Correo</span><span class="v">${esc(sesion.user.email)}</span></div></div>
      <div class="dato"><div class="dato-txt"><span class="k">Empresa</span><span class="v">${esc(yo ? yo.empresa : '')}</span></div></div>
      <div class="dato"><div class="dato-txt"><span class="k">Datos descargados</span><span class="v">${D.desde ? hace(D.desde) : '—'} · ${vivos().length} proveedores</span></div></div></div>
      <div style="margin:14px 20px 0;display:flex;flex-direction:column;gap:8px">
        <button class="btn-blanco" id="c-act">${ico('restaurar', 18, '#575049')}Actualizar datos</button>
        <button class="btn-blanco" id="c-pass">Cambiar contraseña</button>
        <button class="btn-blanco btn-peligro" id="c-salir">${ico('salir', 18, '#B4151B')}Cerrar sesión</button></div>
      <div class="pie" style="text-align:center">Contacta ${esc(CFG.version)}</div>`;
    el.querySelector('#c-act').onclick = async () => { if (!enLinea()) return aviso('Sin conexión', false); await cargarDatos(); aviso('Datos actualizados'); pintar(); };
    el.querySelector('#c-pass').onclick = hojaNuevaContrasena;
    el.querySelector('#c-salir').onclick = async () => { await sb.auth.signOut(); location.hash = ''; };
  }

  /* ---------------- Administración ---------------- */
  let pestana = 'avisos';
  async function pintarAdmin(el) {
    const nuevos = D.oficios.filter((o) => o.nuevo && !o.redirige_a);
    const dups = D.prov.filter((p) => p.revisar_duplicado && !p.eliminado_en);
    const semana = D.prov.filter((p) => p.eliminado_en && Date.now() - new Date(p.eliminado_en) < 7 * 864e5);
    el.innerHTML = `<div class="barra-nav"><a class="btn-texto" href="#/">${ico('atras', 22, '#575049', 2.2)}Contacta</a><span></span><a class="btn-texto" href="#/cuenta">Mi cuenta</a></div>
      <div style="padding:4px 20px 12px"><h1 class="titulo">Administración</h1></div>
      <div class="pestanas" role="tablist">${[['avisos', 'Revisar'], ['usuarios', 'Usuarios'], ['historial', 'Historial'], ['datos', 'Datos']].map(([k, t]) => `<button role="tab" class="${pestana === k ? 'on' : ''}" data-t="${k}">${t}</button>`).join('')}</div>
      <div id="adm"></div>`;
    el.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { pestana = b.dataset.t; pintarAdmin(el); });
    const z = el.querySelector('#adm');
    if (pestana === 'avisos') {
      z.innerHTML = `
        <div class="seccion"><span class="etiqueta-sec">Oficios nuevos · ${nuevos.length}</span></div>
        ${nuevos.length ? `<div class="tarjeta">${nuevos.map((o) => `<div class="fila" style="flex-wrap:wrap"><div class="fila-txt"><div class="fila-nombre">${esc(o.nombre)}</div><div class="fila-meta">${esc((IDX.fam.get(o.familia_id) || {}).nombre || '')} · ${esc(nombreUsuario(o.creado_por))}</div></div>
          <button class="chip" data-acep="${o.id}">Aceptar</button><button class="chip" data-fus="${o.id}">Fusionar…</button></div>`).join('')}</div>` : '<div class="ayuda" style="padding-top:0">No hay oficios nuevos.</div>'}
        <div class="seccion"><span class="etiqueta-sec">Posibles duplicados · ${dups.length}</span></div>
        ${dups.length ? `<div class="tarjeta">${dups.map((p) => `<div class="fila"><button class="fila-enlace" data-abrir="${p.id}"><div class="fila-txt"><div class="fila-nombre">${esc(p.nombre)}</div><div class="fila-meta">Creado por ${esc(nombreUsuario(p.creado_por))} · ${hace(p.created_at)}</div></div></button><button class="chip" data-rev="${p.id}">Revisado</button></div>`).join('')}</div>` : '<div class="ayuda" style="padding-top:0">Ninguno pendiente.</div>'}
        <div class="seccion"><span class="etiqueta-sec">Eliminados esta semana · ${semana.length}</span><a href="#/papelera" style="font-size:15px;font-weight:600">Papelera</a></div>
        ${semana.length ? `<div class="tarjeta">${semana.map((p) => `<div class="fila"><div class="fila-txt"><div class="fila-nombre">${esc(p.nombre)}</div><div class="fila-meta">${esc(nombreUsuario(p.eliminado_por))} · ${hace(p.eliminado_en)} · ${esc(p.motivo_eliminacion || '')}</div></div></div>`).join('')}</div>` : '<div class="ayuda" style="padding-top:0">Nada eliminado en los últimos 7 días.</div>'}`;
      engancharFilas(z);
      z.querySelectorAll('[data-acep]').forEach((b) => b.onclick = async () => { const { error } = await sb.from('oficios').update({ nuevo: false }).eq('id', Number(b.dataset.acep)); if (error) return aviso(error.message, false); await cargarDatos(); pintarAdmin(el); aviso('Oficio aceptado'); });
      z.querySelectorAll('[data-rev]').forEach((b) => b.onclick = async () => { const { error } = await sb.from('proveedores').update({ revisar_duplicado: false }).eq('id', Number(b.dataset.rev)); if (error) return aviso(error.message, false); await cargarDatos(); pintarAdmin(el); });
      z.querySelectorAll('[data-fus]').forEach((b) => b.onclick = () => fusionarOficio(Number(b.dataset.fus), () => pintarAdmin(el)));
    } else if (pestana === 'usuarios') {
      const us = D.usuarios.slice().sort((a, b) => a.email.localeCompare(b.email));
      z.innerHTML = `<div class="seccion"><span class="etiqueta-sec">${us.length} usuarios</span></div><div class="tarjeta">${us.map((u) => `<div class="fila"><div class="fila-txt"><div class="fila-nombre">${esc(u.nombre)}${u.rol === 'admin' ? ' · admin' : ''}</div><div class="fila-meta">${esc(u.email)} · ${esc(u.empresa)}</div></div>
        ${u.id === sesion.user.id ? '' : `<button class="chip ${u.bloqueado ? 'on' : ''}" data-bloq="${u.id}" data-v="${u.bloqueado ? 0 : 1}">${u.bloqueado ? 'Bloqueado' : 'Bloquear'}</button>`}</div>`).join('')}</div>
        <div class="ayuda">Un usuario bloqueado no puede entrar ni ver nada. Sus valoraciones se conservan.</div>`;
      z.querySelectorAll('[data-bloq]').forEach((b) => b.onclick = async () => {
        const v = b.dataset.v === '1';
        if (v && !await confirmar('¿Bloquear a este usuario?', 'No podrá entrar en Contacta.', 'Bloquear', true)) return;
        const { error } = await sb.from('usuarios').update({ bloqueado: v }).eq('id', b.dataset.bloq);
        if (error) return aviso(error.message, false); await cargarDatos(); pintarAdmin(el);
      });
    } else if (pestana === 'historial') {
      z.innerHTML = '<div class="ayuda">Cargando…</div>';
      const { data, error } = await sb.from('historial').select('*').not('usuario_id', 'is', null).order('created_at', { ascending: false }).limit(150);
      if (error) { z.innerHTML = `<div class="error-txt">${esc(error.message)}</div>`; return; }
      const verbo = { insert: 'añadió', update: 'editó', delete: 'borró', eliminar: 'eliminó', restaurar: 'restauró' };
      const filas = data.filter((h) => h.usuario_id); // los cambios sin usuario son de la importación inicial
      z.innerHTML = `<div class="seccion"><span class="etiqueta-sec">Últimos cambios</span></div><div class="tarjeta">${filas.map((h) => {
        const reg = h.despues || h.antes || {}; let que = '';
        if (h.tabla === 'proveedores') que = `«${esc(reg.nombre)}»`;
        else if (h.tabla === 'valoraciones') que = `una valoración (${reg.estrellas}★) de «${esc((IDX.porId.get(reg.proveedor_id) || {}).nombre || 'proveedor')}»`;
        else if (h.tabla === 'proveedor_oficios') que = `${h.accion === 'insert' ? 'el oficio' : 'el oficio'} ${esc((IDX.of.get(reg.oficio_id) || {}).nombre || '')} de «${esc((IDX.porId.get(reg.proveedor_id) || {}).nombre || '')}»`;
        else if (h.tabla === 'oficios') que = `el oficio «${esc(reg.nombre)}»`;
        const v = h.tabla === 'proveedor_oficios' ? (h.accion === 'insert' ? 'añadió' : 'quitó') : verbo[h.accion] || h.accion;
        const deshacer = h.tabla === 'proveedores' && ['update', 'eliminar', 'restaurar'].includes(h.accion) && h.antes;
        return `<div class="fila"><div class="fila-txt hist" style="white-space:normal"><div><b>${esc(nombreUsuario(h.usuario_id, 'Sistema'))}</b> ${v} ${que}</div><div>${hace(h.created_at)}</div></div>${deshacer ? `<button class="chip" data-desh="${h.id}">Deshacer</button>` : ''}</div>`;
      }).join('') || '<div class="texto-bloque">Sin cambios todavía.</div>'}</div>`;
      z.querySelectorAll('[data-desh]').forEach((b) => b.onclick = async () => {
        const h = data.find((x) => String(x.id) === b.dataset.desh); const a = h.antes;
        if (!await confirmar('¿Deshacer este cambio?', `La ficha «${esc(a.nombre)}» volverá a como estaba antes.`, 'Deshacer')) return;
        const campos = ['nombre', 'cif', 'personas', 'moviles', 'fijos', 'emails', 'web', 'poblacion', 'provincia', 'notas', 'recomendado_por', 'estado', 'sin_verificar', 'eliminado_en', 'motivo_eliminacion'];
        const fila = {}; campos.forEach((c) => { fila[c] = a[c]; });
        const { error: e2 } = await sb.from('proveedores').update(fila).eq('id', a.id);
        if (e2) return aviso(e2.message, false); aviso('Cambio deshecho'); await cargarDatos(); pintarAdmin(el);
      });
    } else {
      const total = vivos().length; const sinv = vivos().filter((p) => p.sin_verificar).length; const trab = vivos().filter((p) => p._trab).length;
      z.innerHTML = `<div class="seccion"><span class="etiqueta-sec">Resumen</span></div><div class="tarjeta">
        ${[['Proveedores', total], ['Trabajado con nosotros', trab], ['Sin verificar', sinv], ['Cerrados', vivos().filter((p) => p.estado === 'inactivo').length], ['Valoraciones', D.vals.length], ['Oficios', oficiosVivos().length], ['Usuarios', D.usuarios.length]].map(([k, v]) => `<div class="dato"><div class="dato-txt"><span class="k">${k}</span><span class="v">${v}</span></div></div>`).join('')}</div>
        <div style="margin:14px 20px 0"><button class="btn-blanco" id="exp">${ico('copiar', 18, '#575049')}Copiar todos los proveedores (para Excel)</button></div>
        <div class="ayuda">Copia la base entera con todas las columnas para pegarla en un Excel de copia de seguridad.</div>`;
      z.querySelector('#exp').onclick = async (e) => {
        const cab = ['ID', 'EMPRESA', 'OFICIOS', 'PERSONA', 'MÓVIL', 'FIJO', 'EMAIL', 'WEB', 'POBLACIÓN', 'PROVINCIA', 'CIF', 'NOTAS', 'ESTADO', 'SIN VERIFICAR', 'VALORACIÓN', 'Nº VALORACIONES'];
        const filas = vivos().map((p) => [p.id, p.nombre, p._ofs.map((o) => o.nombre).join('; '), p.personas, p.moviles, p.fijos, p.emails, p.web, p.poblacion, p.provincia, p.cif, p.notas, p.estado, p.sin_verificar ? 'sí' : 'no', p._n ? p._media.toFixed(1) : '', p._n]);
        const txt = [cab, ...filas].map((f) => f.map((c) => String(c == null ? '' : c).replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
        if (await copiarTexto(txt)) { marcarCopiado(e.currentTarget, true); aviso(`${filas.length} proveedores copiados`); }
      };
    }
  }
  function fusionarOficio(srcId, despues) {
    const src = IDX.of.get(srcId);
    const opciones = oficiosVivos().filter((o) => o.id !== srcId).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map((o) => `<option value="${o.id}">${esc(o.nombre)}</option>`).join('');
    abrirHoja(`<div class="hoja-asa"></div><div class="hoja-barra"><button class="btn-texto" data-c>Cancelar</button><div class="hoja-titulo">Fusionar oficio</div><button class="btn-texto fuerte" id="fu-ok">Fusionar</button></div>
      <p>«${esc(src.nombre)}» pasará a ser un sinónimo del oficio que elijas, y sus proveedores se moverán allí.</p>
      <div class="form-grupo"><div class="campo"><label for="fu-d">Con</label><select id="fu-d">${opciones}</select></div></div>`, (h) => {
      h.querySelector('[data-c]').onclick = cerrarHoja;
      h.querySelector('#fu-ok').onclick = async () => {
        const dst = IDX.of.get(Number(h.querySelector('#fu-d').value));
        const provs = D.links.filter((l) => l.oficio_id === srcId).map((l) => l.proveedor_id);
        const ya = new Set(D.links.filter((l) => l.oficio_id === dst.id).map((l) => l.proveedor_id));
        const nuevos = provs.filter((p) => !ya.has(p)).map((p) => ({ proveedor_id: p, oficio_id: dst.id }));
        let r;
        if (nuevos.length) { r = await sb.from('proveedor_oficios').insert(nuevos); if (r.error) return aviso(r.error.message, false); }
        if (provs.length) { r = await sb.from('proveedor_oficios').delete().eq('oficio_id', srcId); if (r.error) return aviso(r.error.message, false); }
        r = await sb.from('oficios').update({ sinonimos: [...new Set([...(dst.sinonimos || []), src.nombre, ...(src.sinonimos || [])])] }).eq('id', dst.id); if (r.error) return aviso(r.error.message, false);
        r = await sb.from('oficios').update({ redirige_a: dst.id, nuevo: false }).eq('id', srcId); if (r.error) return aviso(r.error.message, false);
        cerrarHoja(); aviso('Oficio fusionado'); await cargarDatos(); despues();
      };
    });
  }

  iniciar();
})();
