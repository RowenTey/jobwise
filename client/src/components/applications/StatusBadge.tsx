import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types";

const statusVariant: Record<ApplicationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  APPLIED: "secondary",
  ASSESSMENT: "default",
  INTERVIEW: "default",
  REJECTED: "destructive",
  OFFERED: "default",
  GHOSTED: "outline",
};

const statusColor: Record<ApplicationStatus, string> = {
  APPLIED: "",
  ASSESSMENT: "bg-blue-500 hover:bg-blue-600 text-white",
  INTERVIEW: "bg-purple-500 hover:bg-purple-600 text-white",
  REJECTED: "",
  OFFERED: "bg-emerald-500 hover:bg-emerald-600 text-white",
  GHOSTED: "",
};

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={statusVariant[status]} className={statusColor[status] || undefined}>
      {status}
    </Badge>
  );
}
