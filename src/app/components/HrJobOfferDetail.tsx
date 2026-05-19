import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import {
  formatDate,
  jobOffersApi,
  type ApplicantSummaryDTO,
  type JobOfferDetailDTO,
  type UpdateJobOfferPayloadDTO,
} from "../api";

type TabKey = "job-info" | "applicants";
type JobOfferManagementRole = "HR" | "ADMIN";

function jobStatusClass(status: string): string {
  if (status === "PUBLISHED") return "bg-green-50 text-green-700 border-green-200";
  if (status === "CLOSED") return "bg-gray-100 text-gray-700 border-gray-200";
  if (status === "DRAFT") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

function localizeStatus(status: string, t: (key: string) => string): string {
  const key = `common.status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function scoreColor(score: number | null): string {
  if (score == null) return "#9ca3af";
  if (score > 80) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  return "#dc2626";
}

function MatchScoreRing({ score, naLabel }: { score: number | null; naLabel: string }) {
  const size = 44;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = score == null || Number.isNaN(score) ? 0 : Math.max(0, Math.min(score, 100));
  const dash = (normalizedScore / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-gray-700">
        {score == null ? naLabel : `${Math.round(normalizedScore)}%`}
      </span>
    </div>
  );
}

function normalizeSkill(value: string): string {
  return value.trim();
}

export function JobOfferManagement({ role }: { role: JobOfferManagementRole }) {
  const { t } = useTranslation();
  const params = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const jobsPath = role === "ADMIN" ? "/admin/jobs" : "/hr/jobs";

  const jobId = useMemo(() => {
    const parsed = Number(params.jobId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.jobId]);

  const [activeTab, setActiveTab] = useState<TabKey>("job-info");
  const [job, setJob] = useState<JobOfferDetailDTO | null>(null);
  const [applicants, setApplicants] = useState<ApplicantSummaryDTO[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "date" | "name" | "status">("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [applicantsLoading, setApplicantsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [minExperience, setMinExperience] = useState("");
  const [maxExperience, setMaxExperience] = useState("");
  const [responsibilitiesText, setResponsibilitiesText] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [requiredSkillInput, setRequiredSkillInput] = useState("");
  const [preferredSkillInput, setPreferredSkillInput] = useState("");

  const syncFormFromJob = (value: JobOfferDetailDTO) => {
    setTitle(value.title ?? "");
    setLocation(value.structuredJd?.workLocation ?? "");
    setEmploymentType(value.structuredJd?.employmentType ?? "");
    setMinExperience(value.structuredJd?.experienceRange?.minYears ?? "");
    setMaxExperience(value.structuredJd?.experienceRange?.maxYears ?? "");
    setResponsibilitiesText((value.structuredJd?.responsibilities ?? []).join("\n"));
    setRequiredSkills(value.structuredJd?.requiredSkills ?? []);
    setPreferredSkills(value.structuredJd?.preferredSkills ?? []);
    setRequiredSkillInput("");
    setPreferredSkillInput("");
  };

  useEffect(() => {
    if (jobId == null) {
      setError(t("jobOffers.detail.invalidId"));
      setLoading(false);
      setApplicantsLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      setFeedback("");
      try {
        const jobData = await jobOffersApi.getJobOffer(jobId);
        if (cancelled) return;
        setJob(jobData);
        syncFormFromJob(jobData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("jobOffers.detail.errors.load"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  useEffect(() => {
    if (jobId == null) {
      setApplicantsLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setApplicantsLoading(true);
      setError("");
      try {
        const applicantsData = await jobOffersApi.getJobApplicants(jobId, sortBy, sortDirection);
        if (cancelled) return;
        setApplicants(applicantsData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("jobOffers.detail.errors.load"));
        }
      } finally {
        if (!cancelled) {
          setApplicantsLoading(false);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [jobId, sortBy, sortDirection]);

  const addSkill = (
    value: string,
    skills: string[],
    setSkills: (next: string[]) => void,
    setInput: (next: string) => void,
  ) => {
    const next = normalizeSkill(value);
    if (!next) return;
    const exists = skills.some((item) => item.toLowerCase() === next.toLowerCase());
    if (!exists) {
      setSkills([...skills, next]);
    }
    setInput("");
  };

  const removeSkill = (skills: string[], setSkills: (next: string[]) => void, index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const saveChanges = async () => {
    if (!job || jobId == null) return;
    if (!title.trim()) {
      setError(t("jobOffers.detail.errors.titleRequired"));
      return;
    }

    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const payload: UpdateJobOfferPayloadDTO = {
        title: title.trim(),
        structuredJd: {
          workLocation: location.trim() || null,
          employmentType: employmentType || null,
          experienceRange:
            minExperience.trim() || maxExperience.trim()
              ? {
                  minYears: minExperience.trim() || null,
                  maxYears: maxExperience.trim() || null,
                }
              : null,
          requiredSkills: requiredSkills.map((item) => item.trim()).filter(Boolean),
          preferredSkills: preferredSkills.map((item) => item.trim()).filter(Boolean),
          responsibilities: responsibilitiesText
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      };

      const updated = await jobOffersApi.updateJobOffer(jobId, payload);
      setJob(updated);
      syncFormFromJob(updated);
      setFeedback(t("jobOffers.detail.feedback.changesSaved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobOffers.detail.errors.save"));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!job || jobId == null) return;
    const nextStatus = job.status === "PUBLISHED" ? "CLOSED" : "PUBLISHED";
    setToggling(true);
    setError("");
    setFeedback("");
    try {
      const updated = await jobOffersApi.toggleJobStatus(jobId, nextStatus);
      setJob(updated);
      setFeedback(t("jobOffers.detail.feedback.statusSet", { status: localizeStatus(updated.status, t) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobOffers.detail.errors.updateStatus"));
    } finally {
      setToggling(false);
    }
  };

  const deleteJob = async () => {
    if (jobId == null) return;
    setDeleting(true);
    setError("");
    setFeedback("");
    try {
      await jobOffersApi.deleteJobOffer(jobId);
      navigate(jobsPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("jobOffers.detail.errors.delete"));
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (column: "score" | "date" | "name" | "status") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };
  const showApplicantsLoadingOverlay = applicantsLoading && applicants.length > 0;

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 md:p-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex items-center justify-center md:p-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-gray-50 p-4 md:p-6">
        <div className="max-w-[1200px] mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-6 text-red-700">
          {error || t("jobOffers.detail.notFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="w-full flex justify-start">
          <button
            type="button"
            onClick={() => navigate(jobsPath)}
            className="text-sm font-medium text-gray-600 hover:text-[#ED1C24] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> {t("common.actions.backToJobOffers")}
          </button>
        </div>

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold md:text-3xl">{job.title}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-md border ${jobStatusClass(job.status)}`}
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {localizeStatus(job.status, t)}
              </span>
            </div>

            <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
              <Button variant="outline" onClick={() => void toggleStatus()} disabled={toggling || deleting}>
                {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : t("jobOffers.detail.toggleStatus")}
              </Button>
              <button
                type="button"
                onClick={() => void deleteJob()}
                disabled={deleting || toggling}
                className="text-sm font-medium text-[#ED1C24] hover:text-[#c81820] disabled:opacity-50"
              >
                {deleting ? t("jobOffers.detail.deleting") : t("jobOffers.detail.deleteJob")}
              </button>
            </div>
          </div>
        </Card>

        {error && (
          <Card className="bg-white rounded-lg border border-red-200 shadow-sm p-4 text-red-700 text-sm">{error}</Card>
        )}
        {feedback && (
          <Card className="bg-white rounded-lg border border-green-200 shadow-sm p-4 text-green-700 text-sm">{feedback}</Card>
        )}

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("job-info")}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === "job-info" ? "border-[#ED1C24] text-[#ED1C24]" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("jobOffers.detail.tabs.jobInfo")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("applicants")}
                className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === "applicants" ? "border-[#ED1C24] text-[#ED1C24]" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t("jobOffers.detail.tabs.applicants")}
              </button>
            </div>
          </div>

          {activeTab === "job-info" ? (
            <div className="space-y-6 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>{t("jobOffers.detail.fields.jobTitle")}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("jobOffers.detail.fields.location")}</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("jobOffers.list.filters.locationPlaceholder")} />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("jobOffers.detail.fields.employmentType")}</Label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#ED1C24]/40"
                  >
                    <option value="">{t("jobOffers.detail.employmentTypes.select")}</option>
                    <option value="Full-Time">{t("jobOffers.detail.employmentTypes.fullTime")}</option>
                    <option value="Part-Time">{t("jobOffers.detail.employmentTypes.partTime")}</option>
                    <option value="Hybrid">{t("jobOffers.detail.employmentTypes.hybrid")}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>{t("jobOffers.detail.fields.experienceRange")}</Label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Input
                      value={minExperience}
                      onChange={(e) => setMinExperience(e.target.value)}
                      placeholder={t("jobOffers.detail.fields.minYears")}
                    />
                    <Input
                      value={maxExperience}
                      onChange={(e) => setMaxExperience(e.target.value)}
                      placeholder={t("jobOffers.detail.fields.maxYears")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t("jobOffers.detail.fields.responsibilities")}</Label>
                <Textarea
                  className="min-h-[170px]"
                  value={responsibilitiesText}
                  onChange={(e) => setResponsibilitiesText(e.target.value)}
                  placeholder={t("jobOffers.detail.fields.responsibilitiesPlaceholder")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label>{t("jobOffers.detail.fields.requiredSkills")}</Label>
                  <Input
                    value={requiredSkillInput}
                    onChange={(e) => setRequiredSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(requiredSkillInput, requiredSkills, setRequiredSkills, setRequiredSkillInput);
                      }
                    }}
                    placeholder={t("jobOffers.detail.fields.skillPlaceholder")}
                  />
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill, index) => (
                      <span key={`required-${skill}-${index}`} className="inline-flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(requiredSkills, setRequiredSkills, index)}
                          className="text-red-700 hover:text-red-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("jobOffers.detail.fields.preferredSkills")}</Label>
                  <Input
                    value={preferredSkillInput}
                    onChange={(e) => setPreferredSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill(preferredSkillInput, preferredSkills, setPreferredSkills, setPreferredSkillInput);
                      }
                    }}
                    placeholder={t("jobOffers.detail.fields.skillPlaceholder")}
                  />
                  <div className="flex flex-wrap gap-2">
                    {preferredSkills.map((skill, index) => (
                      <span key={`preferred-${skill}-${index}`} className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full text-xs">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(preferredSkills, setPreferredSkills, index)}
                          className="text-gray-700 hover:text-gray-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-stretch md:justify-end">
                <Button
                  onClick={() => void saveChanges()}
                  disabled={saving || toggling || deleting}
                  className="bg-[#ED1C24] hover:bg-[#c81820] text-white"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("jobOffers.detail.saveChanges")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 md:p-6">
              <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700">
                  {t("jobOffers.detail.applicants.totalApplicants", { count: applicants.length })}
                </p>
              </div>

              <div className="relative rounded-lg border border-gray-200">
                <div className="w-full overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded px-2 py-1 -ml-2 inline-flex items-center ${
                            sortBy === "name" ? "text-blue-600 font-semibold" : ""
                          }`}
                        >
                          {t("jobOffers.detail.applicants.candidateName")}
                          {sortBy === "name" && (
                            sortDirection === "desc" ? <ChevronDown className="w-4 h-4 ml-1 inline" /> : <ChevronUp className="w-4 h-4 ml-1 inline" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort("score")}
                          className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded px-2 py-1 -ml-2 inline-flex items-center ${
                            sortBy === "score" ? "text-blue-600 font-semibold" : ""
                          }`}
                        >
                          {t("jobOffers.detail.applicants.matchScore")}
                          {sortBy === "score" && (
                            sortDirection === "desc" ? <ChevronDown className="w-4 h-4 ml-1 inline" /> : <ChevronUp className="w-4 h-4 ml-1 inline" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort("date")}
                          className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded px-2 py-1 -ml-2 inline-flex items-center ${
                            sortBy === "date" ? "text-blue-600 font-semibold" : ""
                          }`}
                        >
                          {t("jobOffers.detail.applicants.applicationDate")}
                          {sortBy === "date" && (
                            sortDirection === "desc" ? <ChevronDown className="w-4 h-4 ml-1 inline" /> : <ChevronUp className="w-4 h-4 ml-1 inline" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          onClick={() => handleSort("status")}
                          className={`hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer rounded px-2 py-1 -ml-2 inline-flex items-center ${
                            sortBy === "status" ? "text-blue-600 font-semibold" : ""
                          }`}
                        >
                          {t("jobOffers.detail.applicants.status")}
                          {sortBy === "status" && (
                            sortDirection === "desc" ? <ChevronDown className="w-4 h-4 ml-1 inline" /> : <ChevronUp className="w-4 h-4 ml-1 inline" />
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">{t("jobOffers.detail.applicants.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicantsLoading && applicants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-500 inline-block" />
                        </TableCell>
                      </TableRow>
                    ) : applicants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          {t("jobOffers.detail.applicants.noApplicants")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      applicants.map((applicant, index) => (
                        <TableRow key={`${applicant.evaluationId ?? "none"}-${index}`}>
                          <TableCell style={{ fontWeight: 500 }}>{applicant.candidateName}</TableCell>
                          <TableCell>
                            <MatchScoreRing score={applicant.matchScore} naLabel={t("common.messages.na")} />
                          </TableCell>
                          <TableCell className="text-gray-600">{formatDate(applicant.applicationDate)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700" style={{ fontSize: 11, fontWeight: 600 }}>
                              {localizeStatus(applicant.status, t)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!applicant.evaluationId}
                              onClick={() => {
                                if (!applicant.evaluationId) return;
                                if (role === "ADMIN") {
                                  navigate(`/admin/jobs/${jobId}/evaluations/${applicant.evaluationId}`);
                                  return;
                                }
                                navigate(`/hr/jobs/${jobId}/evaluations/${applicant.evaluationId}`);
                              }}
                            >
                              {t("jobOffers.detail.applicants.viewEvaluation")}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  </Table>
                </div>
                {showApplicantsLoadingOverlay && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function HrJobOfferDetail() {
  return <JobOfferManagement role="HR" />;
}

export function AdminJobOfferDetail() {
  return <JobOfferManagement role="ADMIN" />;
}
