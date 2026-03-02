import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stethoscope, ThermometerSun, Truck } from "lucide-react";
import { ScoredSite } from "@/hooks/useSitesData";

const districts: ("Dayniile" | "Hodan" | "Kahda")[] = ["Dayniile", "Hodan", "Kahda"];

function summarizeDistrict(district: (typeof districts)[number], sites: ScoredSite[]) {
  const filtered = sites.filter((s) => s.district === district);
  if (!filtered.length) return { penta3: 0, gam: "0.0", arrivals: 0 };
  const penta3 = filtered.reduce((acc, s) => acc + s.penta3Coverage, 0) / filtered.length;
  const gam = filtered.reduce((acc, s) => acc + s.gam, 0) / filtered.length;
  const arrivals = filtered.reduce((acc, s) => acc + (s.newArrivals14d ?? 0), 0);
  return { penta3: Math.round(penta3), gam: gam.toFixed(1), arrivals };
}

export const HealthDisplacement = ({ sites }: { sites: ScoredSite[] }) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Health + Displacement Signals</CardTitle>
          <Badge variant="outline" className="gap-1">
            <ThermometerSun className="h-4 w-4" />
            Alerts: Penta3 &lt; 50% or GAM &gt; 15%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {districts.map((district) => {
          const summary = summarizeDistrict(district, sites);
          const pentaRisk = Math.max(0, 100 - summary.penta3);
          const gamRisk = Math.min(100, (parseFloat(summary.gam) / 25) * 100);
          return (
            <div key={district} className="rounded-xl border border-border/70 p-4 space-y-3 bg-gradient-to-br from-primary/5 via-card to-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <p className="font-semibold">{district}</p>
                </div>
                <Badge variant="secondary">Arrivals: {summary.arrivals}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Penta3 coverage</span>
                  <span className={summary.penta3 < 50 ? "text-red-600" : "text-emerald-600"}>
                    {summary.penta3}%
                  </span>
                </div>
                <Progress value={summary.penta3} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span>GAM prevalence</span>
                  <span className={parseFloat(summary.gam) > 15 ? "text-red-600" : "text-emerald-600"}>
                    {summary.gam}%
                  </span>
                </div>
                <Progress value={parseFloat(summary.gam) * 4} className="h-2 bg-amber-100" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Truck className="h-3.5 w-3.5" />
                {summary.arrivals.toLocaleString()} new arrivals (14d) flagged by IOM ETT
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
