import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { fetchApplications } from "@/lib/api";
import type { ApplicationDto, PaginatedResponse } from "@/types";
import StatusBadge from "./StatusBadge";

interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

const columns = [
  { key: "job.title", label: "Job Title", sortable: true },
  { key: "job.company.name", label: "Company", sortable: false },
  { key: "status", label: "Status", sortable: true },
  { key: "source", label: "Source", sortable: true },
  { key: "job.jobType", label: "Job Type", sortable: true },
  { key: "job.location", label: "Location", sortable: true },
  { key: "lastUpdated", label: "Last Updated", sortable: true },
  { key: "notes", label: "Notes", sortable: false },
];

export default function ApplicationsTable({ statusFilter }: { statusFilter?: string }) {
  const [data, setData] = useState<PaginatedResponse<ApplicationDto> | null>(null);
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<SortConfig>({ column: "lastUpdated", direction: "desc" });

  useEffect(() => {
    fetchApplications({
      page,
      size: 20,
      sort: sort.column,
      direction: sort.direction,
      status: statusFilter,
    })
      .then(setData)
      .catch(console.error);
  }, [page, sort, statusFilter]);

  const toggleSort = (column: string) => {
    setSort((prev) =>
      prev.column === column
        ? { ...prev, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) return <ChevronsUpDown className="ml-1 h-3 w-3" />;
    return sort.direction === "asc" ? (
      <ChevronUp className="ml-1 h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 h-3 w-3" />
    );
  };

  if (!data) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const apps = data.content;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={col.sortable ? "cursor-pointer select-none" : ""}
                  onClick={() => col.sortable && toggleSort(col.key)}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {col.sortable && <SortIcon column={col.key} />}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                  No applications found
                </TableCell>
              </TableRow>
            ) : (
              apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="font-medium">
                    {app.job.externalUrl ? (
                      <a href={app.job.externalUrl} target="_blank" rel="noreferrer" className="hover:underline">
                        {app.job.title}
                      </a>
                    ) : (
                      app.job.title
                    )}
                  </TableCell>
                  <TableCell>{app.job.company.name}</TableCell>
                  <TableCell><StatusBadge status={app.status} /></TableCell>
                  <TableCell>{app.source}</TableCell>
                  <TableCell>{app.job.jobType}</TableCell>
                  <TableCell>{app.job.location}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(app.lastUpdated).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {app.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.number + 1} of {data.totalPages} ({data.totalElements} total)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
