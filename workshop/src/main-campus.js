import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Chart } from "chart.js/auto";
import "./style.css";
import { CAMPUS_CENTER } from "./campusData.js";
import { mockIncidents, safePaths } from "./crimeData.js";
import { initialEvents } from "./eventsData.js";
import { campusSim } from "./campusSimulator.js";

// ==========================================
// PORTAL GLOBAL STATE
// ==========================================

let activeRoute = "campus"; // 'campus', 'events', 'safety'
let mapInstance = null;
let mapLayersGroup = null; // LayerGroup for leaflet to clear easily

// Shared Map Overlay state
let campusOverlayMode = "none"; // 'none', 'heatmap', 'wifi'
let safetyShowEscort = false;

// Data state synced to LocalStorage
let events = [];
let bookmarks = [];
let bookedTickets = [];
let safetyIncidents = [];

// Form / Drawer state
let selectedBuildingId = "science_hall";
let activeEvent = null;
let activeBookingTier = "general";
let activeBookingQty = 1;
let activePromoDiscount = 0;
let activePromoCode = "";

// Global Chart Instances
let campusChartInstance = null;
let safetyChartInstance = null;
let creatorSalesChart = null;
let creatorRevenueChart = null;

// ==========================================
// STORAGE SYNC & INITIALIZATION
// ==========================================

function syncLocalStorage() {
  // Events
  const savedEvents = localStorage.getItem("apex_events");
  if (savedEvents) {
    events = JSON.parse(savedEvents);
  } else {
    events = [...initialEvents];
    localStorage.setItem("apex_events", JSON.stringify(events));
  }

  // Bookmarks
  const savedBookmarks = localStorage.getItem("apex_bookmarks");
  bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];

  // Tickets
  const savedTickets = localStorage.getItem("apex_tickets");
  bookedTickets = savedTickets ? JSON.parse(savedTickets) : [];

  // Incidents
  const savedIncidents = localStorage.getItem("apex_incidents");
  if (savedIncidents) {
    safetyIncidents = JSON.parse(savedIncidents);
  } else {
    safetyIncidents = [...mockIncidents];
    localStorage.setItem("apex_incidents", JSON.stringify(safetyIncidents));
  }
}

function updateSharedBadges() {
  document.getElementById("bookmarks-badge").textContent = bookmarks.length;
  document.getElementById("tickets-badge").textContent = bookedTickets.length;
}

// ==========================================
// TOAST ALERTS SYSTEM
// ==========================================

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  let icon = "fa-circle-info";
  if (type === "success") icon = "fa-circle-check";
  if (type === "error") icon = "fa-triangle-exclamation";
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-closing");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// DYNAMIC VIEW ROUTER
// ==========================================

function switchRoute(route) {
  activeRoute = route;

  // Toggle active sidebar link
  document.querySelectorAll(".sidebar-menu .menu-item").forEach(btn => btn.classList.remove("active"));
  document.getElementById(`menu-btn-${route}`).classList.add("active");

  // Toggle visible app panels
  document.querySelectorAll(".app-sub-panel").forEach(panel => panel.classList.remove("active"));
  document.getElementById(`panel-${route}-left`).classList.add("active");
  document.getElementById(`panel-${route}-right`).classList.add("active");

  // Toggle header widgets
  document.getElementById("header-sim-widgets").style.display = route === "campus" ? "flex" : "none";
  document.getElementById("header-events-widgets").style.display = route === "events" ? "flex" : "none";
  document.getElementById("header-safety-widgets").style.display = route === "safety" ? "flex" : "none";

  // Breadcrumbs text
  const breadcrumbsApp = document.getElementById("breadcrumb-app-name");
  const breadcrumbsSub = document.getElementById("breadcrumb-sub-name");
  if (route === "campus") {
    breadcrumbsApp.textContent = "Campus Digital Twin";
    breadcrumbsSub.textContent = "Edge Monitoring Station";
  } else if (route === "events") {
    breadcrumbsApp.textContent = "GatherGo Events";
    breadcrumbsSub.textContent = "Explore & Book Passes";
  } else if (route === "safety") {
    breadcrumbsApp.textContent = "Safety Radar";
    breadcrumbsSub.textContent = "Incident Threat Maps";
  }

  // Toggle map controller headers
  document.getElementById("map-controls-campus").style.display = route === "campus" ? "flex" : "none";
  document.getElementById("map-controls-events").style.display = route === "events" ? "flex" : "none";
  document.getElementById("map-controls-safety").style.display = route === "safety" ? "flex" : "none";

  // Re-build map layers
  updateMapLayers();

  // Load View Charts
  if (route === "campus") {
    loadCampusChart();
  } else if (route === "safety") {
    loadSafetyChart();
  }
}

// ==========================================
// SHARED MAP ENGINE & LAYER ADAPTERS
// ==========================================

function initMapEngine() {
  if (mapInstance) return;

  mapInstance = L.map("leaflet-map-shared", {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView(CAMPUS_CENTER, 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapInstance);

  L.control.zoom({ position: "bottomright" }).addTo(mapInstance);

  mapLayersGroup = L.layerGroup().addTo(mapInstance);
}

function updateMapLayers() {
  if (!mapInstance || !mapLayersGroup) return;
  mapLayersGroup.clearLayers();

  const legendTitle = document.getElementById("map-legend-title");
  const legendItems = document.getElementById("map-legend-items");

  if (activeRoute === "campus") {
    legendTitle.textContent = "Campus State";
    legendItems.innerHTML = `
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(0, 240, 255, 0.4); border-color: var(--neon-cyan);"></span>
        <span>Nominal Node</span>
      </div>
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(255, 183, 0, 0.4); border-color: var(--warning);"></span>
        <span>Warning Active</span>
      </div>
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(255, 59, 48, 0.4); border-color: var(--danger);"></span>
        <span>Critical Anomaly</span>
      </div>
    `;

    // Render campus polygons
    campusSim.buildings.forEach(bld => {
      let fillColor = "#00f0ff";
      let fillOpacity = 0.4;

      if (campusOverlayMode === "heatmap") {
        // occupancy gradient green to red
        const ratio = bld.occupancy / bld.maxOccupancy;
        fillColor = ratio > 0.7 ? "#ff3b30" : ratio > 0.3 ? "#ffb700" : "#00ff66";
        fillOpacity = 0.55;
      } else if (campusOverlayMode === "wifi") {
        // wifi loading purple
        fillColor = "#ae00ff";
        const wifiRatio = bld.wifiConnections / (bld.maxOccupancy * 1.25);
        fillOpacity = Math.min(0.8, Math.max(0.15, wifiRatio));
      } else {
        // default systemState
        fillColor = bld.systemState === "warning" ? "#ffb700" : bld.systemState === "critical" ? "#ff3b30" : "#00f0ff";
      }

      const polygon = L.polygon(bld.coordinates, {
        color: fillColor,
        weight: 1.5,
        fillColor: fillColor,
        fillOpacity: fillOpacity
      }).addTo(mapLayersGroup);

      // Tooltips & Clicks
      polygon.bindTooltip(`<strong>${bld.name}</strong><br>State: ${bld.systemState.toUpperCase()}`, { permanent: false, direction: "top" });
      polygon.on("click", () => {
        selectBuilding(bld.id);
      });
    });

  } else if (activeRoute === "events") {
    legendTitle.textContent = "Venue Key";
    legendItems.innerHTML = `
      <div class="legend-row">
        <div style="width:10px; height:10px; border-radius:50%; background:#ae00ff; box-shadow:0 0 6px var(--neon-purple-glow);"></div>
        <span>Event Location</span>
      </div>
    `;

    // Render Event Markers
    events.forEach(evt => {
      const lat = parseFloat(evt.coordinates[0]);
      const lng = parseFloat(evt.coordinates[1]);
      const iconColor = { Concerts: "#FF007A", Tech: "#00F0FF", Arts: "#9D4EDD", Sports: "#00F5D4" }[evt.category] || "#9D4EDD";

      const neonIcon = L.divIcon({
        className: "custom-event-marker",
        html: `<div style="width:14px; height:14px; background:${iconColor}; border:2px solid #fff; border-radius:50%; box-shadow:0 0 10px ${iconColor}; cursor:pointer;"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const marker = L.marker([lat, lng], { icon: neonIcon }).addTo(mapLayersGroup);
      marker.bindTooltip(`<strong>${evt.title}</strong><br>Click to open details`, { direction: "top" });
      marker.on("click", () => {
        openEventDrawer(evt.id);
      });
    });

  } else if (activeRoute === "safety") {
    legendTitle.textContent = "Threat Scale";
    legendItems.innerHTML = `
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(0, 255, 102, 0.4); border-color: var(--success);"></span>
        <span>Low Threat</span>
      </div>
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(255, 183, 0, 0.4); border-color: var(--warning);"></span>
        <span>Medium Alert</span>
      </div>
      <div class="legend-row">
        <span class="legend-color" style="background: rgba(255, 59, 48, 0.4); border-color: var(--danger);"></span>
        <span>High Danger</span>
      </div>
    `;

    // Render Crime Markers
    safetyIncidents.forEach(inc => {
      const lat = parseFloat(inc.coordinates[0]);
      const lng = parseFloat(inc.coordinates[1]);
      const color = inc.resolved ? "#00ff66" : { low: "#ffb700", medium: "#ff9f00", high: "#ff3b30" }[inc.threatLevel] || "#ff3b30";

      const crimeIcon = L.divIcon({
        className: "custom-crime-marker",
        html: `<div class="${inc.resolved ? '' : 'animate-ping'}" style="width:12px; height:12px; background:${color}; border:2px solid #fff; border-radius:50%; box-shadow:0 0 8px ${color};"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([lat, lng], { icon: crimeIcon }).addTo(mapLayersGroup);
      
      const resolveButtonHtml = inc.resolved ? '' : `<br><button class="btn-resolve-crime" onclick="window.resolveIncident('${inc.id}')" style="margin-top:5px; padding:2px 8px; font-size:9px;">Resolve</button>`;
      marker.bindPopup(`<strong style="color:#000;">${inc.title}</strong><br><span style="color:#666; font-size:10px;">${inc.category} | ${inc.location}</span><br><p style="color:#333; font-size:11px; margin-top:4px;">${inc.description}</p>${resolveButtonHtml}`);
    });

    // Render Safe Escort route lines
    if (safetyShowEscort) {
      safePaths.forEach(path => {
        L.polyline(path.coordinates, {
          color: "#00f0ff",
          weight: 4,
          opacity: 0.75,
          dashArray: "8, 6"
        }).addTo(mapLayersGroup)
          .bindTooltip(`<strong>${path.name}</strong> (Lit Route)`, { sticky: true });
      });
    }
  }
}

// Recenter Map view
function recenterMap() {
  if (mapInstance) {
    mapInstance.setView(CAMPUS_CENTER, 15);
    showToast("Map recentered to Main Campus", "info");
  }
}

// ==========================================
// CAMPUS DIGITAL TWIN MODULE LOGIC
// ==========================================

function selectBuilding(buildingId) {
  selectedBuildingId = buildingId;
  const bld = campusSim.buildings.find(b => b.id === buildingId);
  if (!bld) return;

  // Render Telemetry
  document.getElementById("lbl-bld-name").textContent = bld.name;
  document.getElementById("lbl-bld-desc").textContent = bld.description;
  document.getElementById("lbl-bld-type").textContent = bld.type;
  document.getElementById("lbl-bld-type").className = `badge-type ${bld.type}`;

  // Sliders positions
  document.getElementById("slider-hvac").value = bld.hvacSetting;
  document.getElementById("lbl-slider-hvac").textContent = `${bld.hvacSetting.toFixed(1)}°C`;

  document.getElementById("slider-lights").value = bld.lightSetting;
  document.getElementById("lbl-slider-lights").textContent = `${bld.lightSetting}%`;

  // Vent buttons active modes
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.mode === bld.ventilationMode);
  });

  // Re-highlight polygons on click (redrawn immediately)
  updateMapLayers();
}

function updateCampusDynamicUI() {
  if (activeRoute !== "campus") return;

  // Outdoor widgets
  document.getElementById("outdoor-weather-temp").textContent = `${campusSim.outdoorTemp.toFixed(1)}°C`;
  document.getElementById("kpi-outdoor-temp").textContent = `${campusSim.outdoorTemp.toFixed(1)}°C`;
  document.getElementById("time-display").textContent = campusSim.simTime.toLocaleTimeString();

  // Weather icon matching
  const weatherIconNode = document.getElementById("weather-icon");
  const weatherStatusNode = document.getElementById("weather-status");
  weatherStatusNode.textContent = campusSim.weather.toUpperCase();
  if (campusSim.weather === "cloudy") {
    weatherIconNode.className = "fa-solid fa-cloud";
    weatherIconNode.style.color = "var(--text-secondary)";
  } else if (campusSim.weather === "rainy") {
    weatherIconNode.className = "fa-solid fa-cloud-showers-heavy";
    weatherIconNode.style.color = "var(--neon-cyan)";
  } else {
    weatherIconNode.className = "fa-solid fa-sun";
    weatherIconNode.style.color = "var(--warning)";
  }

  // Calculate global KPIs
  let totalSolar = 0;
  let totalConsumption = 0;
  let totalOccupants = 0;

  campusSim.buildings.forEach(b => {
    totalSolar += b.solarGeneration;
    totalConsumption += b.energyConsumption;
    totalOccupants += b.occupancy;
  });

  const netGridDraw = totalConsumption - totalSolar;
  document.getElementById("kpi-grid-load").textContent = `${Math.round(netGridDraw).toLocaleString()} kW`;
  document.getElementById("kpi-solar-gen").textContent = `${Math.round(totalSolar).toLocaleString()} kW`;
  document.getElementById("kpi-occupancy").textContent = totalOccupants.toLocaleString();

  // Render warnings list
  const list = document.getElementById("alerts-list");
  if (campusSim.alerts.length === 0) {
    list.innerHTML = `<div class="alert-desc" style="color:var(--text-muted); text-align:center; padding:10px;">All nodes reporting nominal operation.</div>`;
  } else {
    list.innerHTML = campusSim.alerts.map(a => `
      <div class="alert-item ${a.severity}">
        <div class="alert-meta">
          <span>${a.buildingName.toUpperCase()}</span>
          <span>${new Date(a.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="alert-desc">${a.message}</div>
        <div class="alert-actions">
          <button class="btn-resolve-crime" onclick="window.dispatchTechnician('${a.id}')">Dispatch Tech</button>
        </div>
      </div>
    `).join('');
  }

  // Update selected building details panel
  const activeBld = campusSim.buildings.find(b => b.id === selectedBuildingId);
  if (activeBld) {
    document.getElementById("lbl-sensor-temp").textContent = `${activeBld.temperature.toFixed(1)}°C`;
    document.getElementById("lbl-sensor-humidity").textContent = `${activeBld.humidity}%`;
    document.getElementById("lbl-sensor-aqi").textContent = activeBld.aqi;
    document.getElementById("lbl-sensor-wifi").textContent = `${activeBld.wifiConnections} users`;
  }

  // Update Broker MQTT Console logs
  const now = Date.now();
  if (now - lastConsoleLogTime > 4000) {
    lastConsoleLogTime = now;
    logBrokerConsole();
  }
}

function logBrokerConsole() {
  const brokerConsole = document.getElementById("campus-mqtt-logs");
  if (!brokerConsole) return;

  const randomBld = campusSim.buildings[Math.floor(Math.random() * campusSim.buildings.length)];
  const timestamp = new Date(campusSim.simTime).toLocaleTimeString();
  const topics = [
    { sub: "telemetry/temp", val: `${randomBld.temperature}°C` },
    { sub: "telemetry/occupancy", val: `${randomBld.occupancy} active` },
    { sub: "telemetry/power", val: `${randomBld.energyConsumption}kW` }
  ];
  const choice = topics[Math.floor(Math.random() * topics.length)];
  
  const log = document.createElement("div");
  log.className = "log-entry";
  log.innerHTML = `<span class="log-time">[${timestamp}]</span> topic: campus/${randomBld.id}/${choice.sub} - payload: <strong>${choice.val}</strong>`;
  
  brokerConsole.appendChild(log);
  brokerConsole.scrollTop = brokerConsole.scrollHeight;

  // Max 25 log rows
  if (brokerConsole.childNodes.length > 25) {
    brokerConsole.removeChild(brokerConsole.firstChild);
  }
}

// Chart.js Power grids loader
function loadCampusChart() {
  const ctx = document.getElementById("campus-energy-chart");
  if (!ctx) return;

  if (campusChartInstance) {
    campusChartInstance.destroy();
  }

  campusChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: campusSim.history.timestamps,
      datasets: [
        {
          label: "Grid Draw (kW)",
          data: campusSim.history.consumption,
          borderColor: "#00f0ff",
          backgroundColor: "rgba(0, 240, 255, 0.05)",
          borderWidth: 1.5,
          tension: 0.3,
          fill: true
        },
        {
          label: "Solar Generation (kW)",
          data: campusSim.history.solar,
          borderColor: "#00ff66",
          backgroundColor: "rgba(0, 255, 102, 0.05)",
          borderWidth: 1.5,
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: "rgba(255, 255, 255, 0.04)" }, ticks: { color: "#64748b", font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 } } }
      }
    }
  });
}

// ==========================================
// GATHERGO EVENT EXPLORER MODULE
// ==========================================

function renderEventsList() {
  const container = document.getElementById("events-list-container");
  if (!container) return;

  const searchVal = document.getElementById("event-search-input").value.toLowerCase();
  const activeTab = document.querySelector(".category-tab.active");
  const categoryVal = activeTab ? activeTab.dataset.category : "All";
  const priceVal = parseFloat(document.getElementById("event-price-slider").value);
  const dateVal = document.getElementById("event-date-filter").value;
  const sortVal = document.getElementById("event-sort-select").value;

  document.getElementById("event-price-limit-lbl").textContent = `$${priceVal}`;

  let filtered = events.filter(evt => {
    const matchesSearch = evt.title.toLowerCase().includes(searchVal) || evt.description.toLowerCase().includes(searchVal);
    const matchesCategory = categoryVal === "All" || evt.category === categoryVal;
    const matchesPrice = (evt.tiers.general ? evt.tiers.general.price : 0) <= priceVal;
    const matchesDate = !dateVal || evt.date === dateVal;

    return matchesSearch && matchesCategory && matchesPrice && matchesDate;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortVal === "popularity") return b.popularity - a.popularity;
    if (sortVal === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortVal === "price-asc") {
      const aMin = a.tiers.general ? a.tiers.general.price : 0;
      const bMin = b.tiers.general ? b.tiers.general.price : 0;
      return aMin - bMin;
    }
    return 0;
  });

  document.getElementById("lbl-events-count").textContent = `${filtered.length} Event${filtered.length === 1 ? '' : 's'} Available`;

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state-message"><i class="fa-solid fa-calendar-times"></i><p>No events found.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(evt => {
    const isFav = bookmarks.includes(evt.id);
    const minPrice = evt.tiers.general ? evt.tiers.general.price : 0;
    
    return `
      <div class="event-list-item" data-id="${evt.id}">
        <img class="item-thumb" src="${evt.image || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=150&q=80'}" alt="${evt.title}" />
        <div class="item-info">
          <h5>${evt.title}</h5>
          <div class="item-meta">
            <span><i class="fa-solid fa-calendar"></i> ${new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span>$${minPrice}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Clicks
  container.querySelectorAll(".event-list-item").forEach(item => {
    item.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      // Fly to marker on shared map
      const found = events.find(x => x.id === id);
      if (found && mapInstance) {
        mapInstance.flyTo(found.coordinates, 16);
      }
      openEventDrawer(id);
    };
  });
}

function initEventsFeaturedCountdown() {
  const featured = events.find(e => e.featured) || events[0];
  if (!featured) return;

  document.getElementById("featured-title").textContent = featured.title;
  document.getElementById("featured-venue").textContent = featured.venue;

  // Book Vip action
  document.getElementById("btn-featured-book-now").onclick = () => {
    activeEvent = featured;
    openBookingWizard();
  };

  const targetDate = new Date(`${featured.date}T${featured.time}:00`).getTime();

  function tick() {
    const distance = targetDate - new Date().getTime();
    if (distance < 0) return;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("lbl-days").textContent = String(days).padStart(2, "0");
    document.getElementById("lbl-hours").textContent = String(hours).padStart(2, "0");
    document.getElementById("lbl-mins").textContent = String(minutes).padStart(2, "0");
    document.getElementById("lbl-secs").textContent = String(seconds).padStart(2, "0");
  }

  tick();
  setInterval(tick, 1000);
}

// Drawer details opening
function openEventDrawer(eventId) {
  const evt = events.find(e => e.id === eventId);
  if (!evt) return;

  activeEvent = evt;

  document.getElementById("drawer-banner-img").src = evt.image || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80";
  document.getElementById("drawer-category-lbl").textContent = evt.category;
  document.getElementById("drawer-event-title").textContent = evt.title;
  document.getElementById("drawer-organizer-lbl").textContent = evt.organizer;
  document.getElementById("drawer-popularity-lbl").textContent = evt.popularity.toFixed(1);
  document.getElementById("drawer-date-lbl").textContent = new Date(evt.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  document.getElementById("drawer-time-lbl").textContent = evt.time;
  document.getElementById("drawer-minprice-lbl").textContent = `$${evt.tiers.general ? evt.tiers.general.price : 0}`;
  document.getElementById("drawer-desc-lbl").textContent = evt.description;

  // Favorite toggle active style
  const isFav = bookmarks.includes(evt.id);
  const favBtn = document.getElementById("btn-drawer-fav-toggle");
  favBtn.className = `drawer-icon-action-btn ${isFav ? 'active' : ''}`;
  favBtn.innerHTML = `<i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
  favBtn.onclick = () => {
    toggleEventFavorite(evt.id);
    const updated = bookmarks.includes(evt.id);
    favBtn.className = `drawer-icon-action-btn ${updated ? 'active' : ''}`;
    favBtn.innerHTML = `<i class="${updated ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
  };

  // Itinerary
  const timeline = document.getElementById("drawer-itinerary-timeline");
  if (evt.itinerary && evt.itinerary.length > 0) {
    timeline.innerHTML = evt.itinerary.map(item => `
      <div class="timeline-item">
        <div class="timeline-time">${item.time}</div>
        <div class="timeline-node"></div>
        <div class="timeline-desc">${item.title}</div>
      </div>
    `).join('');
  } else {
    timeline.innerHTML = `<div class="timeline-desc">Itinerary details pending.</div>`;
  }

  // Performers
  const performers = document.getElementById("drawer-performers-row");
  if (evt.performers && evt.performers.length > 0) {
    performers.innerHTML = evt.performers.map(p => `
      <div class="performer-card">
        <img src="${p.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}" alt="${p.name}" />
        <div class="performer-info">
          <span class="performer-name">${p.name}</span>
          <span class="performer-role">${p.role}</span>
        </div>
      </div>
    `).join('');
  } else {
    performers.innerHTML = `<div class="performer-role">Lineup lineup pending.</div>`;
  }

  // Show
  document.getElementById("event-drawer-overlay").classList.add("active");

  // Booking Checkout Trigger
  document.getElementById("btn-drawer-checkout-trigger").onclick = () => {
    closeEventDrawer();
    openBookingWizard();
  };
}

function closeEventDrawer() {
  document.getElementById("event-drawer-overlay").classList.remove("active");
}

function toggleEventFavorite(eventId) {
  const idx = bookmarks.indexOf(eventId);
  if (idx === -1) {
    bookmarks.push(eventId);
    showToast("Event bookmarked to favorites", "success");
  } else {
    bookmarks.splice(idx, 1);
    showToast("Event removed from bookmarks", "info");
  }
  localStorage.setItem("apex_bookmarks", JSON.stringify(bookmarks));
  updateSharedBadges();
  renderEventsList();
  renderFavoritesList();
}

// Booking Wizard workflow
function openBookingWizard() {
  if (!activeEvent) return;

  activeBookingTier = "general";
  activeBookingQty = 1;
  activePromoDiscount = 0;
  activePromoCode = "";
  document.getElementById("coupon-code-input").value = "";
  document.getElementById("coupon-message").textContent = "";
  document.getElementById("checkout-name").value = "";
  document.getElementById("checkout-email").value = "";

  document.getElementById("booking-event-title-lbl").textContent = activeEvent.title;

  // Select Step 1 active
  document.getElementById("indicator-step1").classList.add("active");
  document.getElementById("indicator-step2").classList.remove("active");
  document.getElementById("booking-step1-pane").classList.add("active");
  document.getElementById("booking-step2-pane").classList.remove("active");

  updateWizardTiersUI();

  document.getElementById("booking-wizard-overlay").classList.add("active");
}

function updateWizardTiersUI() {
  const genLeft = activeEvent.tiers.general.capacity - activeEvent.tiers.general.sold;
  document.getElementById("availability-general").textContent = `${genLeft} left`;
  document.getElementById("price-general-val").textContent = `$${activeEvent.tiers.general.price}`;

  const vipLeft = activeEvent.tiers.vip ? (activeEvent.tiers.vip.capacity - activeEvent.tiers.vip.sold) : 0;
  document.getElementById("availability-vip").textContent = `${vipLeft} left`;
  document.getElementById("price-vip-val").textContent = `$${activeEvent.tiers.vip ? activeEvent.tiers.vip.price : 0}`;

  document.getElementById("qty-display-val").textContent = activeBookingQty;

  document.querySelectorAll(".booking-wizard-modal .tier-option-card").forEach(card => {
    card.classList.toggle("active", card.dataset.tier === activeBookingTier);
  });
}

function closeBookingWizard() {
  document.getElementById("booking-wizard-overlay").classList.remove("active");
}

function calculateWizardReceipt() {
  const price = activeEvent.tiers[activeBookingTier].price;
  const base = price * activeBookingQty;
  const discount = base * activePromoDiscount;
  const fees = (base - discount) * 0.025;
  const total = (base - discount) + fees;

  document.getElementById("receipt-qty-desc").textContent = `${activeEvent.tiers[activeBookingTier].name} x ${activeBookingQty}`;
  document.getElementById("receipt-base-price").textContent = `$${base.toFixed(2)}`;

  if (discount > 0) {
    document.getElementById("receipt-discount-row").style.display = "flex";
    document.getElementById("receipt-discount-val").textContent = `-$${discount.toFixed(2)}`;
  } else {
    document.getElementById("receipt-discount-row").style.display = "none";
  }

  document.getElementById("receipt-fees-val").textContent = `$${fees.toFixed(2)}`;
  document.getElementById("receipt-total-val").textContent = `$${total.toFixed(2)}`;

  return { base, discount, fees, total };
}

function applyCouponWizard() {
  const code = document.getElementById("coupon-code-input").value.trim().toUpperCase();
  const msg = document.getElementById("coupon-message");

  if (code === "EARLYBIRD20") {
    activePromoDiscount = 0.20;
    activePromoCode = "EARLYBIRD20";
    msg.className = "coupon-status-msg success";
    msg.textContent = "Coupon accepted: 20% discount applied.";
  } else if (code === "GATHER15") {
    activePromoDiscount = 0.15;
    activePromoCode = "GATHER15";
    msg.className = "coupon-status-msg success";
    msg.textContent = "Coupon accepted: 15% discount applied.";
  } else if (code === "WELCOME10") {
    activePromoDiscount = 0.10;
    activePromoCode = "WELCOME10";
    msg.className = "coupon-status-msg success";
    msg.textContent = "Coupon accepted: 10% discount applied.";
  } else if (code === "") {
    activePromoDiscount = 0;
    activePromoCode = "";
    msg.textContent = "";
  } else {
    activePromoDiscount = 0;
    activePromoCode = "";
    msg.className = "coupon-status-msg error";
    msg.textContent = "Invalid Coupon Code.";
  }

  calculateWizardReceipt();
}

function processBookingPayment(e) {
  e.preventDefault();

  const name = document.getElementById("checkout-name").value.trim();
  const email = document.getElementById("checkout-email").value.trim();

  if (!name || !email) {
    showToast("Contact details required.", "error");
    return;
  }

  const tierSelected = activeEvent.tiers[activeBookingTier];
  const seatsLeft = tierSelected.capacity - tierSelected.sold;
  if (activeBookingQty > seatsLeft) {
    showToast("Insufficient ticket seats available.", "error");
    return;
  }

  const { base, discount, fees, total } = calculateWizardReceipt();

  // Deduct
  tierSelected.sold += activeBookingQty;
  localStorage.setItem("apex_events", JSON.stringify(events));

  // Generate pass
  const ticketId = `PASS-${Math.floor(100000 + Math.random() * 900000)}`;
  const ticket = {
    id: ticketId,
    eventId: activeEvent.id,
    eventTitle: activeEvent.title,
    eventDate: activeEvent.date,
    eventVenue: activeEvent.venue,
    eventTime: activeEvent.time,
    eventCategory: activeEvent.category,
    attendeeName: name,
    attendeeEmail: email,
    tier: tierSelected.name,
    qty: activeBookingQty,
    totalPaid: total,
    purchaseDate: new Date().toISOString().split("T")[0]
  };

  bookedTickets.push(ticket);
  localStorage.setItem("apex_tickets", JSON.stringify(bookedTickets));
  updateSharedBadges();

  renderEventsList();
  closeBookingWizard();

  // Render SVG ticket modal
  openTicketPassModal(ticket);
  showToast("Ticket successfully purchased!", "success");
}

// Generate SVG string
function getTicketSVGString(t) {
  const categoryColor = { Concerts: "#FF007A", Tech: "#00F0FF", Arts: "#9D4EDD", Sports: "#00F5D4" }[t.eventCategory] || "#9D4EDD";
  
  // stripes
  let stripes = "";
  let startX = 320;
  for (let i = 0; i < 15; i++) {
    const width = Math.random() > 0.5 ? 4 : 2;
    const gap = Math.random() > 0.5 ? 3 : 2;
    stripes += `<rect x="${startX}" y="30" width="${width}" height="80" fill="#fff" opacity="0.8" />`;
    startX += (width + gap);
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 140" width="100%" height="auto" style="border-radius:10px; background:#0c0f16; border:1px solid rgba(255,255,255,0.08);">
      <rect width="450" height="140" fill="#0f131f" />
      <rect width="6" height="140" fill="${categoryColor}" />
      
      <!-- ticket notch cut lines -->
      <circle cx="300" cy="0" r="10" fill="#000" />
      <circle cx="300" cy="140" r="10" fill="#000" />
      <line x1="300" y1="12" x2="300" y2="128" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-dasharray="5,5" />
      
      <!-- texts -->
      <text x="20" y="28" fill="${categoryColor}" font-family="Outfit" font-size="8" font-weight="700" letter-spacing="1">${t.eventCategory.toUpperCase()}</text>
      <text x="20" y="50" fill="#ffffff" font-family="Outfit" font-size="13" font-weight="700">${t.eventTitle.length > 28 ? t.eventTitle.slice(0, 27) + '...' : t.eventTitle}</text>
      <text x="20" y="70" fill="#94a3b8" font-family="Inter" font-size="8">VENUE: ${t.eventVenue.split(',')[0].toUpperCase()}</text>
      <text x="20" y="82" fill="#94a3b8" font-family="Inter" font-size="8">DATE: ${t.eventDate} | TIME: ${t.eventTime}</text>
      
      <line x1="20" y1="95" x2="280" y2="95" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
      
      <text x="20" y="110" fill="#64748b" font-family="Inter" font-size="7" font-weight="600">ATTENDEE PASS</text>
      <text x="20" y="124" fill="#ffffff" font-family="Outfit" font-size="10" font-weight="600">${t.attendeeName.toUpperCase()}</text>
      
      <text x="170" y="110" fill="#64748b" font-family="Inter" font-size="7" font-weight="600">TIER CLASS</text>
      <text x="170" y="124" fill="${categoryColor}" font-family="Outfit" font-size="10" font-weight="700">${t.tier.toUpperCase()}</text>

      <text x="260" y="110" fill="#64748b" font-family="Inter" font-size="7" font-weight="600">QTY</text>
      <text x="260" y="124" fill="#ffffff" font-family="Outfit" font-size="10" font-weight="700">${t.qty}</text>

      <!-- Stub -->
      <rect x="320" y="15" width="105" height="15" rx="3" fill="rgba(255,255,255,0.03)" />
      <text x="372" y="26" fill="#fff" font-family="Outfit" font-size="8" font-weight="700" text-anchor="middle" letter-spacing="1">GATE ACCESS</text>
      <g>${stripes}</g>
      <text x="372" y="124" fill="#64748b" font-family="Inter" font-size="8" text-anchor="middle" letter-spacing="2.5">${t.id}</text>
    </svg>
  `;
}

function openTicketPassModal(ticket) {
  const renderTarget = document.getElementById("pass-render-target");
  const svg = getTicketSVGString(ticket);
  renderTarget.innerHTML = svg;

  document.getElementById("btn-download-pass").onclick = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticket.id}_GatherGo_Pass.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("SVG Gate Pass downloaded!", "success");
  };

  document.getElementById("ticket-pass-modal-overlay").classList.add("active");
}

function closeTicketPassModal() {
  document.getElementById("ticket-pass-modal-overlay").classList.remove("active");
}

// Modals displays list renders
function renderFavoritesList() {
  const container = document.getElementById("favorites-list-container");
  if (!container) return;

  const favs = events.filter(e => bookmarks.includes(e.id));
  if (favs.length === 0) {
    document.getElementById("favorites-empty-state").style.display = "flex";
    container.innerHTML = "";
    return;
  }
  document.getElementById("favorites-empty-state").style.display = "none";

  container.innerHTML = favs.map(evt => `
    <div class="event-list-item">
      <img class="item-thumb" src="${evt.image}" alt="${evt.title}" />
      <div class="item-info">
        <h5>${evt.title}</h5>
        <div class="item-meta">
          <span>${evt.date}</span>
          <button class="btn btn-primary" onclick="window.bookFavoriteEvent('${evt.id}')" style="padding:2px 8px; font-size:10px;">Book</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderPurchasedTickets() {
  const container = document.getElementById("tickets-passes-container");
  if (!container) return;

  if (bookedTickets.length === 0) {
    document.getElementById("tickets-empty-state").style.display = "flex";
    container.innerHTML = "";
    return;
  }
  document.getElementById("tickets-empty-state").style.display = "none";

  container.innerHTML = bookedTickets.map(t => {
    const svg = getTicketSVGString(t);
    return `
      <div style="background:#000; padding:8px; border-radius:8px; border:1px solid var(--border-color); display:flex; flex-direction:column; gap:6px;">
        ${svg}
        <button class="btn btn-secondary" onclick="window.downloadPassById('${t.id}')" style="align-self:flex-end; padding:4px 8px; font-size:10px;">
          <i class="fa-solid fa-download"></i> Download
        </button>
      </div>
    `;
  }).join('');
}

// ==========================================
// CREATOR PORTAL & DASHBOARD ANALYTICS
// ==========================================

function openCreatorPortal() {
  // Update creator KPIs
  document.getElementById("creator-kpi-events").textContent = events.length;

  let totalTickets = 0;
  let totalRevenue = 0;
  events.forEach(e => {
    Object.values(e.tiers).forEach(t => {
      totalTickets += t.sold;
      totalRevenue += t.sold * t.price;
    });
  });

  document.getElementById("creator-kpi-tickets").textContent = totalTickets.toLocaleString();
  document.getElementById("creator-kpi-revenue").textContent = `$${totalRevenue.toLocaleString()}`;

  // Render Table
  const body = document.getElementById("creator-table-body");
  if (body) {
    body.innerHTML = events.map(e => {
      let sold = 0;
      Object.values(e.tiers).forEach(t => sold += t.sold);
      return `
        <tr>
          <td style="color:#fff; font-weight:600;">${e.title.length > 20 ? e.title.slice(0, 19) + '...' : e.title}</td>
          <td>${e.category}</td>
          <td>${sold}</td>
          <td>
            <button class="btn-action-icon delete" onclick="window.cancelCreatedEvent('${e.id}')" title="Cancel Event"><i class="fa-solid fa-trash-can"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Open modal
  document.getElementById("modal-creator-overlay").classList.add("active");

  // Load Charts
  setTimeout(() => {
    loadCreatorPortalCharts();
  }, 200);
}

function loadCreatorPortalCharts() {
  if (creatorSalesChart) creatorSalesChart.destroy();
  if (creatorRevenueChart) creatorRevenueChart.destroy();

  const ctxSales = document.getElementById("creator-sales-chart");
  const ctxRev = document.getElementById("creator-revenue-chart");

  if (!ctxSales || !ctxRev) return;

  const labels = events.map(e => e.title.length > 10 ? e.title.slice(0, 9) + '...' : e.title);
  const sales = events.map(e => {
    let s = 0;
    Object.values(e.tiers).forEach(t => s += t.sold);
    return s;
  });

  creatorSalesChart = new Chart(ctxSales, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        data: sales,
        backgroundColor: "rgba(174, 0, 255, 0.45)",
        borderColor: "#ae00ff",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: "#64748b", font: { size: 8 } } },
        x: { ticks: { color: "#64748b", font: { size: 8 } } }
      }
    }
  });

  const categories = ["Concerts", "Tech", "Arts", "Sports"];
  const revs = { Concerts: 0, Tech: 0, Arts: 0, Sports: 0 };
  events.forEach(e => {
    let r = 0;
    Object.values(e.tiers).forEach(t => r += t.sold * t.price);
    revs[e.category] += r;
  });

  creatorRevenueChart = new Chart(ctxRev, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [{
        data: categories.map(c => revs[c]),
        backgroundColor: ["#ff007a", "#00f0ff", "#ae00ff", "#00ff66"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: "#64748b", font: { size: 8 } } } }
    }
  });
}

function processNewCreatorEvent(e) {
  e.preventDefault();

  const title = document.getElementById("form-title").value.trim();
  const category = document.getElementById("form-category").value;
  const date = document.getElementById("form-date").value;
  const time = document.getElementById("form-time").value;
  const venue = document.getElementById("form-venue").value.trim();
  const lat = parseFloat(document.getElementById("form-lat").value);
  const lng = parseFloat(document.getElementById("form-lng").value);
  const description = document.getElementById("form-desc").value.trim();
  const banner = document.getElementById("form-banner").value.trim() || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80";
  const organizer = document.getElementById("form-organizer").value.trim();

  const priceGen = parseFloat(document.getElementById("form-price-gen").value);
  const capGen = parseInt(document.getElementById("form-cap-gen").value);
  const priceVip = parseFloat(document.getElementById("form-price-vip").value);
  const capVip = parseInt(document.getElementById("form-cap-vip").value);

  const newEvt = {
    id: `evt-${Math.floor(100 + Math.random() * 900)}`,
    title,
    category,
    date,
    time,
    venue,
    coordinates: [lat, lng],
    description,
    image: banner,
    featured: false,
    organizer,
    tiers: {
      general: { name: "General Admission", price: priceGen, capacity: capGen, sold: 0 },
      vip: { name: "VIP Lounge Pass", price: priceVip, capacity: capVip, sold: 0 }
    },
    itinerary: [{ time: time, title: "Gate Entry Check-in" }],
    performers: [{ name: organizer, role: "Organizer Host", avatar: "" }],
    popularity: 5.0
  };

  events.push(newEvt);
  localStorage.setItem("apex_events", JSON.stringify(events));

  document.getElementById("creator-event-form").reset();
  showToast("Event published successfully!", "success");

  // Re-render
  renderEventsList();
  updateMapLayers();
  
  // Close and refresh
  document.getElementById("modal-creator-overlay").classList.remove("active");
}

// ==========================================
// CRIME SAFETY RADAR MODULE LOGIC
// ==========================================

function renderSafetyIncidentsList() {
  const container = document.getElementById("safety-incidents-list");
  if (!container) return;

  const activeCategory = document.querySelector("#safety-categories-container .category-tab.active").dataset.category;

  let filtered = safetyIncidents.filter(inc => {
    return activeCategory === "All" || inc.category === activeCategory;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:10px;">No safety alerts logged.</div>`;
    return;
  }

  container.innerHTML = filtered.map(inc => `
    <div class="safety-incident-item" id="safety-${inc.id}">
      <div class="safety-incident-header">
        <span class="safety-incident-title">${inc.title}</span>
        <span class="threat-dot ${inc.resolved ? 'resolved' : inc.threatLevel}" style="${inc.resolved ? 'background:#00ff66' : ''}"></span>
      </div>
      <div class="safety-incident-meta">
        <span>${inc.location}</span>
        <span>${inc.resolved ? 'RESOLVED' : inc.threatLevel.toUpperCase()}</span>
      </div>
      ${inc.resolved ? '' : `<button class="btn-resolve-crime" onclick="window.resolveIncident('${inc.id}')">Mark Resolved</button>`}
    </div>
  `).join('');
}

// Submit a new Safety incident
function processNewSafetyIncident(e) {
  e.preventDefault();

  const title = document.getElementById("crime-form-title").value.trim();
  const category = document.getElementById("crime-form-category").value;
  const threatLevel = document.getElementById("crime-form-threat").value;
  const lat = parseFloat(document.getElementById("crime-form-lat").value);
  const lng = parseFloat(document.getElementById("crime-form-lng").value);
  const description = document.getElementById("crime-form-desc").value.trim();

  const newInc = {
    id: `crm-${Math.floor(100 + Math.random() * 900)}`,
    title,
    category,
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    location: `Grid Pin [${lat.toFixed(3)}, ${lng.toFixed(3)}]`,
    coordinates: [lat, lng],
    threatLevel,
    description,
    resolved: false
  };

  safetyIncidents.unshift(newInc);
  localStorage.setItem("apex_incidents", JSON.stringify(safetyIncidents));

  document.getElementById("report-incident-form").reset();
  showToast("Campus Incident reported to Security desk!", "success");

  // Re-render
  renderSafetyIncidentsList();
  updateMapLayers();

  if (mapInstance) {
    mapInstance.flyTo([lat, lng], 16);
  }
}

// Emergency Panic trigger
function triggerEmergencySOS() {
  showToast("EMERGENCY PANIC DISPATCHED! Dispatching nearby patrols...", "error");
  
  // Log mock critical incident at current map center
  if (mapInstance) {
    const center = mapInstance.getCenter();
    const sosInc = {
      id: `crm-${Math.floor(1000 + Math.random() * 9000)}`,
      title: "SOS PANIC BEACON ACTIVE",
      category: "Assault",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      location: "Active Operator Beacon GPS",
      coordinates: [center.lat, center.lng],
      threatLevel: "high",
      description: "Operator manually triggered the emergency SOS panic dashboard beacon. Security patrols routing to coordinates.",
      resolved: false
    };

    safetyIncidents.unshift(sosInc);
    localStorage.setItem("apex_incidents", JSON.stringify(safetyIncidents));
    
    renderSafetyIncidentsList();
    updateMapLayers();
    mapInstance.flyTo([center.lat, center.lng], 16);
  }
}

function loadSafetyChart() {
  const ctx = document.getElementById("safety-prediction-chart");
  if (!ctx) return;

  if (safetyChartInstance) {
    safetyChartInstance.destroy();
  }

  // Simulated crime stats decline with safety escort lighting paths implemented
  safetyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["2021", "2022", "2023", "2024", "2025", "2026 (Pred)"],
      datasets: [
        {
          label: "Standard Campus Area",
          data: [42, 38, 45, 30, 28, 24],
          borderColor: "#ff3b30",
          borderWidth: 1.5,
          tension: 0.2
        },
        {
          label: "Lit Blue-Light Pathways",
          data: [35, 20, 12, 5, 2, 0],
          borderColor: "#00f0ff",
          borderWidth: 1.5,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: "rgba(255, 255, 255, 0.04)" }, ticks: { color: "#64748b", font: { size: 9 } } },
        x: { grid: { display: false }, ticks: { color: "#64748b", font: { size: 9 } } }
      }
    }
  });
}

// ==========================================
// WINDOW EXPOSED GLOBALS FOR IN-LINE CALLS
// ==========================================

window.dispatchTechnician = function(alertId) {
  if (campusSim.resolveAlert(alertId)) {
    showToast("Incident resolved. Building state returned to nominal.", "success");
    updateMapLayers();
    updateCampusDynamicUI();
  }
};

window.resolveIncident = function(incidentId) {
  const inc = safetyIncidents.find(x => x.id === incidentId);
  if (inc) {
    inc.resolved = true;
    localStorage.setItem("apex_incidents", JSON.stringify(safetyIncidents));
    showToast("Safety incident marked resolved.", "success");
    renderSafetyIncidentsList();
    updateMapLayers();
    
    // Close open popups
    if (mapInstance) mapInstance.closePopup();
  }
};

window.bookFavoriteEvent = function(eventId) {
  document.getElementById("modal-favorites-overlay").classList.remove("active");
  activeEvent = events.find(x => x.id === eventId);
  if (activeEvent) openBookingWizard();
};

window.downloadPassById = function(ticketId) {
  const ticket = bookedTickets.find(t => t.id === ticketId);
  if (ticket) {
    const svg = getTicketSVGString(ticket);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${ticket.id}_GatherGo_Pass.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Pass downloaded successfully!", "success");
  }
};

window.cancelCreatedEvent = function(eventId) {
  if (confirm("Are you sure you want to cancel this event?")) {
    events = events.filter(e => e.id !== eventId);
    localStorage.setItem("apex_events", JSON.stringify(events));
    bookmarks = bookmarks.filter(b => b !== eventId);
    localStorage.setItem("apex_bookmarks", JSON.stringify(bookmarks));
    
    showToast("Event cancelled successfully.", "info");
    openCreatorPortal(); // Refresh Creator modal
    renderEventsList();
    updateMapLayers();
  }
};

// ==========================================
// CORE APP EVENTS & INITIAL BINDINGS
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  syncLocalStorage();
  updateSharedBadges();

  // Load Map Engine
  initMapEngine();

  // Default Routing active
  switchRoute("campus");

  // Start Campus Sim clocks
  campusSim.init();
  setInterval(() => {
    if (!isSimPaused) {
      campusSim.updateStates(1);
      updateCampusDynamicUI();
    }
  }, 1000);

  // 1. Sidebar menu click bindings
  document.getElementById("menu-btn-campus").onclick = () => switchRoute("campus");
  document.getElementById("menu-btn-events").onclick = () => {
    switchRoute("events");
    renderEventsList();
    initEventsFeaturedCountdown();
  };
  document.getElementById("menu-btn-safety").onclick = () => {
    switchRoute("safety");
    renderSafetyIncidentsList();
  };

  // 2. Campus simulation widgets handlers
  document.getElementById("btn-play-pause").onclick = (e) => {
    isSimPaused = !isSimPaused;
    const icon = document.getElementById("play-pause-icon");
    icon.className = isSimPaused ? "fa-solid fa-play" : "fa-solid fa-pause";
    document.getElementById("btn-play-pause").classList.toggle("active", !isSimPaused);
    showToast(isSimPaused ? "Simulation paused" : "Simulation running", "info");
  };

  document.getElementById("select-speed").onchange = (e) => {
    campusSim.simSpeed = parseInt(e.target.value);
    showToast(`Simulation speed adjusted to ${campusSim.simSpeed}x`, "info");
  };

  document.getElementById("btn-trigger-anomaly").onclick = () => {
    campusSim.triggerRandomAnomaly();
    updateCampusDynamicUI();
    updateMapLayers();
    showToast("Triggered simulated incident", "warning");
  };

  // 3. IoT Controllers sliders overrides
  document.getElementById("slider-hvac").oninput = (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById("lbl-slider-hvac").textContent = `${val.toFixed(1)}°C`;
    const bld = campusSim.buildings.find(b => b.id === selectedBuildingId);
    if (bld) {
      bld.hvacSetting = val;
    }
  };

  document.getElementById("slider-lights").oninput = (e) => {
    const val = parseInt(e.target.value);
    document.getElementById("lbl-slider-lights").textContent = `${val}%`;
    const bld = campusSim.buildings.find(b => b.id === selectedBuildingId);
    if (bld) {
      bld.lightSetting = val;
    }
  };

  // Vent buttons
  document.querySelectorAll(".telemetry-panel .toggle-btn").forEach(btn => {
    btn.onclick = (e) => {
      document.querySelectorAll(".telemetry-panel .toggle-btn").forEach(b => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      const mode = e.currentTarget.dataset.mode;
      const bld = campusSim.buildings.find(b => b.id === selectedBuildingId);
      if (bld) {
        bld.ventilationMode = mode;
        showToast(`${bld.name} fan ventilation set to ${mode.toUpperCase()}`, "info");
      }
    };
  });

  // Map controls Toggles
  document.getElementById("btn-map-heatmap").onclick = (e) => {
    e.currentTarget.classList.toggle("active");
    campusOverlayMode = e.currentTarget.classList.contains("active") ? "heatmap" : "none";
    document.getElementById("btn-map-wifi").classList.remove("active");
    updateMapLayers();
  };

  document.getElementById("btn-map-wifi").onclick = (e) => {
    e.currentTarget.classList.toggle("active");
    campusOverlayMode = e.currentTarget.classList.contains("active") ? "wifi" : "none";
    document.getElementById("btn-map-heatmap").classList.remove("active");
    updateMapLayers();
  };

  document.getElementById("btn-map-safepaths").onclick = (e) => {
    e.currentTarget.classList.toggle("active");
    safetyShowEscort = e.currentTarget.classList.contains("active");
    updateMapLayers();
  };

  document.getElementById("btn-map-recenter").onclick = recenterMap;

  // 4. Events Platform navigation overlays
  document.getElementById("btn-my-favs").onclick = () => {
    renderFavoritesList();
    document.getElementById("modal-favorites-overlay").classList.add("active");
  };
  document.getElementById("btn-close-favs").onclick = () => {
    document.getElementById("modal-favorites-overlay").classList.remove("active");
  };

  document.getElementById("btn-my-tickets").onclick = () => {
    renderPurchasedTickets();
    document.getElementById("modal-tickets-overlay").classList.add("active");
  };
  document.getElementById("btn-close-tickets").onclick = () => {
    document.getElementById("modal-tickets-overlay").classList.remove("active");
  };

  document.getElementById("btn-my-creator").onclick = openCreatorPortal;
  document.getElementById("btn-close-creator").onclick = () => {
    document.getElementById("modal-creator-overlay").classList.remove("active");
  };

  // Creator publish event
  document.getElementById("creator-event-form").onsubmit = processNewCreatorEvent;

  // Events explorer searches
  document.getElementById("event-search-input").onkeyup = renderEventsList;

  document.querySelectorAll("#event-categories-container .category-tab").forEach(tab => {
    tab.onclick = (e) => {
      document.querySelectorAll("#event-categories-container .category-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      renderEventsList();
    };
  });

  document.getElementById("event-price-slider").oninput = renderEventsList;
  document.getElementById("event-date-filter").onchange = renderEventsList;
  document.getElementById("event-sort-select").onchange = renderEventsList;

  // Clear filters
  document.getElementById("btn-clear-event-filters").onclick = () => {
    document.getElementById("event-search-input").value = "";
    document.querySelectorAll("#event-categories-container .category-tab").forEach(t => t.classList.remove("active"));
    document.querySelector("#event-categories-container .category-tab[data-category='All']").classList.add("active");
    document.getElementById("event-price-slider").value = 500;
    document.getElementById("event-date-filter").value = "";
    document.getElementById("event-sort-select").value = "popularity";
    renderEventsList();
  };

  // Drawer closing
  document.getElementById("btn-close-event-drawer").onclick = closeEventDrawer;
  document.getElementById("event-drawer-overlay").onclick = (e) => {
    if (e.target.id === "event-drawer-overlay") closeEventDrawer();
  };

  // Booking Wizard bindings
  document.getElementById("btn-close-booking-wizard").onclick = closeBookingWizard;
  document.getElementById("booking-wizard-overlay").onclick = (e) => {
    if (e.target.id === "booking-wizard-overlay") closeBookingWizard();
  };

  document.querySelectorAll(".booking-wizard-modal .tier-option-card").forEach(card => {
    card.onclick = (e) => {
      activeBookingTier = e.currentTarget.dataset.tier;
      updateWizardTiersUI();
      calculateWizardReceipt();
    };
  });

  document.getElementById("qty-minus").onclick = () => {
    if (activeBookingQty > 1) {
      activeBookingQty--;
      updateWizardTiersUI();
      calculateWizardReceipt();
    }
  };
  document.getElementById("qty-plus").onclick = () => {
    if (activeBookingQty < 10) {
      activeBookingQty++;
      updateWizardTiersUI();
      calculateWizardReceipt();
    } else {
      showToast("Maximum 10 passes per checkout.", "warning");
    }
  };

  document.getElementById("btn-apply-coupon").onclick = applyCouponWizard;

  document.getElementById("btn-next-step1").onclick = () => {
    document.getElementById("indicator-step1").classList.remove("active");
    document.getElementById("indicator-step2").classList.add("active");
    document.getElementById("booking-step1-pane").classList.remove("active");
    document.getElementById("booking-step2-pane").classList.add("active");
    calculateWizardReceipt();
  };

  document.getElementById("btn-back-step2").onclick = () => {
    document.getElementById("indicator-step1").classList.add("active");
    document.getElementById("indicator-step2").classList.remove("active");
    document.getElementById("booking-step1-pane").classList.add("active");
    document.getElementById("booking-step2-pane").classList.remove("active");
  };

  document.getElementById("booking-flow-form").onsubmit = processBookingPayment;

  // Pass modals close
  document.getElementById("btn-close-pass-modal").onclick = closeTicketPassModal;
  document.getElementById("btn-close-pass-view-finished").onclick = closeTicketPassModal;
  document.getElementById("ticket-pass-modal-overlay").onclick = (e) => {
    if (e.target.id === "ticket-pass-modal-overlay") closeTicketPassModal();
  };

  // 5. Crime Safety Radar triggers
  document.querySelectorAll("#safety-categories-container .category-tab").forEach(tab => {
    tab.onclick = (e) => {
      document.querySelectorAll("#safety-categories-container .category-tab").forEach(t => t.classList.remove("active"));
      e.target.classList.add("active");
      renderSafetyIncidentsList();
      updateMapLayers();
    };
  });

  document.getElementById("report-incident-form").onsubmit = processNewSafetyIncident;
  document.getElementById("btn-panic-sos").onclick = triggerEmergencySOS;

  // Trigger basic initial rendering
  selectBuilding("science_hall");
  updateCampusDynamicUI();
});
