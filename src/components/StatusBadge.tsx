// src/components/StatusBadge.tsx
import type { WorkflowState } from "@/lib/types";

const STATE_CONFIG: Record<
  WorkflowState,
  { dot: string; label: string; text: string }
> = {
  generated: { dot: "bg-gray-300", label: "Generated", text: "text-gray-400" },
  in_review: { dot: "bg-gray-400", label: "In review", text: "text-gray-400" },
  approved: { dot: "bg-green-500", label: "Approved", text: "text-green-600" },
  flagged: { dot: "bg-red-500", label: "Flagged", text: "text-red-500" },
};

export const StatusBadge = ({ state }: { state: WorkflowState }) => {
  const { dot, label, text } = STATE_CONFIG[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide ${text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
};
