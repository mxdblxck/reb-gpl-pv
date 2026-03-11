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
  "Facteur de simultanéité intégré (x1.3) et valeurs PR conservatrices conformes aux normes PV françaises/algériennes."
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
"PSH pire mois = 4.95 h (REB)",
"PR conservateur = 0.72",
"Tension système 48 V",
"Batteries Ni-Cad",
"DOD = 0.8 standard"];


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
              Essais
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
      <section className="relative pt-28 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Solar gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
            "linear-gradient(#FF6600 1px, transparent 1px), linear-gradient(90deg, #FF6600 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />
        
        {/* Large solar glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] bg-primary/8 rounded-full blur-[120px] sm:blur-[150px]" />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-4 sm:mb-6">
              <Zap className="w-4 h-4" />
              Sonatrach Ligne GPL — Rhourde El Baguel, Algérie
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground text-balance mb-4 sm:mb-6">
            
            Dimensionnement du système pour le projet <span className="text-primary">Off-Grid</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 text-balance">
            
            Dimensionnement photovoltaïque professionnel pour BVS1, BVS2 et
            Terminal d'Arrivée sur la pipeline GPL REB. Calculs d'ingénierie
            conformes à la norme UTE C15-712-2 avec dimensionnement de l'autonomie des batteries Ni-Cad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>
            
            <Button size="lg" onClick={() => navigate("/calculator")} className="gap-2 text-sm sm:text-base px-6 sm:px-8 h-11 sm:h-12 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all w-full sm:w-auto">
              <Calculator className="w-5 h-5" />
              Ouvrir le Calculateur
              <ChevronRight className="w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Entrez vos charges énergétiques pour chaque site →</p>
          </motion.div>
        </div>

        {/* Ligne de statistiques - Clickable Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="relative max-w-3xl mx-auto mt-10 sm:mt-16 grid grid-cols-3 gap-3 sm:gap-4">
          
          {[
            { 
              label: "Puissance Module", 
              value: "555 Wp", 
              sub: "Jinko Solar", 
              href: "/datasheets/JKM555-575N-72HL4-(V)-F1-EN.pdf",
              desc: "Module photovoltaïque monocristallin"
            },
            { 
              label: "5 jours autonomie", 
              value: "1275Ah/1515Ah", 
              sub: "HBL Ni-Cad Batteries", 
              href: "/datasheets/HSL-Ni-Cd-Battery-Leaflet.pdf",
              desc: "Batteries Nickel-Cadmium HBL"
            },
            { 
              label: "MPPT Regulator", 
              value: "80A/100A", 
              sub: "Morningstar® Genstar", 
              href: "/datasheets/datasheet-genstar-mppt-en.pdf",
              desc: "Régulateur de charge MPPT"
            },
          ].
          map((stat, i) =>
          <a
            key={i}
            href={stat.href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border border-border rounded-xl p-3 sm:p-4 text-center shadow-sm hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group block overflow-hidden">
            
              <div className="text-sm sm:text-xl font-bold text-primary group-hover:text-primary/80 transition-colors truncate">{stat.value}</div>
              <div className="text-xs font-medium text-foreground mt-1 truncate">
                {stat.label}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                {stat.sub}
              </div>
              <div className="text-[9px] sm:text-[10px] text-primary/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                📄 Fiche technique
              </div>
          </a>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {sites.map((site, i) =>
            <motion.div
              key={site.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
              onClick={() => navigate("/calculator")}
            >
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold">{site.id}</span>
                </div>
                <h3 className="font-semibold text-foreground text-center mb-1 text-sm sm:text-base">
                  {site.label}
                </h3>
                <p className="text-xs text-muted-foreground text-center mb-3 text-wrap">
                  {site.description}
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {site.battery}
                  </span>
                  <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((f, i) =>
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-pointer group">
              
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
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
            © {new Date().getFullYear()} Sonatrach DC-EPM. Conforme UTE C15-712-2.<br/>
            by <a href="https://www.linkedin.com/in/med-adda" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Mohamed ADDA</a>
          </p>
        </div>
      </footer>
    </div>);

}