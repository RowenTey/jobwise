import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { fetchApplications, updateApplicationStatus } from "@/lib/api";
import type { ApplicationDto, ApplicationStatus } from "@/types";
import KanbanColumn from "./KanbanColumn";

const statuses: ApplicationStatus[] = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFERED",
  "REJECTED",
  "GHOSTED",
];

export default function KanbanBoard({ refreshKey }: { refreshKey: number }) {
  const emptyColumns = () => {
    const cols: Record<string, ApplicationDto[]> = {};
    for (const s of statuses) cols[s] = [];
    return cols as Record<ApplicationStatus, ApplicationDto[]>;
  };

  const [columns, setColumns] = useState<Record<ApplicationStatus, ApplicationDto[]> | null>(null);
  const [activeApp, setActiveApp] = useState<ApplicationDto | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const data = await fetchApplications({ page: 0, size: 1000, sort: "lastUpdated", direction: "desc" });
      const grouped = emptyColumns();
      for (const app of data.content) {
        grouped[app.status]?.push(app);
      }
      setColumns(grouped);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, [loadAll, refreshKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!columns) return;
    const id = event.active.id as number;
    for (const apps of Object.values(columns)) {
      const found = apps.find((a) => a.id === id);
      if (found) {
        setActiveApp(found);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveApp(null);
    const { active, over } = event;
    if (!over) return;
    if (!columns) return;

    const appId = active.id as number;
    const newStatus = over.id as ApplicationStatus;
    if (!statuses.includes(newStatus)) return;

    // Find which column the app is currently in
    let oldStatus: ApplicationStatus | null = null;
    for (const [s, apps] of Object.entries(columns)) {
      if (apps.some((a) => a.id === appId)) {
        oldStatus = s as ApplicationStatus;
        break;
      }
    }
    if (!oldStatus || oldStatus === newStatus) return;

    const app = columns[oldStatus].find((a) => a.id === appId)!;
    const oldColumns = { ...columns };

    // Optimistic update
    const newColumns = { ...columns };
    newColumns[oldStatus] = newColumns[oldStatus].filter((a) => a.id !== appId);
    newColumns[newStatus] = [
      { ...app, status: newStatus },
      ...newColumns[newStatus],
    ];
    setColumns(newColumns);

    try {
      await updateApplicationStatus(appId, newStatus);
    } catch {
      setColumns(oldColumns);
    }
  };

  if (!columns) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <KanbanColumn key={status} status={status} items={columns[status] ?? []} />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? (
          <div className="rounded-lg border bg-card p-3 text-sm shadow-xl">
            <p className="font-medium">{activeApp.job.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{activeApp.job.company.name}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
