import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";
import type { ApplicationDto, ApplicationStatus } from "@/types";

const headerColors: Record<ApplicationStatus, string> = {
  APPLIED: "bg-slate-500",
  ASSESSMENT: "bg-blue-500",
  INTERVIEW: "bg-purple-500",
  OFFERED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  GHOSTED: "bg-gray-400",
};

export default function KanbanColumn({
  status,
  items,
}: {
  status: ApplicationStatus;
  items: ApplicationDto[];
}) {
  const { setNodeRef } = useDroppable({ id: status });

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-lg border bg-muted/30">
      <div className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-white ${headerColors[status]}`}>
        <span className="text-sm font-semibold">{status}</span>
        <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 240px)" }}
      >
        <SortableContext items={items.map((a) => a.id)} strategy={verticalListSortingStrategy}>
          {items.map((app) => <KanbanCard key={app.id} application={app} />)}
        </SortableContext>
        {items.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">No applications</p>
        )}
      </div>
    </div>
  );
}
