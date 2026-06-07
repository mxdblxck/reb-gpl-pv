/**
 * Vérificateur Câbles PV — Logique GATECH BVS01 (UTE C15-712-2)
 *
 * S = (ρ × 2L × I) / (ε × U)   ρ=0.02314  ε=0.03
 *
 * Séquence exacte du document GATECH :
 *  1. S_calc  pour chaque segment (formule)
 *  2. S_sugg  = section commerciale ≥ S_calc ET Iz ≥ 1.25×Isc
 *  3. ε_S1 + ε_S2 ≤ 3% — si NON, augmenter S2 d'un cran jusqu'à conformité
 *  4. S3 indépendant : ε_S3 ≤ 3% ET Iz ≥ 1.25×Isc  (Isc = courant chaîne = ISC)
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CheckCircle2, XCircle, AlertTriangle, Cable, RefreshCw, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { SiteResult } from "@/lib/solar-calc.ts";

// ── Constantes ────────────────────────────────────────────────────────────────
const RHO      = 0.02314;  // Ω·mm²/m  cuivre 80°C  (UTE C15-712-2)
const EPS_LIM  = 3;        // % chute de tension max circuit PV (S1+S2)
const S_PV_MIN = 2.5;      // mm²  section minimale pratique câble PV (règle GATECH)

// ── Fallback constants (Jinko 555 Wp — used only if params fields absent) ─────
const IMP_FALLBACK = 13.33;
const ISC_FALLBACK = 14.07;
const VMP_FALLBACK = 41.64;

const L1_DEF = 3;    // m  module → BJ
const L2_DEF = 30;   // m  BJ → armoire
const L3_DEF = 8;    // m  batterie → armoire

// Sections commerciales PV (mm²)
const SECS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240] as const;
type Sec = (typeof SECS)[number];

// Iz à 80°C — pose B1 (UTE C15-712-2 tableau)
const IZ: Record<number, number> = {
  1.5: 20,  2.5: 27,  4: 36,   6: 47,   10: 66,
  16: 88,   25: 117,  35: 146, 50: 177,  70: 226,
  95: 274,  120: 318, 150: 363, 185: 415, 240: 489,
};

// ── Fonctions de calcul ───────────────────────────────────────────────────────

/** Section théorique minimale (formule GATECH) */
function sMin(L: number, I: number, U: number): number {
  return (RHO * 2 * L * I) / ((EPS_LIM / 100) * U);
}

/** Chute de tension réelle d'un segment (%) */
function epsPct(L: number, I: number, U: number, S: number): number {
  return ((RHO * 2 * L * I) / (S * U)) * 100;
}

/** Chute de tension en V */
function dvVolts(L: number, I: number, S: number): number {
  return (RHO * 2 * L * I) / S;
}

/** Pertes résistives (W) */
function pLossW(L: number, I: number, S: number): number {
  return (RHO * 2 * L * I * I) / S;
}

/**
 * Section commerciale minimale (logique document GATECH) :
 *   1. S ≥ max(sMin, S_PV_MIN)  — section minimale pratique câble PV = 2.5mm²
 *   2. Iz ≥ 1.25 × Isc
 * @param applyPvMin  false pour S3 (batterie) où la section mini ne s'applique pas
 */
function pickBase(L: number, I: number, U: number, isc: number, applyPvMin = true): Sec {
  const sm    = sMin(L, I, U);
  const smEff = applyPvMin ? Math.max(sm, S_PV_MIN) : sm;
  const izReq = 1.25 * isc;
  const start = Math.max(0, SECS.findIndex((s) => s >= smEff));
  for (let i = start; i < SECS.length; i++) {
    if ((IZ[SECS[i]] ?? 0) >= izReq) return SECS[i];
  }
  return SECS[SECS.length - 1];
}

/**
 * Cascade S2 (document GATECH) :
 * Étape 1 : pickBase(S2)  → section initiale satisfaisant S_calc + Iz
 * Étape 2 : si ε_S1 + ε_S2 > 3%  → monter S2 d'un cran jusqu'à conformité
 * Exemple BVS01 : S2=35mm² → total 3.43% NON CONFORME → S2=50mm² → 2.67% ✅
 */
function pickS2Cascade(
  l1: number, i1: number,
  l2: number, i2: number,
  u: number, isc2: number,
  s1Chosen: Sec,
): Sec {
  const eps1     = epsPct(l1, i1, u, s1Chosen);
  const base     = pickBase(l2, i2, u, isc2);      // S2 initial (S_calc + Iz)
  const startIdx = SECS.indexOf(base);
  for (let i = startIdx; i < SECS.length; i++) {
    const s2  = SECS[i];
    const iz  = IZ[s2] ?? 0;
    if (iz < 1.25 * isc2) continue;                // Iz doit rester satisfait
    const eps2 = epsPct(l2, i2, u, s2);
    if (eps1 + eps2 <= EPS_LIM) return s2;          // cascade OK
  }
  return SECS[SECS.length - 1];
}

// ── Évaluation complète d'un segment ─────────────────────────────────────────
/**
 * @param dvOtherPct  ε des autres segments du même circuit (0 pour circuit indépendant)
 * @param isc         Isc de référence pour le critère Iz (ISC pour PV, ISC pour batterie aussi)
 */
function evalSeg(
  L: number, I: number, isc: number, U: number,
  chosen: Sec, dvOtherPct: number, applyPvMin = true,
) {
  const sc_val  = sMin(L, I, U);
  const sugg    = pickBase(L, I, U, isc, applyPvMin);
  const eps     = epsPct(L, I, U, chosen);
  const epsTotal = eps + dvOtherPct;          // ε total du circuit
  const dv      = dvVolts(L, I, chosen);
  const pl      = pLossW(L, I, chosen);
  const iz      = IZ[chosen] ?? 0;
  const izReq   = 1.25 * isc;

  const izOk        = iz >= izReq;
  const dvCircuitOk = epsTotal <= EPS_LIM;    // seul critère DV qui compte

  const margin = EPS_LIM - epsTotal;
  const status: "ok" | "warning" | "danger" =
    !izOk || !dvCircuitOk ? "danger"
    : margin < 0.3        ? "warning"
    : "ok";

  return { sc: sc_val, sugg, eps, epsTotal, dv, pl, iz, izReq, izOk, dvCircuitOk, status };
}

type SegData = ReturnType<typeof evalSeg>;

// ── Composant principal ───────────────────────────────────────────────────────
export default function SiteCableChecker({ result }: { result: SiteResult }) {
  const { pv, params } = result;

  // Module electrical params — read from params (synced with catalogue), fallback to Jinko
  const IMP = params.moduleImp ?? IMP_FALLBACK;
  const ISC = params.moduleIsc ?? ISC_FALLBACK;
  const VMP = params.moduleVmp ?? VMP_FALLBACK;

  // Np total (toutes chaînes) et tensions
  const np   = pv.parallelStrings * params.groups;
  const vMpp = VMP * pv.seriesPerGroup;   // tension chaîne = Ns × Vmpp
  const vSys = params.systemVoltage;      // tension batterie

  // Courants nominaux
  const i1Def = IMP;           // 1 chaîne → BJ
  const i2Def = IMP * np;      // Np chaînes → armoire
  const i3Def = 100;           // batterie (cas défavorable)

  const [l1, setL1] = useState(L1_DEF);
  const [l2, setL2] = useState(L2_DEF);
  const [l3, setL3] = useState(L3_DEF);
  const [i1, setI1] = useState(i1Def);
  const [i2, setI2] = useState(i2Def);
  const [i3, setI3] = useState(i3Def);

  const [s1User, setS1User] = useState<Sec | null>(null);
  const [s2User, setS2User] = useState<Sec | null>(null);
  const [s3User, setS3User] = useState<Sec | null>(null);

  // ── Suggestions ────────────────────────────────────────────────────────────
  // S1 : simple pickBase (segment court, DV faible)
  const s1Sugg = useMemo(() => pickBase(l1, i1, vMpp, ISC), [l1, i1, vMpp]);

  const s1 = s1User ?? s1Sugg;

  // S2 : cascade — s2Sugg dépend de s1 choisi pour garantir total ≤ 3%
  const s2Sugg = useMemo(
    () => pickS2Cascade(l1, i1, l2, i2, vMpp, ISC * np, s1),
    [l1, i1, l2, i2, vMpp, np, s1],
  );

  // S3 : indépendant, Iz ref = ISC (document GATECH utilise 1.25×Isc pour S3 aussi)
  const s3Sugg = useMemo(() => pickBase(l3, i3, vSys, ISC, false), [l3, i3, vSys]);

  const s2 = s2User ?? s2Sugg;
  const s3 = s3User ?? s3Sugg;

  // ── Évaluation ─────────────────────────────────────────────────────────────
  const eps1Raw = useMemo(() => epsPct(l1, i1, vMpp, s1), [l1, i1, vMpp, s1]);
  const eps2Raw = useMemo(() => epsPct(l2, i2, vMpp, s2), [l2, i2, vMpp, s2]);

  // Chaque segment voit le total du circuit :
  //   S1 : ε_total = ε_S1 + ε_S2
  //   S2 : ε_total = ε_S1 + ε_S2  (même valeur, contrainte partagée)
  //   S3 : circuit indépendant → dvOther = 0
  const seg1 = useMemo(
    () => evalSeg(l1, i1, ISC,      vMpp, s1, eps2Raw),
    [l1, i1, vMpp, s1, eps2Raw],
  );
  const seg2 = useMemo(
    () => evalSeg(l2, i2, ISC * np, vMpp, s2, eps1Raw),
    [l2, i2, np, vMpp, s2, eps1Raw],
  );
  const seg3 = useMemo(
    () => evalSeg(l3, i3, ISC, vSys, s3, 0, false),
    [l3, i3, vSys, s3],
  );

  const dvTotal   = eps1Raw + eps2Raw;
  const circuitOk = dvTotal <= EPS_LIM;

  const anyDanger  = seg1.status === "danger"  || seg2.status === "danger"  || seg3.status === "danger";
  const anyWarning = seg1.status === "warning" || seg2.status === "warning" || seg3.status === "warning";
  const allOk = !anyDanger;

  const autoOptimize = () => {
    setS1User(null); setS2User(null); setS3User(null);
    setL1(L1_DEF); setL2(L2_DEF); setL3(L3_DEF);
    setI1(i1Def);  setI2(i2Def);  setI3(i3Def);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-7 h-7 bg-primary/10 rounded-md flex items-center justify-center">
            <Cable className="w-4 h-4 text-primary" />
          </div>
          Vérification Câbles PV — {result.siteId}
          <Badge className={`ml-auto text-[10px] font-bold ${
            allOk
              ? anyWarning
                ? "bg-amber-500/10 text-amber-700 border-amber-400"
                : "bg-green-500/10 text-green-700 border-green-300"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}>
            {allOk
              ? anyWarning ? "⚠️ CONFORME (marge faible)" : "✅ CONFORME"
              : "❌ NON CONFORME"}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Paramètres du champ */}
        <div className="rounded-lg bg-muted/30 border border-border px-3 py-2 space-y-0.5">
          <div className="flex flex-wrap gap-x-5 text-[10px] font-mono text-muted-foreground">
            <span>Ns={pv.seriesPerGroup} | Np={np} | Impp={IMP} A | Isc={ISC} A</span>
            <span>U_S1S2 = Ns×Vmpp = {vMpp.toFixed(2)} V | U_S3 = {vSys} V</span>
          </div>
          <p className="text-[10px] font-mono text-primary">
            S = (ρ×2L×I)/(ε×U) | ρ={RHO} Ω·mm²/m | ε_max={EPS_LIM}% | Iz ≥ 1.25×Isc
          </p>
        </div>

        {/* Bilan chute totale S1+S2 */}
        <div className={`rounded-xl border-2 px-4 py-3 flex items-center justify-between ${
          circuitOk
            ? "border-green-500/40 bg-green-50/20"
            : "border-destructive/50 bg-destructive/10"
        }`}>
          <div className="flex items-center gap-2">
            {circuitOk
              ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
              : <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />}
            <div>
              <p className="text-xs font-semibold text-foreground">Chute totale circuit PV (S1 + S2)</p>
              <p className="text-[10px] font-mono text-muted-foreground">
                ε_S1 ({eps1Raw.toFixed(3)}%) + ε_S2 ({eps2Raw.toFixed(3)}%) = {dvTotal.toFixed(3)}%
              </p>
              {!circuitOk && (
                <p className="text-xs font-bold text-destructive mt-0.5">
                  NON CONFORME — augmenter S2 (cascade GATECH)
                </p>
              )}
            </div>
          </div>
          <div className="text-right shrink-0 ml-3">
            <p className={`font-bold text-xl ${circuitOk ? "text-green-600" : "text-destructive"}`}>
              {dvTotal.toFixed(3)}%
            </p>
            <p className={`text-[10px] font-semibold ${circuitOk ? "text-green-600" : "text-destructive"}`}>
              {circuitOk ? `✅ ≤ ${EPS_LIM}%` : `❌ > ${EPS_LIM}%`}
            </p>
          </div>
        </div>

        {/* Boutons */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={autoOptimize}
            className="h-8 gap-1.5 text-xs border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10">
            <Wand2 className="w-3.5 h-3.5" />
            Optimisation Automatique
          </Button>
          <Button size="sm" onClick={() => {
            setL1(L1_DEF); setL2(L2_DEF); setL3(L3_DEF);
            setI1(i1Def);  setI2(i2Def);  setI3(i3Def);
          }}
            className="h-8 gap-1.5 text-xs border border-border bg-transparent text-muted-foreground hover:bg-muted">
            <RefreshCw className="w-3.5 h-3.5" />
            Synchroniser
          </Button>
        </div>

        {/* Tableau récapitulatif */}
        <CompareTable rows={[
          { id: "S1", label: "S1 — Module → BJ",        sc: seg1.sc, sugg: s1Sugg, chosen: s1, setChosen: setS1User, isUser: s1User !== null },
          { id: "S2", label: "S2 — BJ → Armoire",        sc: seg2.sc, sugg: s2Sugg, chosen: s2, setChosen: setS2User, isUser: s2User !== null },
          { id: "S3", label: "S3 — Batteries → Armoire", sc: seg3.sc, sugg: s3Sugg, chosen: s3, setChosen: setS3User, isUser: s3User !== null },
        ]} />

        {/* Détail par segment */}
        <div className="space-y-3">
          <SegCard id="S1" label="S1 — Module / Chaîne → Boîte de Jonction"
            L={l1} setL={setL1} I={i1} setI={setI1} U={vMpp}
            iHint={`I = 1×Impp = ${IMP} A`}
            uHint={`U = Ns×Vmpp = ${vMpp.toFixed(2)} V`}
            iSc={ISC} chosen={s1} setChosen={setS1User} seg={seg1}
            circuitLabel="ε_S1 + ε_S2 (circuit PV)" />

          <SegCard id="S2" label="S2 — Boîte de Jonction → Armoire Distribution"
            L={l2} setL={setL2} I={i2} setI={setI2} U={vMpp}
            iHint={`I = Np×Impp = ${np}×${IMP} = ${i2Def.toFixed(2)} A`}
            uHint={`U = Ns×Vmpp = ${vMpp.toFixed(2)} V`}
            iSc={ISC * np} chosen={s2} setChosen={setS2User} seg={seg2}
            circuitLabel="ε_S1 + ε_S2 (circuit PV)" />

          <SegCard id="S3" label="S3 — Parc Batteries → Armoire Distribution"
            L={l3} setL={setL3} I={i3} setI={setI3} U={vSys}
            iHint="I = 100 A (décharge max, cas défavorable)"
            uHint={`U = ${vSys} V nominal`}
            iSc={ISC} chosen={s3} setChosen={setS3User} seg={seg3}
            circuitLabel="ε_S3 (circuit batterie indépendant)" />
        </div>

        <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
          Calcul conforme à la méthode GATECH (UTE C15-712-2 / NF C15-100) :
          chute de tension totale ≤ 3 % et Iz ≥ 1.25×Isc à 80 °C.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Tableau récapitulatif ─────────────────────────────────────────────────────
function CompareTable({ rows }: {
  rows: {
    id: string; label: string; sc: number; sugg: Sec;
    chosen: Sec; setChosen: (s: Sec | null) => void; isUser: boolean;
  }[];
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 border-b border-border">
          <tr>
            <th className="text-left px-3 py-2 text-muted-foreground font-semibold">Segment</th>
            <th className="text-center px-2 py-2 text-muted-foreground font-semibold">S_calc (mm²)</th>
            <th className="text-center px-2 py-2 text-primary font-semibold">S_suggérée</th>
            <th className="text-center px-2 py-2 text-muted-foreground font-semibold">S_choisie</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id} className={`border-t border-border ${idx % 2 === 0 ? "" : "bg-muted/10"}`}>
              <td className="px-3 py-2 font-medium text-foreground text-[11px]">{r.label}</td>
              <td className="px-2 py-2 text-center font-mono text-muted-foreground">{r.sc.toFixed(3)}</td>
              <td className="px-2 py-2 text-center font-bold text-primary">{r.sugg} mm²</td>
              <td className="px-2 py-2 text-center">
                <div className="flex items-center justify-center gap-1">
                  <select
                    value={r.chosen}
                    onChange={(e) => r.setChosen(parseFloat(e.target.value) as Sec)}
                    className={`h-6 text-xs rounded border px-1 font-bold ${
                      r.isUser
                        ? "border-amber-400 bg-amber-50 text-amber-700"
                        : "border-primary/30 bg-primary/5 text-primary"
                    }`}
                  >
                    {SECS.map((s) => <option key={s} value={s}>{s} mm²</option>)}
                  </select>
                  {r.isUser && (
                    <button
                      onClick={() => r.setChosen(null)}
                      className="text-[9px] text-muted-foreground hover:text-destructive"
                      title="Réinitialiser"
                    >✕</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Carte segment ─────────────────────────────────────────────────────────────
function SegCard({
  id, label, L, setL, I, setI, U, iHint, uHint,
  iSc, chosen, setChosen, seg, circuitLabel,
}: {
  id: string; label: string;
  L: number; setL: (v: number) => void;
  I: number; setI: (v: number) => void;
  U: number; iHint: string; uHint: string; iSc: number;
  chosen: Sec; setChosen: (s: Sec | null) => void;
  seg: SegData; circuitLabel: string;
}) {
  const isOk      = seg.status !== "danger";
  const isWarning = seg.status === "warning";

  return (
    <div className={`rounded-xl border-2 p-3 space-y-3 ${
      isOk
        ? isWarning
          ? "border-amber-400/60 bg-amber-50/10"
          : "border-green-500/40 bg-green-50/10"
        : "border-destructive/50 bg-destructive/5"
    }`}>
      {/* En-tête */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{iHint} &nbsp;|&nbsp; {uHint}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isOk
            ? <CheckCircle2 className={`w-4 h-4 ${isWarning ? "text-amber-500" : "text-green-600"}`} />
            : <XCircle className="w-4 h-4 text-destructive" />}
          <Badge className={`text-[10px] font-bold ${
            isOk
              ? isWarning
                ? "bg-amber-500/10 text-amber-700 border-amber-400"
                : "bg-green-500/10 text-green-700 border-green-300"
              : "bg-destructive/10 text-destructive border-destructive/30"
          }`}>
            {isOk ? (isWarning ? "⚠️ MARGE FAIBLE" : "CONFORME") : "NON CONFORME"}
          </Badge>
        </div>
      </div>

      {/* Entrées */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Longueur L (m)</Label>
          <Input type="number" min={0.5} step={0.5} value={L}
            onChange={(e) => setL(Math.max(0.5, parseFloat(e.target.value) || 0.5))}
            className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">I_design (A)</Label>
          <Input type="number" min={0.1} step={0.01} value={parseFloat(I.toFixed(3))}
            onChange={(e) => setI(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
            className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Section {id}</Label>
          <select
            value={chosen}
            onChange={(e) => setChosen(parseFloat(e.target.value) as Sec)}
            className="h-7 w-full text-xs rounded-md border border-input bg-background px-2 font-semibold text-primary"
          >
            {SECS.map((s) => <option key={s} value={s}>{s} mm²</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <p className="text-[10px] font-mono text-muted-foreground leading-tight">
            S_calc=<span className="font-semibold text-foreground">{seg.sc.toFixed(3)}</span>
            {" "}→ sugg=<span className="font-bold text-primary">{seg.sugg}</span>
            {" "}→ <span className="font-bold text-foreground">{chosen} mm²</span>
          </p>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <RBox label="S_calc (mm²)"  value={seg.sc.toFixed(3)} />
        <RBox label="S_suggérée"    value={`${seg.sugg} mm²`} highlight />
        <RBox label="Pertes (W)"    value={seg.pl.toFixed(2)} />
        <RBox label="Iz à 80°C (A)" value={String(seg.iz)} />
      </div>

      {/* Critères */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Critère 1 : Iz */}
        <StatBox
          label="Iz ≥ 1.25 × Isc"
          detail={`${seg.iz} A ≥ 1.25 × ${iSc.toFixed(2)} = ${seg.izReq.toFixed(2)} A`}
          value={`${seg.iz} A`}
          ok={seg.izOk}
          msg={seg.izOk
            ? `✅ ${seg.iz} ≥ ${seg.izReq.toFixed(2)} A`
            : `❌ ${seg.iz} < ${seg.izReq.toFixed(2)} A — augmenter section`}
        />
        {/* Informatif : ε du segment seul */}
        <StatBox
          label={`ε segment ${id}`}
          detail={`ρ×2×${L}×${I.toFixed(2)} / (${chosen}×${U.toFixed(2)})`}
          value={`${seg.dv.toFixed(4)} V`}
          pct={seg.eps}
          ok                        // toujours vert — informatif
          msg={`${seg.eps.toFixed(3)}%`}
        />
        {/* Critère 2 : ε total du circuit */}
        <StatBox
          label={circuitLabel}
          detail={`ε_total ≤ ${EPS_LIM}%`}
          value={`${seg.epsTotal.toFixed(3)}%`}
          ok={seg.dvCircuitOk}
          msg={seg.dvCircuitOk
            ? `✅ marge ${(EPS_LIM - seg.epsTotal).toFixed(3)}%`
            : `❌ dépasse de ${(seg.epsTotal - EPS_LIM).toFixed(3)}%`}
        />
      </div>
    </div>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function RBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-2 py-1.5 ${
      highlight ? "border-primary/40 bg-primary/5" : "border-border bg-background/60"
    }`}>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={`font-bold text-xs mt-0.5 ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function StatBox({ label, detail, value, pct, ok, msg }: {
  label: string; detail: string; value: string; pct?: number; ok: boolean; msg: string;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 space-y-0.5 ${
      ok ? "border-green-500/30 bg-green-50/10" : "border-destructive/30 bg-destructive/5"
    }`}>
      <div className="flex justify-between items-center gap-1">
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
        <span className={`font-bold text-sm shrink-0 ${ok ? "text-green-600" : "text-destructive"}`}>{value}</span>
      </div>
      {pct !== undefined && (
        <div className="flex justify-between items-center gap-1">
          <p className="text-[9px] font-mono text-muted-foreground truncate">{detail}</p>
          <span className="font-bold text-sm shrink-0 text-foreground">{pct.toFixed(3)}%</span>
        </div>
      )}
      {pct === undefined && (
        <p className="text-[9px] font-mono text-muted-foreground">{detail}</p>
      )}
      <p className={`text-[10px] font-semibold ${ok ? "text-green-600" : "text-destructive"}`}>{msg}</p>
    </div>
  );
}
