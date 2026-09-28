import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { gisApi } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuthStore } from "../store/authStore";
import { Map, X, Layers, Sparkles } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet default icon
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, shadowUrl: markerShadow });

const DEMO_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.4230, 26.7260],
            [88.4270, 26.7262],
            [88.4268, 26.7290],
            [88.4228, 26.7288],
            [88.4230, 26.7260],
          ],
        ],
      },
      properties: {
        record_id: "LR-WB-DAR-1024",
        owner_name: "Amit Kumar Das",
        plot_number: "Plot 104 (Dag 67/A)",
        khata_number: "238",
        khasra_number: "104",
        village: "Matigara",
        district: "Darjeeling",
        area: 2.40,
        unit: "acres",
        land_type: "Agricultural",
        status: "VERIFIED",
        survey_number: "104",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.4272, 26.7262],
            [88.4310, 26.7265],
            [88.4308, 26.7292],
            [88.4270, 26.7290],
            [88.4272, 26.7262],
          ],
        ],
      },
      properties: {
        record_id: "LR-WB-DAR-1025",
        owner_name: "Rajeshwar Sen",
        plot_number: "Plot 105",
        khata_number: "195",
        khasra_number: "88",
        village: "Matigara East",
        district: "Darjeeling",
        area: 1.80,
        unit: "acres",
        land_type: "Agricultural",
        status: "VERIFIED",
        survey_number: "105",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.4232, 26.7292],
            [88.4268, 26.7294],
            [88.4266, 26.7320],
            [88.4230, 26.7318],
            [88.4232, 26.7292],
          ],
        ],
      },
      properties: {
        record_id: "LR-WB-DAR-1026",
        owner_name: "Sunil Kumar Roy",
        plot_number: "Plot 103 (Bimal Roy)",
        khata_number: "482",
        khasra_number: "215/1",
        village: "Matigara North",
        district: "Darjeeling",
        area: 1.85,
        unit: "acres",
        land_type: "Agricultural",
        status: "PENDING_REVIEW",
        survey_number: "103",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.4190, 26.7260],
            [88.4228, 26.7260],
            [88.4226, 26.7288],
            [88.4188, 26.7288],
            [88.4190, 26.7260],
          ],
        ],
      },
      properties: {
        record_id: "LR-WB-DAR-1027",
        owner_name: "Matigara Gram Panchayat",
        plot_number: "Plot 102 (Common Land)",
        khata_number: "12",
        khasra_number: "102",
        village: "Matigara",
        district: "Darjeeling",
        area: 3.10,
        unit: "acres",
        land_type: "Other",
        status: "VERIFIED",
        survey_number: "102",
      },
    },
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [88.4270, 26.7230],
            [88.4310, 26.7232],
            [88.4308, 26.7258],
            [88.4268, 26.7256],
            [88.4270, 26.7230],
          ],
        ],
      },
      properties: {
        record_id: "LR-WB-DAR-1028",
        owner_name: "Priya Mukherjee",
        plot_number: "Plot 106 (Homestead Bastu)",
        khata_number: "310",
        khasra_number: "142/B",
        village: "Matigara Roadside",
        district: "Darjeeling",
        area: 0.95,
        unit: "acres",
        land_type: "Residential",
        status: "VERIFIED",
        survey_number: "106",
      },
    },
  ],
};

export default function GISMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const { isDemoMode } = useAuthStore();

  const { data: geoData, isLoading } = useQuery({
    queryKey: ["gis-geojson"],
    queryFn: () => gisApi.getGeoJson().then(r => r.data),
  });

  const effectiveGeoData = (geoData?.features && geoData.features.length > 0) ? geoData : DEMO_GEOJSON;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { center: [26.727, 88.425], zoom: 15, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    mapInstance.current = map;
    setMapReady(true);
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapReady || !effectiveGeoData || !mapInstance.current) return;
    const map = mapInstance.current;
    if (geoLayerRef.current) { geoLayerRef.current.remove(); }

    if (effectiveGeoData.features?.length > 0) {
      const layer = L.geoJSON(effectiveGeoData as any, {
        style: (feature: any) => ({
          color: "#235234",
          weight: 2,
          fillColor: feature?.properties?.land_type === "Agricultural" ? "#4f9e67" :
                     feature?.properties?.land_type === "Residential" ? "#ca8a04" : "#2d6942",
          fillOpacity: 0.45,
        }),
        onEachFeature: (feature: any, lyr: any) => {
          lyr.on("click", () => setSelected(feature.properties));
          lyr.on("mouseover", function(this: any) { this.setStyle({ fillOpacity: 0.75, weight: 3 }); });
          lyr.on("mouseout", () => layer.resetStyle(lyr));
        }
      }).addTo(map);
      geoLayerRef.current = layer;
      try { map.fitBounds(layer.getBounds(), { padding: [40, 40] }); } catch {}
    }
  }, [mapReady, effectiveGeoData]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <PageHeader title="GIS Plot Map"
        subtitle={`${effectiveGeoData?.features?.length || 5} cadastral land plots mapped · Matigara, Siliguri Sub-Division`}>
        {isDemoMode && (
          <button
            onClick={() => setSelected(effectiveGeoData.features[0].properties)}
            className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1.5"
          >
            <Sparkles size={13} />
            <span>Select Plot 104 Demo</span>
          </button>
        )}
      </PageHeader>

      <div className="flex flex-1 relative">
        <div className="absolute top-4 left-4 z-[500] bg-white rounded-xl border border-neutral-200 p-3 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={14} className="text-neutral-500" />
            <span className="text-xs font-semibold text-neutral-600">Legend</span>
          </div>
          {[
            { color: "#4f9e67", label: "Agricultural" },
            { color: "#ca8a04", label: "Residential" },
            { color: "#2d6942", label: "Other" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
              <div className="w-3 h-3 rounded-sm border" style={{ background: color, borderColor: color }} />
              {label}
            </div>
          ))}
        </div>

        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-[1000]">
              <LoadingSpinner message="Loading GIS data..." />
            </div>
          )}
          <div ref={mapRef} className="w-full" style={{ height: "calc(100vh - 85px)" }} />
        </div>

        {selected && (
          <div className="w-80 border-l border-neutral-200 bg-white overflow-y-auto shrink-0" style={{ height: "calc(100vh - 85px)" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Map size={16} className="text-green-700" />
                <h3 className="font-semibold text-neutral-900 text-sm">Plot Details</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-center p-4 rounded-xl" style={{ background: "#f2f9f4" }}>
                <div className="text-2xl font-bold" style={{ color: "#235234" }}>
                  {selected.plot_number || "—"}
                </div>
                <div className="text-xs text-neutral-500 mt-1">Plot Number</div>
              </div>
              <StatusBadge status={selected.status} />
              <div className="space-y-3">
                {[
                  ["Owner", selected.owner_name],
                  ["Khata Number", selected.khata_number],
                  ["Khasra Number", selected.khasra_number],
                  ["Area", selected.area ? `${selected.area} ${selected.unit}` : "—"],
                  ["Land Type", selected.land_type],
                  ["Village", selected.village],
                  ["District", selected.district],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between text-sm border-b border-neutral-50 pb-2">
                    <span className="text-neutral-500">{label}</span>
                    <span className="font-medium text-neutral-800 text-right max-w-40">{String(value || "—")}</span>
                  </div>
                ))}
              </div>
              <a href={`/land-records/${selected.record_id}`}
                className="block w-full py-2.5 text-sm font-semibold text-white rounded-xl text-center transition"
                style={{ background: "#235234" }}>
                View Full Record
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}