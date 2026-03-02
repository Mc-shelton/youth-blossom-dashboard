import { BeneficiaryImpact } from "@/components/nabad/BeneficiaryImpact";
import { Card, CardContent } from "@/components/ui/card";

const Impact = () => {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Beneficiary & Impact Tracking</h1>
        <p className="text-muted-foreground">
          Monitor SADD targets, cross-sector uptake, and Penta3 dropout trends across predictive vs control sites.
        </p>
      </div>

      <BeneficiaryImpact />

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
          <p className="font-semibold text-foreground">Learning questions</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Are we reaching 60% women and 35% minority clans each cycle?</li>
            <li>Does vaccination uptake correlate with protection/WGFS module access?</li>
            <li>What is the cost-per-beneficiary delta between predictive and control sites?</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default Impact;
