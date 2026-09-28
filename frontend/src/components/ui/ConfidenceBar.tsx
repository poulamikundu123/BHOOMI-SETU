import { getConfidenceColor } from "../../utils/helpers";

interface Props {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md";
}

export default function ConfidenceBar({ value, showLabel = true, size = "md" }: Props) {
  const pct = Math.round((value || 0) * 100);
  const color = getConfidenceColor(value);
  const h = size === "sm" ? "4px" : "6px";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 confidence-bar" style={{ height: h }}>
        <div className="confidence-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold tabular-nums" style={{ color, minWidth: "2.5rem", textAlign: "right" }}>
          {pct}%
        </span>
      )}
    </div>
  );
}