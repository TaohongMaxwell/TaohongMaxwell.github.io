/**
 * 旅行票根 — 画册模块
 * 处理卡片筛选、地图联动、medium-zoom 集成
 */
(function () {
  'use strict';

  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  const cards = Array.from(galleryGrid.querySelectorAll('.ticket-card'));

  // 筛选按钮
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        if (filter === 'all' || card.getAttribute('data-type') === filter) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 卡片点击 → 定位到地图对应路线
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      const ticketId = card.getAttribute('data-id');
      if (window.travelMap && window.travelMap.highlightTicket) {
        window.travelMap.highlightTicket(ticketId);

        // 飞往对应路线的视野
        const depLat = parseFloat(card.getAttribute('data-departure-lat'));
        const depLng = parseFloat(card.getAttribute('data-departure-lng'));
        const arrLat = parseFloat(card.getAttribute('data-arrival-lat'));
        const arrLng = parseFloat(card.getAttribute('data-arrival-lng'));

        if (window.travelMap.map && !isNaN(depLat)) {
          const bounds = L.latLngBounds([[depLat, depLng], [arrLat, arrLng]]);
          window.travelMap.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
        }
      }

      // 滚动地图到视野
      const mapEl = document.getElementById('travel-map');
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // 对新增的图片启用 medium-zoom
  if (typeof mediumZoom !== 'undefined') {
    const ticketImages = document.querySelectorAll('.ticket-card-image img');
    if (ticketImages.length > 0) {
      mediumZoom(ticketImages, {
        margin: 1,
        background: 'rgba(0, 0, 0, 0.8)',
      });
    }
  }
})();
