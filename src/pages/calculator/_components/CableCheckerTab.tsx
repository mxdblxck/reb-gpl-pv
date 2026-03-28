/**
 * Vérificateur de Section de Câbles PV
 * Conforme GATECH REV I — 2024-DO-SE-DOC-06
 * Formule : S = (ρ × 2 × L × I) / (ε × U)
 * 
 * UI/UX Professionnel avec interactivité avancée
 */
import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import {
  CheckCircle2, XCircle, AlertTriangle, Cable, FileText, Info, Zap, Thermometer, Gauge,
  ChevronDown, ChevronUp, Settings, Calculator, TrendingDown, Activity,
  RotateCcw, Copy, Check, Sparkles, Zap as Lightning, Shield
} from "lucide-react";
import {
  calculateCableSection,
  RHO_CU_80, RHO_AL_80,
  type CableCheckerInput,
  type CableCheckerResult,
} from "@/lib/solar-calc.ts";
import { generateCablePDF } from "@/lib/pdf-export.ts";

// ═══════════════════════════════════════════════════════════════════════════════
// PRÉSLECTIONS PRÉDÉFINIES
// ═══════════════════════════════════════════════════════════════════════════════
const PRESETS = {
  jinko555: { name: "Jinko 555W Tiger Neo", cableLength: 30, iImp: 13.16, iIsc: 13.98, systemVoltage: 48 },
  longi540: { name: "Longi 540W Hi-MO5", cableLength: 25, iImp: 13.02, iIsc: 13.82, systemVoltage: 48 },
  rec400: { name: "REC 400W Alpha", cableLength: 20, iImp: 10.01, iIsc: 10.54, systemVoltage: 48 },
  solar400: { name: "Solar Module 400W", cableLength: 35, iImp: 10.14, iIsc: 10.81, systemVoltage: 48 },
  custom: { name: "Personnalisé", cableLength: 30, iImp: 13.16, iIsc: 13.98, systemVoltage: 48 },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANTS UI PROFESSIONNELS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Input slider avec──────────────────────────────────────────────────────────────
function SliderInput({
  label, value, icon: Icon, min, max, step, unit, onChange, tooltip,
}: {
  label: string; value: number; icon: React.ElementType; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; tooltip?: string;
}) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => { setLocalValue(value); }, [value]);
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setLocalValue(v);
    onChange(v);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value) || min;
    const clamped = Math.min(max, Math.max(min, v));
    setLocalValue(clamped);
    onChange(clamped);
  };
  
  const content = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-primary" />
          {label}
        </Label>
        <span className="text-sm font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded">
          {localValue.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleSliderChange}
        className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
          [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full 
          [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      />
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={handleInputChange}
        className="h-8 text-sm"
      />
    </div>
  );
  
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent className="max-w-xs"><p>{tooltip}</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  return content;
}

// ── Toggle Button moderne─────────────────────────────────────────────────
function SegmentButton({
  options, value, onChange,
}: {
  options: { value: string; label: string; sub?: string; icon?: React.ElementType }[]; 
  value: string; 
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
            value === opt.value
              ? "bg-background shadow-sm text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.icon && <opt.icon className="w-4 h-4" />}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Résultat Card avancé──────────────────────────────────────────────────────
function ResultDisplay({
  label, value, unit, sub, status, delay = 0,
}: {
  label: string; value: string; unit: string; sub?: string; status?: "ok" | "warning" | "danger" | "neutral"; 
  delay?: number;
}) {
  const statusConfig = {
    ok: { bg: "bg-green-50/80 border-green-500/30", text: "text-green-700", icon: CheckCircle2 },
    warning: { bg: "bg-amber-50/80 border-amber-500/30", text: "text-amber-700", icon: AlertTriangle },
    danger: { bg: "bg-red-50/80 border-red-500/30", text: "text-red-700", icon: XCircle },
    neutral: { bg: "bg-muted/20 border-border", text: "text-foreground", icon: Activity },
  };
  const config = status ? statusConfig[status] : statusConfig.neutral;
  const Icon = config.icon;
  
  return (
    <div 
      className={`rounded-xl border-2 p-4 ${config.bg} transition-all duration-500`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        <Icon className={`w-4 h-4 ${config.text}`} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${config.text}`}>{value}</span>
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

// ── Indicateur de statut───────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "ok" | "warning" | "danger" }) {
  const configs = {
    ok: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle2, label: "Conforme" },
    warning: { bg: "bg-amber-100", text: "text-amber-700", icon: AlertTriangle, label: "Attention" },
    danger: { bg: "bg-red-100", text: "text-red-700", icon: XCircle, label: "Non conforme" },
  };
  const config = configs[status];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
      <Icon className={`w-4 h-4 ${config.text}`} />
      <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CableCheckerTab() {
  const [form, setForm] = useState<CableCheckerInput>(DEFAULTS);
  const [activePreset, setActivePreset] = useState<string>("custom");
  const [copied, setCopied] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  const result: CableCheckerResult = useMemo(
    () => calculateCableSection(form),
    [form]
  );

  const set = useCallback(<K extends keyof CableCheckerInput>(k: K, v: CableCheckerInput[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  // Reset avec animation
  const handleReset = () => {
    setForm(DEFAULTS);
    setActivePreset("custom");
  };

  // Appliquer un preset
  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      set("cableLength", preset.cableLength);
      set("iImp", preset.iImp);
      set("iIsc", preset.iIsc);
      set("systemVoltage", preset.systemVoltage);
      setActivePreset(presetKey);
    }
  };

  // Copier les résultats
  const handleCopy = async () => {
    const text = [
      `Vérification Câbles PV - résultats`,
      `Section calculée: ${result.sectionMin.toFixed(2)} mm²`,
      `Section recommandée: ${result.sectionCommercial} mm²`,
      `Chute de tension: ${result.deltaVPercent.toFixed(2)}%`,
      `Courant admissible Iz: ${result.iz} A`,
    ].join('\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculer le statut global
  const globalStatus = useMemo(() => {
    if (result.izStatus === "ok" && result.voltageDropStatus === "ok") return "ok";
    if (result.izStatus === "ok" || result.voltageDropStatus === "acceptable") return "warning";
    return "danger";
  }, [result.izStatus, result.voltageDropStatus]);

  const globalOk = result.izStatus === "ok" && result.voltageDropStatus !== "danger";

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* ═══════════════════════════════════════════════════════ */}
      {/* HEADER PROFESSIONNEL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className={`border-2 transition-all duration-300 ${
        globalOk 
          ? "border-green-500/50 bg-gradient-to-r from-green-50/50 to-transparent" 
          : "border-red-500/50 bg-gradient-to-r from-red-50/50 to-transparent"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner">
                <Cable className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">
                  Vérificateur Câbles PV
                </CardTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  GATECH REV I — 2024-DO-SE-DOC-06
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalOk ? (
                <StatusBadge status="ok" />
              ) : globalStatus === "warning" ? (
                <StatusBadge status="warning" />
              ) : (
                <StatusBadge status="danger" />
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PRÉSLECTIONS RAPIDES */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card className="overflow-hidden">
        <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Modules PV courants</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Réinitialiser
            </Button>
          </div>
        </div>
        <CardContent className="pt-3">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => applyPreset(key)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  activePreset === key
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-xs font-medium truncate">{preset.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {preset.iImp}A / {preset.cableLength}m
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* PARAMÈTRES D'ENTRÉE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card>
        <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Paramètres du Câble</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="advanced" className="text-xs mr-2">Mode avancé</Label>
            <Switch 
              id="advanced" 
              checked={advancedMode} 
              onCheckedChange={setAdvancedMode} 
            />
          </div>
        </div>
        <CardContent className="space-y-6 pt-4">
          {/* Matériau & Courant */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Matériau du conducteur</Label>
              <SegmentButton
                options={[
                  { value: "copper", label: "Cuivre", sub: `ρ = ${RHO_CU_80}`, icon: Cable },
                  { value: "aluminum", label: "Aluminium", sub: `ρ = ${RHO_AL_80}`, icon: Cable },
                ]}
                value={form.conductorType}
                onChange={(v) => set("conductorType", v as "copper" | "aluminum")}
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Courant de référence</Label>
              <SegmentButton
                options={[
                  { value: "imp", label: "Imp", sub: "MPP", icon: Zap },
                  { value: "isc", label: "Isc", sub: "Court-circuit", icon: Zap },
                ]}
                value={form.currentType}
                onChange={(v) => set("currentType", v as "imp" | "isc")}
              />
            </div>
          </div>

          {/* Sliders principaux */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SliderInput
              label="Longueur du câbl"
              value={form.cableLength}
              icon={Gauge}
              min={1}
              max={200}
              step={1}
              unit="m"
              onChange={(v) => set("cableLength", v)}
              tooltip="Longueur totale du cable du panneau au regulateur/batterie"
            />
            <SliderInput
              label="Courant Imp"
              value={form.iImp}
              icon={Lightning}
              min={0.1}
              max={50}
              step={0.01}
              unit="A"
              onChange={(v) => set("iImp", v)}
              tooltip="Courant maximal a puissance maximale (MPP)"
            />
            <SliderInput
              label="Courant Isc"
              value={form.iIsc}
              icon={Zap}
              min={0.1}
              max={50}
              step={0.01}
              unit="A"
              onChange={(v) => set("iIsc", v)}
              tooltip="Courant de court-circuit (x1.25 pour securite)"
            />
          </div>

          {/* Tension & Temperature */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-medium text-muted-foreground">Tension systeme</Label>
              <SegmentButton
                options={[
                  { value: "24", label: "24V", icon: Cable },
                  { value: "48", label: "48V", icon: Cable },
                ]}
                value={String(form.systemVoltage)}
                onChange={(v) => set("systemVoltage", parseInt(v))}
              />
            </div>
            <SliderInput
              label="Temperature"
              value={form.ambientTemp}
              icon={Thermometer}
              min={-20}
              max={100}
              step={5}
              unit="°C"
              onChange={(v) => set("ambientTemp", v)}
              tooltip="Temperature ambiante maximale (chaleur-toiture)"
            />
            <SliderInput
              label="Chute max"
              value={form.maxVoltageDrop}
              icon={TrendingDown}
              min={1}
              max={10}
              step={0.5}
              unit="%"
              onChange={(v) => set("maxVoltageDrop", v)}
              tooltip="Perte de tension maximale acceptee (3% recommended)"
            />
          </div>

          {/* Formule info */}
          <div className="flex items-center gap-2 text-xs bg-blue-50/80 border border-blue-200/30 rounded-lg p-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <span className="font-semibold">Formule GATECH:</span>{" "}
              <code className="font-mono bg-blue-100 px-1 rounded">S = (ρ x 2 x L x I) / (e x U)</code>
              {" "}— Norme 2024-DO-SE-DOC-06
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* RÉSULTATS */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card>
        <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Resultats du Calcul</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-3 h-3 mr-1 text-green-600" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copie!" : "Copier"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => generateCablePDF(form, result)}>
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Button>
          </div>
        </div>
        <CardContent className="space-y-5 pt-4">
          {/* Cartes principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ResultDisplay
              label="Section calculee"
              value={String(result.sectionMin.toFixed(2))}
              unit="mm2"
              sub={`rho = ${result.rho} Ohm.mm2/m`}
              status="neutral"
              delay={0}
            />
            <ResultDisplay
              label="Section recommandee"
              value={String(result.sectionCommercial)}
              unit="mm2"
              sub="Normalisee comercial"
              status={globalOk ? "ok" : "danger"}
              delay={100}
            />
            <ResultDisplay
              label="Pertes resistives"
              value={String(result.powerLoss.toFixed(2))}
              unit="W"
              sub="P = rho x 2L x I2 / S"
              status={result.powerLoss < 5 ? "ok" : result.powerLoss < 10 ? "warning" : "danger"}
              delay={200}
            />
          </div>

          {/* Indicateur chute de tension */}
          <div className={`rounded-xl border-2 p-4 transition-all duration-300 ${
            result.voltageDropStatus === "ok" 
              ? "border-green-500/40 bg-green-50/30" 
              : result.voltageDropStatus === "acceptable"
                ? "border-amber-500/40 bg-amber-50/30"
                : "border-red-500/40 bg-red-50/30"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {result.voltageDropStatus === "ok"
                  ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                  : result.voltageDropStatus === "acceptable"
                    ? <AlertTriangle className="w-6 h-6 text-amber-600" />
                    : <XCircle className="w-6 h-6 text-red-600" />}
                <div>
                  <p className="font-semibold">Chute de tension</p>
                  <p className="text-xs text-muted-foreground">
                    DeltaV = {result.deltaVReal.toFixed(3)} V
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
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
                    ? "Conforme (<= 3%)"
                    : result.voltageDropStatus === "acceptable"
                      ? "Acceptable (3-5%)"
                      : "Non conforme (> 5%)"}
                </p>
              </div>
            </div>
            <Progress 
              value={Math.min(result.deltaVPercent, 10) * 10} 
              className="h-2"
            />
          </div>

          {/* Indicateur Iz */}
          <div className={`rounded-xl border-2 p-4 transition-all duration-300 ${
            result.izStatus === "ok"
              ? "border-green-500/40 bg-green-50/30"
              : "border-red-500/40 bg-red-50/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {result.izStatus === "ok"
                  ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                  : <XCircle className="w-6 h-6 text-red-600" />}
                <div>
                  <p className="font-semibold">
                    Courant admissible Iz @ {form.ambientTemp}C
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verification: Iz superieur/egal 1.25 x Isc ({form.iIsc.toFixed(2)} A)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  {result.iz} A
                </p>
                <p className={`text-xs font-medium ${
                  result.izStatus === "ok" ? "text-green-600" : "text-red-600"
                }`}>
                  {result.izStatus === "ok"
                    ? "Conforme"
                    : "Danger"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* DÉTAILS TECHNIQUES (OPTIONNEL) */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Card>
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Details Techniques</span>
          </div>
          {advancedMode ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {advancedMode && (
          <CardContent className="pt-0">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold">Parametre</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold">Formule</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold">Valeur</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { p: "Resistivite rho", f: `${form.conductorType === "copper" ? "Cuivre" : "Aluminium"} a ${form.ambientTemp}C`, v: `${result.rho} Ohm.mm2/m` },
                    { p: "Courant I", f: form.currentType === "imp" ? "Imp" : "Isc", v: `${result.iCalc.toFixed(2)} A` },
                    { p: "S_min", f: "Calculee", v: `${result.sectionMin.toFixed(3)} mm2` },
                    { p: "Section S", f: "Normalisee", v: `${result.sectionCommercial} mm2` },
                    { p: "DeltaV", f: "rho x 2L x I / S", v: `${result.deltaVReal.toFixed(3)} V` },
                    { p: "Pertes", f: "rho x 2L x I2 / S", v: `${result.powerLoss.toFixed(2)} W` },
                    { p: "Iz", f: "Table UTE", v: `${result.iz} A` },
                    { p: "Verif", f: "Iz sup/egal 1.25xIsc", v: result.izCheck ? "OK" : "NON" },
                  ].map((row, i) => (
                    <tr key={i} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                      <td className="px-3 py-2 text-xs font-medium">{row.p}</td>
                      <td className="px-3 py-2 text-[10px] font-mono text-muted-foreground">{row.f}</td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-primary">{row.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VALEURS PAR DÉFAUT
// ═══════════════════════════════════════════════════════════════════════════════
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