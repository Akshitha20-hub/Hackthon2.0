import { buildingsData } from "./mapData.js";

class CampusSimulation {
  constructor() {
    this.buildings = [];
    this.simTime = new Date();
    // Default: 1 real second = 4 minutes of simulation (240x speed)
    // This makes a full 24h cycle pass in 6 minutes
    this.simSpeed = 240; 
    this.outdoorTemp = 20.0;
    this.weather = "sunny";
    this.alerts = [];
    this.history = {
      timestamps: [],
      solar: [],
      consumption: []
    };
    this.lastHistoryTick = 0;
  }

  init() {
    this.simTime = new Date();
    // Start at 08:00 AM for visual convenience
    this.simTime.setHours(8, 0, 0, 0);

    this.buildings = buildingsData.map(b => ({
      ...b,
      occupancy: 0,
      temperature: b.defaultHVAC,
      hvacSetting: b.defaultHVAC,
      lightSetting: 70, // default 70% light brightness
      ventilationMode: "low", // off, low, high
      humidity: 45,
      aqi: 22,
      wifiConnections: 0,
      solarGeneration: 0,
      energyConsumption: 0,
      systemState: "nominal", // nominal, warning, maintenance
    }));

    // Trigger initial state update
    this.updateStates(0);

    // Initial alert list
    this.alerts = [
      {
        id: "alert_1",
        buildingId: "science_hall",
        buildingName: "Science Hall",
        severity: "warning",
        message: "Fume hood exhaust ventilation rate sluggish in Lab 304.",
        timestamp: new Date(this.simTime.getTime() - 20 * 60 * 1000)
      }
    ];

    // Seed some initial history points (last 12 hours)
    const backupTime = new Date(this.simTime);
    for (let i = 12; i >= 0; i--) {
      const histTime = new Date(backupTime.getTime() - i * 60 * 60 * 1000);
      const histStates = this.calculateStatesForTime(histTime);
      this.history.timestamps.push(histTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.history.solar.push(histStates.totalSolar);
      this.history.consumption.push(histStates.totalConsumption);
    }
  }

  // Pure state calculation based on time, useful for seeding history
  calculateStatesForTime(time) {
    const H = time.getHours() + time.getMinutes() / 60;
    const weatherFactor = this.getWeatherFactor();

    // Outdoor Temp
    const outdoorTemp = 18.0 + 7.0 * Math.sin((H - 9) * Math.PI / 12);

    let totalSolar = 0;
    let totalConsumption = 0;

    buildingsData.forEach(b => {
      // Occupancy
      let occFraction = 0.05;
      if (b.type === "academic") {
        if (H >= 8 && H <= 18) {
          occFraction = Math.max(0.05, Math.sin((H - 8) * Math.PI / 10) * 0.85);
        }
      } else if (b.type === "residential") {
        if (H < 8 || H > 18) {
          occFraction = 0.75 + Math.cos((H - 2) * Math.PI / 12) * 0.2;
        } else {
          occFraction = 0.15 + Math.random() * 0.1;
        }
      } else if (b.type === "recreational") {
        if (H >= 15 && H <= 22) {
          occFraction = Math.max(0.05, Math.sin((H - 15) * Math.PI / 7) * 0.9);
        }
      } else if (b.type === "utility") {
        occFraction = 0.2; // stable security staff
      }
      const occupancy = Math.round(occFraction * b.maxOccupancy);

      // Solar
      let solarGen = 0;
      if (b.solarCapacity > 0 && H >= 6 && H <= 18) {
        solarGen = Math.max(0, Math.sin((H - 6) * Math.PI / 12)) * b.solarCapacity * weatherFactor;
      }

      // Energy
      const hvacDelta = Math.abs(b.defaultHVAC - outdoorTemp);
      const hvacLoad = hvacDelta * (b.areaSqFt / 1000) * 0.35;
      const lightingLoad = 0.7 * (b.areaSqFt / 1000) * 0.6;
      const occLoad = occupancy * 0.06; // 60W per person
      const energyConsumption = b.baseEnergy + hvacLoad + lightingLoad + occLoad;

      totalSolar += solarGen;
      totalConsumption += energyConsumption;
    });

    return { totalSolar, totalConsumption };
  }

  getWeatherFactor() {
    switch (this.weather) {
      case "sunny": return 1.0;
      case "cloudy": return 0.45;
      case "rainy": return 0.15;
      default: return 1.0;
    }
  }

  updateStates(deltaRealSeconds) {
    // 1. Advance simulation clock
    const msToAdd = deltaRealSeconds * 1000 * this.simSpeed;
    this.simTime = new Date(this.simTime.getTime() + msToAdd);

    const H = this.simTime.getHours() + this.simTime.getMinutes() / 60;
    const weatherFactor = this.getWeatherFactor();

    // 2. Outdoor temperature updates
    // Min around 4 AM (14C), Max around 3 PM (26C)
    this.outdoorTemp = 20.0 + 6.0 * Math.sin((H - 9) * Math.PI / 12) + (this.weather === "rainy" ? -3.0 : this.weather === "cloudy" ? -1.0 : 0);

    // 3. Update individual buildings
    this.buildings.forEach(b => {
      // Set State Warning color if there is an active alert
      const hasAlert = this.alerts.some(a => a.buildingId === b.id);
      b.systemState = hasAlert ? "warning" : "nominal";

      // A. Dynamic Occupancy
      let occFraction = 0.02;
      if (b.type === "academic") {
        if (H >= 8 && H <= 18) {
          occFraction = Math.max(0.02, Math.sin((H - 8) * Math.PI / 10) * 0.85);
        }
      } else if (b.type === "residential") {
        if (H < 8 || H > 18) {
          occFraction = 0.8 + Math.cos((H - 2) * Math.PI / 12) * 0.15;
        } else {
          occFraction = 0.1 + Math.random() * 0.08;
        }
      } else if (b.type === "recreational") {
        if (H >= 15 && H <= 22) {
          occFraction = Math.max(0.02, Math.sin((H - 15) * Math.PI / 7) * 0.85);
        }
      } else if (b.type === "utility") {
        occFraction = 0.1 + Math.random() * 0.05;
      }
      
      // Inject slight random noise to make numbers fluctuate
      const noise = (Math.random() - 0.5) * 0.05;
      b.occupancy = Math.max(0, Math.round((occFraction + noise) * b.maxOccupancy));
      if (b.id === "solar_farm") {
        b.occupancy = Math.max(1, Math.min(4, b.occupancy)); // Solar farm has very few technicians
      }

      // B. Wi-Fi connections (roughly matches occupancy, with server multipliers)
      b.wifiConnections = Math.round(b.occupancy * (1.1 + Math.random() * 0.2));

      // C. Solar Generation
      if (b.solarCapacity > 0) {
        if (H >= 6 && H <= 18) {
          b.solarGeneration = Math.max(0, Math.sin((H - 6) * Math.PI / 12)) * b.solarCapacity * weatherFactor;
          // Add small cloud fluctuation
          b.solarGeneration *= (0.95 + Math.random() * 0.1);
        } else {
          b.solarGeneration = 0;
        }
      } else {
        b.solarGeneration = 0;
      }

      // D. HVAC physics simulation
      // HVAC power draws based on difference from outdoor temp and user setting
      // The room temp moves slowly towards target
      const target = b.hvacSetting;
      const rate = 0.05 * (b.ventilationMode === "high" ? 2.5 : b.ventilationMode === "low" ? 1.0 : 0.2);
      b.temperature += (target - b.temperature) * rate + (this.outdoorTemp - b.temperature) * 0.005;
      // Fluctuation
      b.temperature += (Math.random() - 0.5) * 0.05;

      // Ventilation mode energy loads
      const ventMult = b.ventilationMode === "high" ? 1.8 : b.ventilationMode === "low" ? 1.0 : 0.15;

      // E. Calculate Energy Draw (in kW)
      // HVAC Load: proportional to outdoor vs indoor delta and ventilation rate
      const hvacDelta = Math.abs(b.temperature - this.outdoorTemp);
      const hvacLoad = hvacDelta * (b.areaSqFt / 1000) * 0.35 * ventMult;

      // Lighting Load: proportional to light setting
      const lightingLoad = (b.lightSetting / 100) * (b.areaSqFt / 1000) * 0.65;

      // Occupancy/Equipment Load
      const baseLoad = b.baseEnergy;
      const occupancyLoad = b.occupancy * 0.07; // 70W per active user

      b.energyConsumption = baseLoad + hvacLoad + lightingLoad + occupancyLoad;

      // F. Environmental stats
      b.aqi = Math.round(12 + (b.occupancy / b.maxOccupancy) * 45 + (b.ventilationMode === "high" ? -8 : b.ventilationMode === "off" ? 25 : 0) + Math.random() * 5);
      b.aqi = Math.max(10, Math.min(150, b.aqi));

      b.humidity = Math.round(45 + Math.sin(H / 4) * 5 + (b.ventilationMode === "high" ? -4 : 2) + (Math.random() - 0.5) * 2);
    });

    // 4. Update dynamic history array (collect once every 10 simulation minutes)
    const currentSimMs = this.simTime.getTime();
    if (currentSimMs - this.lastHistoryTick > 10 * 60 * 1000) {
      this.lastHistoryTick = currentSimMs;
      this.history.timestamps.push(this.simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.history.solar.push(this.getTotalSolar());
      this.history.consumption.push(this.getTotalEnergy());

      // Cap history length to last 24 items
      if (this.history.timestamps.length > 24) {
        this.history.timestamps.shift();
        this.history.solar.shift();
        this.history.consumption.shift();
      }
    }

    // 5. Random anomaly/alert generator (chance per tick)
    if (Math.random() < 0.005 && this.alerts.length < 5) {
      this.generateAlert();
    }
  }

  getTotalSolar() {
    return this.buildings.reduce((sum, b) => sum + b.solarGeneration, 0);
  }

  getTotalEnergy() {
    return this.buildings.reduce((sum, b) => sum + b.energyConsumption, 0);
  }

  updateBuildingControls(id, hvac, lights, ventilation) {
    const b = this.buildings.find(item => item.id === id);
    if (b) {
      if (hvac !== undefined) b.hvacSetting = parseFloat(hvac);
      if (lights !== undefined) b.lightSetting = parseInt(lights);
      if (ventilation !== undefined) b.ventilationMode = ventilation;
    }
  }

  generateAlert() {
    const targetBuilding = this.buildings[Math.floor(Math.random() * this.buildings.length)];
    // Don't trigger duplicates for same building
    if (this.alerts.some(a => a.buildingId === targetBuilding.id)) return;

    const alertsPool = [
      { severity: "warning", message: "Water flow surge detected in basement utility pipeline." },
      { severity: "critical", message: "Power node overload detected on floor grid breaker." },
      { severity: "warning", message: "Air Quality Index (AQI) elevated in low-ventilation zone." },
      { severity: "warning", message: "Solar inverter temperature alert. Reduced efficiency." },
      { severity: "critical", message: "HVAC cooling loop pressure drop detected." }
    ];

    const alertConfig = alertsPool[Math.floor(Math.random() * alertsPool.length)];
    const alertId = `alert_${Date.now()}`;

    const newAlert = {
      id: alertId,
      buildingId: targetBuilding.id,
      buildingName: targetBuilding.name,
      severity: alertConfig.severity,
      message: `${targetBuilding.name}: ${alertConfig.message}`,
      timestamp: new Date(this.simTime)
    };

    this.alerts.unshift(newAlert);
    targetBuilding.systemState = alertConfig.severity;
  }

  dismissAlert(id) {
    const alertIndex = this.alerts.findIndex(a => a.id === id);
    if (alertIndex > -1) {
      const alert = this.alerts[alertIndex];
      const building = this.buildings.find(b => b.id === alert.buildingId);
      if (building) building.systemState = "nominal";
      this.alerts.splice(alertIndex, 1);
    }
  }
}

export const campusSim = new CampusSimulation();
