import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@convex/react";
import { api } from "@convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useMutation } from "@convex/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Save, Download, Info, AlertCircle } from "lucide-react";
import SiteParamsForm from "@/pages/calculator/components/SiteParamsForm";
import SiteResultCard from "@/pages/calculator/components/SiteResultCard";
import EnergyCharts from "@/pages/calculator/components/EnergyCharts";
import EnergyLoadInput from "@/pages/calculator/components/EnergyLoadInput";
import type { SiteParams, SiteResult } from "@/lib/solar-calc";
import { SITES, getDefaultSiteParams, calculateSite, getSiteFullName } from "@/lib/solar-calc";
import { generateSizingPDF } from "@/lib/pdf-export";
import { ConvexError } from "convex/values";
import type { Id } from "@convex/_generated/dataModel";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const project = useQuery(
    api.projects.getProject,
    id ? { projectId: id as Id<"projects"> } : "skip"
  );
  
  const updateProject = useMutation(api.projects.updateProject);
  
  const [activeTab, setActiveTab] = useState("BVS1");
  const [applySimultaneity, setApplySimultaneity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [siteParams, setSiteParams] = useState<Record<string, SiteParams>>(
    () => Object.fromEntries(SITES.map((sid) => [sid, getDefaultSiteParams(sid)]))
  );
  const [initialized, setInitialized] = useState(false);

  // Charger les données du projet une seule fois
  useEffect(() => {
    if (project && !initialized) {
      const map: Record<string, SiteParams> = Object.fromEntries(
        SITES.map((sid) => [sid, getDefaultSiteParams(sid)])
      );
      project.sites.forEach((s) => {
        map[s.siteId] = s;
      });
      setSiteParams(map);
      setInitialized(true);
    }
  }, [project, initialized]);

  const results: SiteResult[] = SITES.map((sid) =>
    calculateSite(siteParams[sid], applySimultaneity)
  ).filter((r) => r.params.energyLoad > 0);

  const handleEnergyChange = (siteId: string, wh: number) => {
    setSiteParams((prev) => ({
      ...prev,
      [siteId]: { ...prev[siteId], energyLoad: wh },
    }));
  };

  const handleParamsChange = (siteId: string, updated: SiteParams) => {
    setSiteParams((prev) => ({ ...prev, [siteId]: updated }));
  };

  const handleSave = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateProject({
        projectId: id as Id<"projects">,
        sites: SITES.map((sid) => siteParams[sid]),
      });
      toast.success("Projet mis à jour.");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Échec de la sauvegarde des modifications.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPDF = () => {
    if (results.length === 0) {
      toast.error("Veuillez saisir au moins une charge énergétique pour exporter.");
      return;
    }
    try {
      generateSizingPDF(results);
      toast.success("Rapport PDF généré.");
    } catch {
      toast.error("Échec de la génération du PDF.");
    }
  };

  if (project === undefined) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Projet introuvable ou accès refusé.</p>
        <Button onClick={() => navigate("/dashboard")} className="gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Retour au Tableau de Bord
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="border border-border bg-transparent text-muted-foreground hover:bg-muted h-8 px-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                  <Sun className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold text-sm text-foreground">
                  {project.name}
                </span>
              </div>
              {project.description && (
                <p className="text-[10px] text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="h-8 gap-1 border border-border bg-transparent text-muted-foreground hover:bg-muted text-xs"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 gap-1 text-xs"
            >
              <Save className="w-3 h-3" />
              {isSaving ? "Sauvegarde..." : "Enregistrer"}
            </Button>
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
                <p className="text-sm text-muted-foreground">
                  Facteur de simultanéité UTE C15-712-2 ×1,3
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {applySimultaneity ? "×1,3 appliqué" : "×1,0"}
                </span>
                <Switch
                  checked={applySimultaneity}
                  onCheckedChange={setApplySimultaneity}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {SITES.map((sid) => {
              const hasLoad = siteParams[sid].energyLoad > 0;
              return (
                <TabsTrigger key={sid} value={sid} className="flex items-center gap-1.5">
                  {sid}
                  {hasLoad && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {SITES.map((sid) => (
            <TabsContent key={sid} value={sid} className="mt-4 space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-bold">{sid}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{sid}</div>
                        <div className="text-xs font-normal text-muted-foreground">
                          {getSiteFullName(sid)}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <EnergyLoadInput
                      siteId={sid}
                      totalWh={siteParams[sid].energyLoad}
                      onTotalChange={(wh) => handleEnergyChange(sid, wh)} 
                    />
                    <SiteParamsForm
                      params={siteParams[sid]}
                      onChange={(updated) => handleParamsChange(sid, updated)}
                    />
                  </CardContent>
                </Card>

                {siteParams[sid].energyLoad > 0 ? (
                  <SiteResultCard
                    result={calculateSite(siteParams[sid], applySimultaneity)}
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

        {results.length > 0 && <EnergyCharts results={results} />}

        {results.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Récapitulatif de Tous les Sites</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Site</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">E (Wh/j)</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Puissance PV</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Modules</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Config. PV</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Cap. Batterie</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Config. Batt.</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.siteId} className={`border-b border-border ${i % 2 === 0 ? "bg-muted/10" : ""}`}>
                      <td className="px-4 py-3 font-semibold text-primary">{r.siteId}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{r.correctedEnergyLoad.toFixed(0)}</td>
                      <td className="px-4 py-3 text-right font-medium">{(r.pv.actualPvPower / 1000).toFixed(2)} kWp</td>
                      <td className="px-4 py-3 text-right">{r.pv.totalModules}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{r.pv.configLabel}</td>
                      <td className="px-4 py-3 text-right font-medium">{r.battery.actualCapacityAh.toFixed(0)} Ah</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{r.battery.configLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}

        {project.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Notes d'Ingénierie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{project.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
