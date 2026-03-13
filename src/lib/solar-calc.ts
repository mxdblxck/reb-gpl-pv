// Solar PV & Battery Sizing Calculation Engine
// UTE C15-712-2 compliant – REB GPL Line Project

export type SiteId = "BVS1" | "BVS2" | "TA";

export type SiteParams = {
  siteId: string;
  energyLoad: number; // Wh/day
  psh: number; // Peak Sun Hours (default 4.95 h – worst month REB)
  pr: number; // Performance Ratio (default 0.72)
  modulePower: number; // Wp per module (default 555 Wp Jinko)
  groups: number; // Number of parallel PV groups (1 for BVS1/BVS2, 2 for TA)
  autonomy: number; // Battery autonomy in days (default 5)
  dod: number; // Depth of Discharge (default 0.8 Ni-Cad)
  batteryEfficiency: number; // Battery charge/discharge efficiency (default 0.85)
  cellVoltage: number; // Single cell voltage V (default 1.2 V Ni-Cad)
  unitaryBatteryCapacity: number; // Single battery capacity Ah (default 1275 Ah)
  systemVoltage: number; // DC bus voltage V (default 48 V)
  margin: number; // Safety margin percentage (default 0.2 = 20%)
};

export type PVResult = {
  pvRequiredWp: number; // PV Required Power (Wp)
  nModules: number; // Number of modules (ceil)
  nModulesPerGroup: number; // Modules per group
  seriesPerGroup: number; // Modules in series per group (MPPT range 2)
  parallelStrings: number; // Parallel strings per group
  totalModules: number; // Total modules all groups
  configLabel: string; // e.g. "2G × 2S × 2P"
  actualPvPower: number; // Actual installed Wp
};

export type BatteryResult = {
  capacityAh: number; // Required capacity in Ah
  capacityWh: number; // Required capacity in Wh
  cellsInSeries: number; // Cells in series to reach V_BATT
  parallelBranches: number; // Parallel branches (ceil(cap_ah / CAP_UNITAIRE))
  totalCells: number;
  configLabel: string; // e.g. "40S × 2P"
  actualCapacityAh: number; // Actual installed capacity
  actualCapacityWh: number;
};

export type SiteResult = {
  siteId: string;
  params: SiteParams;
  pv: PVResult;
  battery: BatteryResult;
  simultaneityFactor: number; // 1.0 standard, 1.3 if simultaneity applied
  correctedEnergyLoad: number; // E × simultaneityFactor
};

/**
 * Calculate PV system sizing for a single site
 */
export function calculatePV(params: SiteParams): PVResult {
  const { energyLoad, psh, pr, modulePower, groups } = params;

  // Required PV power: P_PV = E / (PSH × PR)
  const pvRequiredWp = energyLoad / (psh * pr);

  // Modules per group
  const nModulesPerGroup = Math.ceil(pvRequiredWp / (modulePower * groups));

  // Series/Parallel configuration: 2S per MPPT input (standard MPPT range)
  const seriesPerGroup = 2;
  const parallelStrings = Math.ceil(nModulesPerGroup / seriesPerGroup);

  // Adjusted modules per group (must be multiple of series)
  const adjustedModulesPerGroup = seriesPerGroup * parallelStrings;
  const totalModules = adjustedModulesPerGroup * groups;
  const actualPvPower = totalModules * modulePower;

  const configLabel = `${groups}G × ${seriesPerGroup}S × ${parallelStrings}P`;

  return {
    pvRequiredWp,
    nModules: adjustedModulesPerGroup,
    nModulesPerGroup: adjustedModulesPerGroup,
    seriesPerGroup,
    parallelStrings,
    totalModules,
    configLabel,
    actualPvPower,
  };
}

/**
 * Calculate battery bank sizing for a single site
 */
export function calculateBattery(params: SiteParams): BatteryResult {
  const {
    energyLoad,
    autonomy,
    dod,
    batteryEfficiency,
    cellVoltage,
    unitaryBatteryCapacity,
    systemVoltage,
  } = params;

  // Required capacity: C = (E × Autonomy) / (DOD × η_batt × V_batt)
  const capacityAh = (energyLoad * autonomy) / (dod * batteryEfficiency * systemVoltage);
  const capacityWh = capacityAh * systemVoltage;

  // Cells in series: n_s = V_BATT / V_CELL
  const cellsInSeries = Math.round(systemVoltage / cellVoltage);

  // Parallel branches: n_p = ceil(C_req / C_unit)
  const parallelBranches = Math.ceil(capacityAh / unitaryBatteryCapacity);

  const totalCells = cellsInSeries * parallelBranches;
  const actualCapacityAh = parallelBranches * unitaryBatteryCapacity;
  const actualCapacityWh = actualCapacityAh * systemVoltage;

  const configLabel = `${cellsInSeries}S × ${parallelBranches}P`;

  return {
    capacityAh,
    capacityWh,
    cellsInSeries,
    parallelBranches,
    totalCells,
    configLabel,
    actualCapacityAh,
    actualCapacityWh,
  };
}

/**
 * Full site sizing calculation
 */
export function calculateSite(
  params: SiteParams,
  applySimultaneity = false
): SiteResult {
  const simultaneityFactor = applySimultaneity ? 1.3 : 1.0;
  const margin = params.margin || 0;
  // Apply margin and simultaneity factor to energy load
  const correctedEnergyLoad = params.energyLoad * simultaneityFactor * (1 + margin);

  const correctedParams: SiteParams = {
    ...params,
    energyLoad: correctedEnergyLoad,
  };

  const pv = calculatePV(correctedParams);
  const battery = calculateBattery(correctedParams);

  return {
    siteId: params.siteId,
    params,
    pv,
    battery,
    simultaneityFactor,
    correctedEnergyLoad,
  };
}

/**
 * Default site parameters for REB GPL Line
 * BVS1: 1275 Ah | BVS2 & TA: 1515 Ah
 */
export function getDefaultSiteParams(siteId: string): SiteParams {
  const groups = siteId === "TA" ? 2 : 1;
  // Site-specific unitary battery capacity
  const unitaryBatteryCapacity = siteId === "BVS1" ? 1275 : 1515;
  return {
    siteId,
    energyLoad: 0,
    psh: 5.2,
    pr: 0.72,
    modulePower: 555,
    groups,
    autonomy: 5,
    dod: 0.8,
    batteryEfficiency: 0.85,
    cellVoltage: 1.2,
    unitaryBatteryCapacity,
    systemVoltage: 48,
    margin: 0, // Default: no safety margin (user can add in detailed view)
  };
}

/** Human-readable site full name */
export function getSiteFullName(siteId: string): string {
  if (siteId === "TA") return "Terminal Arrival";
  return `Bloc Valve Station ${siteId.slice(-1)}`;
}

// ── Battery Recharge Time ─────────────────────────────────────────────────────
// Corrected formula (off-grid energy flux method):
//   P_pv_net  = P_installed × PR
//   E_recharge_j = (P_pv_net × PSH) − (P_load_avg × PSH)   [load only subtracted during sunshine hours]
//   T_charge  = E_autonomie_consommee / (E_recharge_j × η_batt)

export type RechargeScenario = {
  sunHours: number;
  ePvJ: number;           // Net PV energy during sun hours: P_pv_net × PSH  (Wh/day)
  eLoadDuringPSH: number; // Load energy during sun hours:   P_load_avg × PSH (Wh)
  eRechargeJ: number;     // Net recharge energy available:  ePvJ − eLoadDuringPSH (Wh/day)
  daysToRecharge: number | null; // null when no surplus
};

export type RechargeResult = {
  batteryEnergyWh: number;     // P_batt = U × C  (Wh)
  eAutonomieConsommee: number; // E_load × autonomy (Wh) — energy to restore
  pPvNet: number;              // P_installed × PR  (W)
  pLoadAvg: number;            // E_load / 24  (W)
  scenarios: RechargeScenario[];
};

/**
 * Battery recharge time — corrected off-grid energy flux method.
 * The load is only subtracted during PSH hours because outside those hours
 * the load is fed exclusively by the batteries.
 */
export function calculateRecharge(result: SiteResult): RechargeResult {
  const { pv, battery, params, correctedEnergyLoad } = result;

  // Total battery energy (P_batteries = U × C)
  const batteryEnergyWh = battery.actualCapacityAh * params.systemVoltage;

  // Total energy to restore after full autonomy discharge
  const eAutonomieConsommee = correctedEnergyLoad * params.autonomy;

  // Net PV power after Performance Ratio losses
  const pPvNet = pv.actualPvPower * params.pr;

  // Average load power over 24 h
  const pLoadAvg = correctedEnergyLoad / 24;

  const scenarios: RechargeScenario[] = [6, 7, 8].map((sunHours) => {
    // Net PV energy produced during PSH hours
    const ePvJ = pPvNet * sunHours;
    // Load energy consumed only during the sun-hours window
    const eLoadDuringPSH = pLoadAvg * sunHours;
    // Energy surplus available for battery charging each day
    const eRechargeJ = ePvJ - eLoadDuringPSH;
    // Days to fully recharge (η_batt = charging efficiency)
    const daysToRecharge =
      eRechargeJ > 0
        ? eAutonomieConsommee / (eRechargeJ * params.batteryEfficiency)
        : null;
    return { sunHours, ePvJ, eLoadDuringPSH, eRechargeJ, daysToRecharge };
  });

  return { batteryEnergyWh, eAutonomieConsommee, pPvNet, pLoadAvg, scenarios };
}

// ── Detail Study Reference Configurations ────────────────────────────────────
// Fixed configurations from the REB GPL Line engineering detail study.

export type DetailConfig = {
  siteId: string;
  pvLabel: string;       // e.g. "1G × 2S × 5P"
  pvTotalModules: number;
  pvInstalledWp: number;
  battLabel: string;     // e.g. "40S × 2P = 2550 Ah"
  battSeries: number;
  battParallel: number;
  battTotalAh: number;
};

export const SITE_DETAIL_CONFIGS: Record<string, DetailConfig> = {
  BVS1: {
    siteId: "BVS1",
    pvLabel: "1G × 2S × 5P",
    pvTotalModules: 10,
    pvInstalledWp: 10 * 555,   // 5 550 Wp
    battLabel: "40S × 2P = 2 550 Ah",
    battSeries: 40,
    battParallel: 2,
    battTotalAh: 2 * 1275,     // 2 550 Ah
  },
  BVS2: {
    siteId: "BVS2",
    pvLabel: "1G × 2S × 3P",
    pvTotalModules: 6,
    pvInstalledWp: 6 * 555,    // 3 330 Wp
    battLabel: "40S × 1P = 1 515 Ah",
    battSeries: 40,
    battParallel: 1,
    battTotalAh: 1 * 1515,     // 1 515 Ah
  },
  TA: {
    siteId: "TA",
    pvLabel: "2G × 2S × 4.5P avg",
    pvTotalModules: 18,        // 9 modules/group avg (4P + 5P)
    pvInstalledWp: 18 * 555,   // 9 990 Wp
    battLabel: "40S × 4P = 6 060 Ah",
    battSeries: 40,
    battParallel: 4,
    battTotalAh: 4 * 1515,     // 6 060 Ah
  },
};

export const SITES: SiteId[] = ["BVS1", "BVS2", "TA"];

export function formatWp(wp: number): string {
  return wp >= 1000
    ? `${(wp / 1000).toFixed(2)} kWp`
    : `${wp.toFixed(0)} Wp`;
}

export function formatWh(wh: number): string {
  return wh >= 1000
    ? `${(wh / 1000).toFixed(2)} kWh`
    : `${wh.toFixed(0)} Wh`;
}

export function formatAh(ah: number): string {
  return `${ah.toFixed(0)} Ah`;
}
