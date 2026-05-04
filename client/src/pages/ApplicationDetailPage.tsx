import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ArrowLeft, ExternalLink, Building2, MapPin, Clock, Briefcase, FileText } from "lucide-react";
import { fetchApplication, updateApplicationStatus } from "@/lib/api";
import StatusBadge from "@/components/applications/StatusBadge";
import type { ApplicationDto, ApplicationStatus } from "@/types";

const STATUSES: ApplicationStatus[] = [
  "VIEWED", "APPLIED", "ASSESSMENT", "INTERVIEW", "REJECTED", "OFFERED", "GHOSTED",
];

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<ApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchApplication(Number(id))
      .then((data) => { setApp(data); setLoading(false); })
      .catch((err) => { setError(err instanceof Error ? err.message : "Failed to load application"); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    if (!app) return;
    try {
      await updateApplicationStatus(app.id, newStatus);
      const updated = await fetchApplication(app.id);
      setApp(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <p className="text-destructive">{error || "Application not found"}</p>
      </div>
    );
  }

  const salaryDisplay = app.job.salaryMin != null || app.job.salaryMax != null
    ? `${app.job.salaryMin != null ? `$${app.job.salaryMin.toLocaleString()}` : ""} - ${app.job.salaryMax != null ? `$${app.job.salaryMax.toLocaleString()}` : ""}`
    : null;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{app.job.title}</h1>
          <p className="text-lg text-muted-foreground">{app.job.company.name}</p>
        </div>
        <StatusBadge status={app.status} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{app.job.location || "Remote"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span>{app.job.jobType.replace("_", " ")}</span>
            </div>
            {salaryDisplay && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">💰</span>
                <span>{salaryDisplay}</span>
              </div>
            )}
            {app.job.externalUrl && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a href={app.job.externalUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  View Job Posting
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{app.job.company.name}</span>
            </div>
            {app.job.company.website && (
              <div className="flex items-center gap-2 text-sm">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a href={app.job.company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {app.job.company.website}
                </a>
              </div>
            )}
            {app.job.company.industry && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Industry:</span>
                <span>{app.job.company.industry}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Source:</span>
              <span className="capitalize">{app.source}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Applied:</span>
              <span>{new Date(app.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(app.lastUpdated).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={app.status} onValueChange={(val) => handleStatusChange(val as ApplicationStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {app.job.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.job.description}</p>
          </CardContent>
        </Card>
      )}

      {app.coverLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cover Letter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.coverLetter}</p>
          </CardContent>
        </Card>
      )}

      {app.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{app.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
