import Map, { Layer, Source, NavigationControl, Marker, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeCompositeScore, siteProfiles } from "@/data/nabad";
import { ScoredSite } from "@/hooks/useSitesData";
import { useMemo, useState } from "react";

const STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const circleLayer: Layer = {
  id: "cvi-circles",
  type: "circle",
  paint: {
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "score"],
      0,
      "#22c55e",
      50,
      "#eab308",
      65,
      "#f59e0b",
      80,
      "#ef4444"
    ],
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "households"],
      100,
      7,
      900,
      16,
      1500,
      22
    ],
    "circle-stroke-color": "#0f172a",
    "circle-stroke-width": 1.2,
    "circle-opacity": 0.9
  }
};

const glowLayer: Layer = {
  id: "cvi-glow",
  type: "circle",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "households"],
      100,
      14,
      900,
      22,
      1500,
      30
    ],
    "circle-color": [
      "interpolate",
      ["linear"],
      ["get", "score"],
      0,
      "rgba(34,197,94,0.0)",
      50,
      "rgba(234,179,8,0.25)",
      65,
      "rgba(245,158,11,0.35)",
      80,
      "rgba(239,68,68,0.45)"
    ],
    "circle-blur": 0.9,
    "circle-opacity": 0.9
  }
};

const heatLayer: Layer = {
  id: "cvi-heat",
  type: "heatmap",
  minzoom: 8,
  maxzoom: 16,
  paint: {
    "heatmap-weight": ["interpolate", ["linear"], ["get", "score"], 40, 0.2, 80, 1],
    "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.7, 14, 1.4],
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(34,197,94,0)",
      0.25,
      "rgba(34,197,94,0.35)",
      0.45,
      "rgba(234,179,8,0.55)",
      0.7,
      "rgba(245,158,11,0.72)",
      1,
      "rgba(239,68,68,0.9)"
    ],
    "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 22, 12, 32, 14, 48],
    "heatmap-opacity": 0.85
  }
};

const debugLayer: Layer = {
  id: "cvi-debug",
  type: "circle",
  paint: {
    "circle-radius": 6,
    "circle-color": "#ef4444",
    "circle-opacity": 0.9,
  },
};

type Props = {
  sites?: (typeof siteProfiles | ScoredSite[]);
  onSelect?: (name: string) => void;
  selected?: string | null;
};

export const Choropleth = ({ sites = siteProfiles, onSelect, selected }: Props) => {
  const [hover, setHover] = useState<{ name: string; lon: number; lat: number; score: number; arrivals: number; hh: number } | null>(null);
  const normalized = (sites as any[]).map((s) => ({ ...s, _score: (s as any)._score ?? computeCompositeScore(s as any) }));

  const geojson = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: normalized.map((s) => ({
        type: "Feature",
        properties: {
          name: s.name,
          district: s.district,
          households: s.households,
          score: (s as any)._score?.composite ?? computeCompositeScore(s as any).composite,
        },
        geometry: {
          type: "Point",
          coordinates: [s.lon, s.lat],
        },
      })),
    } as const;
  }, [normalized]);

  const center = useMemo(() => {
    const lon = normalized.reduce((a, s) => a + s.lon, 0) / normalized.length;
    const lat = normalized.reduce((a, s) => a + s.lat, 0) / normalized.length;
    return { lon, lat };
  }, [normalized]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">CVI Choropleth (MapLibre)</CardTitle>
        <p className="text-sm text-muted-foreground">Circles colored by CVI, sized by households; heat layer underneath.</p>
      </CardHeader>
      <CardContent>
        <div className="relative h-[360px] w-full overflow-hidden rounded-lg border border-border/60">
          <Map
            initialViewState={{ longitude: center.lon, latitude: center.lat, zoom: 12.2 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={STYLE_URL}
            attributionControl={false}
            interactiveLayerIds={["cvi-circles"]}
            onClick={(e) => {
              const feat = e.features?.find((f) => f.layer.id === "cvi-circles");
              const name = feat?.properties?.name as string | undefined;
              if (name && onSelect) onSelect(name);
            }}
          >
            <NavigationControl position="top-left" />
            <Source id="cvi-sites" type="geojson" data={geojson}>
              <Layer {...heatLayer} />
              <Layer {...glowLayer} />
              <Layer {...circleLayer} />
              <Layer {...debugLayer} />
            </Source>
            {normalized.map((s) => {
              const score = (s as any)._score?.composite ?? computeCompositeScore(s as any).composite;
              const color =
                score >= 80 ? "#ef4444" : score >= 65 ? "#f59e0b" : score >= 50 ? "#eab308" : "#22c55e";
              return (
                <Marker
                  key={s.name}
                  longitude={s.lon}
                  latitude={s.lat}
                  anchor="center"
                  onClick={(e) => {
                    e.originalEvent.stopPropagation();
                    onSelect?.(s.name);
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: "0 0 12px 4px rgba(0,0,0,0.25)",
                      border: "2px solid #0f172a",
                      opacity: 0.95,
                    }}
                    onMouseEnter={() =>
                      setHover({
                        name: s.name,
                        lon: s.lon,
                        lat: s.lat,
                        score,
                        arrivals: s.newArrivals14d ?? 0,
                        hh: s.households,
                      })
                    }
                    onMouseLeave={() => setHover(null)}
                  />
                </Marker>
              );
            })}
            {selected && (
              <Source
                id="selected-site"
                type="geojson"
                data={
                  geojson.features.find((f) => (f.properties as any).name === selected) ?? {
                    type: "FeatureCollection",
                    features: [],
                  }
                }
              >
                <Layer
                  id="selected-ring"
                  type="circle"
                  paint={{
                    "circle-radius": 22,
                    "circle-color": "transparent",
                    "circle-stroke-color": "#2563eb",
                    "circle-stroke-width": 3,
                  }}
                />
              </Source>
            )}
            {hover && (
              <Popup longitude={hover.lon} latitude={hover.lat} closeButton={false} closeOnClick={false} offset={12}>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-sm">{hover.name}</div>
                  <div>CVI: {hover.score}</div>
                  <div>HH: {hover.hh.toLocaleString()}</div>
                  <div>Arrivals (14d): {hover.arrivals}</div>
                </div>
              </Popup>
            )}
          </Map>
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-md border text-[11px] text-muted-foreground shadow">
            <div className="font-semibold text-xs text-foreground mb-1">Legend (CVI)</div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />{" "}
              <span>{"<50"} Stable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#eab308" }} />{" "}
              <span>50–64 Monitor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} />{" "}
              <span>65–79 Verify</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ef4444" }} />{" "}
              <span>{"≥80"} Deploy</span>
            </div>
          </div>
          {/* <div className="absolute bottom-2 right-2 bg-white/85 backdrop-blur px-2 py-1 rounded-md border text-[10px] text-muted-foreground shadow">
            © OpenStreetMap · © CARTO
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};
