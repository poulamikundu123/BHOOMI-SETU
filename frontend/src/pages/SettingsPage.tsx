import PageHeader from "../components/ui/PageHeader";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="Settings" subtitle="Platform configuration and preferences" />
      <div className="p-8 max-w-2xl">
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <Settings size={32} className="mx-auto mb-3 text-neutral-300" />
          <h3 className="font-semibold text-neutral-700">Settings Panel</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Configuration options for OCR engines, NLP models, GIS providers, and notification preferences.
          </p>
          <div className="mt-6 grid grid-cols-1 gap-3 text-left">
            {[
              "OCR Engine Configuration (Tesseract / Google Vision)",
              "NLP Model Selection (spaCy / IndicBERT)",
              "Confidence Threshold Settings",
              "GIS Provider Configuration",
              "Notification Preferences",
              "Database Connection Settings",
            ].map(item => (
              <div key={item} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg text-sm text-neutral-600">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}