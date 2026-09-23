/*
 * weatherinfo-web — veðurgræja fyrir Reykjanesbæ.
 *
 * Gögn: Open-Meteo (https://open-meteo.com) — ókeypis, enginn lykill,
 * og sendir CORS-hausa svo hægt sé að kalla beint úr vafra. Veðurstofan
 * sendir ekki CORS-hausa og krefst því milliþjóns; sjá README.
 */
(function () {
  'use strict';

  var cfg = window.WeatherConfig;
  var icons = window.WeatherIcons;

  var API = 'https://api.open-meteo.com/v1/forecast';
  var CACHE_TTL_MS = 5 * 60 * 1000;      /* gögn talin fersk í 5 mín */
  var STALE_AFTER_MS = 60 * 60 * 1000;   /* eldri en klst -> merkt gamalt */
  var FALLBACK_MAX_MS = 6 * 60 * 60 * 1000; /* má nota sem varaleið í 6 klst */

  /* ================================================================== */
  /* Stillingar úr slóð                                                  */
  /* ================================================================== */

  function readOptions() {
    var q = new URLSearchParams(window.location.search);

    var placeKey = (q.get('stadur') || q.get('place') || cfg.DEFAULT_PLACE)
      .toLowerCase().trim();
    var place = cfg.PLACES[placeKey] || cfg.PLACES[cfg.DEFAULT_PLACE];

    var lat = parseFloat(q.get('lat'));
    var lon = parseFloat(q.get('lon'));
    var hasCoords = isFinite(lat) && isFinite(lon) &&
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;

    var lang = q.get('lang') === 'en' ? 'en' : 'is';
    var view = q.get('view');
    if (['mini', 'compact', 'full'].indexOf(view) === -1) view = 'compact';

    var theme = q.get('theme');
    if (['light', 'dark', 'auto'].indexOf(theme) === -1) theme = 'auto';

    /* Fjöldi spádaga / klukkustunda — sjálfgefið eftir útgáfu */
    var days = clampInt(q.get('days'), 0, 7, view === 'full' ? 3 : 0);
    var hours = clampInt(q.get('hours'), 0, 24, 0);

    return {
      lat: hasCoords ? lat : place.lat,
      lon: hasCoords ? lon : place.lon,
      name: q.get('name') || (hasCoords ? '' : place.name),
      lang: lang,
      view: view,
      theme: theme,
      days: days,
      hours: hours,
      details: q.get('details') !== '0' && view !== 'mini',
      sun: q.get('sun') === '1',
      accent: sanitizeColor(q.get('accent')),
      radius: q.get('radius'),
      transparent: q.get('bg') === 'transparent',
      credit: q.get('credit') !== '0',
      creditSize: sanitizeSize(q.get('creditSize')),
      refreshMin: clampInt(q.get('refresh'), 5, 180, 15),
      link: q.get('link') || ''
    };
  }

  function clampInt(raw, min, max, fallback) {
    var n = parseInt(raw, 10);
    if (!isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  /* Leyfum aðeins hex-liti — kemur í veg fyrir innspýtingu í style */
  function sanitizeColor(raw) {
    if (!raw) return null;
    var v = raw.replace(/^#/, '').trim();
    return /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(v) ? '#' + v : null;
  }

  /*
   * Leturstærð í px: heiltala eða einn aukastafur, klemmd á 9-16.
   * Aðeins tölur sleppa í gegn — aldrei hrár texti inn í style.
   */
  function sanitizeSize(raw) {
    if (!raw) return null;
    var v = String(raw).trim();
    if (!/^\d{1,2}(\.\d)?$/.test(v)) return null;
    return Math.min(16, Math.max(9, parseFloat(v)));
  }

  /* ================================================================== */
  /* Hjálparföll                                                         */
  /* ================================================================== */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /*
   * Tölur eru sniðnar handvirkt í stað Intl.NumberFormat: sumar vafraútgáfur
   * eru byggðar með skertum ICU-gögnum og detta þá þegjandi aftur í en-US,
   * sem myndi sýna "0.4" í stað "0,4" fyrir íslenska notendur.
   */
  function num(value, lang, decimals) {
    if (value === null || value === undefined || !isFinite(value)) return '–';
    var d = decimals || 0;
    var factor = Math.pow(10, d);
    var rounded = Math.round(value * factor) / factor;
    var text = Math.abs(rounded).toFixed(d);
    if (lang !== 'en') text = text.replace('.', ',');
    /* Rétt mínusmerki (U+2212) — ekki bandstrik. -0 fær ekkert formerki. */
    return (rounded < 0 ? '\u2212' : '') + text;
  }

  /* Hitastig alltaf sýnt sem heil tala, með mínus þar sem við á */
  function temp(value, lang) {
    if (value === null || value === undefined || !isFinite(value)) return '–';
    return num(Math.round(value), lang);
  }

  /* "2026-09-21T13:00" -> "13:00" (Open-Meteo skilar staðartíma) */
  function hhmm(isoLocal) {
    return typeof isoLocal === 'string' && isoLocal.length >= 16
      ? isoLocal.slice(11, 16) : '';
  }

  /* "2026-09-21" -> Date án tímabeltisbrenglunar */
  function parseDate(isoDate) {
    var parts = String(isoDate).slice(0, 10).split('-');
    return new Date(+parts[0], +parts[1] - 1, +parts[2]);
  }

  /* ================================================================== */
  /* Gagnasókn                                                           */
  /* ================================================================== */

  function buildUrl(o) {
    var p = new URLSearchParams();
    p.set('latitude', o.lat.toFixed(4));
    p.set('longitude', o.lon.toFixed(4));
    p.set('current', [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'is_day', 'precipitation', 'weather_code',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
    ].join(','));
    p.set('timezone', 'Atlantic/Reykjavik');
    p.set('wind_speed_unit', 'ms');

    var needDaily = o.days > 0 || o.sun;
    if (needDaily) {
      p.set('daily', [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'precipitation_probability_max', 'sunrise', 'sunset'
      ].join(','));
    }
    if (o.hours > 0) {
      p.set('hourly', 'temperature_2m,weather_code,precipitation_probability,is_day');
    }

    /* Nógu margir dagar til að þekja bæði dagaspá og klukkustundir */
    var span = Math.max(o.days, o.hours > 0 ? 2 : 1);
    p.set('forecast_days', String(Math.min(7, Math.max(1, span))));

    return API + '?' + p.toString();
  }

  /*
   * maxAge ræður hversu gömul gögn mega vera. Fersk sókn notar CACHE_TTL_MS,
   * en varaleiðin eftir netvillu má seilast mun lengra aftur (FALLBACK_MAX_MS)
   * — betra er að sýna gömul gögn, merkt sem slík, en villuskilaboð.
   */
  function cacheGet(url, maxAge) {
    try {
      var raw = sessionStorage.getItem('wx:' + url);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.at > (maxAge || CACHE_TTL_MS)) return null;
      return entry;
    } catch (e) { return null; }
  }

  function cacheSet(url, data) {
    try {
      sessionStorage.setItem('wx:' + url, JSON.stringify({ at: Date.now(), data: data }));
    } catch (e) { /* private mode o.þ.h. — hunsum */ }
  }

  function fetchWeather(url) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

    function clear() {
      if (timer) { clearTimeout(timer); timer = null; }
    }

    return fetch(url, controller ? { signal: controller.signal } : undefined)
      .then(function (res) {
        clear();
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      }, function (err) {
        /* Tímamælirinn þarf líka að hverfa þegar sóknin sjálf mistekst */
        clear();
        throw err;
      })
      .then(function (data) {
        if (!data || !data.current) throw new Error('Óvænt svar frá veðurþjónustu');
        return data;
      });
  }

  /* ================================================================== */
  /* Teikning                                                            */
  /* ================================================================== */

  var root = document.getElementById('wx-root');

  function renderSkeleton(o) {
    root.className = 'wx wx-skeleton';
    root.setAttribute('data-view', o.view);
    root.setAttribute('aria-busy', 'true');
    root.innerHTML =
      '<div class="wx-head"><span class="wx-sk wx-sk-place"></span></div>' +
      '<div class="wx-now">' +
        '<div class="wx-sk wx-sk-icon"></div>' +
        '<div class="wx-now-main" style="flex:1">' +
          '<div class="wx-sk wx-sk-temp"></div>' +
          '<div class="wx-sk wx-sk-cond"></div>' +
        '</div>' +
      '</div>' +
      (o.details ? '<div class="wx-details"><span class="wx-sk wx-sk-row"></span>' +
        '<span class="wx-sk wx-sk-row"></span></div>' : '') +
      '<span class="wx-sr">' + esc(cfg.t(o.lang, 'loading')) + '</span>';
    postHeight();
  }

  function renderError(o, onRetry) {
    root.className = 'wx';
    root.setAttribute('data-view', o.view);
    root.removeAttribute('aria-busy');
    root.innerHTML =
      '<div class="wx-error" role="alert">' +
        '<div class="wx-error-title">' + esc(cfg.t(o.lang, 'errorTitle')) + '</div>' +
        '<div class="wx-error-body">' + esc(cfg.t(o.lang, 'errorBody')) + '</div>' +
        '<button type="button" class="wx-retry">' + icons.ui.refresh +
          esc(cfg.t(o.lang, 'retry')) + '</button>' +
      '</div>';
    var btn = root.querySelector('.wx-retry');
    if (btn) btn.addEventListener('click', onRetry);
    postHeight();
  }

  function render(o, data, fetchedAt) {
    var lang = o.lang;
    var c = data.current;
    var units = data.current_units || {};
    var isDay = c.is_day !== 0;
    var condition = cfg.describe(c.weather_code, lang);

    var html = '';

    /* --- haus --- */
    var placeLabel = o.name || (num(o.lat, lang, 2) + ', ' + num(o.lon, lang, 2));
    html += '<div class="wx-head">';
    html += '<h2 class="wx-place">' + esc(placeLabel) + '</h2>';
    html += '<span class="wx-time">' + esc(hhmm(c.time)) + '</span>';
    html += '</div>';

    /* --- núverandi veður --- */
    html += '<div class="wx-now">';
    html += '<div class="wx-now-icon">' + icons.render(cfg.iconKey(c.weather_code), isDay) + '</div>';
    html += '<div class="wx-now-main">';
    html += '<div class="wx-temp">' + temp(c.temperature_2m, lang) +
            '<span class="wx-temp-unit">' + esc(units.temperature_2m || '°C') + '</span></div>';
    html += '<div class="wx-cond" title="' + esc(condition) + '">' + esc(condition) + '</div>';
    html += '</div></div>';

    /* --- smáatriði --- */
    if (o.details) {
      var windDir = cfg.compass(c.wind_direction_10m, lang);
      var windVal = num(Math.round(c.wind_speed_10m), lang) + ' m/s';
      if (isFinite(c.wind_gusts_10m) && c.wind_gusts_10m - c.wind_speed_10m >= 3) {
        windVal += ' (' + num(Math.round(c.wind_gusts_10m), lang) + ')';
      }

      html += '<div class="wx-details">';
      /* Örin snýr í þá átt sem vindurinn blæs — vindátt er gefin sem "úr" */
      var blowsToward = (Math.round(c.wind_direction_10m) + 180) % 360;
      html += detail(icons.ui.wind, cfg.t(lang, 'wind'),
        icons.ui.arrow(blowsToward) + esc(windDir + ' ' + windVal));
      html += detail(icons.ui.thermometer, cfg.t(lang, 'feelsLike'),
        esc(temp(c.apparent_temperature, lang) + ' ' + (units.apparent_temperature || '°C')));
      html += detail(icons.ui.droplet, cfg.t(lang, 'humidity'),
        esc(num(c.relative_humidity_2m, lang) + ' %'));
      html += detail(icons.ui.umbrella, cfg.t(lang, 'precip'),
        esc(num(c.precipitation, lang, 1) + ' mm'));

      if (o.sun && data.daily && data.daily.sunrise) {
        html += detail(icons.ui.sunrise, cfg.t(lang, 'sunrise'), esc(hhmm(data.daily.sunrise[0])));
        html += detail(icons.ui.sunset, cfg.t(lang, 'sunset'), esc(hhmm(data.daily.sunset[0])));
      }
      html += '</div>';
    }

    /* --- næstu klukkustundir --- */
    if (o.hours > 0 && data.hourly && data.hourly.time) {
      html += renderHours(o, data, lang);
    }

    /* --- dagaspá --- */
    if (o.days > 0 && data.daily && data.daily.time) {
      html += renderDays(o, data, lang);
    }

    /* --- fótur --- */
    if (o.credit) {
      html += '<div class="wx-foot">';
      html += '<span>' + esc(cfg.t(lang, 'updated')) + ' ' + esc(hhmm(c.time)) + '</span>';
      html += '<a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">' +
              esc(cfg.t(lang, 'source')) + '</a>';
      html += '</div>';
    }

    /* --- samantekt fyrir skjálesara --- */
    html += '<span class="wx-sr">' + esc(summary(o, c, condition, lang)) + '</span>';

    root.className = 'wx';
    if (Date.now() - fetchedAt > STALE_AFTER_MS) root.className += ' wx-stale';
    root.setAttribute('data-view', o.view);
    root.removeAttribute('aria-busy');
    root.innerHTML = html;

    /* Valkvæmur hlekkur á ítarlegri veðursíðu */
    if (o.link) wrapInLink(o.link);

    postHeight();
  }

  function detail(icon, label, valueHtml) {
    return '<div class="wx-detail">' + icon +
      '<span class="wx-detail-label">' + esc(label) + '</span>' +
      '<span class="wx-detail-value">' + valueHtml + '</span></div>';
  }

  function renderHours(o, data, lang) {
    var h = data.hourly;
    var nowHour = String(data.current.time).slice(0, 13); /* "YYYY-MM-DDTHH" */
    var start = 0;
    for (var i = 0; i < h.time.length; i++) {
      if (h.time[i].slice(0, 13) >= nowHour) { start = i; break; }
    }

    var out = '<div class="wx-hours" role="list" aria-label="' +
      esc(cfg.t(lang, 'nextHours')) + '">';
    for (var j = start; j < Math.min(start + o.hours, h.time.length); j++) {
      var pop = h.precipitation_probability ? h.precipitation_probability[j] : null;
      var dayFlag = h.is_day ? h.is_day[j] !== 0 : true;
      out += '<div class="wx-hour' + (j === start ? ' wx-hour-now' : '') + '" role="listitem">';
      out += '<div class="wx-hour-time">' +
        (j === start ? esc(cfg.t(lang, 'now')) : esc(hhmm(h.time[j]))) + '</div>';
      out += '<div class="wx-hour-icon">' +
        icons.render(cfg.iconKey(h.weather_code[j]), dayFlag) + '</div>';
      out += '<div class="wx-hour-temp">' + temp(h.temperature_2m[j], lang) + '°</div>';
      out += '<div class="wx-hour-pop">' +
        (isFinite(pop) && pop >= 20 ? esc(num(pop, lang) + '%') : '') + '</div>';
      out += '</div>';
    }
    return out + '</div>';
  }

  function renderDays(o, data, lang) {
    var d = data.daily;
    var names = cfg.t(lang, 'days');
    var count = Math.min(o.days, d.time.length);

    /* Ekkert role="list" hér: raðirnar nota display:contents, sem fellir
       listahlutverk úr aðgengistrénu í sumum vöfrum. Textinn les rétt. */
    var out = '<div class="wx-forecast" aria-label="' +
      esc(cfg.t(lang, 'forecast')) + '">';
    for (var i = 0; i < count; i++) {
      var label = i === 0 ? cfg.t(lang, 'today')
        : i === 1 ? cfg.t(lang, 'tomorrow')
        : names[parseDate(d.time[i]).getDay()];
      var cond = cfg.describe(d.weather_code[i], lang);

      out += '<div class="wx-day">';
      out += '<span class="wx-day-name">' + esc(label) + '</span>';
      out += '<span class="wx-day-icon">' +
        icons.render(cfg.iconKey(d.weather_code[i]), true) + '</span>';
      out += '<span class="wx-day-cond">' + esc(cond) + '</span>';
      out += '<span class="wx-day-temps">' +
        '<span class="wx-day-max">' + temp(d.temperature_2m_max[i], lang) + '°</span>' +
        '<span class="wx-day-min">' + temp(d.temperature_2m_min[i], lang) + '°</span></span>';
      out += '</div>';
    }
    return out + '</div>';
  }

  function summary(o, c, condition, lang) {
    var place = o.name || '';
    var windText = cfg.compassLong(c.wind_direction_10m, lang) + ' ' +
      num(Math.round(c.wind_speed_10m), lang) + ' m/s (' +
      cfg.beaufortName(c.wind_speed_10m, lang) + ')';
    if (lang === 'en') {
      return (place ? place + ': ' : '') + condition + ', ' +
        temp(c.temperature_2m, lang) + ' degrees, wind ' + windText + '.';
    }
    return (place ? place + ': ' : '') + condition + ', ' +
      temp(c.temperature_2m, lang) + ' stig, vindur ' + windText + '.';
  }

  /*
   * Vefur kortið í hlekk ef ?link= er gefið.
   * Fóturinn verður eftir fyrir utan: hann inniheldur heimildarhlekkinn á
   * Open-Meteo, og hreiðraðir <a> eru ógilt HTML — vafrinn myndi slíta
   * þeim í sundur og heimildin gæti hætt að virka.
   */
  function wrapInLink(href) {
    if (!/^https?:\/\//i.test(href)) return;
    var link = document.createElement('a');
    link.href = href;
    link.target = '_top';
    link.rel = 'noopener';
    link.style.cssText = 'text-decoration:none;color:inherit;display:block';

    var foot = root.querySelector('.wx-foot');
    var node = root.firstChild;
    while (node) {
      var next = node.nextSibling;
      if (node !== foot) link.appendChild(node);
      node = next;
    }
    /* Hlekkurinn fer fremst, fóturinn heldur sínum stað neðst */
    root.insertBefore(link, root.firstChild);
  }

  /* ================================================================== */
  /* Hæð send á foreldrasíðu (fyrir sjálfvirka stærð á iframe)           */
  /* ================================================================== */

  var lastHeight = 0;

  function postHeight() {
    if (window.parent === window) return;
    var h = Math.ceil(document.documentElement.getBoundingClientRect().height);
    if (h === lastHeight || h === 0) return;
    lastHeight = h;
    try {
      window.parent.postMessage({
        type: 'weatherinfo:height',
        id: new URLSearchParams(window.location.search).get('frameId') || '',
        height: h
      }, '*');
    } catch (e) { /* hunsum */ }
  }

  /* ================================================================== */
  /* Keyrsla                                                             */
  /* ================================================================== */

  function applyChrome(o) {
    var el = document.documentElement;
    if (o.theme !== 'auto') el.setAttribute('data-theme', o.theme);
    if (o.transparent) el.setAttribute('data-bg', 'transparent');
    if (o.accent) el.style.setProperty('--wx-accent', o.accent);
    if (o.radius !== null && o.radius !== undefined && /^\d{1,2}$/.test(o.radius)) {
      el.style.setProperty('--wx-radius', o.radius + 'px');
    }
    if (o.creditSize !== null) {
      el.style.setProperty('--wx-credit-size', o.creditSize + 'px');
    }
    /* Innfelld í iframe: skugginn klippist af jöðrunum, sjá widget.css */
    if (window.parent !== window) el.setAttribute('data-framed', '');
    el.lang = o.lang;
  }

  function start() {
    var o = readOptions();
    applyChrome(o);

    var url = buildUrl(o);
    /* Síðustu gögn sem tókst að sækja — lifa af misheppnaða endurnýjun */
    var lastGood = null;
    var inFlight = false;

    function show(entry) {
      lastGood = entry;
      render(o, entry.data, entry.at);
    }

    function load(useCache) {
      if (inFlight) return;

      var cached = useCache ? cacheGet(url, CACHE_TTL_MS) : null;
      if (cached) { show(cached); return; }

      /* Beinagrind aðeins þegar ekkert er þegar á skjánum */
      if (!lastGood) renderSkeleton(o);

      inFlight = true;
      fetchWeather(url)
        .then(function (data) {
          inFlight = false;
          cacheSet(url, data);
          show({ data: data, at: Date.now() });
        })
        .catch(function (err) {
          inFlight = false;
          if (window.console && console.warn) console.warn('[weatherinfo]', err);
          /*
           * Tímabundin netvilla má ekki eyða veðri sem þegar sést. Höldum
           * síðustu gögnum uppi (render merkir þau gömul eftir klukkustund)
           * og sýnum villu aðeins ef ekkert er til að falla aftur á.
           */
          var fallback = lastGood || cacheGet(url, FALLBACK_MAX_MS);
          if (fallback) show(fallback);
          else renderError(o, function () { load(false); });
        });
    }

    load(true);

    setInterval(function () {
      if (!document.hidden) load(false);
    }, o.refreshMin * 60 * 1000);

    /* Sækjum aftur þegar notandi kemur til baka í flipann */
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) load(true);
    });

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(postHeight).observe(document.documentElement);
    } else {
      window.addEventListener('resize', postHeight);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
