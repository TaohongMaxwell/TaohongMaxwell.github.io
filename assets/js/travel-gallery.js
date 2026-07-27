/**
 * 旅行票根 — 画册模块
 * 双层筛选、文件夹收纳（模态框）、地图联动、medium-zoom
 */
(function () {
  'use strict';

  var galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  var cards = Array.from(galleryGrid.querySelectorAll('.ticket-card'));

  // --- 路线文件夹分组 ---
  var routeMap = {};
  cards.forEach(function (c) {
    var r = c.getAttribute('data-route');
    if (!routeMap[r]) routeMap[r] = [];
    routeMap[r].push(c);
  });

  // 对 >1 卡片的路线包装为文件夹
  Object.entries(routeMap).forEach(function (entry) {
    var route = entry[0];
    var group = entry[1];
    if (group.length < 2) return;

    var folder = document.createElement('div');
    folder.className = 'ticket-folder collapsed';
    folder.setAttribute('data-route', route);
    // badge
    var badge = document.createElement('span');
    badge.className = 'folder-badge';
    badge.textContent = group.length;
    folder.appendChild(badge);
    // 包装卡片
    var first = group[0];
    first.parentNode.insertBefore(folder, first);
    group.forEach(function (c) { folder.appendChild(c); });
  });

  // --- 模态框 ---
  var overlay = document.getElementById('folder-overlay');
  var modal = document.getElementById('folder-modal');
  var folderTitle = document.getElementById('folder-route-title');
  var folderBody = document.getElementById('folder-body');
  var closeBtn = document.getElementById('folder-close');

  // 遮罩上拦截滚轮/触摸，但放行模态框内部滚动
  overlay.addEventListener('wheel', function (e) {
    if (!modal.contains(e.target)) e.preventDefault();
  }, { passive: false });
  overlay.addEventListener('touchmove', function (e) {
    if (!modal.contains(e.target)) e.preventDefault();
  }, { passive: false });

  function openFolder(folder) {
    var route = folder.getAttribute('data-route');
    var groupCards = Array.from(folder.querySelectorAll('.ticket-card'));
    folderTitle.textContent = route.replace(/-/g, ' → ');
    folderBody.innerHTML = '';
    groupCards.forEach(function (c) {
      var clone = c.cloneNode(true);
      clone.addEventListener('click', function () {
        if (window.travelMap && window.travelMap.highlightTicket) {
          window.travelMap.highlightTicket(c.getAttribute('data-id'));
        }
        closeFolder();
        var mapEl = document.getElementById('travel-map');
        if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      folderBody.appendChild(clone);
    });
    overlay.classList.add('open');
    document.body.classList.add('folder-locked');
    document.documentElement.classList.add('folder-locked');
  }

  function closeFolder() {
    overlay.classList.remove('open');
    document.body.classList.remove('folder-locked');
    document.documentElement.classList.remove('folder-locked');
  }

  closeBtn.addEventListener('click', closeFolder);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeFolder();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay.classList.contains('open')) closeFolder();
  });

  // 文件夹点击
  var folders = document.querySelectorAll('.ticket-folder');
  folders.forEach(function (f) {
    f.addEventListener('click', function (e) {
      e.stopPropagation();
      openFolder(f);
    });
  });

  // --- 路线筛选按钮生成 ---
  var routeFreq = {};
  cards.forEach(function (c) {
    var r = c.getAttribute('data-route');
    routeFreq[r] = (routeFreq[r] || 0) + 1;
  });
  var sortedRoutes = Object.keys(routeFreq).sort(function (a, b) {
    return routeFreq[b] - routeFreq[a];
  });
  var routeFilters = document.getElementById('route-filters');
  sortedRoutes.forEach(function (r) {
    var btn = document.createElement('button');
    btn.className = 'gallery-filter-btn';
    btn.setAttribute('data-route', r);
    btn.textContent = r.replace(/-/g, '→') + ' ' + routeFreq[r];
    routeFilters.appendChild(btn);
  });

  // --- 组合筛选 ---
  var typeFilter = 'all';
  var routeFilter = 'all';
  function applyFilters() {
    cards.forEach(function (card) {
      var type = card.getAttribute('data-type');
      var route = card.getAttribute('data-route');
      var typeMatch = typeFilter === 'all' || type === typeFilter;
      var routeMatch = routeFilter === 'all' || route === routeFilter;
      // 隐藏卡片本身；文件夹容器不影响筛选逻辑
      card.style.display = (typeMatch && routeMatch) ? '' : 'none';
    });
    // 如果文件夹内所有卡片都被隐藏，隐藏文件夹
    document.querySelectorAll('.ticket-folder').forEach(function (f) {
      var vis = Array.from(f.querySelectorAll('.ticket-card')).some(function (c) {
        return c.style.display !== 'none';
      });
      f.style.display = vis ? '' : 'none';
    });
  }

  // 类型筛选
  var typeBtns = document.querySelectorAll('.gallery-filters .gallery-filter-btn');
  typeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      typeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      typeFilter = btn.getAttribute('data-filter');
      applyFilters();
    });
  });

  // 路线筛选
  var routeBtns = routeFilters.querySelectorAll('.gallery-filter-btn');
  routeBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      routeBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      routeFilter = btn.getAttribute('data-route');
      applyFilters();
    });
  });

  // --- 非文件夹卡片点击 → 飞地图 ---
  cards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      // 文件夹内的卡片由文件夹点击处理
      if (card.closest('.ticket-folder')) return;
      e.stopPropagation();
      if (window.travelMap && window.travelMap.highlightTicket) {
        window.travelMap.highlightTicket(card.getAttribute('data-id'));
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
