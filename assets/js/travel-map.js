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

  // 初始化地图（静态模式：禁用所有交互）
  const map = L.map('travel-map', {
    center: [35, 105],
    zoom: 5,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    touchZoom: false,
    zoomControl: false,
    attributionControl: false,
    boxZoom: false,
    keyboard: false,
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
  function renderRoute(ticket, index, freq) {
    freq = freq || 1;
    const fromLat = parseFloat(ticket.departure.lat);
    const fromLng = parseFloat(ticket.departure.lng);
    const toLat = parseFloat(ticket.arrival.lat);
    const toLng = parseFloat(ticket.arrival.lng);
    const routeColor = ticket.routeColor || (ticket.type === 'flight' ? '#3b82f6' : '#10b981');

    // 路线粗细按频率：1次=2.5px，2次=4px，3次=5.5px，4+次=7px
    var weight = 2.5 + (freq - 1) * 2;
    if (weight > 7) weight = 7;

    let polylinePoints;

    if (ticket.type === 'train' && ticket.route && ticket.route.length > 1) {
      polylinePoints = ticket.route;
    } else {
      polylinePoints = getGreatCirclePoints(fromLat, fromLng, toLat, toLng);
    }

    const polyline = L.polyline(polylinePoints, {
      color: routeColor,
      weight: weight,
      opacity: Math.min(0.85, 0.5 + freq * 0.1),
      dashArray: ticket.type === 'train' ? '8 4' : null,
      ticketId: ticket.id,
    }).addTo(map);

    polyline.bindTooltip(
      '<div class="travel-tooltip">' +
      '<strong>' + ticket.departure.city + ' → ' + ticket.arrival.city + '</strong>' +
      (freq > 1 ? freq + ' ' + (window.travelI18n ? window.travelI18n.t('trips') : 'trips') + ' · ' : '') + ticket.number + ' · ' + ticket.date +
      '</div>',
      { sticky: true }
    );

    polyline.on('click', function () {
      highlightTicketCard(ticket.id);
    });

    routeGroups[ticket.type].push(polyline);
  }

  // 渲染城市圆圈 + 站场实心点 + 中国边界
  function renderMarkers() {
    const stationMap = {};
    const cityTotal = {};
    const cityStations = {}; // city -> [{lat, lng, station}]

    tickets.forEach(function (ticket) {
      [ticket.departure, ticket.arrival].forEach(function (loc) {
        const key = loc.lat + ',' + loc.lng;
        if (!stationMap[key]) {
          stationMap[key] = { city: loc.city, lat: parseFloat(loc.lat), lng: parseFloat(loc.lng), count: 0, stations: new Set() };
        }
        stationMap[key].count++;
        if (loc.station) stationMap[key].stations.add(loc.station);
        cityTotal[loc.city] = (cityTotal[loc.city] || 0) + 1;
        if (!cityStations[loc.city]) cityStations[loc.city] = [];
        cityStations[loc.city].push({ lat: parseFloat(loc.lat), lng: parseFloat(loc.lng), station: loc.station });
      });
    });

    var maxCityCount = 0;
    Object.values(cityTotal).forEach(function (c) { if (c > maxCityCount) maxCityCount = c; });

    function cityColor(count) {
      var ratio = maxCityCount > 1 ? (count - 1) / (maxCityCount - 1) : 0;
      var hue = 200 - ratio * 200;
      return 'hsl(' + Math.round(hue) + ', 70%, 55%)';
    }

    // Haversine distance in km
    function haversineKm(lat1, lng1, lat2, lng2) {
      var R = 6371;
      var dLat = (lat2 - lat1) * Math.PI / 180;
      var dLng = (lng2 - lng1) * Math.PI / 180;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // 每座城市：计算质心 + 覆盖半径
    Object.keys(cityStations).forEach(function (city) {
      var stations = cityStations[city];
      // 质心
      var sumLat = 0, sumLng = 0;
      stations.forEach(function (s) { sumLat += s.lat; sumLng += s.lng; });
      var cLat = sumLat / stations.length;
      var cLng = sumLng / stations.length;

      // 最大距离 + 15km padding
      var maxDist = 0;
      stations.forEach(function (s) {
        var d = haversineKm(cLat, cLng, s.lat, s.lng);
        if (d > maxDist) maxDist = d;
      });
      var radiusKm = maxDist + 15;

      // 像素换算（粗略：1° ≈ 111km 在纬度方向上）
      var radiusPx = radiusKm * 1000 / (111320 * Math.cos(cLat * Math.PI / 180));
      // Leaflet 的 radius 是像素，在 zoom level 需要换算。用 circle 而非 circleMarker 可以用米作单位
      var color = cityColor(cityTotal[city] || 1);

      // 城市空心圆（用 circle 以米为单位）
      L.circle([cLat, cLng], {
        radius: radiusKm * 1000,
        color: color,
        weight: 1.5,
        fill: false,
        opacity: 0.6,
        dashArray: '4 3'
      }).addTo(map);

      // 城市名标签
      L.circleMarker([cLat, cLng], {
        radius: 1,
        fill: false,
        color: 'transparent',
        weight: 0
      }).bindTooltip('<strong>' + city + '</strong><br>' + cityTotal[city] + ' ' + (window.travelI18n ? window.travelI18n.t('trips') : 'trips'), { direction: 'top', permanent: false }).addTo(map);
    });

    // 各站场实心点
    Object.values(stationMap).forEach(function (station) {
      var color = cityColor(cityTotal[station.city] || 1);
      L.circleMarker([station.lat, station.lng], {
        radius: 5,
        fillColor: color,
        fillOpacity: 0.9,
        color: '#fff',
        weight: 1.5,
      }).addTo(map).bindTooltip(station.station + '', { direction: 'top' });
    });

    // 中国省级行政区描边（本地 GeoJSON，异步加载不阻塞渲染）
    // 外国国界（1px/50%）
    fetch('/data/world-countries.json')
      .then(function (r) { return r.json(); })
      .then(function (topo) {
        if (typeof topojson === 'undefined') return;
        L.geoJSON(topojson.feature(topo, topo.objects.countries), {
          style: { color: '#bbb', weight: 1, fill: false, opacity: 0.5 }
        }).addTo(map);
      })
      .catch(function () {});
    // 中国国界（2px/50%）
    fetch('/data/china-border.json')
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        L.geoJSON(geo, {
          style: { color: '#999', weight: 2, fill: false, opacity: 0.5 }
        }).addTo(map);
      })
      .catch(function () {});
    // 中国省界（1px/50%）
    fetch('/data/china-provinces.json')
      .then(function (r) { return r.json(); })
      .then(function (geo) {
        L.geoJSON(geo, {
          style: { color: '#bbb', weight: 1, fill: false, opacity: 0.5 }
        }).addTo(map);
      })
      .catch(function () {});
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

  // 路线频率：同出发→到达的票根数 → 决定线粗
  var routeFreq = {};
  tickets.forEach(function (t) {
    var key = t.departure.city + '→' + t.arrival.city;
    routeFreq[key] = (routeFreq[key] || 0) + 1;
  });

  // 渲染全部票根（地图上只画一条路线，取最高频率）
  var drawnRoutes = {};
  tickets.forEach(function (ticket, index) {
    var key = ticket.departure.city + '→' + ticket.arrival.city;
    if (!drawnRoutes[key]) {
      drawnRoutes[key] = true;
      renderRoute(ticket, index, routeFreq[key]);
    }
  });

  renderMarkers();

  // 自适应视野：包含所有出发/到达城市
  if (tickets.length > 0) {
    var allPoints = [];
    tickets.forEach(function (t) {
      allPoints.push([parseFloat(t.departure.lat), parseFloat(t.departure.lng)]);
      allPoints.push([parseFloat(t.arrival.lat), parseFloat(t.arrival.lng)]);
    });
    map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40] });
  }
  map.dragging.disable();

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
    values[4].textContent = '¥' + Math.round(stats.spent).toLocaleString();
  }

  renderStats();

  // 暴露接口给 gallery 模块
  window.travelMap = {
    highlightTicket: highlightTicketCard,
    map: map,
  };
})();
