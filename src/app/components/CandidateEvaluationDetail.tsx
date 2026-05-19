import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  Download,
  Link as LinkIcon,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { EvaluationMatchCards } from "./EvaluationMatchCards";
import { formatDate, hrApi, type HrEvaluationDetailDTO } from "../api";

type ActiveTab = "overview" | "interview-guides" | "parsed-profile";

interface CandidateEvaluationDetailProps {
  backTo?: string;
  evaluationId?: number | string;
  candidateName?: string | null;
  jobTitle?: string | null;
  cvId?: number | null;
  uploadDate?: string | null;
}

interface ParsedProfileData {
  personalInfo?: {
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
  };
  experience?: Array<{
    title?: string | null;
    company?: string | null;
    duration?: string | null;
    description?: string | null;
  }>;
  education?: Array<{
    degree?: string | null;
    institution?: string | null;
    year?: string | null;
  }>;
  languages?: string[];
  skills?: string[];
}

function valueOrDash(value: string | null | undefined): string {
  return value && value.trim() ? value : "-";
}

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object" && "language" in item && typeof item.language === "string") {
        const language = item.language.trim();
        const level = "level" in item && typeof item.level === "string" ? item.level.trim() : "";
        return level ? `${language} (${level})` : language;
      }
      return "";
    })
    .filter((item) => item.length > 0);
}

function normalizeProfileData(raw: unknown): ParsedProfileData | null {
  if (!raw || typeof raw !== "object") return null;
  const profile = raw as Record<string, unknown>;
  const personalInfoRaw = (profile.personalInfo ?? profile.personal_info ?? {}) as Record<string, unknown>;
  const experienceRaw = (profile.experience ?? profile.experiences ?? []) as Array<Record<string, unknown>>;
  const educationRaw = (profile.education ?? []) as Array<Record<string, unknown>>;
  const skillsRaw = profile.skills ?? [];
  const languagesRaw = profile.languages ?? [];

  const experience = Array.isArray(experienceRaw)
    ? experienceRaw.map((item) => {
        const startDate = typeof item.startDate === "string" ? item.startDate : typeof item.start_date === "string" ? item.start_date : "";
        const endDate = typeof item.endDate === "string" ? item.endDate : typeof item.end_date === "string" ? item.end_date : "";
        const derivedDuration = startDate || endDate ? `${startDate || "?"} - ${endDate || "Present"}` : undefined;
        return {
          title: typeof item.title === "string" ? item.title : null,
          company: typeof item.company === "string" ? item.company : null,
          duration: typeof item.duration === "string" ? item.duration : derivedDuration,
          description: typeof item.description === "string" ? item.description : null,
        };
      })
      .filter((item) => item.title || item.company || item.duration || item.description)
    : [];

  const education = Array.isArray(educationRaw)
    ? educationRaw
      .map((item) => ({
        degree: typeof item.degree === "string" ? item.degree : null,
        institution: typeof item.institution === "string" ? item.institution : null,
        year: typeof item.year === "string"
          ? item.year
          : typeof item.endDate === "string"
            ? item.endDate
            : typeof item.end_date === "string"
              ? item.end_date
              : null,
      }))
      .filter((item) => item.degree || item.institution || item.year)
    : [];

  return {
    personalInfo: {
      email: typeof personalInfoRaw.email === "string" ? personalInfoRaw.email : null,
      phone: typeof personalInfoRaw.phone === "string" ? personalInfoRaw.phone : null,
      location: typeof personalInfoRaw.location === "string" ? personalInfoRaw.location : null,
      linkedin: typeof personalInfoRaw.linkedin === "string" ? personalInfoRaw.linkedin : null,
    },
    experience,
    education,
    languages: normalizeStringArray(languagesRaw),
    skills: normalizeStringArray(skillsRaw),
  };
}

function toScoreOutOfTen(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  const normalized = score > 10 ? score / 10 : score;
  return Math.max(0, Math.min(normalized, 10));
}

function scoreColor(scoreOutOfTen: number | null): string {
  if (scoreOutOfTen == null) return "#6b7280";
  if (scoreOutOfTen > 8) return "#16a34a";
  if (scoreOutOfTen > 5) return "#f59e0b";
  return "#dc2626";
}

function scoreLabel(scoreOutOfTen: number | null): string {
  if (scoreOutOfTen == null) return "-";
  const rounded = Math.round(scoreOutOfTen * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
}

function statusClass(status: string | null | undefined): string {
  if (status === "SCORED") return "bg-green-50 text-green-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  if (status === "WAITING") return "bg-yellow-50 text-yellow-700";
  return "bg-gray-100 text-gray-700";
}

function localizeStatus(status: string | null | undefined, t: (key: string) => string): string {
  if (!status) return "-";
  const key = `common.status.${status.toLowerCase()}`;
  const translated = t(key);
  return translated === key ? status : translated;
}

function ScoreRing({ score }: { score: number | null }) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = score == null ? 0 : (score / 10) * 100;
  const clampedPercentage = Math.max(0, Math.min(percentage, 100));
  const dash = (clampedPercentage / 100) * circumference;
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
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
        <span className="text-2xl font-semibold" style={{ color }}>
          {scoreLabel(score)}
        </span>
        <span className="text-xs text-gray-500">/10</span>
      </div>
    </div>
  );
}

function QuestionAccordion({
  question,
  badge,
  children,
}: {
  question: string | null | undefined;
  badge?: string | null;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-4 flex items-start justify-between gap-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span className="text-sm font-medium text-gray-900 whitespace-normal text-left break-words">{question || "-"}</span>
          {badge && (
            <span className="shrink-0 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[11px] font-semibold">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown className={`mt-0.5 w-4 h-4 text-gray-500 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">{children}</div>}
    </div>
  );
}

export function CandidateEvaluationDetail({
  backTo,
  evaluationId,
  candidateName: initialCandidateName,
  jobTitle: initialJobTitle,
  cvId: initialCvId,
  uploadDate: initialUploadDate,
}: CandidateEvaluationDetailProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ evaluationId?: string; jobId?: string }>();
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [evaluation, setEvaluation] = useState<HrEvaluationDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const resolvedEvaluationId = useMemo(() => {
    const fromRoute = params.evaluationId;
    const source = fromRoute ?? (evaluationId != null ? String(evaluationId) : null);
    if (!source) return null;
    const parsed = Number(source);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.evaluationId, evaluationId]);
  const routeJobId = useMemo(() => {
    const parsed = Number(params.jobId);
    return Number.isFinite(parsed) ? parsed : null;
  }, [params.jobId]);
  const rolePrefix = useMemo(() => {
    if (location.pathname.startsWith("/admin/")) return "/admin";
    if (location.pathname.startsWith("/hr/")) return "/hr";
    return null;
  }, [location.pathname]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!resolvedEvaluationId) {
        setError(t("evaluations.detail.errors.missingId"));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await hrApi.getEvaluationById(resolvedEvaluationId);
        if (!cancelled) {
          setEvaluation(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("evaluations.detail.errors.load"));
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
  }, [resolvedEvaluationId]);

  const score = toScoreOutOfTen(evaluation?.overallScore);
  const candidateName = evaluation?.candidateFullName ?? initialCandidateName ?? "-";
  const jobTitle = evaluation?.jobOfferTitle ?? initialJobTitle ?? "-";
  const status = evaluation?.status ?? "-";
  const resolvedCvId = evaluation?.cvId ?? initialCvId ?? "-";
  const resolvedUploadDate = evaluation?.cvUploadDate ?? initialUploadDate ?? null;
  const summaryText = evaluation?.reasoning || evaluation?.recommendation || t("common.messages.noSummary");
  const technicalQuestions = evaluation?.technicalQuestions ?? [];
  const hrQuestions = evaluation?.hrQuestions ?? [];
  const profileData = useMemo(() => {
    return normalizeProfileData(evaluation?.profileData);
  }, [evaluation?.profileData]);
  const linkedInHref = useMemo(() => {
    const directLinkedin = profileData?.personalInfo?.linkedin?.trim();
    if (directLinkedin) return directLinkedin;
    const fullName = (evaluation?.candidateFullName ?? initialCandidateName ?? "").trim();
    if (!fullName || fullName === "-") return null;
    return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(fullName)}`;
  }, [profileData?.personalInfo?.linkedin, evaluation?.candidateFullName, initialCandidateName]);

  const downloadCv = async () => {
    if (!resolvedEvaluationId) return;
    setDownloading(true);
    try {
      await hrApi.downloadEvaluationCv(resolvedEvaluationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("evaluations.detail.errors.downloadCv"));
    } finally {
      setDownloading(false);
    }
  };

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
      return;
    }
    const resolvedJobOfferId = evaluation?.jobOfferId ?? routeJobId;
    if (resolvedJobOfferId != null && rolePrefix) {
      navigate(`${rolePrefix}/jobs/${resolvedJobOfferId}`);
      return;
    }
    navigate(-1);
  };

  return (
    <div className="bg-gray-50 min-h-full p-4 md:p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="w-full flex justify-start mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" /> {t("common.actions.backToJobOffer")}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm min-h-[260px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <ScoreRing score={score} />
                  <div className="space-y-2 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{candidateName}</h1>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusClass(status)}`}>{localizeStatus(status, t)}</span>
                      {linkedInHref && (
                        <a
                          href={linkedInHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#0A66C2] bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          {t("evaluations.detail.actions.linkedinSearch")}
                        </a>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                      <Briefcase className="w-4 h-4" /> {jobTitle}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => void downloadCv()}
                  disabled={downloading || !resolvedEvaluationId}
                  className="w-full bg-[#ED1C24] hover:bg-[#c81820] text-white gap-2 md:w-auto"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t("evaluations.detail.downloadCv")}
                </Button>
              </div>
            </section>

            <section className="bg-white rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center border-b border-gray-100 px-4 sm:px-6 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "overview" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {t("evaluations.detail.tabs.overview")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("interview-guides")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "interview-guides" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {t("evaluations.detail.tabs.interviewGuides")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("parsed-profile")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                    activeTab === "parsed-profile" ? "text-gray-900 border-gray-900" : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  {t("evaluations.detail.tabs.parsedProfile")}
                </button>
              </div>

              {activeTab === "overview" && (
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-6 lg:col-span-1">
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.matchedSkills")}</h3>
                        {evaluation?.matchedSkills && evaluation.matchedSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {evaluation.matchedSkills.map((skill) => (
                              <span key={skill} className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
                                {skill || "-"}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t("candidates.applications.noSkillsData")}</p>
                        )}
                      </div>

                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.missingSkills")}</h3>
                        {evaluation?.missingSkills && evaluation.missingSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {evaluation.missingSkills.map((skill, index) => (
                              <span
                                key={`${skill.skillName || "missing-skill"}-${index}`}
                                className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700"
                              >
                                {skill.skillName || "-"}
                                {skill.importance ? ` (${skill.importance})` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t("candidates.applications.noSkillsData")}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-6 lg:col-span-2">
                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">{t("evaluations.detail.sections.aiSummary")}</h3>
                        <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{summaryText}</p>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4 md:p-5">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.evaluationMetadata")}</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex flex-col items-start justify-between gap-1 border-b border-gray-100 pb-2 md:flex-row md:items-center">
                            <span className="text-gray-500">{t("evaluations.detail.sections.uploadDate")}</span>
                            <span className="font-medium text-gray-900">{resolvedUploadDate ? formatDate(resolvedUploadDate) : "-"}</span>
                          </div>
                          <div className="flex flex-col items-start justify-between gap-1 border-b border-gray-100 pb-2 md:flex-row md:items-center">
                            <span className="text-gray-500">{t("evaluations.detail.sections.cvId")}</span>
                            <span className="font-medium text-gray-900">{resolvedCvId}</span>
                          </div>
                          <div className="flex flex-col items-start justify-between gap-1 border-b border-gray-100 pb-2 md:flex-row md:items-center">
                            <span className="text-gray-500">{t("evaluations.detail.sections.evaluationId")}</span>
                            <span className="font-medium text-gray-900">{resolvedEvaluationId ?? "-"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-3">
                      <EvaluationMatchCards
                        experienceAlignment={evaluation?.experienceAlignment ?? null}
                        educationMatch={evaluation?.educationMatch ?? null}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "interview-guides" && (
                <div className="p-4 sm:p-6 space-y-6">
                  <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.technicalAssessment")}</h3>
                    {technicalQuestions.length > 0 ? (
                      <div>
                        {technicalQuestions.map((item, index) => (
                          <QuestionAccordion
                            key={`tech-${index}`}
                            question={item.question}
                            badge={item.difficulty || item.skillArea || null}
                          >
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.expectedAnswer")}</p>
                                <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
                                  {item.expectedAnswer || "-"}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.followUpQuestions")}</p>
                                {item.followUpQuestions?.length > 0 ? (
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {item.followUpQuestions.map((followUp, followUpIndex) => (
                                      <li key={`tech-${index}-follow-up-${followUpIndex}`}>{followUp || "-"}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noFollowUpQuestions")}</p>
                                )}
                              </div>

                              {item.bluffIndicator === true && (
                                <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-amber-700 text-xs font-semibold">
                                  <AlertTriangle className="w-4 h-4" />
                                  {t("evaluations.detail.sections.listenForBluffing")}
                                </div>
                              )}
                            </div>
                          </QuestionAccordion>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noTechnicalQuestions")}</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.hrBehavioralAssessment")}</h3>
                    {hrQuestions.length > 0 ? (
                      <div>
                        {hrQuestions.map((item, index) => (
                          <QuestionAccordion key={`hr-${index}`} question={item.question}>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.psychologicalIntent")}</p>
                                <p className="text-sm italic text-gray-700">{item.psychologicalIntent || "-"}</p>
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.idealResponseIndicators")}</p>
                                {item.idealResponseIndicators?.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {item.idealResponseIndicators.map((entry, entryIndex) => (
                                      <div key={`hr-${index}-ideal-${entryIndex}`} className="flex items-start gap-2 text-sm text-gray-700">
                                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                        <span>{entry || "-"}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noIdealResponseIndicators")}</p>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.redFlags")}</p>
                                {item.redFlags?.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {item.redFlags.map((entry, entryIndex) => (
                                      <div key={`hr-${index}-red-${entryIndex}`} className="flex items-start gap-2 text-sm text-gray-700">
                                        <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                                        <span>{entry || "-"}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noRedFlags")}</p>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.followUpProbes")}</p>
                                {item.followUpProbes?.length > 0 ? (
                                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {item.followUpProbes.map((probe, probeIndex) => (
                                      <li key={`hr-${index}-probe-${probeIndex}`}>{probe || "-"}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noFollowUpProbes")}</p>
                                )}
                              </div>

                              <div className="rounded-md border border-gray-200 bg-white p-3">
                                <p className="text-sm font-semibold text-gray-900 mb-1">{t("evaluations.detail.sections.evaluationCriteria")}</p>
                                <p className="text-sm text-gray-700">{item.evaluationCriteria || "-"}</p>
                              </div>
                            </div>
                          </QuestionAccordion>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t("evaluations.detail.sections.noHrQuestions")}</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "parsed-profile" && (
                <div className="p-4 sm:p-6">
                  {!profileData ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                      <p className="text-sm text-gray-600">{t("evaluations.detail.sections.parsedUnavailable")}</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.contactInfo")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{t("common.labels.email")}</p>
                              <p className="text-gray-800">{valueOrDash(profileData?.personalInfo?.email)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{t("common.labels.phone")}</p>
                              <p className="text-gray-800">{valueOrDash(profileData?.personalInfo?.phone)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{t("common.labels.location")}</p>
                              <p className="text-gray-800">{valueOrDash(profileData?.personalInfo?.location)}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <LinkIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-0.5">{t("common.labels.linkedin")}</p>
                              {profileData?.personalInfo?.linkedin ? (
                                <a
                                  href={profileData.personalInfo.linkedin}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700 break-all"
                                >
                                  {profileData.personalInfo.linkedin}
                                </a>
                              ) : (
                                <p className="text-gray-800">-</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {(profileData?.experience?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.workExperience")}</h3>
                          <div className="space-y-4">
                            {profileData?.experience?.map((item, index) => (
                              <div key={`exp-${index}`} className={`pb-4 ${index < (profileData.experience?.length ?? 0) - 1 ? "border-b border-gray-200" : ""}`}>
                                <p className="text-sm font-semibold text-gray-900">{valueOrDash(item.title)}</p>
                                <p className="text-sm text-gray-500">{`${valueOrDash(item.company)}${item.duration ? ` · ${item.duration}` : ""}`}</p>
                                <p className="text-sm text-gray-700 mt-2">{valueOrDash(item.description)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(profileData?.education?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.education")}</h3>
                          <div className="space-y-3">
                            {profileData?.education?.map((item, index) => (
                              <div key={`edu-${index}`} className="text-sm">
                                <p className="font-semibold text-gray-900">{valueOrDash(item.degree)}</p>
                                <p className="text-gray-600">{`${valueOrDash(item.institution)}${item.year ? ` · ${item.year}` : ""}`}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {((profileData?.skills?.length ?? 0) > 0 || (profileData?.languages?.length ?? 0) > 0) && (
                        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
                          <h3 className="text-base font-semibold text-gray-900 mb-4">{t("evaluations.detail.sections.skillsLanguages")}</h3>
                          {(profileData?.skills?.length ?? 0) > 0 && (
                            <div className="mb-4">
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t("evaluations.detail.sections.skills")}</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData?.skills?.map((skill, index) => (
                                  <span key={`skill-${index}`} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {(profileData?.languages?.length ?? 0) > 0 && (
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">{t("evaluations.detail.sections.languages")}</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData?.languages?.map((language, index) => (
                                  <span key={`lang-${index}`} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs">
                                    {language}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
