// PDF Export utility for Solar Sizing Reports
// REB GPL Line Project — UTE C15-712-2

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { SiteResult } from "./solar-calc.ts";
import { formatWp, formatWh, formatAh, calculateRecharge, SITE_DETAIL_CONFIGS } from "./solar-calc.ts";

const BRAND_ORANGE = [255, 102, 0] as [number, number, number];
const BRAND_LIGHT = [255, 242, 230] as [number, number, number];
const DARK = [30, 20, 10] as [number, number, number];
const GRAY = [120, 100, 80] as [number, number, number];

export function generateSizingPDF(results: SiteResult[]): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageW, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SOLAR PANELS SYSTEMS SIZING", margin, 12);
  doc.setFontSize(11);
  doc.text("REB GPL LINE PROJECT — Off-Grid PV Dimensioning Report", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleString()} | UTE C15-712-2 | Rhourde El Baguel, Algeria`,
    margin,
    27
  );

  let y = 42;

  // ── Design Basis ─────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Design Basis & Default Parameters", margin, y);
  y += 6;

  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const basis = [
    ["Location", "Rhourde El Baguel, Algeria (Sahara Desert)"],
    ["Peak Sun Hours (PSH)", `${results[0]?.params.psh ?? 4.95} h/day (worst month)`],
    ["Performance Ratio (PR)", `${results[0]?.params.pr ?? 0.72} (conservative, incl. wiring/temperature losses)`],
    ["PV Module", `${results[0]?.params.modulePower ?? 555} Wp — Jinko Solar (mono-PERC)`],
    ["System Voltage", `${results[0]?.params.systemVoltage ?? 48} V DC`],
    ["Battery Technology", "Ni-Cad (Nickel-Cadmium), 1.2 V/cell"],
    ["Battery Autonomy", `${results[0]?.params.autonomy ?? 5} days`],
    ["Depth of Discharge (DoD)", `${results[0]?.params.dod ?? 0.8} (80%)`],
    ["Battery Efficiency", `${results[0]?.params.batteryEfficiency ?? 0.85} (85%)`],
    ["Unitary Battery Capacity", `${results[0]?.params.unitaryBatteryCapacity ?? 1275} Ah`],
    ["Norm Reference", "UTE C15-712-2 (French/Algerian PV standard)"],
  ];

  autoTable(doc, {
    startY: y,
    body: basis,
    theme: "plain",
    styles: { fontSize: 8.5, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 65, textColor: GRAY },
      1: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // ── Formulas ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text("Sizing Formulas", margin, y);
  y += 6;
  doc.setDrawColor(...BRAND_ORANGE);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const formulas = [
    "PV Required Power (Wp) = E_load / (PSH × PR)",
    "Number of Modules = ⌈P_PV_required / P_module⌉  →  adjusted to full series strings",
    "Battery Required Capacity (Ah) = (E_load × Autonomy) / (DoD × η_batt × V_sys)",
    "Cells in Series = V_sys / V_cell",
    "Parallel Battery Branches = ⌈C_required / C_unitary⌉",
  ];
  formulas.forEach((f) => {
    doc.setTextColor(...GRAY);
    doc.text("•  ", margin, y);
    doc.setTextColor(...DARK);
    doc.text(f, margin + 5, y);
    y += 5.5;
  });
  y += 4;

  // ── Per-Site Results ──────────────────────────────────────────────────────
  for (const result of results) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    const { siteId, pv, battery, params, correctedEnergyLoad, simultaneityFactor } = result;

    // Site header
    doc.setFillColor(...BRAND_LIGHT);
    doc.rect(margin, y - 2, pageW - 2 * margin, 10, "F");
    doc.setFillColor(...BRAND_ORANGE);
    doc.rect(margin, y - 2, 3, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(`Site: ${siteId}`, margin + 6, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `E = ${correctedEnergyLoad.toFixed(0)} Wh/day${simultaneityFactor > 1 ? ` (×${simultaneityFactor} simultaneity)` : ""}`,
      120,
      y + 5
    );

    y += 14;

    // PV Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text("PV System", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Value", "Formula / Note"]],
      body: [
        ["Required PV Power", formatWp(pv.pvRequiredWp), `E / (PSH × PR) = ${correctedEnergyLoad.toFixed(0)} / (${params.psh} × ${params.pr})`],
        ["Installed PV Power", formatWp(pv.actualPvPower), `${pv.totalModules} × ${params.modulePower} Wp`],
        ["Total Modules", `${pv.totalModules} modules`, `${pv.nModulesPerGroup}/group × ${params.groups} group(s)`],
        ["Configuration", pv.configLabel, "Groups × Series × Parallel"],
        ["Series/String", `${pv.seriesPerGroup} modules`, "MPPT voltage range"],
        ["Parallel Strings", `${pv.parallelStrings}`, "per group"],
      ],
      theme: "striped",
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: BRAND_LIGHT },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: "auto", textColor: GRAY },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

    // Battery Table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text("Battery Bank", margin, y);
    y += 2;

    autoTable(doc, {
      startY: y,
      head: [["Parameter", "Value", "Formula / Note"]],
      body: [
        ["Required Capacity", formatAh(battery.capacityAh), `(E × ${params.autonomy}d) / (${params.dod} × ${params.batteryEfficiency} × ${params.systemVoltage}V)`],
        ["Required Energy", formatWh(battery.capacityWh), `At ${params.systemVoltage} V system`],
        ["Installed Capacity", formatAh(battery.actualCapacityAh), `${battery.parallelBranches} branch(es) × ${params.unitaryBatteryCapacity} Ah`],
        ["Installed Energy", formatWh(battery.actualCapacityWh), "Nominal at system voltage"],
        ["Cells in Series", `${battery.cellsInSeries} cells`, `${params.systemVoltage}V / ${params.cellVoltage}V/cell`],
        ["Parallel Branches", `${battery.parallelBranches}`, `⌈${battery.capacityAh.toFixed(0)} / ${params.unitaryBatteryCapacity}⌉`],
        ["Configuration", battery.configLabel, "Series × Parallel (Ni-Cad)"],
        ["Total Cells", `${battery.totalCells}`, `${battery.cellsInSeries}S × ${battery.parallelBranches}P`],
      ],
      theme: "striped",
      headStyles: { fillColor: [80, 60, 40], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: "auto", textColor: GRAY },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    // ── Étude de Détails Suggérée ────────────────────────────────────────────
    const detailConfig = SITE_DETAIL_CONFIGS[siteId];
    if (detailConfig) {
      if (y > 230) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      doc.text("Étude de Détails Suggérée (Référence)", margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        head: [["Paramètre", "Système PV", "Banc de Batteries"]],
        body: [
          ["Configuration", detailConfig.pvLabel, detailConfig.battLabel],
          [
            "Nombre / Cellules",
            `${detailConfig.pvTotalModules} modules`,
            `${detailConfig.battSeries}S × ${detailConfig.battParallel}P`,
          ],
          [
            "Puissance / Capacité",
            formatWp(detailConfig.pvInstalledWp),
            formatAh(detailConfig.battTotalAh),
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [180, 120, 0], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: "bold" },
          1: { cellWidth: 55, halign: "center" },
          2: { cellWidth: "auto", halign: "center" },
        },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ── Temps de Recharge ────────────────────────────────────────────────────
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text("Temps de Recharge des Batteries", margin, y);
    y += 2;

    const recharge = calculateRecharge(result);
    const { batteryEnergyWh, eAutonomieConsommee, pPvNet, pLoadAvg, scenarios } = recharge;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    const formulaLine1 = `P_pv_net = P_inst × PR = ${pv.actualPvPower.toFixed(0)} × ${params.pr} = ${pPvNet.toFixed(0)} W  |  P_load_avg = E / 24 = ${pLoadAvg.toFixed(1)} W`;
    const formulaLine2 = `E_recharge_j = (P_pv_net − P_load_avg) × PSH  |  T_charge = E_autonomie / (E_recharge_j × η_batt)`;
    const formulaLine3 = `E_autonomie = ${result.correctedEnergyLoad.toFixed(0)} × ${params.autonomy}j = ${formatWh(eAutonomieConsommee)}  |  P_batt = ${params.systemVoltage}V × ${battery.actualCapacityAh}Ah = ${formatWh(batteryEnergyWh)}  |  η_batt = ${params.batteryEfficiency}`;
    doc.text(formulaLine1, margin, y + 5);
    doc.text(formulaLine2, margin, y + 9.5);
    doc.text(formulaLine3, margin, y + 14);
    y += 18;

    autoTable(doc, {
      startY: y,
      head: [["PSH (h/j)", "E_pv_net (Wh/j)", "E_charge_load (Wh)", "E_recharge_j (Wh/j)", "T_charge (jours)"]],
      body: scenarios.map((s) => [
        `${s.sunHours} h`,
        s.ePvJ.toFixed(0),
        s.eLoadDuringPSH.toFixed(0),
        s.eRechargeJ > 0 ? `+${s.eRechargeJ.toFixed(0)}` : s.eRechargeJ.toFixed(0),
        s.daysToRecharge !== null ? `${s.daysToRecharge.toFixed(2)} j` : "Pas de surplus",
      ]),
      theme: "striped",
      headStyles: { fillColor: [60, 120, 60], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 248, 240] },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: "bold" },
        1: { cellWidth: 35, halign: "right" },
        2: { cellWidth: 38, halign: "right" },
        3: { cellWidth: 38, halign: "right" },
        4: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ── All Sites Summary ─────────────────────────────────────────────────────
  if (results.length > 1) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text("All Sites Summary", margin, y);
    y += 6;
    doc.setDrawColor(...BRAND_ORANGE);
    doc.line(margin, y, pageW - margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Site", "E (Wh/d)", "PV Power", "Modules", "PV Config", "Batt. Cap.", "Batt. Config"]],
      body: results.map((r) => [
        r.siteId,
        r.correctedEnergyLoad.toFixed(0),
        formatWp(r.pv.actualPvPower),
        r.pv.totalModules.toString(),
        r.pv.configLabel,
        formatAh(r.battery.actualCapacityAh),
        r.battery.configLabel,
      ]),
      theme: "grid",
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
  }

  // ── Footer on all pages ───────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      `Sonatrach DC-EPM — REB GPL Line Project | by: Mohamed ADDA | Page ${i}/${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: "center" }
    );
  }

  doc.save(`REB-GPL-PV-Sizing-${new Date().toISOString().slice(0, 10)}.pdf`);
}
