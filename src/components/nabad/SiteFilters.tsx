import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScoredSite } from "@/hooks/useSitesData";

type Props = {
  threshold: number;
  district: string;
  onlySafe: boolean;
  onChange: (v: { threshold: number; district: string; onlySafe: boolean }) => void;
  sites: ScoredSite[];
};

export const SiteFilters = ({ threshold, district, onlySafe, onChange, sites }: Props) => {
  const districts = Array.from(new Set(sites.map((s) => s.district)));
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Minimum CVI</Label>
          <span className="text-sm font-semibold">{threshold}</span>
        </div>
        <Slider
          min={40}
          max={90}
          step={5}
          value={[threshold]}
          onValueChange={([v]) => onChange({ threshold: v, district, onlySafe })}
        />
        <div className="space-y-2">
          <Label className="text-sm">District</Label>
          <Select value={district} onValueChange={(v) => onChange({ threshold, district: v, onlySafe })}>
            <SelectTrigger>
              <SelectValue placeholder="All districts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {districts.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm">Hide unsafe (&lt;45%)</Label>
            <p className="text-xs text-muted-foreground">Safety override filter</p>
          </div>
          <Switch checked={onlySafe} onCheckedChange={(v) => onChange({ threshold, district, onlySafe: v })} />
        </div>
      </CardContent>
    </Card>
  );
};
