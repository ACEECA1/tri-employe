import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ApplicationModal } from "./ApplicationModal";
import { candidateApi, type JobOfferDetailDTO } from "../api";

function experienceLabel(
  job: JobOfferDetailDTO | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const min = job?.structuredJd?.experienceRange?.minYears;
  const max = job?.structuredJd?.experienceRange?.maxYears;
  if (!min && !max) return t("jobOffers.candidateDetail.experienceNotSpecified");
  if (min && max) return t("jobOffers.candidateDetail.yearsRange", { min, max });
  if (min) return t("jobOffers.candidateDetail.yearsPlus", { min });
  return t("jobOffers.candidateDetail.upToYears", { max });
}

export function CandidateJobDetail() {
  const { t } = useTranslation();
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<JobOfferDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setError(t("jobOffers.candidateDetail.errors.missingId"));
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await candidateApi.getCandidateJobOffer(jobId);
        if (!cancelled) setJob(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("jobOffers.candidateDetail.errors.load"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const description = useMemo(() => {
    const explicitDescription = job?.structuredJd?.description?.trim();
    if (explicitDescription) return explicitDescription;
    const rows = job?.structuredJd?.responsibilities ?? [];
    if (rows.length === 0) return t("jobOffers.candidateDetail.noDescription");
    return rows.join("\n");
  }, [job?.structuredJd?.description, job?.structuredJd?.responsibilities, t]);

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-full p-4 md:p-6">
        <div className="max-w-[1100px] mx-auto bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center shadow-sm md:p-10">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-gray-50 min-h-full p-4 md:p-6">
        <div className="max-w-[1100px] mx-auto bg-white rounded-lg border border-red-200 p-6 text-red-700 shadow-sm">
          {error || t("jobOffers.candidateDetail.jobNotFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full p-4 md:p-6">
      <div className="max-w-[1100px] mx-auto space-y-6">
        <button type="button" onClick={() => navigate("/candidate/jobs")} className="text-sm text-gray-600 hover:text-gray-900">
          ← {t("common.actions.backToJobBoard")}
        </button>

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">{job.title}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {job.structuredJd?.workLocation || t("jobOffers.candidateDetail.locationNotSpecified")}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {job.structuredJd?.employmentType || t("jobOffers.candidateDetail.employmentTypeNotSpecified")}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                  {experienceLabel(job, t)}
                </span>
              </div>
            </div>

            <Button onClick={() => setIsModalOpen(true)} className="bg-[#ED1C24] hover:bg-[#c81820] text-white">
              {t("common.actions.applyNow")}
            </Button>
          </div>
        </Card>

        {error && (
          <Card className="bg-white rounded-lg border border-red-200 shadow-sm p-4 text-red-700 text-sm">
            {error}
          </Card>
        )}

        <Card className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t("jobOffers.candidateDetail.jobDescription")}</h2>
          <p className="text-gray-700 text-sm leading-7 whitespace-pre-line">{description}</p>
        </Card>
      </div>

      <ApplicationModal jobId={jobId ?? null} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
