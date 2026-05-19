export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface NestedPageMeta {
  totalPages: number;
  totalElements: number;
  number?: number;
  size?: number;
}

export interface NestedPageResponse<T> {
  content: T[];
  page?: NestedPageMeta;
}

export interface UserDTO {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "CANDIDATE" | "HR" | "ADMIN";
  isEnabled: boolean;
  hrApprovalStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserDTO {
  firstName: string;
  lastName: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
  user: UserDTO;
}

export interface ExperienceRangeDTO {
  minYears: string | null;
  maxYears: string | null;
}

export interface StructuredJdDTO {
  id: number;
  title: string;
  companyName: string | null;
  description?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRange: ExperienceRangeDTO | null;
  responsibilities: string[];
  qualifications: string[];
  workLocation: string | null;
  employmentType: string | null;
}

export interface JobOfferDTO {
  id: number;
  title: string;
  rawText: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "FAILED";
  jdRequestId: string | null;
  structuredJd: StructuredJdDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobOfferDetailDTO {
  id: number;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "FAILED";
  createdAt: string;
  structuredJd: StructuredJdDTO | null;
}

export interface ApplicantSummaryDTO {
  evaluationId: number | null;
  candidateName: string;
  matchScore: number | null;
  status: string;
  applicationDate: string;
}

export interface UpdateJobOfferPayloadDTO {
  title: string;
  structuredJd: {
    workLocation: string | null;
    employmentType: string | null;
    experienceRange: ExperienceRangeDTO | null;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
  };
}

export interface UploadCvResponseDTO {
  cvId: number;
  evaluationId: number;
  cvStatus: "UPLOADED" | "OCR_DONE" | "SENT_FOR_EVALUATION" | "EVALUATED" | "FAILED";
  evaluationStatus: "WAITING" | "SCORED" | "FAILED";
  uploadDate: string;
}

export interface ApplyForJobResponseDTO {
  cvId: number;
  evaluationStatus: "WAITING" | "SCORED" | "FAILED";
}

export interface CandidateEvaluationDTO {
  id: number;
  status: "WAITING" | "SCORED" | "FAILED";
  overallScore: number | null;
  recommendation: string | null;
  reasoning: string | null;
  matchedSkills: string[];
  missingSkills: Array<{
    skillName: string;
    importance: string;
  }>;
  experienceAlignment: {
    yearsRequired: number | null;
    yearsCandidate: number | null;
    matchPercentage: number | null;
  } | null;
  educationMatch: {
    requiredDegree: string | null;
    candidateDegree: string | null;
    matchStatus: string | null;
  } | null;
}

export interface HrEvaluationDetailDTO extends CandidateEvaluationDTO {
  cvId: number | null;
  cvUploadDate: string | null;
  candidateId: number | null;
  candidateFullName: string | null;
  jobOfferId: number | null;
  jobOfferTitle: string | null;
  technicalQuestions: Array<{
    question: string | null;
    expectedAnswer: string | null;
    difficulty: string | null;
    skillArea: string | null;
    bluffIndicator: boolean | null;
    followUpQuestions: string[];
  }>;
  hrQuestions: Array<{
    question: string | null;
    psychologicalIntent: string | null;
    idealResponseIndicators: string[];
    redFlags: string[];
    followUpProbes: string[];
    evaluationCriteria: string | null;
  }>;
  profileData?: {
    personalInfo?: {
      email?: string | null;
      phone?: string | null;
      location?: string | null;
      linkedin?: string | null;
    } | null;
    experience?: Array<{
      title?: string | null;
      company?: string | null;
      duration?: string | null;
      description?: string | null;
    }> | null;
    education?: Array<{
      degree?: string | null;
      institution?: string | null;
      year?: string | null;
    }> | null;
    languages?: string[] | null;
    skills?: string[] | null;
  } | null;
}

export interface CandidateSubmissionDTO {
  cvId: number;
  fileUrl: string | null;
  rawText: string | null;
  cvStatus: "UPLOADED" | "OCR_DONE" | "SENT_FOR_EVALUATION" | "EVALUATED" | "FAILED";
  uploadDate: string;
  jobOffer: JobOfferDTO;
  evaluation: CandidateEvaluationDTO | null;
}

export interface DashboardStatsDTO {
  totalCvsProcessed: number;
  averageMatchScore: number;
  pendingHrApprovals: number;
}

export interface HrEvaluationSummaryDTO {
  evaluationId: number;
  status: "WAITING" | "SCORED" | "FAILED";
  overallScore: number | null;
  cvId: number | null;
  cvUploadDate: string | null;
  candidateId: number | null;
  candidateFullName: string | null;
  jobOfferId: number | null;
  jobOfferTitle: string | null;
}

export interface ExternalServiceStatusDTO {
  name: string;
  url: string | null;
  reachable: boolean;
  statusCode: number | null;
  message: string | null;
}

export interface SystemHealthDTO {
  apiStatus: string;
  timestamp: string;
  externalServices: ExternalServiceStatusDTO[];
}

export interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

const STORAGE_KEY = "talent-portal-auth";
const ENV_API_BASE_URL = (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL;
const DEFAULT_API_BASE_URL = (() => {
  if (typeof window === "undefined") return "http://localhost:8080";
  return `${window.location.protocol}//${window.location.hostname}:8080`;
})();
const API_BASE_URL = (ENV_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, "");
let accessToken: string | null = null;

export function formatScoreOutOfTen(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return "N/A";
  const rounded = Math.round(score * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}/10`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function parseMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const message = "message" in payload ? (payload as { message?: unknown }).message : null;
  const data = "data" in payload ? (payload as { data?: unknown }).data : null;

  if (typeof message === "string" && message.trim()) {
    if (message === "Validation failed" && data && typeof data === "object") {
      const entries = Object.entries(data as Record<string, unknown>)
        .filter(([, value]) => typeof value === "string" && value.trim())
        .map(([field, value]) => `${field}: ${value as string}`);
      if (entries.length > 0) return entries.join(" | ");
    }
    return message;
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return fallback;
}

function parseFileName(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? null;
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function setAccessToken(token: string | null) {
  accessToken = token;
}

export function loadStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed?.accessToken || !parsed?.refreshToken || !parsed?.user) return null;
    setAccessToken(parsed.accessToken);
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAuth(value: StoredAuth) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
  setAccessToken(value.accessToken);
}

export function clearStoredAuth() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  setAccessToken(null);
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  const auth = options.auth ?? true;
  const headers = new Headers(init.headers ?? {});
  if (auth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!(init.body instanceof FormData) && init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  let response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (
    (response.status === 401 || response.status === 403)
    && path !== "/api/auth/refresh"
    && path !== "/api/auth/login"
  ) {
    const stored = loadStoredAuth();
    if (stored?.refreshToken) {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
      });

      let refreshSucceeded = false;
      if (refreshResponse.ok) {
        const refreshText = await refreshResponse.text();
        let refreshPayload: unknown = null;
        if (refreshText) {
          try {
            refreshPayload = JSON.parse(refreshText) as unknown;
          } catch {
            refreshPayload = null;
          }
        }
        if (refreshPayload && typeof refreshPayload === "object" && "success" in refreshPayload && "data" in refreshPayload) {
          const envelope = refreshPayload as ApiResponseEnvelope<AuthTokensDTO>;
          if (envelope.success && envelope.data) {
            saveStoredAuth(envelope.data);
            headers.set("Authorization", `Bearer ${envelope.data.accessToken}`);
            refreshSucceeded = true;
          }
        }
      }

      if (refreshSucceeded) {
        response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
      } else {
        clearStoredAuth();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    } else {
      clearStoredAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }
  const message = parseMessage(payload, `Request failed (${response.status})`);
  if (!response.ok) throw new Error(message);

  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    const envelope = payload as ApiResponseEnvelope<T>;
    if (!envelope.success) throw new Error(envelope.message || "Request failed");
    return envelope.data;
  }

  return payload as T;
}

async function downloadWithAuth(path: string, fallbackFileName: string): Promise<void> {
  const headers = new Headers();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { method: "GET", headers });
  if (!response.ok) {
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
    const message = parseMessage(payload, `Download failed (${response.status})`);
    throw new Error(message);
  }

  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get("Content-Disposition")) ?? fallbackFileName;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const authApi = {
  registerCandidate: (payload: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) =>
    requestJson<UserDTO>(
      "/api/auth/register/candidate",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  registerHr: (payload: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) =>
    requestJson<UserDTO>(
      "/api/auth/register/hr",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  verify: (payload: { email: string; code: string }) =>
    requestJson<void>(
      "/api/auth/verify",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  resendVerification: (payload: { email: string }) =>
    requestJson<void>(
      "/api/auth/resend-verification",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  requestPasswordReset: (email: string) =>
    requestJson<void>(
      "/api/auth/forgot-password",
      { method: "POST", body: JSON.stringify({ email }) },
      { auth: false },
    ),
  resetPassword: (email: string, code: string, newPassword: string) =>
    requestJson<void>(
      "/api/auth/reset-password",
      { method: "POST", body: JSON.stringify({ email, code, newPassword }) },
      { auth: false },
    ),
  login: (payload: { usernameOrEmail: string; password: string }) =>
    requestJson<AuthTokensDTO>(
      "/api/auth/login",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  refresh: (payload: { refreshToken: string }) =>
    requestJson<AuthTokensDTO>(
      "/api/auth/refresh",
      { method: "POST", body: JSON.stringify(payload) },
      { auth: false },
    ),
  logout: (payload: { refreshToken: string }) => requestJson<void>("/api/auth/logout", { method: "POST", body: JSON.stringify(payload) }),
};

export const userApi = {
  getCurrentUser: () => requestJson<UserDTO>("/api/users/me"),
  updateUserProfile: (data: UpdateUserDTO) =>
    requestJson<UserDTO>("/api/users/me", { method: "PUT", body: JSON.stringify(data) }),
};

export const candidateApi = {
  getCandidateJobs: (params: {
    page: number;
    size: number;
    title?: string;
    location?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) =>
    requestJson<NestedPageResponse<JobOfferDTO>>(
      `/api/candidate/job-offers${buildQuery({
        page: params.page,
        size: params.size,
        title: params.title,
        location: params.location,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      })}`,
    ),
  listJobOffers: (params: {
    page: number;
    size: number;
    title?: string;
    location?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) =>
    requestJson<NestedPageResponse<JobOfferDTO>>(
      `/api/candidate/job-offers${buildQuery({
        page: params.page,
        size: params.size,
        title: params.title,
        location: params.location,
        sortBy: params.sortBy,
        sortDir: params.sortDir,
      })}`,
    ),
  getCandidateJobOffer: (jobId: string) =>
    requestJson<JobOfferDetailDTO>(`/api/job-offers/public/${jobId}`, {}, { auth: false }),
  applyForJob: (jobId: string, cvFile: File) => {
    const formData = new FormData();
    formData.append("file", cvFile);
    return requestJson<ApplyForJobResponseDTO>(`/api/candidate/job-offers/${jobId}/cv`, {
      method: "POST",
      body: formData,
    });
  },
  uploadCv: (jobOfferId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestJson<UploadCvResponseDTO>(`/api/candidate/job-offers/${jobOfferId}/cv`, {
      method: "POST",
      body: formData,
    });
  },
  listSubmissions: () => requestJson<CandidateSubmissionDTO[]>("/api/candidate/submissions"),
  retryEvaluation: (evaluationId: number) =>
    requestJson<CandidateEvaluationDTO>(`/api/candidate/submissions/${evaluationId}/retry`, { method: "POST" }),
  downloadMyCv: (jobOfferId: number) => downloadWithAuth(`/api/candidate/submissions/${jobOfferId}/cv/download`, `submission-${jobOfferId}.pdf`),
  withdrawSubmission: (jobOfferId: number) => requestJson<void>(`/api/candidate/submissions/${jobOfferId}/cv`, { method: "DELETE" }),
};

export const hrApi = {
  dashboardStats: () => requestJson<DashboardStatsDTO>("/api/hr/dashboard/stats"),
  listJobOffers: (params: {
    page: number;
    size: number;
    title?: string;
    location?: string;
    isPublished?: boolean;
    sortBy?: "newest" | "applicants" | "highestScore";
    direction?: "asc" | "desc";
  }) =>
    requestJson<NestedPageResponse<JobOfferDTO>>(
      `/api/hr/job-offers${buildQuery({
        page: params.page,
        size: params.size,
        title: params.title,
        location: params.location,
        isPublished: params.isPublished,
        sortBy: params.sortBy,
        direction: params.direction,
      })}`,
    ),
  deleteJobOffer: (jobOfferId: number) =>
    requestJson<void>(`/api/hr/job-offers/${jobOfferId}`, { method: "DELETE" }),
  createJobOffer: (payload: { title: string; rawText: string }) =>
    requestJson<JobOfferDTO>("/api/hr/job-offers", { method: "POST", body: JSON.stringify(payload) }),
  listEvaluations: (params: {
    page: number;
    size: number;
    jobId?: number;
    minScore?: number;
    sortBy?: "score" | "date";
    direction?: "asc" | "desc";
  }) =>
    requestJson<PageResponse<HrEvaluationSummaryDTO>>(
      `/api/hr/evaluations${buildQuery({
        page: params.page,
        size: params.size,
        jobId: params.jobId,
        minScore: params.minScore,
        sortBy: params.sortBy ?? "score",
        direction: params.direction ?? "desc",
      })}`,
    ),
  getEvaluationById: (evaluationId: number) =>
    requestJson<HrEvaluationDetailDTO>(`/api/hr/evaluations/${evaluationId}`),
  downloadEvaluationCv: (evaluationId: number) =>
    downloadWithAuth(`/api/hr/evaluations/${evaluationId}/cv/download`, `evaluation-${evaluationId}-cv.pdf`),
};

export const jobOffersApi = {
  getJobOffer: (jobId: number) =>
    requestJson<JobOfferDetailDTO>(`/api/hr/job-offers/${jobId}`),
  getJobApplicants: (
    jobId: number,
    sortBy: "score" | "date" | "name" | "status" = "score",
    direction: "asc" | "desc" = "desc",
  ) =>
    requestJson<ApplicantSummaryDTO[]>(`/api/hr/job-offers/${jobId}/applicants${buildQuery({ sortBy, direction })}`),
  updateJobOffer: (jobId: number, data: UpdateJobOfferPayloadDTO) =>
    requestJson<JobOfferDetailDTO>(`/api/hr/job-offers/${jobId}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleJobStatus: (jobId: number, status: "PUBLISHED" | "CLOSED") =>
    requestJson<JobOfferDetailDTO>(`/api/hr/job-offers/${jobId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  deleteJobOffer: (jobId: number) =>
    requestJson<void>(`/api/hr/job-offers/${jobId}`, { method: "DELETE" }),
};

export const adminApi = {
  listPendingHr: () => requestJson<UserDTO[]>("/api/admin/hr/pending"),
  approveHr: (userId: number) => requestJson<UserDTO>(`/api/admin/hr/${userId}/approve`, { method: "PUT" }),
};

export const systemApi = {
  health: () => requestJson<SystemHealthDTO>("/api/system/health", {}, { auth: false }),
};

export const api = {
  getCandidateJobs: candidateApi.getCandidateJobs,
  withdrawSubmission: candidateApi.withdrawSubmission,
};

loadStoredAuth();
