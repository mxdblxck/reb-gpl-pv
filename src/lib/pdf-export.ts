// PDF & Excel Export utility for Solar Sizing Reports
// REB GPL Line Project — UTE C15-712-2

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { SiteResult } from "./solar-calc.ts";
import { formatWp, formatWh, formatAh, calculateRecharge, SITE_DETAIL_CONFIGS, getSiteFullName } from "./solar-calc.ts";

const BRAND_ORANGE = [255, 102, 0] as [number, number, number];
const BRAND_LIGHT = [255, 242, 230] as [number, number, number];
const DARK = [30, 20, 10] as [number, number, number];
const GRAY = [120, 100, 80] as [number, number, number];

export function generateSizingPDF(results: SiteResult[], projectName?: string): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  const dateStr = new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // ── En-tête avec logo Sonatrach ────────────────────────────────────────────────
  doc.setFillColor(...BRAND_ORANGE);
  doc.rect(0, 0, pageW, 35, "F");

  // Sonatrach logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SONATRACH", margin, 15);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Direction Centrale - Engineering & Project Management", margin, 22);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Projet ligne d'expédition GPL 14\" - RHOURDE EL BAGUEL", margin, 29);

  // Right side - Report title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("RAPPORT DE DIMENSIONNEMENT", pageW - margin, 15, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Système Photovoltaïque Autonome (Off-Grid)", pageW - margin, 21, { align: "right" });
  doc.setFontSize(8);
  doc.text("Conforme à la norme UTE C15-712-2", pageW - margin, 27, { align: "right" });

  let y = 45;

  // ── Titre du projet ─────────────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`Projet: ${projectName || "Dimensionnement PV - REB GPL"}`, margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Date: ${dateStr}`, margin, y);
  y += 12;

  // ── Base de calcul et paramètres ─────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. BASE DE CALCUL ET PARAMÈTRES", margin, y);
  y += 7;

  doc.setDrawColor(...BRAND_ORANGE);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  const psh = results[0]?.params.psh ?? 4.95;
  const pr = results[0]?.params.pr ?? 0.72;
  const modulePower = results[0]?.params.modulePower ?? 555;
  const systemVoltage = results[0]?.params.systemVoltage ?? 48;
  const autonomy = results[0]?.params.autonomy ?? 5;
  const dod = results[0]?.params.dod ?? 0.8;
  const batteryEff = results[0]?.params.batteryEfficiency ?? 0.85;
  const unitaryCap = results[0]?.params.unitaryBatteryCapacity ?? 1275;

  const basis = [
    ["Emplacement", "Rhourde El Baguel, Algérie (Désert du Sahara)"],
    ["Heures de Soleil Crête (PSH)", `${psh} h/jour (pire mois)`],
    ["Ratio de Performance (PR)", `${pr} (valeur conservative, pertes câblage/température)`],
    ["Module PV", `${modulePower} Wp — Jinko Solar (mono-PERC)`],
    ["Tension Système", `${systemVoltage} V DC`],
    ["Technologie Batterie", "Ni-Cad (Nickel-Cadmium), 1,2 V/celule"],
    ["Autonomie Batterie", `${autonomy} jours`],
    ["Profondeur de Décharge (DOD)", `${dod * 100}%`],
    ["Rendement Batterie", `${batteryEff * 100}%`],
    ["Capacité Unitaire Batterie", `${unitaryCap} Ah`],
    ["Référence Normative", "UTE C15-712-2 (Norme solaire française/algérienne)"],
  ];

  autoTable(doc, {
    startY: y,
    body: basis,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [80, 80, 80] },
      1: { cellWidth: "auto", textColor: DARK },
    },
    margin: { left: margin, right: margin },
  });

  y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Formules de dimensionnement ────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...DARK);
  doc.text("2. FORMULES DE DIMENSIONNEMENT", margin, y);
  y += 7;
  doc.setDrawColor(...BRAND_ORANGE);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const formulas = [
    ["Puissance PV Requise (Wp)", "P_req = E / (PSH x PR)"],
    ["Nombre de Modules", "N = ceil(P_req / P_module)"],
    ["Capacite Batterie Requise (Ah)", "C_req = (E x Autonomie) / (DOD x n_batt x V_sys)"],
    ["Cellules en Serie", "N_cells = V_sys / V_cellule"],
    ["Branches Paralleles", "N_branches = ceil(C_req / C_unitaire)"],
  ];
  
  formulas.forEach(([formula, calc]) => {
    doc.setTextColor(...DARK);
    doc.text(`-  ${formula}:`, margin, y);
    doc.setTextColor(...GRAY);
    doc.text(calc, margin + 75, y);
    y += 6;
  });
  y += 5;

  // ── Résultats par site ──────────────────────────────────────────────────────
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (y > 220) {
      doc.addPage();
      y = 20;
    }

    const { siteId, pv, battery, params, correctedEnergyLoad, simultaneityFactor } = result;
    const siteName = getSiteFullName(siteId);

    // En-tête du site
    doc.setFillColor(...BRAND_LIGHT);
    doc.rect(margin, y - 3, pageW - 2 * margin, 12, "F");
    doc.setFillColor(...BRAND_ORANGE);
    doc.rect(margin, y - 3, 4, 12, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND_ORANGE);
    doc.text(`SITE ${siteId}`, margin + 7, y + 4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.text(siteName, margin + 35, y + 4);

    doc.setFontSize(9);
    doc.setTextColor(...GRAY);
    doc.text(
      `E = ${correctedEnergyLoad.toFixed(0)} Wh/jour${simultaneityFactor > 1 ? ` (×${simultaneityFactor} simultanéité)` : ""}`,
      pageW - margin,
      y + 4,
      { align: "right" }
    );

    y += 16;

    // ── Système PV ─────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(`3.${i + 1} Système Photovoltaïque - ${siteId}`, margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Paramètre", "Valeur", "Formule / Note"]],
      body: [
        ["Puissance PV Requise", formatWp(pv.pvRequiredWp), `E / (PSH * PR) = ${correctedEnergyLoad.toFixed(0)} / (${params.psh} * ${params.pr})`],
        ["Puissance PV Installée", formatWp(pv.actualPvPower), `${pv.totalModules} * ${params.modulePower} Wp`],
        ["Nombre Total de Modules", `${pv.totalModules} modules`, `${pv.nModulesPerGroup}/groupe * ${params.groups} groupe(s)`],
        ["Configuration", pv.configLabel, "Groupes * Série * Parallèle"],
        ["Modules en Série/String", `${pv.seriesPerGroup} modules`, "Plage tension MPPT"],
        ["Strings en Parallèle", `${pv.parallelStrings}`, "par groupe"],
      ],
      theme: "striped",
      headStyles: { fillColor: BRAND_ORANGE, textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: BRAND_LIGHT },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: 45, halign: "right" },
        2: { cellWidth: "auto", textColor: GRAY },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // ── Batterie ────────────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(`3.${i + 2} Parc Batteries - ${siteId}`, margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Paramètre", "Valeur", "Formule / Note"]],
      body: [
        ["Capacité Requise", formatAh(battery.capacityAh), `(E * ${params.autonomy}j) / (${params.dod} * ${params.batteryEfficiency} * ${params.systemVoltage}V)`],
        ["Énergie Requise", formatWh(battery.capacityWh), `A ${params.systemVoltage} V nominal`],
        ["Capacité Installée", formatAh(battery.actualCapacityAh), `${battery.parallelBranches} branche(s) * ${params.unitaryBatteryCapacity} Ah`],
        ["Énergie Installée", formatWh(battery.actualCapacityWh), "Nominale à la tension système"],
        ["Cellules en Série", `${battery.cellsInSeries} cellules`, `${params.systemVoltage}V / ${params.cellVoltage}V/celule`],
        ["Branches Parallèles", `${battery.parallelBranches}`, `ceil(${battery.capacityAh.toFixed(0)} / ${params.unitaryBatteryCapacity})`],
        ["Configuration", battery.configLabel, "Série * Parallèle (Ni-Cad)"],
        ["Total Cellules", `${battery.totalCells}`, `${battery.cellsInSeries}S * ${battery.parallelBranches}P`],
      ],
      theme: "striped",
      headStyles: { fillColor: [80, 60, 40], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [250, 245, 240] },
      columnStyles: {
        0: { cellWidth: 55, fontStyle: "bold" },
        1: { cellWidth: 45, halign: "right" },
        2: { cellWidth: "auto", textColor: GRAY },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // ── Configuration détaillée suggérée ──────────────────────────────────────
    const detailConfig = SITE_DETAIL_CONFIGS[siteId];
    if (detailConfig) {
      if (y > 200) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...DARK);
      doc.text(`3.${i + 3} Configuration Détaillée Suggérée - ${siteId}`, margin, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [["Paramètre", "Système PV", "Parc Batteries"]],
        body: [
          ["Configuration", detailConfig.pvLabel, detailConfig.battLabel],
          ["Nombre / Cellules", `${detailConfig.pvTotalModules} modules`, `${detailConfig.battSeries}S × ${detailConfig.battParallel}P`],
          ["Puissance / Capacité", formatWp(detailConfig.pvInstalledWp), formatAh(detailConfig.battTotalAh)],
        ],
        theme: "grid",
        headStyles: { fillColor: [180, 120, 0], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: "bold" },
          1: { cellWidth: 60, halign: "center" },
          2: { cellWidth: "auto", halign: "center" },
        },
        margin: { left: margin, right: margin },
      });
      y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
    }

    // ── Temps de recharge ─────────────────────────────────────────────────────
    if (y > 180) { doc.addPage(); y = 20; }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...DARK);
    doc.text(`3.${i + 4} Temps de Recharge des Batteries - ${siteId}`, margin, y);
    y += 5;

    const recharge = calculateRecharge(result);
    const { pPvNet, pLoadAvg, scenarios } = recharge;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `P_pv_net = P_inst x PR = ${pv.actualPvPower.toFixed(0)} x ${params.pr} = ${pPvNet.toFixed(0)} W    |    P_moyenne = E / 24 = ${pLoadAvg.toFixed(1)} W`,
      margin,
      y + 4
    );
    doc.text(
      `T_recharge = Energie_autonomie / (Surplus_quotidien x n_batt)`,
      margin,
      y + 9
    );
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [["PSH (h/j)", "E_pv_net (Wh/j)", "E_charge (Wh)", "Surplus (Wh/j)", "T_recharge (jours)"]],
      body: scenarios.map((s) => [
        `${s.sunHours} h`,
        s.ePvJ.toFixed(0),
        s.eLoadDuringPSH.toFixed(0),
        s.eRechargeJ > 0 ? `+${s.eRechargeJ.toFixed(0)}` : s.eRechargeJ.toFixed(0),
        s.daysToRecharge !== null ? `${s.daysToRecharge.toFixed(2)} j` : "Pas de surplus",
      ]),
      theme: "striped",
      headStyles: { fillColor: [60, 120, 60], textColor: [255, 255, 255], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [240, 248, 240] },
      columnStyles: {
        0: { cellWidth: 20, fontStyle: "bold" },
        1: { cellWidth: 35, halign: "right" },
        2: { cellWidth: 35, halign: "right" },
        3: { cellWidth: 35, halign: "right" },
        4: { cellWidth: "auto", halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ── Récapitulatif de tous les sites ────────────────────────────────────────
  if (results.length > 1) {
    if (y > 180) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...DARK);
    doc.text("4. RÉCAPITULATIF GLOBAL", margin, y);
    y += 7;
    doc.setDrawColor(...BRAND_ORANGE);
    doc.line(margin, y, pageW - margin, y);
    y += 3;

    autoTable(doc, {
      startY: y,
      head: [["Site", "E (Wh/j)", "Puissance PV", "Modules", "Config PV", "Capacité Batt.", "Config Batt."]],
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

  // ── Pied de page sur toutes les pages ──────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `SONATRACH DC-EPM — Projet REB GPL Ligne | Préparé par: Mohamed ADDA | Page ${i}/${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 7,
      { align: "center" }
    );
  }

  // Nom du fichier avec date
  const fileName = projectName 
    ? `REB-GPL-PV-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`
    : `REB-GPL-PV-Dimensionnement-${new Date().toISOString().slice(0, 10)}.pdf`;
    
  doc.save(fileName);
}

// Excel Export function - Beautiful and organized with site colors
export function generateExcel(results: SiteResult[], projectName?: string): void {
  const wb = XLSX.utils.book_new();
  
  // Helper: Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };
  
  const ORANGE = hexToRgb('#FF6600');
  const DARK = hexToRgb('#1E1414');
  const LIGHT = hexToRgb('#FFF7ED');
  const WHITE = { r: 255, g: 255, b: 255 };
  const GRAY = hexToRgb('#6B7280');
  const LIGHT_GRAY = hexToRgb('#F3F4F6');
  
  // Helper to create styled cell
  const createCell = (value: any, bold = false, bgColor: typeof ORANGE | null = null, fontColor: typeof ORANGE = DARK): any => ({
    v: value,
    s: {
      font: { bold, color: { rgb: fontColor === DARK ? '1E1414' : 'FFFFFF' } },
      fill: bgColor ? { fgColor: { rgb: bgColor === ORANGE ? 'FF6600' : 'F3F4F6' } } : undefined,
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        left: { style: 'thin', color: { rgb: 'E5E7EB' } },
        right: { style: 'thin', color: { rgb: 'E5E7EB' } },
        top: { style: 'thin', color: { rgb: 'E5E7EB' } },
        bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
      },
    },
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 1: RÉSUMÉ DU PROJET
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryData: any[][] = [];
  
  // En-tête projet - Title row
  summaryData.push([
    createCell("SONATRACH - REB GPL LIGNE", true, ORANGE, WHITE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
  ]);
  
  // Project name
  summaryData.push([
    createCell(`Projet: ${projectName || "Dimensionnement PV"}`, true),
    createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
  ]);
  
  // Date
  summaryData.push([
    createCell(`Date: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}`),
    createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
  ]);
  
  summaryData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  
  // En-têtes tableau avec fond orange
  const headers = ["Site", "Énergie (Wh/j)", "Puissance PV (kWp)", "Modules", "Config PV", "Capacité Batt (Ah)", "Config Batt"];
  summaryData.push(headers.map(h => createCell(h, true, LIGHT_GRAY)));
  
  // Données avec alternance
  results.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? null : LIGHT_GRAY;
    summaryData.push([
      createCell(r.siteId, true, bg ? bg : null, ORANGE),
      createCell(Math.round(r.correctedEnergyLoad), false, bg),
      createCell((r.pv.actualPvPower / 1000).toFixed(2), false, bg),
      createCell(r.pv.totalModules, false, bg),
      createCell(r.pv.configLabel, false, bg),
      createCell(Math.round(r.battery.actualCapacityAh), false, bg),
      createCell(r.battery.configLabel, false, bg),
    ]);
  });
  
  summaryData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  summaryData.push([createCell("PARAMÈTRES DE CALCUL", true, ORANGE, WHITE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE)]);
  
  if (results[0]) {
    const p = results[0].params;
    const paramsData = [
      ["PSH (pire mois)", `${p.psh} h/jour`],
      ["PR (Performance Ratio)", p.pr.toString()],
      ["Tension système", `${p.systemVoltage} V DC`],
      ["Autonomie", `${p.autonomy} jours`],
      ["DOD", `${(p.dod * 100).toFixed(0)}%`],
      ["Rendement batteries", `${(p.batteryEfficiency * 100).toFixed(0)}%`],
      ["Capacité unitaire", `${p.unitaryBatteryCapacity} Ah`],
      ["Marge de sécurité", `${((p.margin || 0) * 100).toFixed(0)}%`],
    ];
    paramsData.forEach((row, idx) => {
      summaryData.push([
        createCell(row[0], true, idx % 2 === 0 ? null : LIGHT_GRAY),
        createCell(row[1], false, idx % 2 === 0 ? null : LIGHT_GRAY),
        createCell(""), createCell(""), createCell(""), createCell(""), createCell(""),
      ]);
    });
  }
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  
  // Set column widths
  wsSummary['!cols'] = [
    { wch: 10 },  // Site
    { wch: 18 }, // Energie
    { wch: 18 }, // Puissance PV
    { wch: 10 }, // Modules
    { wch: 16 }, // Config PV
    { wch: 18 }, // Capacité Batt
    { wch: 16 }, // Config Batt
  ];
  
  // Merge cells for header
  wsSummary['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // SONATRACH title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Project name
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // Date
    { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } }, // Headers
    { s: { r: 7, c: 0 }, e: { r: 7, c: 6 } }, // Params title
  ];
  
  XLSX.utils.book_append_sheet(wb, wsSummary, "Résumé");
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 2: DÉTAIL SYSTÈME PV
  // ═══════════════════════════════════════════════════════════════════════════
  const pvData: any[][] = [];
  pvData.push([
    createCell("DÉTAIL SYSTÈME PHOTOVOLTAÏQUE", true, ORANGE, WHITE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
  ]);
  pvData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  
  const pvHeaders = ["Site", "Puissance Requise (Wp)", "Puissance Installée (Wp)", "Modules Total", "Modules/Groupe", "Groupes", "Série/String", "Strings/Groupe"];
  pvData.push(pvHeaders.map(h => createCell(h, true, LIGHT_GRAY)));
  
  results.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? null : LIGHT_GRAY;
    pvData.push([
      createCell(r.siteId, true, bg ? bg : null, ORANGE),
      createCell(Math.round(r.pv.pvRequiredWp), false, bg),
      createCell(Math.round(r.pv.actualPvPower), false, bg),
      createCell(r.pv.totalModules, false, bg),
      createCell(r.pv.nModulesPerGroup, false, bg),
      createCell(r.params.groups, false, bg),
      createCell(r.pv.seriesPerGroup, false, bg),
      createCell(r.pv.parallelStrings, false, bg),
    ]);
  });
  
  // Add formulas explanation
  pvData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  pvData.push([createCell("FORMULES UTILISÉES", true, ORANGE, WHITE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE)]);
  pvData.push([
    createCell("Formule", true, LIGHT_GRAY), createCell("E = Energie journalière (Wh/j)", false, LIGHT_GRAY), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
  ]);
  pvData.push([
    createCell("", true, LIGHT_GRAY), createCell("P_pv = E / (PSH × PR)", false, LIGHT_GRAY), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
  ]);
  pvData.push([
    createCell("", true, LIGHT_GRAY), createCell("N_modules = P_pv / P_module", false, LIGHT_GRAY), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
  ]);
  
  const wsPV = XLSX.utils.aoa_to_sheet(pvData);
  wsPV['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 14 },
    { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 16 },
  ];
  wsPV['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 5 + results.length, c: 0 }, e: { r: 5 + results.length, c: 7 } },
    { s: { r: 7 + results.length, c: 0 }, e: { r: 7 + results.length, c: 0 } },
    { s: { r: 8 + results.length, c: 0 }, e: { r: 8 + results.length, c: 0 } },
    { s: { r: 9 + results.length, c: 0 }, e: { r: 9 + results.length, c: 0 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsPV, "Système PV");
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 3: DÉTAIL BATTERIES
  // ═══════════════════════════════════════════════════════════════════════════
  const battData: any[][] = [];
  battData.push([
    createCell("DÉTAIL PARC BATTERIES", true, ORANGE, WHITE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
  ]);
  battData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  
  const battHeaders = ["Site", "Capacité Requise (Ah)", "Capacité Installée (Ah)", "Énergie (Wh)", "Cellules Série", "Branches Parall", "Total Cellules", "Configuration"];
  battData.push(battHeaders.map(h => createCell(h, true, LIGHT_GRAY)));
  
  results.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? null : LIGHT_GRAY;
    battData.push([
      createCell(r.siteId, true, bg ? bg : null, ORANGE),
      createCell(Math.round(r.battery.capacityAh), false, bg),
      createCell(Math.round(r.battery.actualCapacityAh), false, bg),
      createCell(Math.round(r.battery.actualCapacityWh), false, bg),
      createCell(r.battery.cellsInSeries, false, bg),
      createCell(r.battery.parallelBranches, false, bg),
      createCell(r.battery.totalCells, false, bg),
      createCell(r.battery.configLabel, false, bg),
    ]);
  });
  
  // Add formulas
  battData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  battData.push([createCell("FORMULES UTILISÉES", true, ORANGE, WHITE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE)]);
  battData.push([
    createCell("Formule", true, LIGHT_GRAY), createCell("C_req = (E × Autonomie) / (DOD × η_batt)", false, LIGHT_GRAY), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
  ]);
  battData.push([
    createCell("", true, LIGHT_GRAY), createCell("N_cellules = C_installée / C_unitaire", false, LIGHT_GRAY), createCell(""), createCell(""), createCell(""), createCell(""), createCell(""), createCell("")
  ]);
  
  const wsBatt = XLSX.utils.aoa_to_sheet(battData);
  wsBatt['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 16 },
    { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 },
  ];
  wsBatt['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } },
    { s: { r: 5 + results.length, c: 0 }, e: { r: 5 + results.length, c: 7 } },
    { s: { r: 7 + results.length, c: 0 }, e: { r: 7 + results.length, c: 0 } },
    { s: { r: 8 + results.length, c: 0 }, e: { r: 8 + results.length, c: 0 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsBatt, "Batteries");
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 4: TEMPS DE RECHARGE
  // ═══════════════════════════════════════════════════════════════════════════
  const rechargeData: any[][] = [];
  rechargeData.push([
    createCell("TEMPS DE RECHARGE DES BATTERIES", true, ORANGE, WHITE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
    createCell("", false, ORANGE), createCell("", false, ORANGE),
  ]);
  rechargeData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
  
  results.forEach((r, rIdx) => {
    const startRow = rechargeData.length;
    rechargeData.push([createCell(`Site: ${r.siteId}`, true, ORANGE, WHITE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE), createCell("", true, ORANGE)]);
    
    const rechHeaders = ["Scénario", "PSH (h/j)", "E_pv_net (Wh/j)", "E_charge (Wh)", "T_recharge (jours)"];
    rechargeData.push(rechHeaders.map(h => createCell(h, true, LIGHT_GRAY)));
    
    const recharge = calculateRecharge(r);
    recharge.scenarios.forEach((s, idx) => {
      const bg = idx % 2 === 0 ? null : LIGHT_GRAY;
      rechargeData.push([
        createCell(`${s.sunHours} h/jour`, false, bg),
        createCell(s.sunHours, false, bg),
        createCell(Math.round(s.ePvJ), false, bg),
        createCell(Math.round(s.eLoadDuringPSH), false, bg),
        createCell(s.daysToRecharge !== null ? s.daysToRecharge.toFixed(2) : "N/A", true, bg, ORANGE),
      ]);
    });
    
    rechargeData.push([createCell(""), createCell(""), createCell(""), createCell(""), createCell("")]);
    
    // Merge site header
    wsSummary['!merges'] = wsSummary['!merges'] || [];
  });
  
  const wsRecharge = XLSX.utils.aoa_to_sheet(rechargeData);
  wsRecharge['!cols'] = [{ wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsRecharge, "Temps Recharge");
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FEUILLE 5: PARAMÈTRES PAR SITE
  // ═══════════════════════════════════════════════════════════════════════════
  const siteData: any[][] = [];
  siteData.push([
    createCell("PARAMÈTRES D'ENTRÉE PAR SITE", true, ORANGE, WHITE),
    createCell("", false, ORANGE), createCell("", false, ORANGE), createCell("", false, ORANGE),
  ]);
  siteData.push([createCell(""), createCell(""), createCell(""), createCell("")]);
  
  const siteHeaders = ["Paramètre", "BVS1", "BVS2", "TA"];
  siteData.push(siteHeaders.map(h => createCell(h, true, LIGHT_GRAY)));
  
  const params = [
    ["Énergie journalière (Wh/j)", "energyLoad"],
    ["PSH (h/j)", "psh"],
    ["PR", "pr"],
    ["Puissance module (Wp)", "modulePower"],
    ["Groupes", "groups"],
    ["Autonomie (jours)", "autonomy"],
    ["DOD", "dod"],
    ["Rendement batterie", "batteryEfficiency"],
    ["Tension système (V)", "systemVoltage"],
    ["Capacité unitaire (Ah)", "unitaryBatteryCapacity"],
    ["Marge (%)", "margin"],
  ];
  
  params.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? null : LIGHT_GRAY;
    siteData.push([
      createCell(row[0], true, bg),
      createCell(row[1] === "margin" ? ((results[0]?.params.margin || 0) * 100).toFixed(0) + "%" : 
                row[1] === "dod" ? (results[0]?.params.dod || 0).toString() :
                row[1] === "batteryEfficiency" ? ((results[0]?.params.batteryEfficiency || 0) * 100).toFixed(0) + "%" :
                row[1] === "pr" ? (results[0]?.params.pr || 0).toString() : "-", false, bg),
      createCell(row[1] === "margin" ? ((results[1]?.params.margin || 0) * 100).toFixed(0) + "%" : 
                row[1] === "dod" ? (results[1]?.params.dod || 0).toString() :
                row[1] === "batteryEfficiency" ? ((results[1]?.params.batteryEfficiency || 0) * 100).toFixed(0) + "%" :
                row[1] === "pr" ? (results[1]?.params.pr || 0).toString() : "-", false, bg),
      createCell(row[1] === "margin" ? ((results[2]?.params.margin || 0) * 100).toFixed(0) + "%" : 
                row[1] === "dod" ? (results[2]?.params.dod || 0).toString() :
                row[1] === "batteryEfficiency" ? ((results[2]?.params.batteryEfficiency || 0) * 100).toFixed(0) + "%" :
                row[1] === "pr" ? (results[2]?.params.pr || 0).toString() : "-", false, bg),
    ]);
  });
  
  const wsSite = XLSX.utils.aoa_to_sheet(siteData);
  wsSite['!cols'] = [{ wch: 28 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  wsSite['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
  ];
  XLSX.utils.book_append_sheet(wb, wsSite, "Paramètres");
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SAUVEGARDE
  // ═══════════════════════════════════════════════════════════════════════════
  const fileName = projectName 
    ? `REB-GPL-PV-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`
    : `REB-GPL-PV-Dimensionnement-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
  XLSX.writeFile(wb, fileName);
}
