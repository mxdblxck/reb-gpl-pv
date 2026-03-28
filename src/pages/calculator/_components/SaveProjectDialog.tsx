import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { SiteParams } from "@/lib/solar-calc.ts";
import { ConvexError } from "convex/values";

type Props = {
  open: boolean;
  onClose: () => void;
  siteParams: SiteParams[];
  existingProjectId?: string;
};

export default function SaveProjectDialog({
  open,
  onClose,
  siteParams,
  existingProjectId: _existingProjectId,
}: Props) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const createProject = useMutation(api.projects.createProject);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Veuillez saisir un nom de projet.");
      return;
    }
    setIsSaving(true);
    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        sites: siteParams,
      });
      toast.success("Projet sauvegardé avec succès.");
      onClose();
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Échec de la sauvegarde du projet.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sauvegarder le Projet</DialogTitle>
          <DialogDescription>
            Sauvegarder votre dimensionnement actuel dans la bibliothèque de projets
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nom du Projet *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. REB GPL Line – Phase 1"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brève description..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes d'Ingénierie</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur les hypothèses, révisions, normes UTE..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            className="border border-border bg-transparent text-foreground hover:bg-muted"
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
