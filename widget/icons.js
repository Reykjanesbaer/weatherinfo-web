/*
 * weatherinfo-web — veðuríkon.
 * Einföld SVG-íkon (24x24, stroke-based) sem erfa lit úr CSS breytum.
 * Hver fall skilar SVG-streng.
 */
(function (global) {
  'use strict';

  function svg(children, extraClass) {
    return '<svg class="wx-icon ' + (extraClass || '') + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
      'aria-hidden="true" focusable="false">' + children + '</svg>';
  }

  /* Skýið sem flest íkon byggja á */
  var CLOUD = '<path class="wx-cloud" d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>';
  /* Minna ský, notað þegar sól/tungl er fyrir aftan */
  var CLOUD_SMALL = '<path class="wx-cloud" d="M17.5 19H8a4.5 4.5 0 1 1 .9-8.91A6 6 0 0 1 20 12.2 3.4 3.4 0 0 1 17.5 19z"/>';

  var SUN_RAYS =
    '<line x1="12" y1="1.6" x2="12" y2="3.6"/>' +
    '<line x1="12" y1="20.4" x2="12" y2="22.4"/>' +
    '<line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/>' +
    '<line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/>' +
    '<line x1="1.6" y1="12" x2="3.6" y2="12"/>' +
    '<line x1="20.4" y1="12" x2="22.4" y2="12"/>' +
    '<line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/>' +
    '<line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/>';

  var ICONS = {
    /* Heiðskírt — dagur */
    clearDay: function () {
      return svg('<g class="wx-sun"><circle cx="12" cy="12" r="4.4"/>' + SUN_RAYS + '</g>');
    },
    /* Heiðskírt — nótt */
    clearNight: function () {
      return svg('<path class="wx-moon" d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/>');
    },
    /* Léttskýjað / skýjað að hluta — dagur */
    partlyDay: function () {
      return svg(
        '<g class="wx-sun"><circle cx="8.6" cy="8.2" r="3.1"/>' +
        '<line x1="8.6" y1="1.9" x2="8.6" y2="3.2"/>' +
        '<line x1="3.4" y1="8.2" x2="2.1" y2="8.2"/>' +
        '<line x1="4.9" y1="4.5" x2="4" y2="3.6"/>' +
        '<line x1="12.3" y1="4.5" x2="13.2" y2="3.6"/>' +
        '<line x1="4.9" y1="11.9" x2="4" y2="12.8"/></g>' +
        CLOUD_SMALL);
    },
    /* Léttskýjað / skýjað að hluta — nótt */
    partlyNight: function () {
      return svg(
        '<path class="wx-moon" d="M13.8 9.4A5.6 5.6 0 0 1 8.9 2.2a5.6 5.6 0 1 0 5.9 7.5z"/>' +
        CLOUD_SMALL);
    },
    /* Alskýjað */
    overcast: function () {
      return svg(
        '<path class="wx-cloud wx-cloud-back" d="M6.5 9.2A5.5 5.5 0 0 1 17 7.6"/>' +
        CLOUD);
    },
    cloud: function () {
      return svg(CLOUD);
    },
    /* Þoka */
    fog: function () {
      return svg(
        '<path class="wx-cloud" d="M17.5 15.5H8a4.5 4.5 0 1 1 .9-8.91A6 6 0 0 1 20 8.7a3.4 3.4 0 0 1-2.5 6.8z"/>' +
        '<g class="wx-fog"><line x1="4" y1="19" x2="20" y2="19"/>' +
        '<line x1="7" y1="22" x2="17" y2="22"/></g>');
    },
    /* Súld */
    drizzle: function () {
      return svg(CLOUD +
        '<g class="wx-rain"><line x1="8.5" y1="21" x2="8.5" y2="22.5"/>' +
        '<line x1="12" y1="21.5" x2="12" y2="23"/>' +
        '<line x1="15.5" y1="21" x2="15.5" y2="22.5"/></g>');
    },
    /* Rigning */
    rain: function () {
      return svg(CLOUD +
        '<g class="wx-rain"><line x1="8.5" y1="20" x2="7.6" y2="23"/>' +
        '<line x1="12" y1="20" x2="11.1" y2="23"/>' +
        '<line x1="15.5" y1="20" x2="14.6" y2="23"/></g>');
    },
    /* Skúrir */
    showers: function () {
      return svg(CLOUD +
        '<g class="wx-rain"><line x1="9.5" y1="20" x2="8.2" y2="23.2"/>' +
        '<line x1="14.5" y1="20" x2="13.2" y2="23.2"/></g>');
    },
    /* Slydda / frostrigning */
    sleet: function () {
      return svg(CLOUD +
        '<g class="wx-rain"><line x1="9" y1="20" x2="8.1" y2="23"/></g>' +
        '<g class="wx-snow"><line x1="15" y1="20.2" x2="15" y2="23"/>' +
        '<line x1="13.8" y1="20.9" x2="16.2" y2="22.3"/>' +
        '<line x1="16.2" y1="20.9" x2="13.8" y2="22.3"/></g>');
    },
    /* Snjókoma / él */
    snow: function () {
      return svg(CLOUD +
        '<g class="wx-snow"><line x1="9" y1="20" x2="9" y2="23"/>' +
        '<line x1="7.7" y1="20.75" x2="10.3" y2="22.25"/>' +
        '<line x1="10.3" y1="20.75" x2="7.7" y2="22.25"/>' +
        '<line x1="15" y1="20" x2="15" y2="23"/>' +
        '<line x1="13.7" y1="20.75" x2="16.3" y2="22.25"/>' +
        '<line x1="16.3" y1="20.75" x2="13.7" y2="22.25"/></g>');
    },
    /* Þrumuveður */
    thunder: function () {
      return svg(
        '<path class="wx-cloud" d="M18 9.5h-1.26A8 8 0 1 0 9 19.5"/>' +
        '<polyline class="wx-bolt" points="13.2 13.5 10.4 18.4 13.4 18.4 10.8 23"/>');
    }
  };

  /*
   * Skilar SVG fyrir gefinn íkonlykil (sjá WeatherConfig.iconKey).
   * isDay: true/false — ræður sól vs. tungli.
   */
  function render(key, isDay) {
    switch (key) {
      case 'clear':    return isDay ? ICONS.clearDay() : ICONS.clearNight();
      case 'mostly':
      case 'partly':   return isDay ? ICONS.partlyDay() : ICONS.partlyNight();
      case 'overcast': return ICONS.overcast();
      case 'fog':      return ICONS.fog();
      case 'drizzle':  return ICONS.drizzle();
      case 'rain':     return ICONS.rain();
      case 'showers':  return ICONS.showers();
      case 'sleet':    return ICONS.sleet();
      case 'snow':     return ICONS.snow();
      case 'thunder':  return ICONS.thunder();
      default:         return ICONS.cloud();
    }
  }

  /* Smáíkon fyrir upplýsingareiti */
  var UI = {
    wind: svg('<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h14a3 3 0 1 1-3 3"/><path d="M3 16h7"/>', 'wx-icon-sm'),
    droplet: svg('<path d="M12 2.7s6 6.1 6 10.1a6 6 0 0 1-12 0c0-4 6-10.1 6-10.1z"/>', 'wx-icon-sm'),
    thermometer: svg('<path d="M14 14.8V4.5a2 2 0 1 0-4 0v10.3a4 4 0 1 0 4 0z"/>', 'wx-icon-sm'),
    umbrella: svg('<path d="M12 12v7a2.5 2.5 0 0 1-5 0"/><path d="M2.5 12a9.5 9.5 0 0 1 19 0z"/>', 'wx-icon-sm'),
    sunrise: svg('<path d="M12 3v5"/><path d="M5.6 10.6 4.2 9.2"/><path d="M18.4 10.6l1.4-1.4"/>' +
                 '<path d="M2 18h20"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M5 21h14"/>', 'wx-icon-sm'),
    sunset: svg('<path d="M12 8V3"/><path d="M5.6 10.6 4.2 9.2"/><path d="M18.4 10.6l1.4-1.4"/>' +
                '<path d="M2 18h20"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M5 21h14"/>', 'wx-icon-sm'),
    /* Vindör — snýr í þá átt sem vindurinn blæs (gráður frá norðri) */
    arrow: function (deg) {
      return '<svg class="wx-arrow" viewBox="0 0 24 24" aria-hidden="true" ' +
        'focusable="false" style="transform:rotate(' + deg + 'deg)">' +
        '<path d="M12 3 18.2 20.6 12 16.2 5.8 20.6z" fill="currentColor" stroke="none"/></svg>';
    },
    refresh: svg('<path d="M20.5 12a8.5 8.5 0 1 1-2.5-6"/><polyline points="18.5 2.5 18.5 6.5 14.5 6.5"/>', 'wx-icon-sm')
  };

  global.WeatherIcons = { render: render, ui: UI };
})(window);
