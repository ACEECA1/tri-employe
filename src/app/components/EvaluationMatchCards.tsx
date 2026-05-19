import { Briefcase, GraduationCap } from "lucide-react";

type ExperienceAlignment = {
  yearsRequired: number | null;
  yearsCandidate: number | null;
  matchScore?: number | null;
  matchPercentage?: number | null;
} | null;

type EducationMatch = {
  requiredDegree: string | null;
  candidateDegree: string | null;
  matchStatus: string | null;
} | null;

interface EvaluationMatchCardsProps {
  experienceAlignment: ExperienceAlignment;
  educationMatch: EducationMatch;
}

function normalizeScoreOutOfTen(experience: ExperienceAlignment): number {
  if (!experience) return 0;
  const rawScore = typeof experience.matchScore === "number" ? experience.matchScore : experience.matchPercentage;
  if (rawScore == null || Number.isNaN(rawScore)) return 0;
  const scoreOutOfTen = rawScore > 10 ? rawScore / 10 : rawScore;
  return Math.max(0, Math.min(scoreOutOfTen, 10));
}

function asYears(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${value}`;
}

function asText(value: string | null | undefined): string {
  return value && value.trim() ? value : "N/A";
}

export function EvaluationMatchCards({ experienceAlignment, educationMatch }: EvaluationMatchCardsProps) {
  const scoreOutOfTen = normalizeScoreOutOfTen(experienceAlignment);
  const percentage = Math.round(scoreOutOfTen * 10);
  const progressColor =
    scoreOutOfTen >= 7 ? "bg-green-500" : scoreOutOfTen >= 4 ? "bg-yellow-500" : "bg-red-500";

  const statusText = educationMatch?.matchStatus ?? "";
  const isMismatch = /mismatch/i.test(statusText);
  const isMatch = /match/i.test(statusText) && !isMismatch;
  const badgeLabel = isMatch ? "Match" : "Mismatch";
  const badgeClass = isMatch ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Experience Alignment</h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience Match</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{percentage}%</span>
        </div>

        <div className="h-2 rounded-full w-full bg-gray-100 dark:bg-gray-700 mt-2 mb-3">
          <div className={`h-2 rounded-full ${progressColor}`} style={{ width: `${(scoreOutOfTen / 10) * 100}%` }} />
        </div>

        <p className="text-sm text-gray-500">
          Required: {asYears(experienceAlignment?.yearsRequired)} years | Candidate:{" "}
          {asYears(experienceAlignment?.yearsCandidate)} years
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Education Match</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>{badgeLabel}</span>
        </div>

        <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mt-3">
          <p>
            <span className="font-semibold">Required Degree: </span>
            {asText(educationMatch?.requiredDegree)}
          </p>
          <p>
            <span className="font-semibold">Candidate Degree: </span>
            {asText(educationMatch?.candidateDegree)}
          </p>
          <p>
            <span className="font-semibold">Reasoning: </span>
            {asText(educationMatch?.matchStatus)}
          </p>
        </div>
      </div>
    </div>
  );
}
