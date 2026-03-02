import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { beneficiaryProgress, serviceMix, vaccinationTrend } from "@/data/nabad";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { HeartPulse } from "lucide-react";

export const BeneficiaryImpact = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Beneficiary & Impact Tracking</CardTitle>
          <p className="text-sm text-muted-foreground">SADD targets + service uptake trends</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <HeartPulse className="h-4 w-4" />
          Real-time
        </Badge>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm font-semibold mb-2">Female participation (target 60%)</p>
            <Progress value={(beneficiaryProgress.female / beneficiaryProgress.femaleTarget) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Current {beneficiaryProgress.female}%</span>
              <span>Target {beneficiaryProgress.femaleTarget}%</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm font-semibold mb-2">Minority clan reach (target 35%)</p>
            <Progress value={(beneficiaryProgress.minority / beneficiaryProgress.minorityTarget) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Current {beneficiaryProgress.minority}%</span>
              <span>Target {beneficiaryProgress.minorityTarget}%</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-4">
            <p className="text-sm font-semibold mb-2">Children w/ disabilities (target 12%)</p>
            <Progress value={(beneficiaryProgress.cwd / beneficiaryProgress.cwdTarget) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Current {beneficiaryProgress.cwd}%</span>
              <span>Target {beneficiaryProgress.cwdTarget}%</span>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-4 bg-primary/5">
            <p className="text-sm font-semibold mb-2">Cross-sector linkage</p>
            <p className="text-2xl font-semibold">32%</p>
            <p className="text-xs text-muted-foreground">
              Caregivers who accessed Protection/WGFS after a child vaccination (pilot sample, 14d window).
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-sm font-semibold mb-2">Service mix (predictive vs control)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceMix} margin={{ left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Legend />
                  <Bar dataKey="predictive" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="control" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-sm font-semibold mb-2">Penta3 dropout trend (hub vs control)</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vaccinationTrend} margin={{ left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="predictive" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="control" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
