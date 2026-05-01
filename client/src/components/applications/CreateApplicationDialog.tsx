import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createApplication } from "@/lib/api";
import type { ApplicationCreateRequest } from "@/types";

const defaultForm: ApplicationCreateRequest = {
  source: "Manual",
  company: { name: "" },
  job: {
    title: "",
    description: "",
    jobType: "FULL_TIME",
    externalUrl: "",
  },
};

export default function CreateApplicationDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<ApplicationCreateRequest>({ ...defaultForm, company: { ...defaultForm.company }, job: { ...defaultForm.job } });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof ApplicationCreateRequest>(
    section: K,
    value: ApplicationCreateRequest[K],
  ) => setForm((prev) => ({ ...prev, [section]: value }));

  const updateCompany = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, company: { ...prev.company, [field]: value } }));

  const updateJob = (field: string, value: string | number | undefined | null) =>
    setForm((prev) => ({ ...prev, job: { ...prev.job, [field]: value } }));

  const handleClose = () => {
    setForm({ ...defaultForm, company: { ...defaultForm.company }, job: { ...defaultForm.job } });
    setError("");
    onOpenChange(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createApplication(form);
      handleClose();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
          <DialogDescription>Fill in the details about the job and company.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Job Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="job-title">Title *</Label>
                <Input id="job-title" value={form.job.title} onChange={(e) => updateJob("title", e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="job-desc">Description *</Label>
                <Textarea id="job-desc" value={form.job.description} onChange={(e) => updateJob("description", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-location">Location</Label>
                <Input id="job-location" value={form.job.location ?? ""} onChange={(e) => updateJob("location", e.target.value || undefined)} />
              </div>
              <div className="space-y-2">
                <Label>Job Type *</Label>
                <Select
                  value={form.job.jobType}
                  onValueChange={(v) => { if (v !== null) updateJob("jobType", v); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                    <SelectItem value="PART_TIME">Part-Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="job-url">External URL *</Label>
                <Input id="job-url" type="url" value={form.job.externalUrl} onChange={(e) => updateJob("externalUrl", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-min">Salary Min</Label>
                <Input id="salary-min" type="number" value={form.job.salaryMin ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateJob("salaryMin", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary-max">Salary Max</Label>
                <Input id="salary-max" type="number" value={form.job.salaryMax ?? ""} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateJob("salaryMax", e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Company</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="company-name">Name *</Label>
                <Input id="company-name" value={form.company.name} onChange={(e) => updateCompany("name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-website">Website</Label>
                <Input id="company-website" type="url" value={form.company.website ?? ""} onChange={(e) => updateCompany("website", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-industry">Industry</Label>
                <Input id="company-industry" value={form.company.industry ?? ""} onChange={(e) => updateCompany("industry", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Application</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Source *</Label>
                <Input id="source" value={form.source} onChange={(e) => update("source", e.target.value)} required />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="cover-letter">Cover Letter</Label>
                <Textarea id="cover-letter" value={form.coverLetter ?? ""} onChange={(e) => update("coverLetter", e.target.value || undefined)} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={form.notes ?? ""} onChange={(e) => update("notes", e.target.value || undefined)} />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
