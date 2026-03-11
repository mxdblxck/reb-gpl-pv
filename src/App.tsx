import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import CalculatorPage from "./pages/calculator/page.tsx";
import DashboardPage from "./pages/dashboard/page.tsx";
import ProjectPage from "./pages/calculator/project.tsx";
import { useServiceWorker } from "@/hooks/use-service-worker.ts";

// Sonatrach ribbon at bottom of all pages
function SonatrachRibbon() {
  return (
    <div className="w-full h-2 bg-gradient-to-r from-[#FF6600] via-[#FF8533] to-[#FF6600]"></div>
  );
}

export default function App() {
  useServiceWorker();
  return (
    <DefaultProviders>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/calculator/project/:id" element={<ProjectPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SonatrachRibbon />
        </div>
      </BrowserRouter>
    </DefaultProviders>
  );
}
