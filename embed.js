/*
 * weatherinfo-web — innfellingarskrifta (embed loader).
 *
 * Notkun á hvaða vefsíðu sem er:
 *
 *   <script src="https://reykjanesbaer.github.io/weatherinfo-web/embed.js"
 *           data-stadur="reykjanesbaer"
 *           data-view="compact"
 *           data-theme="auto"
 *           data-align="left"
 *           data-max-width="420px"></script>
 *
 * Skriftan býr til iframe á staðnum þar sem hún stendur og stillir hæð
 * hennar sjálfkrafa eftir innihaldi. Allar data-* færibreytur eru sendar
 * áfram á græjuna (data-stadur -> ?stadur=...), nema data-align og
 * data-max-width sem stýra aðeins iframe-inum sjálfum.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  /* Slóð á möppuna sem embed.js er í */
  var base = script.src.replace(/[^/]*$/, '');
  var frameId = 'wx-' + Math.random().toString(36).slice(2, 10);

  /* Öll data-* gildi verða að URL-færibreytum */
  var params = new URLSearchParams();
  for (var i = 0; i < script.attributes.length; i++) {
    var attr = script.attributes[i];
    if (attr.name.indexOf('data-') !== 0) continue;
    var key = attr.name.slice(5).replace(/-([a-z])/g, function (m, c) {
      return c.toUpperCase();
    });
    /* Þessar stýra umgjörðinni, ekki græjunni — ekki sendar áfram */
    if (key === 'width' || key === 'maxWidth' || key === 'align') continue;
    params.set(key, attr.value);
  }
  params.set('frameId', frameId);

  var iframe = document.createElement('iframe');
  iframe.src = base + 'widget/?' + params.toString();
  iframe.title = script.getAttribute('data-title') ||
    (script.getAttribute('data-lang') === 'en' ? 'Weather' : 'Veður');
  iframe.loading = 'lazy';
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('frameborder', '0');
  iframe.style.cssText = 'display:block;border:0;width:100%;height:' +
    initialHeight(script) + 'px;max-width:' +
    (script.getAttribute('data-max-width') || '420px') + ';' +
    margins(script.getAttribute('data-align')) +
    'color-scheme:normal;overflow:hidden';

  script.parentNode.insertBefore(iframe, script);

  /* Hæð uppfærð þegar græjan lætur vita */
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'weatherinfo:height') return;
    if (data.id && data.id !== frameId) return;
    if (event.source !== iframe.contentWindow) return;
    var h = parseInt(data.height, 10);
    if (isFinite(h) && h > 0 && h < 2000) iframe.style.height = h + 'px';
  });

  /*
   * Staðsetning á síðunni. Auto-spássíur yfirskrifa miðjun sem kemur úr
   * umlykjandi gámi, hvort sem hún er gerð með text-align eða flex.
   */
  function margins(align) {
    if (align === 'center') return 'margin-left:auto;margin-right:auto;';
    if (align === 'right') return 'margin-left:auto;margin-right:0;';
    return 'margin-left:0;margin-right:auto;';
  }

  /* Gróf ágiskun á byrjunarhæð svo síðan hoppi sem minnst */
  function initialHeight(el) {
    var view = el.getAttribute('data-view') || 'compact';
    /* isFinite, ekki ||: data-days="0" á að þýða engir dagar */
    var days = parseInt(el.getAttribute('data-days'), 10);
    if (!isFinite(days)) days = view === 'full' ? 3 : 0;
    var hours = parseInt(el.getAttribute('data-hours'), 10) || 0;
    var h = view === 'mini' ? 96 : 160;
    if (view !== 'mini' && el.getAttribute('data-details') !== '0') h += 56;
    h += days * 32 + (days ? 14 : 0);
    h += hours ? 90 : 0;
    if (el.getAttribute('data-credit') !== '0') h += 24;
    return h;
  }
})();
