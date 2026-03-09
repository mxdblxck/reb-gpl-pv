import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
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
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
import { ConvexError } from "convex/values";
import { calculateSite, getSiteFullName } from "@/lib/solar-calc.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";

function ProjectCard({
  project,
  onDelete,
  onLoad,
}: {
  project: Doc<"projects">;
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
          Charger le Projet
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardInner() {
  const navigate = useNavigate();
  const projects = useQuery(api.projects.listProjects, {});
  const deleteProject = useMutation(api.projects.deleteProject);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProject({
        projectId: deleteId as Parameters<typeof deleteProject>[0]["projectId"],
      });
      toast.success("Projet supprimé.");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Échec de la suppression du projet.");
      }
    }
    setDeleteId(null);
  };

  const handleLoad = (project: Doc<"projects">) => {
    sessionStorage.setItem("loadedProject", JSON.stringify(project));
    navigate("/calculator/project/" + project._id);
  };

  // Suppress unused variable warning
  void getSiteFullName;

  return (
    <div className="space-y-6">
      {/* Ligne de statistiques */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-primary">
                {projects.length}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Projets Sauvegardés
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

      {/* Grille des projets */}
      {projects === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <FolderOpen className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">
              Aucun projet pour l'instant
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Démarrez un nouveau calcul de dimensionnement et sauvegardez-le dans votre bibliothèque de projets
            </p>
          </div>
          <Button
            onClick={() => navigate("/calculator")}
            className="gap-1.5"
          >
            <Calculator className="w-4 h-4" />
            Nouveau Calcul
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ProjectCard
                project={project}
                onDelete={() => setDeleteId(project._id)}
                onLoad={() => handleLoad(project)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le Projet ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le projet et toutes ses données de
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
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

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
                Mes Projets
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
        <Authenticated>
          <DashboardInner />
        </Authenticated>
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Sun className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Connectez-vous pour accéder à vos projets
              </h3>
              <p className="text-sm text-muted-foreground">
                Sauvegardez et gérez tous vos projets de dimensionnement PV
              </p>
            </div>
            <SignInButton />
          </div>
        </Unauthenticated>
      </div>
    </div>
  );
}
