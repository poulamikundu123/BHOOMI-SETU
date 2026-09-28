export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatConfidence(val: number): string {
  return `${Math.round((val || 0) * 100)}%`;
}

export function getConfidenceColor(val: number): string {
  if (val >= 0.9) return "#16a34a";
  if (val >= 0.7) return "#ca8a04";
  return "#dc2626";
}

export function getConfidenceBg(val: number): string {
  if (val >= 0.9) return "bg-green-100 text-green-800";
  if (val >= 0.7) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getStatusBadge(status: string): { bg: string; text: string; label: string } {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    COMPLETED: { bg: "bg-green-100", text: "text-green-800", label: "Completed" },
    VERIFIED: { bg: "bg-green-100", text: "text-green-800", label: "Verified" },
    REVIEW: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Review Required" },
    FAILED: { bg: "bg-red-100", text: "text-red-800", label: "Failed" },
    UPLOADED: { bg: "bg-blue-100", text: "text-blue-800", label: "Uploaded" },
    PREPROCESSING: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Preprocessing" },
    OCR: { bg: "bg-purple-100", text: "text-purple-800", label: "OCR" },
    NLP: { bg: "bg-violet-100", text: "text-violet-800", label: "NLP" },
    VALIDATION: { bg: "bg-orange-100", text: "text-orange-800", label: "Validation" },
    VALID: { bg: "bg-green-100", text: "text-green-800", label: "Valid" },
    WARNING: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Warning" },
    INVALID: { bg: "bg-red-100", text: "text-red-800", label: "Invalid" },
    NEEDS_REVIEW: { bg: "bg-orange-100", text: "text-orange-800", label: "Needs Review" },
    PENDING_REVIEW: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending Review" },
  };
  return map[status] || { bg: "bg-gray-100", text: "text-gray-700", label: status };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  } catch { return dateStr; }
}

export function formatFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    owner_name: "Owner Name",
    father_name: "Father / Guardian",
    khata_number: "Khata Number",
    khasra_number: "Khasra Number",
    survey_number: "Survey Number",
    plot_number: "Plot Number",
    village: "Village",
    mouza: "Mouza",
    district: "District",
    state: "State",
    area: "Area",
    unit: "Unit",
    land_type: "Land Type",
    registration_date: "Registration Date",
    mutation_number: "Mutation Number",
    document_number: "Document Number",
  };
  return labels[fieldName] || fieldName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}