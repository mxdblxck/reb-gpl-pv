import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Sun,
  ArrowLeft,
  Calculator,
  FolderOpen,
  Trash2,
  Clock,
  Zap,
  Battery,
} from "lucide-react";
import { toast } from "sonner";
import { calculateSite, getSiteFullName, SITES } from "@/lib/solar-calc.ts";
import type { SiteParams } from "@/lib/solar-calc.ts";

// Local storage types
interface LocalProject {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  sites: SiteParams[];
  updatedAt: string;
}

function loadProjects(): LocalProject[] {
  try {
    const stored = localStorage.getItem("solar_projects");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: LocalProject[]): void {
  localStorage.setItem("solar_projects", JSON.stringify(projects));
}

function ProjectCard({
  project,
  onDelete,
  onLoad,
}: {
  project: LocalProject;
  onDelete: () => void;
  onLoad: () => void;
}) {
  const sites = project.sites.filter((s) => s.energyLoad > 0);
  const totalModules = sites.reduce((sum, s) => {
    const r = calculateSite(s);
    return sum + r.pv.totalModules;
  }, 0);
  const totalCapAh = sites.reduce((sum, s) => {
    const r = calculateSite(s);
    return sum + r.battery.actualCapacityAh;
  }, 0);

  return (
    <Card className="hover:border-primary/30 transition-colors shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {project.description}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 border border-border bg-transparent text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Badges des sites */}
        <div className="flex flex-wrap gap-1.5">
          {project.sites
            .filter((s) => s.energyLoad > 0)
            .map((s) => (
              <Badge
                key={s.siteId}
                className="bg-primary/10 text-primary border-primary/20 text-[10px]"
              >
                {s.siteId}: {s.energyLoad.toFixed(0)} Wh/j
              </Badge>
            ))}
          {project.sites.filter((s) => s.energyLoad === 0).map((s) => (
            <Badge
              key={s.siteId}
              className="bg-muted text-muted-foreground border-border text-[10px]"
            >
              {s.siteId}: —
            </Badge>
          ))}
        </div>

        {/* Statistiques */}
        {sites.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sun className="w-3.5 h-3.5 text-primary" />
              <span>{totalModules} modules</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Battery className="w-3.5 h-3.5 text-primary" />
              <span>{totalCapAh.toFixed(0)} Ah</span>
            </div>
          </div>
        )}

        {/* Horodatage */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {new Date(project.updatedAt).toLocaleString()}
        </div>

        {/* Notes */}
        {project.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/30 rounded px-2 py-1">
            {project.notes}
          </p>
        )}

        <Button size="sm" onClick={onLoad} className="w-full h-8 gap-1.5 text-xs">
          <FolderOpen className="w-3.5 h-3.5" />
          Charger l'Essai
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load projects from localStorage on mount
  useEffect(() => {
    setProjects(loadProjects());
    setIsLoading(false);
  }, []);

  const handleDelete = () => {
    if (!deleteId) return;
    const updatedProjects = projects.filter((p) => p.id !== deleteId);
    setProjects(updatedProjects);
    saveProjects(updatedProjects);
    toast.success("Essai supprimé.");
    setDeleteId(null);
  };

  const handleLoad = (project: LocalProject) => {
    navigate("/calculator/project/" + project.id);
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
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Sun className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-foreground">
                Mes Essais
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/calculator")}
            className="h-8 gap-1.5 text-xs"
          >
            <Zap className="w-3 h-3" />
            Nouveau Calcul
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Ligne de statistiques */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Card>
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-primary">
                    {projects.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Essais Sauvegardés
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-primary">
                    {projects.reduce((sum, p) => {
                      return sum + p.sites.filter((s) => s.energyLoad > 0).length;
                    }, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Sites Actifs Dimensionnés
                  </div>
                </CardContent>
              </Card>
              <Card className="hidden sm:block">
                <CardContent className="py-4">
                  <div className="text-2xl font-bold text-primary">
                    {projects
                      .reduce((sum, p) => {
                        return (
                          sum +
                          p.sites
                            .filter((s) => s.energyLoad > 0)
                            .reduce((s2, site) => {
                              const r = calculateSite(site);
                              return s2 + r.pv.totalModules;
                            }, 0)
                        );
                      }, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Total Modules Dimensionnés
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grille des essais */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted/30 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">
                  Aucun essai pour l'instant
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Démarrez un nouveau calcul de dimensionnement et sauvegardez-le dans votre bibliothèque d'essais
                </p>
              </div>
              <Button
                onClick={() => navigate("/calculator")}
                className="gap-1.5"
              >
                <Calculator className="w-4 h-4" />
                Nouvel Essai
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <ProjectCard
                    project={project}
                    onDelete={() => setDeleteId(project.id)}
                    onLoad={() => handleLoad(project)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <AlertDialog
          open={!!deleteId}
          onOpenChange={(o) => !o && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer l'Essai ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'essai et toutes ses données de
                dimensionnement seront définitivement supprimés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
