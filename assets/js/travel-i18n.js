/**
 * 旅行票根 — 中英双语切换
 */
(function () {
  'use strict';

  var translations = {
    en: {
      journeyMap: 'Journey Map',
      ticketGallery: 'Ticket Gallery',
      flights: '✈ Flights',
      trains: '\u{1F684} Trains',
      flightsShort: '✈ Flights',
      trainsShort: '\u{1F684} Trains',
      all: 'All',
      allRoutes: 'All Routes',
      totalTrips: 'Total Trips',
      countries: 'Countries & Regions',
      cities: 'Cities',
      distance: 'Distance (km)',
      totalSpent: 'Total Spent',
      flight: 'Flight',
      train: 'Train',
      close: 'Close',
      trips: 'trips',
    },
    zh: {
      journeyMap: '航程图',
      ticketGallery: '票根画册',
      flights: '✈ 飞机',
      trains: '\u{1F684} 火车',
      flightsShort: '✈ 飞机',
      trainsShort: '\u{1F684} 火车',
      all: '全部',
      allRoutes: '全部路线',
      totalTrips: '旅程数',
      countries: '国家/地区',
      cities: '城市',
      distance: '里程 (km)',
      totalSpent: '总花费',
      flight: '机票',
      train: '火车票',
      close: '关闭',
      trips: '次',
    }
  };

  // 读取语言偏好（默认英文）
  var lang = (localStorage.getItem('travel-lang') || 'en');
  if (!translations[lang]) lang = 'en';

  // 翻译所有带 data-i18n 属性的元素
  function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
    // 翻译 title 属性
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-title');
      if (translations[lang][key]) {
        el.title = translations[lang][key];
      }
    });
    // 更新切换按钮文字
    var btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.textContent = lang === 'zh' ? 'EN' : '中';
    }
    // 更新路线筛选按钮（动态生成，走 i18n 逻辑）
    document.querySelectorAll('#route-filters .gallery-filter-btn').forEach(function (b) {
      var route = b.getAttribute('data-route');
      if (route === 'all') {
        b.textContent = translations[lang].allRoutes;
      }
    });
    // 更新地图 tooltip（重新绑定需要刷新）
    localStorage.setItem('travel-lang', lang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyLang();

    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        lang = lang === 'zh' ? 'en' : 'zh';
        applyLang();
        window.location.reload();
      });
    }
  });

  // 暴露翻译函数给其他模块
  window.travelI18n = {
    t: function (key) { return translations[lang][key] || key; },
    lang: function () { return lang; }
  };
})();
