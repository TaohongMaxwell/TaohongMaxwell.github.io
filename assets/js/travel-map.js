/**
 * 旅行票根 — 地图模块
 * 使用 Leaflet 渲染旅程航线图，包括飞行大圆航线弧线和火车铁路路径
 */
(function () {
  'use strict';

  const mapEl = document.getElementById('travel-map');
  if (!mapEl) return;

  const dataScript = document.getElementById('ticket-data');
  if (!dataScript) return;

  let tickets = [];
  try {
    tickets = JSON.parse(dataScript.textContent);
  } catch (e) {
    console.error('Failed to parse ticket data:', e);
    return;
  }

  // 轨迹折线分组存储（用于图例切换）
  const routeGroups = { flight: [], train: [] };
  const markerGroups = {};

  // 初始化地图
  const map = L.map('travel-map', {
    center: [33, 113],
    zoom: 5,
    scrollWheelZoom: true,
    attributionControl: false,
  });

  // OSM 瓦片（暗色模式通过 CSS filter 反色实现）
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map);

  // 暗色模式：对地图瓦片做反色
  function applyMapTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      mapEl.classList.add('map-dark');
    } else {
      mapEl.classList.remove('map-dark');
    }
  }
  applyMapTheme();

  const themeObserver = new MutationObserver(applyMapTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // 计算大圆航线点集（球面线性插值）
  function getGreatCirclePoints(fromLat, fromLng, toLat, toLng, numPoints) {
    numPoints = numPoints || 80;
    const points = [];
    const fromLatR = fromLat * Math.PI / 180;
    const fromLngR = fromLng * Math.PI / 180;
    const toLatR = toLat * Math.PI / 180;
    const toLngR = toLng * Math.PI / 180;

    // 计算角距离
    const deltaLng = toLngR - fromLngR;
    const cosDist = Math.sin(fromLatR) * Math.sin(toLatR) +
      Math.cos(fromLatR) * Math.cos(toLatR) * Math.cos(deltaLng);
    const angularDist = Math.acos(Math.min(1, Math.max(-1, cosDist)));

    if (angularDist < 0.001) {
      return [[fromLat, fromLng], [toLat, toLng]];
    }

    for (let i = 0; i <= numPoints; i++) {
      const f = i / numPoints;
      const a = Math.sin((1 - f) * angularDist) / Math.sin(angularDist);
      const b = Math.sin(f * angularDist) / Math.sin(angularDist);

      const x = a * Math.cos(fromLatR) * Math.cos(fromLngR) + b * Math.cos(toLatR) * Math.cos(toLngR);
      const y = a * Math.cos(fromLatR) * Math.sin(fromLngR) + b * Math.cos(toLatR) * Math.sin(toLngR);
      const z = a * Math.sin(fromLatR) + b * Math.sin(toLatR);

      const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI;
      const lng = Math.atan2(y, x) * 180 / Math.PI;

      points.push([lat, lng]);
    }

    return points;
  }

  // 渲染单条路线
  function renderRoute(ticket, index) {
    const fromLat = parseFloat(ticket.departure.lat);
    const fromLng = parseFloat(ticket.departure.lng);
    const toLat = parseFloat(ticket.arrival.lat);
    const toLng = parseFloat(ticket.arrival.lng);
    const routeColor = ticket.routeColor || (ticket.type === 'flight' ? '#3b82f6' : '#10b981');

    let polylinePoints;

    if (ticket.type === 'train' && ticket.route && ticket.route.length > 1) {
      // 铁路：使用预计算的路线
      polylinePoints = ticket.route;
    } else {
      // 机票 / 无铁路数据：大圆航线
      polylinePoints = getGreatCirclePoints(fromLat, fromLng, toLat, toLng);
    }

    const polyline = L.polyline(polylinePoints, {
      color: routeColor,
      weight: 2.5,
      opacity: 0.7,
      dashArray: ticket.type === 'train' ? '8 4' : null,
      ticketId: ticket.id,
    }).addTo(map);

    polyline.bindTooltip(
      '<div class="travel-tooltip">' +
      '<strong>' + ticket.departure.city + ' → ' + ticket.arrival.city + '</strong>' +
      ticket.number + ' · ' + ticket.date +
      '</div>',
      { sticky: true }
    );

    polyline.on('click', function () {
      highlightTicketCard(ticket.id);
    });

    routeGroups[ticket.type].push(polyline);
  }

  // 渲染起止点标记（合并重复车站，显示车站/机场名）
  function renderMarkers() {
    const cityMap = {};

    tickets.forEach(function (ticket) {
      [ticket.departure, ticket.arrival].forEach(function (loc) {
        const key = loc.lat + ',' + loc.lng;
        if (!cityMap[key]) {
          cityMap[key] = { city: loc.city, lat: parseFloat(loc.lat), lng: parseFloat(loc.lng), count: 0, stations: new Set() };
        }
        cityMap[key].count++;
        if (loc.station) cityMap[key].stations.add(loc.station);
      });
    });

    Object.values(cityMap).forEach(function (city) {
      const size = Math.min(16, 8 + city.count * 2);
      const marker = L.circleMarker([city.lat, city.lng], {
        radius: size,
        fillColor: '#10b981',
        fillOpacity: 0.8,
        color: '#fff',
        weight: 2,
      }).addTo(map);

      var tooltip = '<strong>' + city.city + '</strong>';
      if (city.stations.size > 0) {
        tooltip += '<br><small>' + Array.from(city.stations).join(' · ') + '</small>';
      }
      tooltip += '<br>' + city.count + ' trips';
      marker.bindTooltip(tooltip, { direction: 'top' });
    });
  }

  // 画册卡片高亮
  function highlightTicketCard(ticketId) {
    document.querySelectorAll('.ticket-card.highlight').forEach(function (el) {
      el.classList.remove('highlight');
    });
    const card = document.querySelector('.ticket-card[data-id="' + ticketId + '"]');
    if (card) {
      card.classList.add('highlight');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 3 秒后自动取消高亮
      setTimeout(function () {
        card.classList.remove('highlight');
      }, 3000);
    }
  }

  // 图例切换
  document.getElementById('legend-flight').addEventListener('change', function () {
    routeGroups.flight.forEach(function (p) {
      if (this.checked) {
        map.addLayer(p);
      } else {
        map.removeLayer(p);
      }
    }, this);
  });

  document.getElementById('legend-train').addEventListener('change', function () {
    routeGroups.train.forEach(function (p) {
      if (this.checked) {
        map.addLayer(p);
      } else {
        map.removeLayer(p);
      }
    }, this);
  });

  // 渲染全部票根
  tickets.forEach(function (ticket, index) {
    renderRoute(ticket, index);
  });

  renderMarkers();

  // 自适应视野
  if (tickets.length > 0) {
    const allPoints = [];
    tickets.forEach(function (t) {
      allPoints.push([parseFloat(t.departure.lat), parseFloat(t.departure.lng)]);
      allPoints.push([parseFloat(t.arrival.lat), parseFloat(t.arrival.lng)]);
    });
    const bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [30, 30] });
  }

  // 统计面板
  function computeStats() {
    const uniqueCities = new Set();
    const uniqueCountries = new Set();
    let totalDistance = 0;
    let totalSpent = 0;

    tickets.forEach(function (t) {
      uniqueCities.add(t.departure.city);
      uniqueCities.add(t.arrival.city);
      if (t.departure.country) uniqueCountries.add(t.departure.country);
      if (t.arrival.country) uniqueCountries.add(t.arrival.country);
      if (t.price) totalSpent += t.price;

      // Haversine distance (km)
      const R = 6371;
      const dLat = (t.arrival.lat - t.departure.lat) * Math.PI / 180;
      const dLng = (t.arrival.lng - t.departure.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(t.departure.lat * Math.PI / 180) * Math.cos(t.arrival.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      totalDistance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    });

    return {
      trips: tickets.length,
      cities: uniqueCities.size,
      countries: uniqueCountries.size,
      distance: Math.round(totalDistance),
      spent: totalSpent,
    };
  }

  function renderStats() {
    const stats = computeStats();
    const container = document.getElementById('travel-stats');
    if (!container) return;

    const values = container.querySelectorAll('.stat-value');
    values[0].textContent = stats.trips;
    values[1].textContent = stats.countries;
    values[2].textContent = stats.cities;
    values[3].textContent = stats.distance.toLocaleString();
    values[4].textContent = '¥' + stats.spent.toLocaleString();
  }

  renderStats();

  // 暴露接口给 gallery 模块
  window.travelMap = {
    highlightTicket: highlightTicketCard,
    map: map,
  };
})();
