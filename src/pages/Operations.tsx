import { RouteSafety } from "@/components/nabad/RouteSafety";
import { Card, CardContent } from "@/components/ui/card";

const Operations = () => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Operational Route Optimisation</h1>
        <p className="text-muted-foreground">
          Track deployment cycles, corridor safety, and A/B testing between predictive and control sites.
        </p>
      </div>

      <RouteSafety />

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Logistics checks</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Safety override if corridor score drops below 45% for 6 hours.</li>
            <li>8-month pilot split into three 2-month cycles; keep control sites constant for A/B validity.</li>
            <li>“Speed to site” baseline captured from first cycle; compare per cycle in weekly ops meeting.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Operations;
