import { buildingsData } from "./campusData.js";

export class CampusSimulation {
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
    // Start at 08:00 AM
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
    this.history.timestamps = [];
    this.history.solar = [];
    this.history.consumption = [];
    
    for (let i = 12; i >= 0; i--) {
      const histTime = new Date(backupTime.getTime() - i * 60 * 60 * 1000);
      const histStates = this.calculateStatesForTime(histTime);
      this.history.timestamps.push(histTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.history.solar.push(histStates.totalSolar);
      this.history.consumption.push(histStates.totalConsumption);
    }
  }

  updateStates(deltaSeconds) {
    // Advance simulated clock
    const msToAdd = deltaSeconds * 1000 * this.simSpeed;
    this.simTime = new Date(this.simTime.getTime() + msToAdd);

    // Weather and Outdoor temperature diurnal cycle
    // Peak temperature at 3 PM (15:00), minimum at 5 AM (05:00)
    const hour = this.simTime.getHours() + this.simTime.getMinutes() / 60;
    const rad = (hour - 15) * (Math.PI / 12);
    const weatherBaseTemps = { sunny: 23.0, cloudy: 18.0, rainy: 14.0 };
    const baseTemp = weatherBaseTemps[this.weather] || 20.0;
    this.outdoorTemp = parseFloat((baseTemp + Math.cos(rad) * 5.0).toFixed(1));

    let totalSolar = 0;
    let totalConsumption = 0;
    let totalOccupants = 0;

    // Update individual buildings
    this.buildings.forEach(b => {
      // 1. Calculate Occupancy (Diurnal Schedule)
      const occupancyRate = this.getOccupancyRateForBuilding(b.id, hour);
      b.occupancy = Math.round(b.maxOccupancy * occupancyRate);
      b.wifiConnections = Math.round(b.occupancy * 1.15 + (Math.random() * 5));
      totalOccupants += b.occupancy;

      // 2. Solar Generation
      // Solar peaks at noon, 0 before 6 AM or after 7 PM
      let solarGen = 0;
      if (hour >= 6 && hour <= 19) {
        const solarRad = (hour - 12.5) * (Math.PI / 6.5);
        solarGen = Math.max(0, Math.cos(solarRad) * b.solarCapacity);
        const weatherFactors = { sunny: 1.0, cloudy: 0.35, rainy: 0.1 };
        solarGen *= (weatherFactors[this.weather] || 1.0);
      }
      b.solarGeneration = parseFloat(solarGen.toFixed(1));
      totalSolar += b.solarGeneration;

      // 3. Thermodynamics (Ambient temp shifts towards outdoor, HVAC fights it)
      const thermalLossConstant = 0.005; // speed of temperature matching outdoor
      const tempDiff = this.outdoorTemp - b.temperature;
      b.temperature += tempDiff * thermalLossConstant * (1 + deltaSeconds * (this.simSpeed / 60));

      // HVAC power adjustment
      const tempGap = b.hvacSetting - b.temperature;
      const hvacPower = Math.abs(tempGap) * 0.15; // cooling/heating constant
      b.temperature += tempGap * hvacPower * (1 + deltaSeconds * (this.simSpeed / 60));
      b.temperature = parseFloat(b.temperature.toFixed(1));

      // 4. Energy Consumption Calculation
      // base + HVAC load + Lighting load
      const hvacLoad = hvacPower * 45; // 45 kW per degree difference load
      const lightsLoad = (b.lightSetting / 100) * (b.areaSqFt * 0.0008); // 0.8W per sqft max
      
      let occupancyLoad = b.occupancy * 0.05; // 50W per person heat/device load
      let ventMultiplier = { off: 0.1, low: 0.6, high: 1.5 }[b.ventilationMode] || 0.6;
      let ventLoad = ventMultiplier * 15;

      let netConsumption = b.baseEnergy + hvacLoad + lightsLoad + occupancyLoad + ventLoad;
      b.energyConsumption = parseFloat(netConsumption.toFixed(1));
      totalConsumption += b.energyConsumption;

      // 5. Environmental indexes (Humidity/AQI shifts with ventilation & occupancy)
      if (b.ventilationMode === "high") {
        b.aqi = Math.max(10, b.aqi - 1);
        b.humidity += (45 - b.humidity) * 0.1;
      } else if (b.ventilationMode === "off") {
        b.aqi = Math.min(150, b.aqi + 1 + Math.round(b.occupancy * 0.02));
        b.humidity += (60 - b.humidity) * 0.05;
      } else { // low
        b.aqi += (20 + Math.round(b.occupancy * 0.01) - b.aqi) * 0.05;
        b.humidity += (48 - b.humidity) * 0.05;
      }
      b.aqi = Math.round(b.aqi);
      b.humidity = Math.round(b.humidity);
    });

    // Anomaly simulation: 0.5% chance per update
    if (Math.random() < 0.005 && this.alerts.length < 5) {
      this.triggerRandomAnomaly();
    }

    // Save history periodically: every 10 simulated minutes
    const simTimeMs = this.simTime.getTime();
    if (simTimeMs - this.lastHistoryTick > 10 * 60 * 1000) {
      this.lastHistoryTick = simTimeMs;
      this.history.timestamps.push(this.simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      this.history.solar.push(parseFloat(totalSolar.toFixed(1)));
      this.history.consumption.push(parseFloat(totalConsumption.toFixed(1)));

      if (this.history.timestamps.length > 15) {
        this.history.timestamps.shift();
        this.history.solar.shift();
        this.history.consumption.shift();
      }
    }
  }

  getOccupancyRateForBuilding(buildingId, hour) {
    // Normal distribution based on schedules
    if (buildingId === "science_hall" || buildingId === "engineering_lab") {
      // 09:00 - 17:00 classes
      if (hour < 8 || hour > 18) return 0.02 + Math.random() * 0.03;
      if (hour >= 12 && hour < 13.5) return 0.25; // lunch dip
      return 0.6 + Math.random() * 0.35;
    }
    if (buildingId === "main_library") {
      // 08:00 - 22:00
      if (hour < 7 || hour > 23) return 0.01;
      if (hour > 14 && hour < 18) return 0.75 + Math.random() * 0.2; // study rush
      return 0.3 + Math.random() * 0.3;
    }
    if (buildingId === "student_center") {
      // lunch and evening peaks
      if (hour < 8 || hour > 22) return 0.05;
      if (hour >= 11.5 && hour < 13.5) return 0.8 + Math.random() * 0.15; // lunch
      if (hour >= 17 && hour < 20) return 0.7 + Math.random() * 0.2; // dinner hang
      return 0.2 + Math.random() * 0.2;
    }
    if (buildingId.startsWith("dormitory")) {
      // residential: high at night, low in day
      if (hour >= 8 && hour < 17) return 0.1 + Math.random() * 0.15;
      return 0.7 + Math.random() * 0.25;
    }
    if (buildingId === "athletic_arena") {
      // evening peak
      if (hour >= 15 && hour < 21) return 0.5 + Math.random() * 0.4;
      return 0.05;
    }
    return 0.05; // Solar Generation Farm holds low occupants
  }

  calculateStatesForTime(time) {
    const hour = time.getHours();
    let totalSolar = 0;
    let totalConsumption = 0;

    buildingsData.forEach(b => {
      // Solar
      let solarGen = 0;
      if (hour >= 6 && hour <= 19) {
        const solarRad = (hour - 12.5) * (Math.PI / 6.5);
        solarGen = Math.max(0, Math.cos(solarRad) * b.solarCapacity);
      }
      totalSolar += solarGen;

      // Energy
      const occupancyRate = this.getOccupancyRateForBuilding(b.id, hour);
      const occupancy = Math.round(b.maxOccupancy * occupancyRate);
      const lightsLoad = 0.7 * (b.areaSqFt * 0.0008);
      const occupancyLoad = occupancy * 0.05;
      const netConsumption = b.baseEnergy + lightsLoad + occupancyLoad + 25; // 25 kW static load proxy
      totalConsumption += netConsumption;
    });

    return {
      totalSolar: parseFloat(totalSolar.toFixed(1)),
      totalConsumption: parseFloat(totalConsumption.toFixed(1))
    };
  }

  triggerRandomAnomaly() {
    const anomalyBld = this.buildings[Math.floor(Math.random() * this.buildings.length)];
    if (anomalyBld.systemState !== "nominal") return;

    const anomalies = [
      { severity: "warning", msg: "Exhaust fan vibration threshold exceeded." },
      { severity: "warning", msg: "Water backflow pressure drop in main service line." },
      { severity: "warning", msg: "Smart light control node unresponsive." },
      { severity: "critical", msg: "Chiller water coolant leak detected." },
      { severity: "critical", msg: "Grid connection phase imbalance warning." }
    ];

    const pick = anomalies[Math.floor(Math.random() * anomalies.length)];
    anomalyBld.systemState = pick.severity;

    const alertId = `alert_${Math.floor(100 + Math.random() * 900)}`;
    this.alerts.unshift({
      id: alertId,
      buildingId: anomalyBld.id,
      buildingName: anomalyBld.name,
      severity: pick.severity,
      message: `${anomalyBld.name}: ${pick.msg}`,
      timestamp: new Date(this.simTime)
    });
  }

  resolveAlert(alertId) {
    const alertIdx = this.alerts.findIndex(a => a.id === alertId);
    if (alertIdx !== -1) {
      const alert = this.alerts[alertIdx];
      const bld = this.buildings.find(b => b.id === alert.buildingId);
      if (bld) bld.systemState = "nominal";
      this.alerts.splice(alertIdx, 1);
      return true;
    }
    return false;
  }
}

export const campusSim = new CampusSimulation();
