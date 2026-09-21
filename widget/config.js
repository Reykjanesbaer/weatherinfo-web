/*
 * weatherinfo-web — stillingar, staðir, veðurkóðar og þýðingar.
 * Hleðst á undan icons.js og widget.js.
 */
(function (global) {
  'use strict';

  /* --------------------------------------------------------------------
   * Staðir á Suðurnesjum. Lykill er notaður í ?stadur=<lykill>
   * ------------------------------------------------------------------ */
  var PLACES = {
    reykjanesbaer:   { name: 'Reykjanesbær',          lat: 64.0049, lon: -22.5657 },
    keflavik:        { name: 'Keflavík',              lat: 64.0049, lon: -22.5657 },
    njardvik:        { name: 'Njarðvík',              lat: 63.9928, lon: -22.5406 },
    innrinjardvik:   { name: 'Innri-Njarðvík',        lat: 63.9836, lon: -22.5075 },
    asbru:           { name: 'Ásbrú',                 lat: 63.9770, lon: -22.5900 },
    hafnir:          { name: 'Hafnir',                lat: 63.9333, lon: -22.6889 },
    gardur:          { name: 'Garður',                lat: 64.0833, lon: -22.6833 },
    sandgerdi:       { name: 'Sandgerði',             lat: 64.0383, lon: -22.7119 },
    vogar:           { name: 'Vogar',                 lat: 63.9797, lon: -22.3906 },
    grindavik:       { name: 'Grindavík',             lat: 63.8424, lon: -22.4370 },
    keflavikurflugvollur: { name: 'Keflavíkurflugvöllur', lat: 63.9850, lon: -22.6056 },
    blaalonid:       { name: 'Bláa lónið',            lat: 63.8804, lon: -22.4495 },
    reykjanesviti:   { name: 'Reykjanesviti',         lat: 63.8122, lon: -22.7053 },
    reykjavik:       { name: 'Reykjavík',             lat: 64.1466, lon: -21.9426 }
  };

  var DEFAULT_PLACE = 'reykjanesbaer';

  /* --------------------------------------------------------------------
   * WMO veðurkóðar -> lykill á íkon + lýsing
   * https://open-meteo.com/en/docs (weather_code)
   * ------------------------------------------------------------------ */
  var CODES = {
    0:  { icon: 'clear',    is: 'Heiðskírt',                  en: 'Clear sky' },
    1:  { icon: 'mostly',   is: 'Léttskýjað',                 en: 'Mainly clear' },
    2:  { icon: 'partly',   is: 'Skýjað að hluta',            en: 'Partly cloudy' },
    3:  { icon: 'overcast', is: 'Alskýjað',                   en: 'Overcast' },
    45: { icon: 'fog',      is: 'Þoka',                       en: 'Fog' },
    48: { icon: 'fog',      is: 'Þoka með frostrími',         en: 'Rime fog' },
    51: { icon: 'drizzle',  is: 'Lítilsháttar súld',          en: 'Light drizzle' },
    53: { icon: 'drizzle',  is: 'Súld',                       en: 'Drizzle' },
    55: { icon: 'drizzle',  is: 'Þétt súld',                  en: 'Dense drizzle' },
    56: { icon: 'sleet',    is: 'Frostsúld',                  en: 'Freezing drizzle' },
    57: { icon: 'sleet',    is: 'Þétt frostsúld',             en: 'Dense freezing drizzle' },
    61: { icon: 'rain',     is: 'Lítilsháttar rigning',       en: 'Light rain' },
    63: { icon: 'rain',     is: 'Rigning',                    en: 'Rain' },
    65: { icon: 'rain',     is: 'Mikil rigning',              en: 'Heavy rain' },
    66: { icon: 'sleet',    is: 'Frostrigning',               en: 'Freezing rain' },
    67: { icon: 'sleet',    is: 'Mikil frostrigning',         en: 'Heavy freezing rain' },
    71: { icon: 'snow',     is: 'Lítilsháttar snjókoma',      en: 'Light snow' },
    73: { icon: 'snow',     is: 'Snjókoma',                   en: 'Snow' },
    75: { icon: 'snow',     is: 'Mikil snjókoma',             en: 'Heavy snow' },
    77: { icon: 'snow',     is: 'Kornsnjór',                  en: 'Snow grains' },
    80: { icon: 'showers',  is: 'Skúrir',                     en: 'Rain showers' },
    81: { icon: 'showers',  is: 'Skúrir',                     en: 'Rain showers' },
    82: { icon: 'showers',  is: 'Miklar skúrir',              en: 'Violent rain showers' },
    85: { icon: 'snow',     is: 'Él',                         en: 'Snow showers' },
    86: { icon: 'snow',     is: 'Mikil él',                   en: 'Heavy snow showers' },
    95: { icon: 'thunder',  is: 'Þrumuveður',                 en: 'Thunderstorm' },
    96: { icon: 'thunder',  is: 'Þrumuveður með hagléli',     en: 'Thunderstorm with hail' },
    99: { icon: 'thunder',  is: 'Þrumuveður með miklu hagléli', en: 'Thunderstorm with heavy hail' }
  };

  var UNKNOWN_CODE = { icon: 'cloud', is: 'Óþekkt veður', en: 'Unknown' };

  function describe(code, lang) {
    var entry = CODES[code] || UNKNOWN_CODE;
    return entry[lang] || entry.is;
  }

  function iconKey(code) {
    return (CODES[code] || UNKNOWN_CODE).icon;
  }

  /* --------------------------------------------------------------------
   * Vindáttir — 16 áttir, styttingar og fullt heiti
   * ------------------------------------------------------------------ */
  var COMPASS = {
    is: ['N', 'NNA', 'NA', 'ANA', 'A', 'ASA', 'SA', 'SSA',
         'S', 'SSV', 'SV', 'VSV', 'V', 'VNV', 'NV', 'NNV'],
    en: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
         'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  };

  var COMPASS_LONG = {
    is: ['norðan', 'norðnorðaustan', 'norðaustan', 'austnorðaustan',
         'austan', 'austsuðaustan', 'suðaustan', 'suðsuðaustan',
         'sunnan', 'suðsuðvestan', 'suðvestan', 'vestsuðvestan',
         'vestan', 'vestnorðvestan', 'norðvestan', 'norðnorðvestan'],
    en: ['northerly', 'north-northeasterly', 'northeasterly', 'east-northeasterly',
         'easterly', 'east-southeasterly', 'southeasterly', 'south-southeasterly',
         'southerly', 'south-southwesterly', 'southwesterly', 'west-southwesterly',
         'westerly', 'west-northwesterly', 'northwesterly', 'north-northwesterly']
  };

  function compass(degrees, lang) {
    var table = COMPASS[lang] || COMPASS.is;
    return table[Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16];
  }

  function compassLong(degrees, lang) {
    var table = COMPASS_LONG[lang] || COMPASS_LONG.is;
    return table[Math.round(((degrees % 360) + 360) % 360 / 22.5) % 16];
  }

  /* --------------------------------------------------------------------
   * Vindstig (Beaufort) — notað í lýsingu fyrir skjálesara
   * ------------------------------------------------------------------ */
  var BEAUFORT_MS = [0.3, 1.6, 3.4, 5.5, 8.0, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7];

  function beaufort(ms) {
    for (var i = 0; i < BEAUFORT_MS.length; i++) {
      if (ms < BEAUFORT_MS[i]) return i;
    }
    return 12;
  }

  var BEAUFORT_NAME = {
    is: ['logn', 'andvari', 'kul', 'gola', 'stinningsgola', 'kaldi', 'stinningskaldi',
         'allhvasst', 'hvassviðri', 'stormur', 'rok', 'ofsaveður', 'fárviðri'],
    en: ['calm', 'light air', 'light breeze', 'gentle breeze', 'moderate breeze',
         'fresh breeze', 'strong breeze', 'near gale', 'gale', 'strong gale',
         'storm', 'violent storm', 'hurricane force']
  };

  function beaufortName(ms, lang) {
    return (BEAUFORT_NAME[lang] || BEAUFORT_NAME.is)[beaufort(ms)];
  }

  /* --------------------------------------------------------------------
   * Þýðingar
   * ------------------------------------------------------------------ */
  var STRINGS = {
    is: {
      feelsLike: 'Finnst sem',
      wind: 'Vindur',
      gusts: 'Hviður',
      humidity: 'Raki',
      precip: 'Úrkoma',
      pressure: 'Loftþrýstingur',
      sunrise: 'Sólarupprás',
      sunset: 'Sólsetur',
      today: 'Í dag',
      tomorrow: 'Á morgun',
      updated: 'Uppfært',
      loading: 'Sæki veðurgögn …',
      errorTitle: 'Ekki tókst að sækja veðurgögn',
      errorBody: 'Reyndu aftur eftir smá stund.',
      retry: 'Reyna aftur',
      source: 'Gögn frá Open-Meteo',
      nextHours: 'Næstu klukkustundir',
      forecast: 'Spá',
      now: 'Núna',
      days: ['Sun', 'Mán', 'Þri', 'Mið', 'Fim', 'Fös', 'Lau'],
      chanceOfRain: 'líkur á úrkomu'
    },
    en: {
      feelsLike: 'Feels like',
      wind: 'Wind',
      gusts: 'Gusts',
      humidity: 'Humidity',
      precip: 'Precipitation',
      pressure: 'Pressure',
      sunrise: 'Sunrise',
      sunset: 'Sunset',
      today: 'Today',
      tomorrow: 'Tomorrow',
      updated: 'Updated',
      loading: 'Loading weather …',
      errorTitle: 'Could not load weather data',
      errorBody: 'Please try again shortly.',
      retry: 'Try again',
      source: 'Data from Open-Meteo',
      nextHours: 'Next hours',
      forecast: 'Forecast',
      now: 'Now',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      chanceOfRain: 'chance of precipitation'
    }
  };

  function t(lang, key) {
    var dict = STRINGS[lang] || STRINGS.is;
    return dict[key] !== undefined ? dict[key] : STRINGS.is[key];
  }

  global.WeatherConfig = {
    PLACES: PLACES,
    DEFAULT_PLACE: DEFAULT_PLACE,
    describe: describe,
    iconKey: iconKey,
    compass: compass,
    compassLong: compassLong,
    beaufort: beaufort,
    beaufortName: beaufortName,
    t: t
  };
})(window);
