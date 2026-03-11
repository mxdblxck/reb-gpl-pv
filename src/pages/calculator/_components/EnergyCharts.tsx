import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import type { SiteResult } from "@/lib/solar-calc.ts";

type Props = {
  results: SiteResult[];
};

const COLORS = ["#FF6600", "#FF9933", "#FFB366", "#CC5200"];

export default function EnergyCharts({ results }: Props) {
  const [activeChart, setActiveChart] = useState("energy");

  const energyData = useMemo(
    () =>
      results.map((r) => ({
        site: r.siteId,
        "Charge Énergétique (Wh/j)": Math.round(r.correctedEnergyLoad),
        "PV Installé (Wp)": Math.round(r.pv.actualPvPower),
        "Capacité Batterie (Wh)": Math.round(r.battery.actualCapacityWh),
      })),
    [results]
  );

  const modulesData = useMemo(
    () =>
      results.map((r) => ({
        site: r.siteId,
        value: r.pv.totalModules,
        label: `${r.pv.totalModules} modules`,
      })),
    [results]
  );

  const batteryCellsData = useMemo(
    () =>
      results.map((r) => ({
        site: r.siteId,
        value: r.battery.totalCells,
        label: `${r.battery.totalCells} cellules`,
      })),
    [results]
  );

  if (results.length === 0 || results.every((r) => r.params.energyLoad === 0)) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Graphiques de Bilan Énergétique</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeChart} onValueChange={setActiveChart} className="w-full">
          <TabsList className="mb-3 w-full flex-wrap h-auto">
            <TabsTrigger value="energy" className="text-xs px-2 py-1.5 flex-1 min-w-[100px]">Vue d'Ensemble</TabsTrigger>
            <TabsTrigger value="modules" className="text-xs px-2 py-1.5 flex-1 min-w-[80px]">Modules PV</TabsTrigger>
            <TabsTrigger value="batteries" className="text-xs px-2 py-1.5 flex-1 min-w-[100px]">Batteries</TabsTrigger>
          </TabsList>

          <TabsContent value="energy">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={energyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.02 55)" />
                <XAxis dataKey="site" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid oklch(0.91 0.02 55)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Charge Énergétique (Wh/j)" fill="#FF6600" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PV Installé (Wp)" fill="#FF9933" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Capacité Batterie (Wh)" fill="#FFB366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="modules">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={modulesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="site"
                    label={({ site, value }) => `${site}: ${value}`}
                    labelLine={true}
                  >
                    {modulesData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} modules`, "Quantité"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend formatter={(value) => `${value}`} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="batteries">
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={batteryCellsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="site"
                    label={({ site, value }) => `${site}: ${value}`}
                    labelLine={true}
                  >
                    {batteryCellsData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} cellules`, "Quantité"]}
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
