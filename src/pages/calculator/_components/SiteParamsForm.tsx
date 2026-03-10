import { useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible.tsx";
import { ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import type { SiteParams } from "@/lib/solar-calc.ts";
import { getDefaultSiteParams } from "@/lib/solar-calc.ts";

type Props = {
  params: SiteParams;
  onChange: (updated: SiteParams) => void;
};

type FieldDef = {
  key: keyof SiteParams;
  label: string;
  unit: string;
  min: number;
  max?: number;
  step: number;
  tooltip: string;
};

const fields: FieldDef[] = [
  {
    key: "psh",
    label: "PSH (Heures de Soleil Crête)",
    unit: "h/j",
    min: 0.1,
    step: 0.01,
    tooltip: "Heures de soleil crête pire mois pour REB : 4.95 h",
  },
  {
    key: "pr",
    label: "Rendement Système (PR)",
    unit: "",
    min: 0.1,
    step: 0.01,
    tooltip: "Facteur de pertes système — 0.72 conservateur",
  },
  {
    key: "modulePower",
    label: "Puissance Module",
    unit: "Wp",
    min: 1,
    step: 1,
    tooltip: "Puissance nominale du module PV — Jinko 555 Wp",
  },
  {
    key: "groups",
    label: "Groupes PV",
    unit: "",
    min: 1,
    step: 1,
    tooltip: "Groupes PV en parallèle (1 pour BVS1/BVS2, 2 pour TA)",
  },
  {
    key: "autonomy",
    label: "Autonomie Batterie",
    unit: "jours",
    min: 1,
    step: 1,
    tooltip: "Jours d'autonomie sans apport solaire",
  },
  {
    key: "dod",
    label: "DOD (Profondeur de Décharge)",
    unit: "",
    min: 0.1,
    step: 0.01,
    tooltip: "Fraction de décharge maximale — 0.8 pour Ni-Cad",
  },
  {
    key: "batteryEfficiency",
    label: "Rendement Batterie (η)",
    unit: "",
    min: 0.1,
    step: 0.01,
    tooltip: "Rendement charge/décharge — 0.85",
  },
  {
    key: "cellVoltage",
    label: "Tension Cellule",
    unit: "V",
    min: 0.1,
    step: 0.01,
    tooltip: "Tension nominale de cellule — 1.2 V Ni-Cad",
  },
  {
    key: "unitaryBatteryCapacity",
    label: "Capacité Unitaire de Batterie",
    unit: "Ah",
    min: 1,
    step: 1,
    tooltip: "Capacité d'une unité de batterie — 1275 Ah",
  },
  {
    key: "systemVoltage",
    label: "Tension Système",
    unit: "V",
    min: 12,
    step: 12,
    tooltip: "Tension bus DC — 48 V pour tous les sites",
  },
  {
    key: "margin",
    label: "Marge (%)",
    unit: "%",
    min: 0,
    max: 100,
    step: 5,
    tooltip: "Marge de sécurité en pourcentage — 20% par défaut",
  },
];

export default function SiteParamsForm({ params, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (key: keyof SiteParams, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      // Convert margin from percentage to decimal
      const finalValue = key === "margin" ? num / 100 : num;
      onChange({ ...params, [key]: finalValue });
    }
  };

  const handleReset = () => {
    const defaults = getDefaultSiteParams(params.siteId);
    onChange({ ...defaults, energyLoad: params.energyLoad });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          className="w-full justify-between border border-border bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          size="sm"
        >
          <span className="text-xs font-medium">Paramètres Avancés</span>
          {isOpen ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-3 p-4 bg-muted/20 rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Paramètres Système
            </span>
            <Button
              size="sm"
              onClick={handleReset}
              className="h-6 text-xs px-2 gap-1 border border-border bg-background text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="w-3 h-3" />
              Réinitialiser
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  {f.label}
                  {f.unit && (
                    <span className="text-primary/70">({f.unit})</span>
                  )}
                </Label>
                <Input
                  type="number"
                  step={f.step}
                  // Remove spinner buttons with CSS, allow decimal points
                  style={{ WebkitAppearance: "textfield", MozAppearance: "textfield" }}
                  // For margin, display as percentage (value * 100), but store as decimal
                  value={f.key === "margin" ? ((params[f.key] as number) * 100) : (params[f.key] as number)}
                  onChange={(e) => handleChange(f.key, e.target.value)}
                  className="h-8 text-sm no-spinner"
                  title={f.tooltip}
                />
              </div>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
