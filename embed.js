/*
 * weatherinfo-web — innfellingarskrifta (embed loader).
 *
 * Notkun á hvaða vefsíðu sem er:
 *
 *   <script src="https://reykjanesbaer.github.io/weatherinfo-web/embed.js"
 *           data-stadur="reykjanesbaer"
 *           data-view="compact"
 *           data-theme="auto"></script>
 *
 * Skriftan býr til iframe á staðnum þar sem hún stendur og stillir hæð
 * hennar sjálfkrafa eftir innihaldi. Allar data-* færibreytur eru sendar
 * áfram á græjuna (data-stadur -> ?stadur=...).
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
    if (key === 'width' || key === 'maxWidth') continue; /* meðhöndlað hér að neðan */
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

  /* Gróf ágiskun á byrjunarhæð svo síðan hoppi sem minnst */
  function initialHeight(el) {
    var view = el.getAttribute('data-view') || 'compact';
    var days = parseInt(el.getAttribute('data-days'), 10) || (view === 'full' ? 3 : 0);
    var hours = parseInt(el.getAttribute('data-hours'), 10) || 0;
    var h = view === 'mini' ? 96 : 160;
    if (view !== 'mini' && el.getAttribute('data-details') !== '0') h += 56;
    h += days * 32 + (days ? 14 : 0);
    h += hours ? 90 : 0;
    if (el.getAttribute('data-credit') !== '0') h += 24;
    return h;
  }
})();
