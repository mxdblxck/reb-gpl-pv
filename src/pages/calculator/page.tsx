import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ArrowLeft,
  Download,
  Info,
  AlertCircle,
} from "lucide-react";
import { Authenticated } from "convex/react";
import { toast } from "sonner";
import SiteParamsForm from "./_components/SiteParamsForm.tsx";
import SiteResultCard from "./_components/SiteResultCard.tsx";
import EnergyCharts from "./_components/EnergyCharts.tsx";
import EnergyLoadInput from "./_components/EnergyLoadInput.tsx";
import SaveProjectDialog from "./_components/SaveProjectDialog.tsx";
import type { SiteParams, SiteResult } from "@/lib/solar-calc.ts";
import {
  SITES,
  getDefaultSiteParams,
  calculateSite,
  getSiteFullName,
} from "@/lib/solar-calc.ts";
import { generateSizingPDF } from "@/lib/pdf-export.ts";

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("BVS1");
  const [applySimultaneity, setApplySimultaneity] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const [siteParams, setSiteParams] = useState<Record<string, SiteParams>>(
    () => Object.fromEntries(SITES.map((id) => [id, getDefaultSiteParams(id)]))
  );

  const results: SiteResult[] = useMemo(
    () =>
      SITES.map((id) =>
        calculateSite(siteParams[id], applySimultaneity)
      ).filter((r) => r.params.energyLoad > 0),
    [siteParams, applySimultaneity]
  );

  const handleEnergyChange = (siteId: string, wh: number) => {
    setSiteParams((prev) => ({
      ...prev,
      [siteId]: { ...prev[siteId], energyLoad: wh },
    }));
  };

  const handleParamsChange = (siteId: string, updated: SiteParams) => {
    setSiteParams((prev) => ({ ...prev, [siteId]: updated }));
  };

  const handleExportPDF = () => {
    if (results.length === 0) {
      toast.error("Veuillez saisir au moins une charge énergétique pour exporter.");
      return;
    }
    try {
      generateSizingPDF(results);
      toast.success("Rapport PDF généré avec succès.");
    } catch {
      toast.error("Échec de la génération du PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/")}
              className="border border-border bg-transparent text-muted-foreground hover:bg-muted h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.hercules.app/file_dhybg5H82iRItXQR7P2hYQLd"
                alt="Sonatrach"
                className="h-7 w-auto object-contain"
              />
              <span className="hidden sm:block text-sm font-semibold text-foreground">
                Calculateur de Dimensionnement PV
              </span>
              <Badge className="hidden sm:flex bg-primary/10 text-primary border-primary/20 text-[10px]">
                REB GPL Line
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="h-8 gap-1 border border-border bg-transparent text-muted-foreground hover:bg-muted text-xs"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Exporter PDF</span>
            </Button>
            <Authenticated>
              <Button
                size="sm"
                onClick={() => setShowSaveDialog(true)}
                className="h-8 gap-1 text-xs"
              >
                <span className="hidden sm:inline">Sauvegarder le Projet</span>
              </Button>
            </Authenticated>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Facteur de simultanéité */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Facteur de Simultanéité UTE C15-712-2
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Appliquer une correction ×1,3 à toutes les charges énergétiques lorsque
                    plusieurs charges fonctionnent simultanément
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {applySimultaneity ? "×1,3 appliqué" : "×1,0 (standard)"}
                </span>
                <Switch
                  checked={applySimultaneity}
                  onCheckedChange={setApplySimultaneity}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onglets par site */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            {SITES.map((id) => {
              const hasLoad = siteParams[id].energyLoad > 0;
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  className="flex items-center gap-1.5"
                >
                  {id}
                  {hasLoad && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {SITES.map((id) => (
            <TabsContent key={id} value={id} className="mt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Carte de saisie */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">
                          {id}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{id}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {getSiteFullName(id)}
                        </div>
                      </div>
                      {id !== "BVS1" && (
                        <Badge className="ml-auto bg-muted text-muted-foreground border-border text-[10px]">
                          Batterie : 1515 Ah
                        </Badge>
                      )}
                      {id === "BVS1" && (
                        <Badge className="ml-auto bg-muted text-muted-foreground border-border text-[10px]">
                          Batterie : 1275 Ah
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EnergyLoadInput
                      siteId={id}
                      totalWh={siteParams[id].energyLoad}
                      onTotalChange={(wh) => handleEnergyChange(id, wh)}
                    />
                    <SiteParamsForm
                      params={siteParams[id]}
                      onChange={(updated) => handleParamsChange(id, updated)}
                    />
                  </CardContent>
                </Card>

                {/* Résultats */}
                {siteParams[id].energyLoad > 0 ? (
                  <SiteResultCard
                    result={calculateSite(siteParams[id], applySimultaneity)}
                  />
                ) : (
                  <Card className="border-dashed border-border">
                    <CardContent className="py-10 flex flex-col items-center text-center gap-2">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Saisir la charge énergétique journalière ci-dessus pour calculer le dimensionnement
                      </p>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Graphiques */}
        {results.length > 0 && <EnergyCharts results={results} />}

        {/* Tableau récapitulatif */}
        {results.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif de Tous les Sites</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">
                      Site
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                      Nom Complet
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      E (Wh/j)
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Puissance PV
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Modules
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Config. PV
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                      Cap. Batterie
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                      Config. Batt.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={r.siteId}
                      className={`border-b border-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    >
                      <td className="px-4 py-3 font-bold text-primary">
                        {r.siteId}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {getSiteFullName(r.siteId)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {r.correctedEnergyLoad.toFixed(0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {(r.pv.actualPvPower / 1000).toFixed(2)} kWp
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.pv.totalModules}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs hidden md:table-cell">
                        {r.pv.configLabel}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {r.battery.actualCapacityAh.toFixed(0)} Ah
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs hidden md:table-cell">
                        {r.battery.configLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogue de sauvegarde — uniquement pour les utilisateurs authentifiés */}
      <Authenticated>
        <SaveProjectDialog
          open={showSaveDialog}
          onClose={() => setShowSaveDialog(false)}
          siteParams={SITES.map((id) => siteParams[id])}
        />
      </Authenticated>
    </div>
  );
}
