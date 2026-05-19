import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { JobOffersPaginationFooter } from "./JobOffersPaginationFooter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Briefcase, FileText, Filter, Loader2, MapPin, Search, Sparkles, Trash2, TrendingUp, Users } from "lucide-react";
import { formatDate, formatScoreOutOfTen, hrApi, loadStoredAuth, type JobOfferDTO } from "../api";
import { toast } from "sonner";

function statusClass(status: string): string {
  if (status === "SCORED" || status === "PUBLISHED") return "bg-green-50 text-green-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  return "bg-amber-50 text-amber-700";
}

function localizeStatus(status: string, t: (key: string) => string): string {
  const key = `common.status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card className="p-4 md:p-6">
      <div className="mb-3 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          {label}
        </span>
        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
      </div>
      <div className="text-2xl font-bold md:text-3xl">{value}</div>
    </Card>
  );
}

export interface JobOffer {
  id: number;
  title: string;
  status: JobOfferDTO["status"];
  location: string;
  createdAt: string;
}

function mapJobOffer(value: JobOfferDTO): JobOffer {
  return {
    id: value.id,
    title: value.title,
    status: value.status,
    location: value.structuredJd?.workLocation || "",
    createdAt: value.createdAt,
  };
}

export function HRDashboard({ createJobPath }: { createJobPath: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCvsProcessed, setTotalCvsProcessed] = useState(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobOffer[]>([]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [stats, offers] = await Promise.all([
          hrApi.dashboardStats(),
          hrApi.listJobOffers({ page: 0, size: 5 }),
        ]);
        if (cancelled) return;
        setTotalCvsProcessed(stats.totalCvsProcessed);
        setAverageScore(stats.averageMatchScore);
        setRecentJobs(offers.content.map(mapJobOffer));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("dashboard.hr.errors.load"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("dashboard.hr.title")}</h1>
          <p className="text-muted-foreground" style={{ fontSize: 14 }}>
            {t("dashboard.hr.subtitle")}
          </p>
        </div>
        <Button onClick={() => navigate(createJobPath)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
          {t("dashboard.hr.newJobOffer")}
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/20 bg-destructive/10 text-destructive" style={{ fontSize: 13 }}>
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <MetricCard label={t("dashboard.hr.ctsProcessed")} value={String(totalCvsProcessed)} icon={<FileText className="w-4 h-4" />} />
        <MetricCard label={t("dashboard.hr.averageMatchScore")} value={formatScoreOutOfTen(averageScore)} icon={<TrendingUp className="w-4 h-4" />} />
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{t("dashboard.hr.recentJobOffers")}</h3>
        </div>
        {loading ? (
          <div className="p-6 text-muted-foreground">{t("dashboard.hr.loadingJobs")}</div>
        ) : recentJobs.length === 0 ? (
          <div className="p-6 text-muted-foreground">{t("dashboard.hr.noJobs")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.labels.title")}</TableHead>
                <TableHead>{t("common.labels.status")}</TableHead>
                <TableHead>{t("common.labels.location")}</TableHead>
                <TableHead>{t("common.labels.created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell style={{ fontWeight: 500 }}>{job.title}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded ${statusClass(job.status)}`} style={{ fontSize: 11, fontWeight: 600 }}>
                      {localizeStatus(job.status, t)}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.location || t("common.messages.notSpecified")}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

export function JobOfferCreate({ backTo }: { backTo: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const publish = async () => {
    setError("");
    setSuccess("");
    if (!title.trim() || !rawText.trim()) {
      setError(t("jobOffers.create.errors.required"));
      return;
    }
    setLoading(true);
    try {
      const created = await hrApi.createJobOffer({
        title: title.trim(),
        rawText: rawText.trim(),
      });
      setSuccess(t("jobOffers.create.success", { id: created.id, status: localizeStatus(created.status, t) }));
      setTitle("");
      setRawText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobOffers.create.errors.create"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[900px] space-y-6">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("jobOffers.create.title")}</h1>
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          {t("jobOffers.create.subtitle")}
        </p>
      </div>
        <Button variant="outline" onClick={() => navigate(backTo)}>
          {t("jobOffers.create.cancel")}
        </Button>
      </div>
      <Card className="space-y-5 p-4 md:p-8">
        <div className="space-y-1.5">
          <Label>{t("jobOffers.create.jobTitle")}</Label>
          <Input placeholder={t("jobOffers.create.titlePlaceholder")} value={title} onChange={(e) => setTitle(e.target.value)} disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("jobOffers.create.rawDescription")}</Label>
          <Textarea
            placeholder={t("jobOffers.create.descriptionPlaceholder")}
            className="min-h-[220px]"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={loading}
          />
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">{error}</div>}
        {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">{success}</div>}
        <div className="flex justify-stretch md:justify-end">
          <Button onClick={() => void publish()} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? t("jobOffers.create.submitting") : t("jobOffers.create.createBtn")}
          </Button>
        </div>
      </Card>
    </div>
  );
}

type JobStatusFilter = "all" | "published" | "draft";
type JobSortBy = "newest" | "applicants" | "highestScore";
type JobSortDirection = "asc" | "desc";

interface UseJobOfferManagementResult {
  page: number;
  size: number;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage: string;
  jobs: JobOffer[];
  totalElements: number;
  safeTotalPages: number;
  titleInput: string;
  locationInput: string;
  statusInput: JobStatusFilter;
  sortBy: JobSortBy;
  sortDirection: JobSortDirection;
  hasDeletePermission: boolean;
  jobToDelete: number | null;
  isDeleting: boolean;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setSize: React.Dispatch<React.SetStateAction<number>>;
  setTitleInput: React.Dispatch<React.SetStateAction<string>>;
  setLocationInput: React.Dispatch<React.SetStateAction<string>>;
  setStatusInput: React.Dispatch<React.SetStateAction<JobStatusFilter>>;
  setSortBy: React.Dispatch<React.SetStateAction<JobSortBy>>;
  setSortDirection: React.Dispatch<React.SetStateAction<JobSortDirection>>;
  setJobToDelete: React.Dispatch<React.SetStateAction<number | null>>;
  handleApplyFilters: () => void;
  handleDeleteConfirm: () => Promise<void>;
}

function useJobOfferManagement(t: (key: string, options?: Record<string, unknown>) => string): UseJobOfferManagementResult {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [jobOffers, setJobOffers] = useState<JobOfferDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [titleInput, setTitleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [statusInput, setStatusInput] = useState<JobStatusFilter>("all");

  const [appliedTitle, setAppliedTitle] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<JobStatusFilter>("all");

  const [sortBy, setSortBy] = useState<JobSortBy>("newest");
  const [sortDirection, setSortDirection] = useState<JobSortDirection>("desc");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const hasDeletePermission = useMemo(() => loadStoredAuth()?.user.role === "ADMIN", []);

  const handleApplyFilters = () => {
    setAppliedTitle(titleInput.trim());
    setAppliedLocation(locationInput.trim());
    setAppliedStatus(statusInput);
    setPage(0);
  };

  useEffect(() => {
    let isCancelled = false;

    const fetchJobOffers = async () => {
      if (hasLoadedOnce) {
        setIsFetching(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage("");
      try {
        const isPublished = appliedStatus === "all" ? undefined : appliedStatus === "published";
        const data = await hrApi.listJobOffers({
          page,
          size,
          title: appliedTitle || undefined,
          location: appliedLocation || undefined,
          isPublished,
          sortBy,
          direction: sortDirection,
        });

        if (!isCancelled) {
          setJobOffers(data?.content || []);
          setTotalPages(data?.page?.totalPages ?? 1);
          setTotalElements(data?.page?.totalElements ?? 0);
        }
      } catch (err) {
        if (!isCancelled) {
          setErrorMessage(err instanceof Error ? err.message : t("jobOffers.list.errors.load"));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsFetching(false);
          setHasLoadedOnce(true);
        }
      }
    };

    void fetchJobOffers();
    return () => {
      isCancelled = true;
    };
  }, [appliedLocation, appliedStatus, appliedTitle, page, size, sortBy, sortDirection]);

  const safeTotalPages = Math.max(1, totalPages);
  const jobs = useMemo(() => jobOffers.map(mapJobOffer), [jobOffers]);

  const handleDeleteConfirm = async () => {
    if (jobToDelete == null) return;
    const deletingJobId = jobToDelete;

    try {
      setIsDeleting(true);
      await hrApi.deleteJobOffer(deletingJobId);
      toast.success(t("jobOffers.list.toasts.deleteSuccess"));
      setJobOffers((prev) => prev.filter((job) => job.id !== deletingJobId));
      setTotalElements((prev) => Math.max(0, prev - 1));
      setJobToDelete(null);
    } catch {
      toast.error(t("jobOffers.list.toasts.deleteFailed"));
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    page,
    size,
    isLoading,
    isFetching,
    errorMessage,
    jobs,
    totalElements,
    safeTotalPages,
    titleInput,
    locationInput,
    statusInput,
    sortBy,
    sortDirection,
    hasDeletePermission,
    jobToDelete,
    isDeleting,
    setPage,
    setSize,
    setTitleInput,
    setLocationInput,
    setStatusInput,
    setSortBy,
    setSortDirection,
    setJobToDelete,
    handleApplyFilters,
    handleDeleteConfirm,
  };
}

function JobOfferFiltersCard({
  titleInput,
  locationInput,
  statusInput,
  sortOption,
  isLoading,
  onTitleChange,
  onLocationChange,
  onStatusChange,
  onSortOptionChange,
  onApply,
}: {
  titleInput: string;
  locationInput: string;
  statusInput: JobStatusFilter;
  sortOption: string;
  isLoading: boolean;
  onTitleChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onStatusChange: (value: JobStatusFilter) => void;
  onSortOptionChange: (value: string) => void;
  onApply: () => void;
}) {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <Card className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="search-title">{t("jobOffers.list.filters.searchTitle")}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-title"
                className="pl-9"
                value={titleInput}
                onChange={(e) => onTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onApply();
                }}
                placeholder={t("jobOffers.list.filters.titlePlaceholder")}
              />
            </div>
          </div>

          <div className="flex gap-3 md:ml-auto md:self-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters((prev) => !prev)}
              className={showFilters ? "bg-muted" : ""}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button onClick={onApply} disabled={isLoading}>
              {t("jobOffers.list.filters.apply")}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted border border-border rounded-md animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1.5">
              <Label htmlFor="search-location">{t("jobOffers.list.filters.searchLocation")}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search-location"
                  className="pl-9"
                  value={locationInput}
                  onChange={(e) => onLocationChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onApply();
                  }}
                  placeholder={t("jobOffers.list.filters.locationPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("jobOffers.list.filters.status")}</Label>
              <Select value={statusInput} onValueChange={(value) => onStatusChange(value as JobStatusFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("jobOffers.list.filters.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("jobOffers.list.filters.all")}</SelectItem>
                  <SelectItem value="published">{t("jobOffers.list.filters.published")}</SelectItem>
                  <SelectItem value="draft">{t("jobOffers.list.filters.draft")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("jobOffers.list.filters.sortBy")}</Label>
              <Select value={sortOption} onValueChange={onSortOptionChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest-desc">{t("jobOffers.list.sortToolbar.options.newestDesc")}</SelectItem>
                  <SelectItem value="newest-asc">{t("jobOffers.list.sortToolbar.options.oldestAsc")}</SelectItem>
                  <SelectItem value="applicants-desc">{t("jobOffers.list.sortToolbar.options.mostApplicants")}</SelectItem>
                  <SelectItem value="applicants-asc">{t("jobOffers.list.sortToolbar.options.leastApplicants")}</SelectItem>
                  <SelectItem value="highestScore-desc">{t("jobOffers.list.sortToolbar.options.highestTopScore")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function JobOfferGrid({
  jobs,
  hasDeletePermission,
  onSelect,
  onRequestDelete,
}: {
  jobs: JobOffer[];
  hasDeletePermission: boolean;
  onSelect: (job: JobOffer) => void;
  onRequestDelete: (jobId: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {jobs.map((job) => (
        <Card
          key={job.id}
          onClick={() => onSelect(job)}
          className="cursor-pointer p-4 transition-all hover:border-primary hover:shadow-sm md:p-6"
        >
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
            <div className="w-11 h-11 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className={`px-2 py-0.5 rounded ${statusClass(job.status)}`} style={{ fontSize: 11, fontWeight: 700 }}>
              {localizeStatus(job.status, t)}
            </span>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 600 }} className="mb-1">{job.title}</h3>
          <div className="text-muted-foreground mb-4" style={{ fontSize: 12 }}>
            {(job.location || t("common.messages.notSpecified"))} · {t("jobOffers.list.createdOn", { date: formatDate(job.createdAt) })}
          </div>
          <div className="flex flex-col items-start justify-between gap-2 border-t border-border pt-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 13 }}>
              <Users className="w-4 h-4 text-muted-foreground" />
              {t("jobOffers.list.clickToSeeEvaluations")}
            </div>
            {hasDeletePermission && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRequestDelete(job.id);
                }}
                className="text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
                aria-label={t("jobOffers.list.a11y.deleteJobOffer")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function JobOfferDeleteDialog({
  open,
  isDeleting,
  onOpenChange,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("jobOffers.list.deleteDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("jobOffers.list.deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isDeleting}>
            {t("common.actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isDeleting}
          >
            {isDeleting ? t("jobOffers.list.deleteDialog.deleting") : t("jobOffers.list.deleteDialog.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function JobOffersList({ onSelectJobPath }: { onSelectJobPath: (job: JobOffer) => string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    page,
    size,
    isLoading,
    isFetching,
    errorMessage,
    jobs,
    totalElements,
    safeTotalPages,
    titleInput,
    locationInput,
    statusInput,
    sortBy,
    sortDirection,
    hasDeletePermission,
    jobToDelete,
    isDeleting,
    setPage,
    setSize,
    setTitleInput,
    setLocationInput,
    setStatusInput,
    setSortBy,
    setSortDirection,
    setJobToDelete,
    handleApplyFilters,
    handleDeleteConfirm,
  } = useJobOfferManagement(t);

  const sortOption = `${sortBy}-${sortDirection}`;

  const handleSortOptionChange = (value: string) => {
    const [nextSortBy, nextSortDirection] = value.split("-");
    if (nextSortBy !== "newest" && nextSortBy !== "applicants" && nextSortBy !== "highestScore") {
      return;
    }
    if (nextSortDirection !== "asc" && nextSortDirection !== "desc") {
      return;
    }
    setSortBy(nextSortBy);
    setSortDirection(nextSortDirection);
    setPage(0);
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("jobOffers.list.title")}</h1>
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          {t("jobOffers.list.subtitle")}
        </p>
      </div>

      {errorMessage && (
        <Card className="p-4 border-destructive/20 bg-destructive/10 text-destructive" style={{ fontSize: 13 }}>
          {errorMessage}
        </Card>
      )}

      <JobOfferFiltersCard
        titleInput={titleInput}
        locationInput={locationInput}
        statusInput={statusInput}
        sortOption={sortOption}
        isLoading={isLoading}
        onTitleChange={setTitleInput}
        onLocationChange={setLocationInput}
        onStatusChange={setStatusInput}
        onSortOptionChange={handleSortOptionChange}
        onApply={handleApplyFilters}
      />

      <p className="text-sm font-medium text-muted-foreground mb-4">{t("jobOffers.list.sortToolbar.totalOffers", { count: totalElements })}</p>

      {isLoading ? (
        <Card className="p-4 text-center text-muted-foreground md:p-8">{t("jobOffers.list.loading")}</Card>
      ) : jobs.length ? (
        <div className="relative">
          <JobOfferGrid
            jobs={jobs}
            hasDeletePermission={hasDeletePermission}
            onSelect={(job) => navigate(onSelectJobPath(job))}
            onRequestDelete={setJobToDelete}
          />
          {isFetching && (
            <div className="absolute inset-0 bg-white/65 backdrop-blur-[1px] flex items-center justify-center rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      ) : (
        <Card className="p-4 text-center text-muted-foreground md:p-8">{t("jobOffers.list.noOffers")}</Card>
      )}

      <JobOffersPaginationFooter
        page={page}
        size={size}
        totalElements={totalElements}
        totalPages={safeTotalPages}
        onPageChange={setPage}
        onSizeChange={(nextSize) => {
          setSize(nextSize);
          setPage(0);
        }}
      />

      <JobOfferDeleteDialog
        open={jobToDelete !== null}
        isDeleting={isDeleting}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setJobToDelete(null);
          }
        }}
        onCancel={() => setJobToDelete(null)}
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </div>
  );
}
