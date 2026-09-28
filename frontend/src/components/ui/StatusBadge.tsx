import { getStatusBadge } from "../../utils/helpers";
import { CheckCircle, AlertTriangle, XCircle, Clock, Loader } from "lucide-react";

interface Props {
  status: string;
  size?: "sm" | "md";
}

const icons: Record<string, any> = {
  COMPLETED: CheckCircle, VERIFIED: CheckCircle, VALID: CheckCircle,
  REVIEW: AlertTriangle, WARNING: AlertTriangle, NEEDS_REVIEW: AlertTriangle, PENDING_REVIEW: AlertTriangle,
  FAILED: XCircle, INVALID: XCircle,
  UPLOADED: Clock, PREPROCESSING: Loader, OCR: Loader, NLP: Loader, VALIDATION: Loader,
};

export default function StatusBadge({ status, size = "md" }: Props) {
  const s = getStatusBadge(status);
  const Icon = icons[status];
  return (
    <span className={`status-badge ${s.bg} ${s.text} ${size === "sm" ? "text-xs py-0.5 px-2" : ""}`}>
      {Icon && <Icon size={size === "sm" ? 11 : 12} />}
      {s.label}
    </span>
  );
}