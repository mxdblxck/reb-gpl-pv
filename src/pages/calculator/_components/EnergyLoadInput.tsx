import { useState, useId } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Plus,
  Trash2,
  Zap,
  Table2,
  Hash,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LoadItem = {
  id: string;
  name: string;
  power: number; // Watts
  hours: number; // h/j
  quantity: number;
};

type Props = {
  siteId: string;
  totalWh: number; // valeur contrôlée pour le mode simple
  onTotalChange: (wh: number) => void;
  marginPercent?: number; // Current margin percentage (0-100)
  onMarginChange?: (percent: number) => void;
};

// ── Charges prédéfinies par site ───────────────────────────────────────────────

// Charges spécifiques par site (issues des études de détails REB GPL)
const SITE_PRESETS: Record<string, { name: string; power: number; hours: number; quantity: number }[]> = {
  BVS1: [
    { name: "24VDC DC/DC Converter", power: 136.8, hours: 24, quantity: 1 },
    { name: "Laptop charging", power: 150, hours: 1, quantity: 1 },
    { name: "Puissance moteur", power: 392, hours: 0.1, quantity: 1 },
    { name: "Composants internes", power: 70, hours: 24, quantity: 1 },
    { name: "Protection cathodique", power: 240, hours: 24, quantity: 1 },
    { name: "Local batteries", power: 40, hours: 1, quantity: 1 },
    { name: "Extracteur", power: 300, hours: 1, quantity: 1 },
    { name: "Armoire telecom", power: 177.2, hours: 24, quantity: 1 },
  ],
  BVS2: [
    { name: "24VDC DC/DC Converter", power: 136.8, hours: 24, quantity: 1 },
    { name: "Laptop charging", power: 150, hours: 1, quantity: 1 },
    { name: "Puissance moteur", power: 392, hours: 0.1, quantity: 1 },
    { name: "Composants internes", power: 70, hours: 24, quantity: 1 },
    { name: "Local batteries", power: 40, hours: 1, quantity: 1 },
    { name: "Extracteur", power: 300, hours: 1, quantity: 1 },
    { name: "Armoire telecom", power: 177.2, hours: 24, quantity: 1 },
  ],
  TA: [
    { name: "24VDC DC/DC Converter", power: 136.8, hours: 24, quantity: 1 },
    { name: "Laptop charging", power: 150, hours: 1, quantity: 1 },
    { name: "Puissance moteur", power: 392, hours: 0.1, quantity: 1 },
    { name: "Composants internes", power: 70, hours: 24, quantity: 1 },
    { name: "Protection cathodique", power: 240, hours: 24, quantity: 1 },
    { name: "Local batteries", power: 40, hours: 1, quantity: 1 },
    { name: "Extracteur", power: 300, hours: 1, quantity: 1 },
    { name: "Skid de filtration", power: 3, hours: 24, quantity: 1 },
    { name: "Skid de comptage", power: 171.65, hours: 24, quantity: 1 },
    { name: "Debitmetre coriolis", power: 0, hours: 0, quantity: 1 },
    { name: "Armoire telecom", power: 180, hours: 24, quantity: 1 },
    { name: "Circuit chauffage comptage", power: 150, hours: 24, quantity: 1 },
  ],
};

// Obtenir les charges prédéfinies pour un site
function getPresetsForSite(siteId: string) {
  return SITE_PRESETS[siteId] || [];
}

function newItem(): LoadItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    power: 0,
    hours: 24,
    quantity: 1,
  };
}

function calcEnergy(item: LoadItem): number {
  return item.power * item.hours * item.quantity;
}

// ── Composant Principal ────────────────────────────────────────────────────────

export default function EnergyLoadInput({ 
  siteId, 
  totalWh, 
  onTotalChange,
  marginPercent = 0,
  onMarginChange
}: Props) {
  const [mode, setMode] = useState<"simple" | "detailed">("simple");
  const [items, setItems] = useState<LoadItem[]>([newItem()]);
  const [showPresets, setShowPresets] = useState(false);
  const labelId = useId();

  // Total mode détaillé (without margin)
  const detailedTotal = items.reduce((sum, it) => sum + calcEnergy(it), 0);
  
  // Total with margin applied
  const totalWithMargin = detailedTotal * (1 + marginPercent / 100);

  // Lors du passage en mode simple depuis le mode détaillé, synchroniser le total
  const handleModeChange = (v: string) => {
    const next = v as "simple" | "detailed";
    if (next === "simple" && mode === "detailed") {
      onTotalChange(totalWithMargin);
    }
    setMode(next);
  };

  // Handle margin change
  const handleMarginChange = (newMargin: number) => {
    if (onMarginChange) {
      onMarginChange(newMargin);
      // Also update the total with new margin
      const newTotal = detailedTotal * (1 + newMargin / 100);
      onTotalChange(newTotal);
    }
  };

  // Mettre à jour un champ d'une ligne de charge
  const updateItem = (id: string, field: keyof LoadItem, value: string | number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (field === "name") return { ...it, name: value as string };
        const num = typeof value === "number" ? value : parseFloat(value as string);
        return { ...it, [field]: isNaN(num) ? 0 : num };
      })
    );
    // Synchroniser le total
    setItems((prev) => {
      const updated = prev.map((it) => {
        if (it.id !== id) return it;
        if (field === "name") return { ...it, name: value as string };
        const num = typeof value === "number" ? value : parseFloat(value as string);
        return { ...it, [field]: isNaN(num) ? 0 : num };
      });
      const total = updated.reduce((s, i) => s + calcEnergy(i), 0) * (1 + marginPercent / 100);
      onTotalChange(total);
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, newItem()]);

  const removeItem = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      const total = next.reduce((s, i) => s + calcEnergy(i), 0) * (1 + marginPercent / 100);
      onTotalChange(total);
      return next.length === 0 ? [newItem()] : next;
    });
  };

  const addPreset = (preset: { name: string; power: number; hours: number; quantity: number }) => {
    const item: LoadItem = {
      id: crypto.randomUUID(),
      ...preset,
    };
    setItems((prev) => {
      // Supprimer le placeholder vide s'il n'y a qu'une seule ligne vide
      const cleaned =
        prev.length === 1 && prev[0].name === "" && prev[0].power === 0
          ? []
          : prev;
      const next = [...cleaned, item];
      const total = next.reduce((s, i) => s + calcEnergy(i), 0);
      onTotalChange(total);
      return next;
    });
    setShowPresets(false);
  };

  // Charger les charges prédéfinies du site
  const loadSitePresets = () => {
    const presets = getPresetsForSite(siteId);
    const newItems = presets.map(p => ({
      id: crypto.randomUUID(),
      name: p.name,
      power: p.power,
      hours: p.hours,
      quantity: p.quantity,
    }));
    setItems(newItems);
    const total = newItems.reduce((s, i) => s + calcEnergy(i), 0);
    onTotalChange(total);
  };

  // Obtenir les presets pour ce site
  const sitePresets = getPresetsForSite(siteId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label id={labelId} className="text-sm font-medium">
          Charge Énergétique Journalière —{" "}
          <span className="text-primary font-semibold">E (Wh/j)</span>
          <span className="text-destructive ml-1">*</span>
        </Label>
        {/* Sélecteur de mode */}
        <Tabs value={mode} onValueChange={handleModeChange}>
          <TabsList className="h-7 text-xs">
            <TabsTrigger value="simple" className="h-5 text-xs px-2 gap-1">
              <Hash className="w-3 h-3" />
              Simple
            </TabsTrigger>
            <TabsTrigger value="detailed" className="h-5 text-xs px-2 gap-1">
              <Table2 className="w-3 h-3" />
              Détaillé
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {mode === "simple" ? (
        /* ── Mode Simple ─────────────────────────────────────────────────────── */
        <div className="space-y-1.5">
          <div className="flex gap-3 items-center">
            <Input
              type="number"
              min={0}
              step={100}
              value={totalWh === 0 ? "" : totalWh}
              placeholder="ex. 12000"
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                onTotalChange(isNaN(num) ? 0 : num);
              }}
              className="max-w-xs text-base font-semibold"
              aria-labelledby={labelId}
            />
            <span className="text-sm text-muted-foreground">Wh/j</span>
          </div>
          {totalWh > 0 && (
            <p className="text-xs text-muted-foreground">
              ≈ {(totalWh / 1000).toFixed(3)} kWh/j
            </p>
          )}
        </div>
      ) : (
        /* ── Mode Détaillé ──────────────────────────────────────────────────── */
        <div className="space-y-2">
          {/* Présélections par site et boutons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={loadSitePresets}
              className="h-7 text-xs gap-1 bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="w-3 h-3" />
              Charger charges {siteId}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowPresets((v) => !v)}
              className="h-7 text-xs gap-1 border border-border bg-muted/30 text-muted-foreground hover:bg-muted"
            >
              <Plus className="w-3 h-3" />
              + Ajouter
            </Button>
          </div>

          {showPresets && (
            <div className="flex flex-wrap gap-1.5 p-3 bg-muted/20 rounded-lg border border-border">
              {sitePresets.map((p) => (
                <Button
                  key={p.name}
                  size="sm"
                  onClick={() => addPreset(p)}
                  className="h-6 text-[11px] px-2 border border-border bg-background text-foreground hover:bg-primary/5 hover:border-primary/30"
                >
                  {p.name}
                </Button>
              ))}
            </div>
          )}

          {/* Tableau */}
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground min-w-[160px]">
                    Charge / Équipement
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground w-24">
                    Puissance (W)
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground w-24">
                    Heures/j
                  </th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground w-20">
                    Qté
                  </th>
                  <th className="text-right px-3 py-2 text-xs font-semibold text-primary w-28">
                    Énergie (Wh/j)
                  </th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => {
                  const energy = calcEnergy(item);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-2 py-1.5">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, "name", e.target.value)}
                          placeholder={`Charge ${i + 1}`}
                          className="h-7 text-xs border-0 bg-transparent focus:bg-background focus:border focus:border-border px-1"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={item.power === 0 ? "" : item.power}
                          placeholder="0"
                          onChange={(e) => updateItem(item.id, "power", e.target.value)}
                          className="h-7 text-xs text-center border-0 bg-transparent focus:bg-background focus:border focus:border-border"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={item.hours}
                          onChange={(e) => updateItem(item.id, "hours", e.target.value)}
                          className="h-7 text-xs text-center border-0 bg-transparent focus:bg-background focus:border focus:border-border"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                          className="h-7 text-xs text-center border-0 bg-transparent focus:bg-background focus:border focus:border-border"
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <span
                          className={`font-semibold text-xs ${energy > 0 ? "text-primary" : "text-muted-foreground"}`}
                        >
                          {energy > 0 ? energy.toFixed(0) : "—"}
                        </span>
                      </td>
                      <td className="px-1 py-1.5">
                        <Button
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 p-0 border-0 bg-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Ligne total */}
              <tfoot>
                <tr className="bg-primary/5 border-t-2 border-primary/20">
                  <td
                    colSpan={4}
                    className="px-3 py-2.5 font-semibold text-sm text-foreground"
                  >
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Charge Énergétique Journalière Totale
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="font-bold text-primary text-base">
                      {detailedTotal.toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      Wh/j
                    </span>
                  </td>
                  <td />
                </tr>
                {detailedTotal > 0 && (
                  <tr className="bg-primary/5">
                    <td colSpan={5} className="px-3 pb-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          Marge (%)
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={5}
                          value={marginPercent}
                          onChange={(e) => handleMarginChange(parseFloat(e.target.value) || 0)}
                          className="h-6 w-16 text-xs text-center"
                        />
                        <span className="text-xs text-primary font-medium">
                          +{marginPercent}% → {(detailedTotal * (1 + marginPercent / 100)).toFixed(0)} Wh/j
                        </span>
                      </div>
                    </td>
                    <td className="px-3 pb-2 pt-1 text-right">
                      <span className="text-xs text-muted-foreground">
                        ≈ {(detailedTotal / 1000).toFixed(3)} kWh/j
                        {" | "}
                        {items.filter((i) => i.power > 0).length} charge(s)
                      </span>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>

          {/* Bouton d'ajout de ligne */}
          <Button
            size="sm"
            onClick={addItem}
            className="h-7 text-xs gap-1 border border-dashed border-primary/40 bg-transparent text-primary hover:bg-primary/5"
          >
            <Plus className="w-3 h-3" />
            Ajouter une ligne
          </Button>

          {/* Indication de synchronisation */}
          {detailedTotal > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Dimensionnement calculé avec{" "}
              <strong className="text-primary">{detailedTotal.toFixed(0)} Wh/j</strong>{" "}
              issu du tableau ci-dessus
            </p>
          )}
        </div>
      )}
    </div>
  );
}
