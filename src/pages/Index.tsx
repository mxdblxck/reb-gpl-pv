import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import {
  Sun,
  Battery,
  BarChart3,
  FileDown,
  FolderOpen,
  ShieldCheck,
  Zap,
  Calculator,
  ChevronRight,
  CheckCircle2 } from
"lucide-react";

const features = [
{
  icon: Calculator,
  title: "Dimensionnement Système PV",
  description:
  "Calculer automatiquement la puissance PV requise, le nombre de modules et la configuration série/parallèle optimale en utilisant les facteurs PSH et PR."
},
{
  icon: Battery,
  title: "Conception du Banc de Batteries",
  description:
  "Dimensionner les bancs de batteries Ni-Cad pour 5 jours d'autonomie avec calcul de capacité tenant compte du DOD et configuration par cellule par site."
},
{
  icon: BarChart3,
  title: "Graphiques de Bilan Énergétique",
  description:
  "Visualiser les charges énergétiques journalières, la production PV et le dimensionnement des batteries avec des graphiques à barres et en secteurs interactifs."
},
{
  icon: FolderOpen,
  title: "Saisie Détaillée des Charges",
  description:
  "Saisir les charges énergétiques en total ou les détailler ligne par ligne par équipement : RTU, CPCU, Télécoms, Éclairage, SDV.. etc"
},
{
  icon: FileDown,
  title: "Export PDF",
  description:
  "Générer des rapports de dimensionnement professionnels avec les tableaux de calcul complets, les formules et les résultats des trois sites."
},
{
  icon: ShieldCheck,
  title: "Norme UTE C15-712-2",
  description:
  "Facteur de simultanéité intégré (×1,3) et valeurs PR conservatrices conformes aux normes PV françaises/algériennes."
}];


const sites = [
{
  id: "BVS1",
  label: "BVS1",
  description: "Bloc Valve Station 1",
  battery: "1275 Ah",
  groups: "1 groupe PV"
},
{
  id: "BVS2",
  label: "BVS2",
  description: "Bloc Valve Station 2",
  battery: "1515 Ah",
  groups: "1 groupe PV"
},
{
  id: "TA",
  label: "TA",
  description: "Terminal d'Arrivée",
  battery: "1515 Ah",
  groups: "2 groupes PV"
}];


const highlights = [
"Modules Jinko 555 Wp préconfigurés",
"PSH pire mois = 4,95 h (REB)",
"PR conservateur = 0,72",
"Tension système 48 V",
"Batteries Ni-Cad",
"DOD = 0,8 standard"];


export default function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Barre de navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.hercules.app/file_HcgQRt87zEBLp1lXLPqQ4NdJ"
              alt="Sonatrach"
              className="h-7 sm:h-8 w-auto object-contain" />
            
            <div className="h-5 sm:h-6 w-px bg-border hidden sm:block" />
            <div className="hidden sm:block">
              <span className="font-bold text-foreground text-sm leading-tight block">
                SolarSizer
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight block">
                REB GPL Line Project
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
            >
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Projets
            </Button>
            <Button onClick={() => navigate("/calculator")} size="sm">
              <Calculator className="w-4 h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Ouvrir le </span>Calculateur
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden min-h-[85vh] flex items-center">
        {/* PV Panel Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80" 
            alt="Solar Panels" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/30" />
        </div>
        
        {/* Animated Particles/Glow */}
        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-20 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-orange-400 text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-4 sm:mb-6">
              <Sun className="w-4 h-4" />
              Sonatrach Ligne GPL — Rhourde El Baguel, Algérie
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white text-balance mb-4 sm:mb-6">
            
            Dimensionnement du système pour le projet <span className="text-orange-400">Off-Grid</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-8 sm:mb-10 text-balance">
            
            Dimensionnement photovoltaïque professionnel pour BVS1, BVS2 et
            Terminal d'Arrivée sur la pipeline GPL REB. Calculs d'ingénierie
            conformes à la norme UTE C15-712-2 avec dimensionnement de l'autonomie des batteries Ni-Cad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>
            
            <Button size="lg" onClick={() => navigate("/calculator")} className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 bg-orange-500 hover:bg-orange-600 border-0">
              <Calculator className="w-5 h-5" />
              Ouvrir le Calculateur
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>

        {/* Ligne de statistiques */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative max-w-3xl mx-auto mt-10 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-4">
          
          {[
          { label: "Heures de Soleil Crête", value: "4,95 h", sub: "Pire mois" },
          { label: "Puissance Module", value: "555 Wp", sub: "Jinko Solar" },
          { label: "Autonomie", value: "5 Jours", sub: "Ni-Cad DOD 0,8" }].
          map((stat, i) =>
          <div
            key={i}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 text-center shadow-sm">
            
              <div className="text-xl sm:text-2xl font-bold text-orange-400">{stat.value}</div>
              <div className="text-xs sm:text-sm font-medium text-white mt-1">
                {stat.label}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                {stat.sub}
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Sites */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Trois Sites, Un Seul Outil
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Dimensionnez les trois stations de la pipeline en une seule session
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sites.map((site, i) =>
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
              onClick={() => navigate("/calculator")}
            >
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-white font-bold text-sm">{site.id}</span>
                </div>
                <h3 className="font-semibold text-foreground text-center mb-1 text-sm sm:text-base">
                  {site.label}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground text-center mb-3">
                  {site.description}
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {site.battery}
                  </span>
                  <span className="text-[10px] sm:text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                    {site.groups}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">
              Fonctionnalités de Niveau Ingénierie
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">Conçu spécifiquement pour le systèmes PV off-grid pour les ouvrages de SH-REB-GPL

            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((f, i) =>
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-6 hover:border-primary/30 transition-colors shadow-sm">
              
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">{f.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {f.description}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Paramètres par défaut */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-primary text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Paramètres par Défaut Préconfigurés</h2>
            <p className="text-white/70 text-sm sm:text-base">Paramètres spécifiques au site REB intégrés — entrez simplement les charges énergétiques

            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {highlights.map((h, i) =>
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="flex items-center gap-2 bg-white/10 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
              
                <CheckCircle2 className="w-4 h-4 text-white/80 shrink-0" />
                <span className="text-sm text-white/90">{h}</span>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            Commencez le Dimensionnement & Vérifiez vos Calculs
          </h2>
          <p className="text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base">Ouvrez le calculateur, entrez les charges énergétiques pour chaque site et obtenez instantanément les résultats de dimensionnement PV et batterie.


          </p>
          <Button size="lg" onClick={() => navigate("/calculator")} className="gap-2 w-full sm:w-auto">
            <Calculator className="w-5 h-5" />
            Ouvrir le Calculateur
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="border-t border-border py-6 sm:py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="https://cdn.hercules.app/file_HcgQRt87zEBLp1lXLPqQ4NdJ"
              alt="Sonatrach"
              className="h-5 sm:h-6 w-auto object-contain" />
            
            <span className="text-xs sm:text-sm text-muted-foreground">
              Ligne GPL REB — Dimensionnement Solaire PV
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Sonatrach DC-EPM. Conforme UTE C15-712-2.
            by : Mohamed ADDA
          </p>
        </div>
      </footer>
    </div>);

}