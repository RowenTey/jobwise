import { useState } from "react";
import { Plus, Table2, Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApplicationsTable from "@/components/applications/ApplicationsTable";
import KanbanBoard from "@/components/applications/KanbanBoard";
import CreateApplicationDialog from "@/components/applications/CreateApplicationDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApplicationStatus } from "@/types";

type ViewMode = "table" | "kanban";

const statuses: Array<{ value: ApplicationStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "APPLIED", label: "Applied" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "REJECTED", label: "Rejected" },
  { value: "OFFERED", label: "Offered" },
  { value: "GHOSTED", label: "Ghosted" },
];

export default function ApplicationsPage() {
  const [status, setStatus] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <div className="flex items-center gap-3">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Application
          </Button>
          <div className="flex overflow-hidden rounded-md border">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("kanban")}
            >
              <Columns3 className="h-4 w-4" />
            </Button>
          </div>
          {viewMode === "table" && (
            <Select value={status} onValueChange={(v) => { if (v !== null) setStatus(v); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      {viewMode === "table" ? (
        <ApplicationsTable key={`${status}-${refreshKey}`} statusFilter={status === "ALL" ? undefined : status} />
      ) : (
        <KanbanBoard key={refreshKey} refreshKey={refreshKey} />
      )}
      <CreateApplicationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
