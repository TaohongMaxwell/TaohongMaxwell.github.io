/**
 * 旅行票根 — 画册模块
 * 处理双层筛选（类型 + 路线）、地图联动、medium-zoom
 */
(function () {
  'use strict';

  var galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  var cards = Array.from(galleryGrid.querySelectorAll('.ticket-card'));

  // --- 路线筛选按钮生成 ---
  var routeFreq = {};
  cards.forEach(function (c) {
    var r = c.getAttribute('data-route');
    routeFreq[r] = (routeFreq[r] || 0) + 1;
  });

  // 按频率降序排列路线
  var sortedRoutes = Object.keys(routeFreq).sort(function (a, b) {
    return routeFreq[b] - routeFreq[a];
  });

  var routeFilters = document.getElementById('route-filters');
  sortedRoutes.forEach(function (r) {
    var btn = document.createElement('button');
    btn.className = 'gallery-filter-btn';
    btn.setAttribute('data-route', r);
    // 格式化显示：广州-上海 → 广州→上海 3
    var label = r.replace(/-/g, '→') + ' ' + routeFreq[r];
    btn.textContent = label;
    routeFilters.appendChild(btn);
  });

  // --- 组合筛选状态 ---
  var typeFilter = 'all';
  var routeFilter = 'all';

  function applyFilters() {
    cards.forEach(function (card) {
      var type = card.getAttribute('data-type');
      var route = card.getAttribute('data-route');
      var typeMatch = typeFilter === 'all' || type === typeFilter;
      var routeMatch = routeFilter === 'all' || route === routeFilter;
      card.closest('.ticket-stack') || card; // 兼容未来叠层
      card.style.display = (typeMatch && routeMatch) ? '' : 'none';
    });
  }

  // --- 第一行：类型筛选 ---
  var typeBtns = document.querySelectorAll('.gallery-filters .gallery-filter-btn');
  typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      typeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      typeFilter = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // --- 第二行：路线筛选 ---
  var routeBtns = routeFilters.querySelectorAll('.gallery-filter-btn');
  routeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      routeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      routeFilter = btn.getAttribute('data-route');
      applyFilters();
    });
  });

  // --- 卡片点击 → 飞地图 ---
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      e.stopPropagation();
      var ticketId = card.getAttribute('data-id');
      if (window.travelMap && window.travelMap.highlightTicket) {
        window.travelMap.highlightTicket(ticketId);
        var depLat = parseFloat(card.getAttribute('data-departure-lat'));
        var depLng = parseFloat(card.getAttribute('data-departure-lng'));
        var arrLat = parseFloat(card.getAttribute('data-arrival-lat'));
        var arrLng = parseFloat(card.getAttribute('data-arrival-lng'));
        if (window.travelMap.map && !isNaN(depLat)) {
          window.travelMap.map.fitBounds(L.latLngBounds([[depLat, depLng], [arrLat, arrLng]]), { padding: [50, 50], maxZoom: 8 });
        }
      }
      var mapEl = document.getElementById('travel-map');
      if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // --- medium-zoom ---
  if (typeof mediumZoom !== 'undefined') {
    var imgs = document.querySelectorAll('.ticket-card-image img');
    if (imgs.length) mediumZoom(imgs, { margin: 1, background: 'rgba(0, 0, 0, 0.8)' });
  }
})();
