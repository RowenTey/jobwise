import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ApplicationDto } from "@/types";

export default function KanbanCard({ application }: { application: ApplicationDto }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg border bg-card p-3 text-sm shadow-xs transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing"
    >
      <p className="font-medium leading-tight">
        {application.job.externalUrl ? (
          <a
            href={application.job.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {application.job.title}
          </a>
        ) : (
          application.job.title
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{application.job.company.name}</p>
    </div>
  );
}
