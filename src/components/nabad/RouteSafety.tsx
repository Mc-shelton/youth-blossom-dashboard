import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { abTestSnapshot, corridorSafety, deploymentCycles } from "@/data/nabad";
import { ShieldCheck, TrafficCone, Truck, Users, Clock } from "lucide-react";

export const RouteSafety = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Operational Route Optimisation</CardTitle>
          <p className="text-sm text-muted-foreground">8-month pilot cycles + corridor safety</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Truck className="h-4 w-4" />
          Mobile hub live
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deploymentCycles.map((cycle) => (
            <div key={cycle.cycle} className="border border-border/70 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{cycle.cycle}</p>
                <Badge variant={cycle.status === "in-progress" ? "secondary" : "outline"}>{cycle.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{cycle.focus}</p>
              <p className="text-xs text-muted-foreground">{cycle.window}</p>
              <Progress value={cycle.completion} className="h-2" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrafficCone className="h-3.5 w-3.5" />
                {cycle.completion}% completion
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border/70 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-background space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="font-semibold">Safety Index Map</p>
              </div>
              <Badge variant="outline">Perceived safety</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Corridor</TableHead>
                  <TableHead className="w-[120px]">Score</TableHead>
                  <TableHead>Last incident</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {corridorSafety.map((corridor) => (
                  <TableRow key={corridor.name}>
                    <TableCell className="font-medium">{corridor.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={corridor.safety * 100} className="h-2" />
                        <span className="text-xs text-muted-foreground">{Math.round(corridor.safety * 100)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{corridor.lastIncident}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border border-border/70 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <p className="font-semibold">A/B Testing Toggle</p>
              </div>
              <Badge variant="outline">Predictive vs Control</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/80 p-3 bg-primary/5">
                <p className="text-muted-foreground text-xs">Cost per beneficiary</p>
                <p className="text-2xl font-semibold">${abTestSnapshot.predictiveCostPerBen}</p>
                <p className="text-emerald-600 text-xs">Predictive</p>
              </div>
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-muted-foreground text-xs">Cost per beneficiary</p>
                <p className="text-2xl font-semibold">${abTestSnapshot.controlCostPerBen}</p>
                <p className="text-amber-600 text-xs">Control</p>
              </div>
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-muted-foreground text-xs">Service uptake</p>
                <p className="text-2xl font-semibold">{abTestSnapshot.predictiveUptake}%</p>
                <p className="text-emerald-600 text-xs">Predictive</p>
              </div>
              <div className="rounded-lg border border-border/80 p-3">
                <p className="text-muted-foreground text-xs">Service uptake</p>
                <p className="text-2xl font-semibold">{abTestSnapshot.controlUptake}%</p>
                <p className="text-amber-600 text-xs">Control</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Sample size: {abTestSnapshot.sampleSites} sites. Toggle keeps control sites constant while predictive algorithm
              directs hub to hotspots.
            </p>
          </div>
          <div className="border border-border/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <p className="font-semibold">Speed to Site (baseline vs current)</p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Predictive (avg)</span>
              <span className="font-semibold text-foreground">14.2 hrs</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Control (avg)</span>
              <span className="font-semibold text-foreground">27.6 hrs</span>
            </div>
            <div className="text-xs text-muted-foreground">
              Baseline captured from Cycle 1; updated weekly. Uses alert-received → deployment-start timestamps.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
