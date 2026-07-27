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
    scrollWheelZoom: true,
    dragging: true,
    doubleClickZoom: true,
    touchZoom: true,
    zoomControl: true,
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
    var routeColor = heatColor(freq, maxRouteFreq);
    var weight = 2.5;

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

    // 每座城市的交通方式统计
    var cityModes = {}; // city -> { flights: n, trains: n }
    tickets.forEach(function (t) {
      [t.departure, t.arrival].forEach(function (loc) {
        if (!cityModes[loc.city]) cityModes[loc.city] = { flights: 0, trains: 0 };
        if (t.type === 'flight') cityModes[loc.city].flights++;
        else cityModes[loc.city].trains++;
      });
    });

    // 每座城市：计算质心 + 覆盖半径
    Object.keys(cityStations).forEach(function (city) {
      var stations = cityStations[city];
      var sumLat = 0, sumLng = 0;
      stations.forEach(function (s) { sumLat += s.lat; sumLng += s.lng; });
      var cLat = sumLat / stations.length;
      var cLng = sumLng / stations.length;

      var maxDist = 0;
      stations.forEach(function (s) {
        var d = haversineKm(cLat, cLng, s.lat, s.lng);
        if (d > maxDist) maxDist = d;
      });
      var radiusKm = maxDist + 15;
      var color = heatColor(cityTotal[city] || 1, maxCityVisit);
      var modes = cityModes[city] || { flights: 0, trains: 0 };
      var stationNames = [...new Set(stations.map(function(s) { return s.station; }).filter(Boolean))];

      // Tooltip: 城市名 + 飞机/火车次数 + 站场列表
      var tooltip = '<strong>' + city + '</strong>';
      tooltip += '<br>' + cityTotal[city] + ' trips';
      if (modes.flights > 0) tooltip += ' · ' + modes.flights + ' flights';
      if (modes.trains > 0) tooltip += ' · ' + modes.trains + ' trains';
      if (stationNames.length > 0) {
        tooltip += '<br><small>' + stationNames.join(' · ') + '</small>';
      }

      // 城市空心圆（固定像素大小）+ tooltip
      L.circleMarker([cLat, cLng], {
        radius: 5,
        fillColor: color,
        fillOpacity: 1,
        color: 'transparent',
        weight: 0
      }).bindTooltip(tooltip, { direction: 'top' }).addTo(map);
    });

    // 各站场实心点
    Object.values(stationMap).forEach(function (station) {
      var color = heatColor(cityTotal[station.city] || 1, maxCityVisit);
      L.circleMarker([station.lat, station.lng], {
        radius: 5,
        fillColor: color,
        fillOpacity: 0,
        color: '#fff',
        weight: 1.5,
        opacity: 0,
        interactive: false
      }).addTo(map);
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

  // 路线频率 + 城市访问次数 → 统一热力标尺
  var routeFreq = {};
  var cityVisit = {};
  tickets.forEach(function (t) {
    var key = t.departure.city + '→' + t.arrival.city;
    routeFreq[key] = (routeFreq[key] || 0) + 1;
    cityVisit[t.departure.city] = (cityVisit[t.departure.city] || 0) + 1;
    cityVisit[t.arrival.city] = (cityVisit[t.arrival.city] || 0) + 1;
  });
  var globalMax = 0;
  Object.values(routeFreq).forEach(function (f) { if (f > globalMax) globalMax = f; });
  Object.values(cityVisit).forEach(function (f) { if (f > globalMax) globalMax = f; });

  // 统一热力色函数
  // 通用 rainbow 热力色（各维度独立归一化）
  function heatColor(count, max) {
    if (max <= 1) return 'hsl(240, 85%, 50%)';
    var ratio = (count - 1) / (max - 1);
    var hue = 240 - ratio * 240; // 蓝240→青180→绿120→黄60→红0
    return 'hsl(' + Math.round(hue) + ', 85%, 50%)';
  }

  // 路线最大频率
  var maxRouteFreq = 0;
  Object.values(routeFreq).forEach(function (f) { if (f > maxRouteFreq) maxRouteFreq = f; });

  // 城市最大访问次数
  var maxCityVisit = 0;
  Object.values(cityVisit).forEach(function (f) { if (f > maxCityVisit) maxCityVisit = f; });

  // 渲染全部票根（地图上只画一条路线）
  var drawnRoutes = {};
  tickets.forEach(function (ticket, index) {
    var key = ticket.departure.city + '→' + ticket.arrival.city;
    if (!drawnRoutes[key]) {
      drawnRoutes[key] = true;
      renderRoute(ticket, index, routeFreq[key]);
    }
  });

  renderMarkers();

  // 自适应视野 + 复位功能
  var defaultView = null;
  if (tickets.length > 0) {
    var allPoints = [];
    tickets.forEach(function (t) {
      allPoints.push([parseFloat(t.departure.lat), parseFloat(t.departure.lng)]);
      allPoints.push([parseFloat(t.arrival.lat), parseFloat(t.arrival.lng)]);
    });
    var bounds = L.latLngBounds(allPoints);
    map.fitBounds(bounds, { padding: [40, 40] });
    defaultView = { bounds: bounds, padding: [40, 40] };
  }

  // 复位按钮
  var resetBtn = L.control({ position: 'topright' });
  resetBtn.onAdd = function () {
    var div = L.DomUtil.create('div', 'map-reset-btn');
    div.innerHTML = '&#8634;';
    div.title = 'Reset view';
    div.onclick = function (e) {
      e.stopPropagation();
      if (defaultView) map.fitBounds(defaultView.bounds, { padding: defaultView.padding });
    };
    return div;
  };
  resetBtn.addTo(map);

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
