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
    ["Puissance PV Requise (Wp)", "E_charge / (PSH × PR)"],
    ["Nombre de Modules", "⌈P_PV_req / P_module⌉ → ajusté pour strings complets"],
    ["Capacité Batterie Requise (Ah)", "(E × Autonomie) / (DOD × η_batt × V_sys)"],
    ["Cellules en Série", "V_sys / V_celule"],
    ["Branches Parallèles", "⌈C_req / C_unitaire⌉"],
  ];
  
  formulas.forEach(([formula, calc]) => {
    doc.setTextColor(...DARK);
    doc.text(`•  ${formula}:`, margin, y);
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
      `P_pv_net = P_inst × PR = ${pv.actualPvPower.toFixed(0)} × ${params.pr} = ${pPvNet.toFixed(0)} W  |  P_moyenne = E / 24 = ${pLoadAvg.toFixed(1)} W`,
      margin,
      y + 4
    );
    doc.text(
      `T_recharge = Énergie_autonomie / (Surplus_quotidien × η_batt)`,
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

// Excel Export function
export function generateExcel(results: SiteResult[], projectName?: string): void {
  const wb = XLSX.utils.book_new();
  
  // Feuille 1: Récapitulatif
  const summaryData = [
    ["SONATRACH - REB GPL Ligne"],
    ["Projet: " + (projectName || "Dimensionnement PV")],
    ["Date: " + new Date().toLocaleDateString('fr-FR')],
    [""],
    ["PARAMÈTRES"],
    ["Emplacement", "Rhourde El Baguel, Algérie"],
    ["PSH (pire mois)", results[0]?.params.psh + " h/jour"],
    ["PR", results[0]?.params.pr],
    ["Tension système", results[0]?.params.systemVoltage + " V DC"],
    ["Autonomie", results[0]?.params.autonomy + " jours"],
    ["DOD", (results[0]?.params.dod * 100) + "%"],
    [""],
  ];
  
  const summaryHeader = ["Site", "Énergie (Wh/j)", "Puissance PV (Wp)", "Modules", "Config PV", "Capacité Batt (Ah)", "Config Batt"];
  const summaryRows = results.map(r => [
    r.siteId,
    r.correctedEnergyLoad.toFixed(0),
    r.pv.actualPvPower,
    r.pv.totalModules,
    r.pv.configLabel,
    r.battery.actualCapacityAh,
    r.battery.configLabel,
  ]);
  
  summaryData.push(summaryHeader);
  summaryRows.forEach(row => summaryData.push(row));
  
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Récapitulatif");
  
  // Feuille 2: Détails PV
  const pvData = [
    ["DÉTAIL SYSTÈME PV"],
    [""],
    ["Site", "Puissance Requise", "Puissance Installée", "Modules Total", "Modules/Groupe", "Groupes", "Série/String", "Strings//Groupe"],
  ];
  results.forEach(r => {
    pvData.push([
      r.siteId,
      String(r.pv.pvRequiredWp),
      String(r.pv.actualPvPower),
      String(r.pv.totalModules),
      String(r.pv.nModulesPerGroup),
      String(r.params.groups),
      String(r.pv.seriesPerGroup),
      String(r.pv.parallelStrings),
    ]);
  });
  const wsPV = XLSX.utils.aoa_to_sheet(pvData);
  XLSX.utils.book_append_sheet(wb, wsPV, "Système PV");
  
  // Feuille 3: Détails Batterie
  const battData = [
    ["DÉTAIL PARC BATTERIES"],
    [""],
    ["Site", "Capacité Requise (Ah)", "Capacité Installée (Ah)", "Énergie (Wh)", "Cellules Série", "Branches Parall", "Total Cellules", "Config"],
  ];
  results.forEach(r => {
    battData.push([
      r.siteId,
      String(r.battery.capacityAh),
      String(r.battery.actualCapacityAh),
      String(r.battery.actualCapacityWh),
      String(r.battery.cellsInSeries),
      String(r.battery.parallelBranches),
      String(r.battery.totalCells),
      r.battery.configLabel,
    ]);
  });
  const wsBatt = XLSX.utils.aoa_to_sheet(battData);
  XLSX.utils.book_append_sheet(wb, wsBatt, "Batteries");
  
  // Feuille 4: Temps de Recharge
  const rechargeData = [
    ["TEMPS DE RECHARGE DES BATTERIES"],
    [""],
  ];
  
  results.forEach(r => {
    rechargeData.push(["Site: " + r.siteId]);
    rechargeData.push(["PSH (h/j)", "E_pv_net (Wh/j)", "E_charge (Wh)", "Surplus (Wh/j)", "T_recharge (jours)"]);
    
    const recharge = calculateRecharge(r);
    recharge.scenarios.forEach(s => {
      rechargeData.push([
        String(s.sunHours),
        s.ePvJ.toFixed(0),
        s.eLoadDuringPSH.toFixed(0),
        s.eRechargeJ > 0 ? "+" + s.eRechargeJ.toFixed(0) : s.eRechargeJ.toFixed(0),
        s.daysToRecharge !== null ? s.daysToRecharge.toFixed(2) : "N/A",
      ]);
    });
    rechargeData.push([""]);
  });
  
  const wsRecharge = XLSX.utils.aoa_to_sheet(rechargeData);
  XLSX.utils.book_append_sheet(wb, wsRecharge, "Temps Recharge");
  
  // Sauvegarder
  const fileName = projectName 
    ? `REB-GPL-PV-${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`
    : `REB-GPL-PV-Dimensionnement-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
  XLSX.writeFile(wb, fileName);
}
