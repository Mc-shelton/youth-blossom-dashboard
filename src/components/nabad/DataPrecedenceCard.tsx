import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export const DataPrecedenceCard = ({ compact = false }: { compact?: boolean }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-lg flex items-center gap-2">
        <ListChecks className="h-4 w-4" />
        Data Precedence (for audits)
      </CardTitle>
    </CardHeader>
    <CardContent className={`text-sm text-muted-foreground ${compact ? "space-y-0.5" : "space-y-1"}`}>
      <p>1) CDMC / SMS alerts (0–72h) override everything.</p>
      <p>2) IOM-DTM new arrivals (≤14d) inform displacement weight.</p>
      <p>3) DHIS2 Penta3 &amp; GAM (≤14d) inform health weight.</p>
      <p>4) Static registry (HH + GPS) fills gaps.</p>
    </CardContent>
  </Card>
);
