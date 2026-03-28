/**
 * Vérificateur de Section de Câbles PV
 * Conforme GATECH REV I — 2024-DO-SE-DOC-06
 * Formule : S = (ρ × 2 × L × I) / (ε × U)
 * 
 * UI/UX redesigné pour une meilleure expérience utilisateur
 */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  CheckCircle2, XCircle, AlertTriangle, Cable, FileText, Info,
  ChevronDown, ChevronUp, Zap, Thermometer, Gauge,
} from "lucide-react";
import {
  calculateCableSection,
  RHO_CU_80, RHO_AL_80,
  type CableCheckerInput,
  type CableCheckerResult,
} from "@/lib/solar-calc.ts";
import { generateCablePDF } from "@/lib/pdf-export.ts";

// ── Valeurs par défaut Jinko 555 Wp Tiger Neo ─────────────────────────────────
const DEFAULTS: CableCheckerInput = {
  conductorType: "copper",
  cableLength: 30,
  iImp: 13.16,
  iIsc: 13.98,
  currentType: "isc",
  systemVoltage: 48,
  ambientTemp: 80,
  maxVoltageDrop: 3,
};

// ── Composant Section Collapsible ─────────────────────────────────────────────
function CollapsibleSection({
  title, icon: Icon, defaultOpen = true, children, badge,
}: {
  title: string; icon: React.ElementType; defaultOpen?: boolean; children: React.ReactNode; badge?: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Card className="overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-foreground">{title}</span>
          {badge && (
            <Badge className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-300">
              {badge}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <CardContent className="pt-0 pb-4">
          {children}
        </CardContent>
      </div>
    </Card>
  );
}

// ── Composant Input avec icône ───────────────────────────────────────────────
function IconInput({
  label, value, icon: Icon, min, max, step, onChange, unit,
}: {
  label: string; value: number; icon: React.ElementType; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; unit: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </Label>
      <div className="relative">
        <Input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="h-10 pr-12 text-sm font-medium"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
          {unit}
        </span>
      </div>
    </div>
  );
}

// ── Composant Bouton toggle moderne ──────────────────────────────────────
function ToggleButton({
  options, value, onChange,
}: {
  options: { value: string; label: string; sub?: string }[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
            value === opt.value
              ? "border-primary bg-primary text-primary-foreground shadow-sm"
              : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
          }`}
        >
          <span>{opt.label}</span>
          {opt.sub && (
            <span className={`block text-[10px] mt-0.5 ${value === opt.value ? "text-primary/70" : "text-muted-foreground/70"}`}>
              {opt.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Composant Résultat avec indicateur visuel ─────────────────────────────────────
function ResultCard({
  label, value, sub, status, icon: Icon,
}: {
  label: string; value: string; sub?: string; status?: "ok" | "warning" | "danger"; icon: React.ElementType;
}) {
  const statusStyles = {
    ok: "border-green-500/30 bg-green-50/50",
    warning: "border-amber-500/30 bg-amber-50/50",
    danger: "border-red-500/30 bg-red-50/50",
  };
  
  const statusIcon = {
    ok: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  };
  
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${status ? statusStyles[status] : "border-border bg-muted/20"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${status ? statusIcon[status] : "text-muted-foreground"}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────────
export default function CableCheckerTab() {
  const [form, setForm] = useState<CableCheckerInput>(DEFAULTS);

  const result: CableCheckerResult = useMemo(
    () => calculateCableSection(form),
    [form]
  );

  const set = <K extends keyof CableCheckerInput>(k: K, v: CableCheckerInput[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const globalOk = result.izStatus === "ok" && result.voltageDropStatus !== "danger";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* En-tête avec statut global */}
      <Card className={`border-2 ${globalOk ? "border-green-500/40 bg-green-50/30" : "border-red-500/40 bg-red-50/30"}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Cable className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-foreground">Vérificateur Câbles PV</span>
                <p className="text-xs text-muted-foreground font-normal">
                  GATECH REV I — 2024-DO-SE-DOC-06
                </p>
              </div>
            </CardTitle>
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${
              globalOk 
                ? "bg-green-100 text-green-700 border border-green-300" 
                : "bg-red-100 text-red-700 border border-red-300"
            }`}>
              {globalOk ? "✅ Conforme" : "⚠️ À vérifier"}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Section Paramètres - Collapsible */}
      <CollapsibleSection title="Paramètres du Câble" icon={Cable} badge="Entrée">
        <div className="space-y-5">
          {/* Type de conducteur */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Matériau du conducteur</Label>
            <ToggleButton
              options={[
                { value: "copper", label: "Cuivre", sub: `ρ = ${RHO_CU_80} Ω·mm²/m` },
                { value: "aluminum", label: "Aluminium", sub: `ρ = ${RHO_AL_80} Ω·mm²/m` },
              ]}
              value={form.conductorType}
              onChange={(v) => set("conductorType", v as "copper" | "aluminum")}
            />
          </div>

          {/* Courant de calcul */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Courant de référence</Label>
            <ToggleButton
              options={[
                { value: "imp", label: "Imp (MPP)", sub: "Courant maximal" },
                { value: "isc", label: "Isc (court-circuit)", sub: "Sécurité +25%" },
              ]}
              value={form.currentType}
              onChange={(v) => set("currentType", v as "imp" | "isc")}
            />
          </div>

          {/* Grille des inputs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <IconInput
              label="Longueur"
              value={form.cableLength}
              icon={Gauge}
              min={1}
              step={1}
              unit="m"
              onChange={(v) => set("cableLength", v)}
            />
            <IconInput
              label="Courant Imp"
              value={form.iImp}
              icon={Zap}
              min={0.1}
              step={0.01}
              unit="A"
              onChange={(v) => set("iImp", v)}
            />
            <IconInput
              label="Courant Isc"
              value={form.iIsc}
              icon={Zap}
              min={0.1}
              step={0.01}
              unit="A"
              onChange={(v) => set("iIsc", v)}
            />
          </div>

          {/* Tension système */}
          <div>
            <Label className="text-sm font-medium text-foreground mb-2 block">Tension système</Label>
            <ToggleButton
              options={[
                { value: "24", label: "24V", sub: "Petite installation" },
                { value: "48", label: "48V", sub: "Installation standard" },
              ]}
              value={String(form.systemVoltage)}
              onChange={(v) => set("systemVoltage", parseInt(v))}
            />
          </div>

          {/* Température et chute */}
          <div className="grid grid-cols-2 gap-4">
            <IconInput
              label="Température"
              value={form.ambientTemp}
              icon={Thermometer}
              min={20}
              max={100}
              step={5}
              unit="°C"
              onChange={(v) => set("ambientTemp", v)}
            />
            <IconInput
              label="Chute tension max"
              value={form.maxVoltageDrop}
              icon={Gauge}
              min={1}
              max={10}
              step={0.5}
              unit="%"
              onChange={(v) => set("maxVoltageDrop", v)}
            />
          </div>

          {/* Info formule */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>
              Formule GATECH :{" "}
              <span className="font-mono font-semibold text-foreground">
                S = (ρ × 2 × L × I) / (ε × U)
              </span>
            </span>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section Résultats */}
      <CollapsibleSection title="Résultats du Calcul" icon={CheckCircle2} defaultOpen={true}>
        <div className="space-y-5">
          {/* Cartes de résultats principaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ResultCard
              label="Section calculée"
              value={`${result.sectionMin.toFixed(2)} mm²`}
              sub={`ρ = ${result.rho} Ω·mm²/m`}
              icon={Cable}
            />
            <ResultCard
              label="Section recommandée"
              value={`${result.sectionCommercial} mm²`}
              status={globalOk ? "ok" : "danger"}
              icon={Cable}
            />
            <ResultCard
              label="Pertes"
              value={`${result.powerLoss.toFixed(2)} W`}
              sub="P = ρ × 2L × I² / S"
              icon={Zap}
            />
          </div>

          {/* Indicateur chute de tension */}
          <div className={`rounded-xl border-2 px-4 py-4 flex items-center justify-between ${
            result.voltageDropStatus === "ok" 
              ? "border-green-500/30 bg-green-50/50" 
              : result.voltageDropStatus === "acceptable"
                ? "border-amber-500/30 bg-amber-50/50"
                : "border-red-500/30 bg-red-50/50"
          }`}>
            <div className="flex items-center gap-3">
              {result.voltageDropStatus === "ok"
                ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                : result.voltageDropStatus === "acceptable"
                  ? <AlertTriangle className="w-6 h-6 text-amber-600" />
                  : <XCircle className="w-6 h-6 text-red-600" />}
              <div>
                <p className="text-sm font-semibold text-foreground">Chute de tension</p>
                <p className="text-xs text-muted-foreground">
                  ΔV = {result.deltaVReal.toFixed(3)} V
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {result.deltaVPercent.toFixed(2)}%
              </p>
              <p className={`text-xs font-medium ${
                result.voltageDropStatus === "ok"
                  ? "text-green-600"
                  : result.voltageDropStatus === "acceptable"
                    ? "text-amber-600"
                    : "text-red-600"
              }`}>
                {result.voltageDropStatus === "ok"
                  ? "✅ Conforme (≤ 3%)"
                  : result.voltageDropStatus === "acceptable"
                    ? "⚠️ Acceptable (3-5%)"
                    : "❌ Non conforme (> 5%)"}
              </p>
            </div>
          </div>

          {/* Indicateur Iz */}
          <div className={`rounded-xl border-2 px-4 py-4 flex items-center justify-between ${
            result.izStatus === "ok"
              ? "border-green-500/30 bg-green-50/50"
              : "border-red-500/30 bg-red-50/50"
          }`}>
            <div className="flex items-center gap-3">
              {result.izStatus === "ok"
                ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                : <XCircle className="w-6 h-6 text-red-600" />}
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Courant admissible Iz à {form.ambientTemp}°C
                </p>
                <p className="text-xs text-muted-foreground">
                  Vérification : Iz ≥ 1.25 × Isc
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {result.iz} A
              </p>
              <p className={`text-xs font-medium ${
                result.izStatus === "ok" ? "text-green-600" : "text-red-600"
              }`}>
                {result.izStatus === "ok"
                  ? "✅ Conforme"
                  : "❌ Danger"}
              </p>
            </div>
          </div>

          {/* Bouton Export PDF */}
          <Button
            onClick={() => generateCablePDF(form, result)}
            className="w-full h-11 gap-2 text-sm font-medium"
            size="lg"
          >
            <FileText className="w-4 h-4" />
            Exporter le rapport PDF
          </Button>
        </div>
      </CollapsibleSection>

      {/* Section Détails Techniques - Optionnelle */}
      <CollapsibleSection title="Détails Techniques" icon={Info} defaultOpen={false}>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Paramètre</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground">Formule</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground">Valeur</th>
              </tr>
            </thead>
            <tbody>
              {[
                { p: "Résistivité ρ", f: `${form.conductorType === "copper" ? "Cuivre" : "Aluminium"} à ${form.ambientTemp}°C`, v: `${result.rho} Ω·mm²/m` },
                { p: "Courant de calcul I", f: form.currentType === "imp" ? "Imp" : "Isc", v: `${result.iCalc.toFixed(2)} A` },
                { p: "Section minimale S_min", f: "Calculée", v: `${result.sectionMin.toFixed(3)} mm²` },
                { p: "Section commerciale S", f: "Normalisée", v: `${result.sectionCommercial} mm²` },
                { p: "Chute de tension ΔV", f: "ρ × 2L × I / S", v: `${result.deltaVReal.toFixed(3)} V` },
                { p: "Chute de tension %", f: "(ΔV / U) × 100", v: `${result.deltaVPercent.toFixed(2)} %` },
                { p: "Pertes résistives P", f: "ρ × 2L × I² / S", v: `${result.powerLoss.toFixed(2)} W` },
                { p: `Iz (${form.ambientTemp}°C)`, f: "Table UTE", v: `${result.iz} A` },
                { p: "Vérification", f: "Iz ≥ 1.25×Isc", v: result.izCheck ? "✅ OK" : "❌ NON" },
              ].map((row, i) => (
                <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-3 py-2.5 text-xs font-medium text-foreground">{row.p}</td>
                  <td className="px-3 py-2.5 text-[10px] font-mono text-muted-foreground">{row.f}</td>
                  <td className="px-3 py-2.5 text-right text-xs font-bold text-primary">{row.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}