import * as React from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Briefcase,
  ClipboardList,
  FileText,
  LayoutDashboard,
  UserCheck,
} from "lucide-react";
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { AuthPage } from "./components/auth-page";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { SidebarShell, type Role } from "./components/sidebar-shell";
import { AdminDashboard, HRApprovals, SystemHealth } from "./components/admin-views";
import { CandidateEvaluationDetail } from "./components/CandidateEvaluationDetail";
import { CandidateJobDetail } from "./components/CandidateJobDetail";
import { JobBoard, MyApplications } from "./components/candidate-views";
import { AdminJobOfferDetail, HrJobOfferDetail } from "./components/HrJobOfferDetail";
import { HRDashboard, JobOfferCreate, JobOffersList } from "./components/hr-views";
import { SettingsPage } from "./components/SettingsPage";
import { useDynamicTitle } from "./hooks/useDynamicTitle";
import {
  authApi,
  clearStoredAuth,
  loadStoredAuth,
  saveStoredAuth,
  type AuthTokensDTO,
  type UserDTO,
} from "./api";

interface Session {
  role: Role;
  name: string;
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

function toRole(role: UserDTO["role"]): Role {
  if (role === "ADMIN") return "admin";
  if (role === "HR") return "hr";
  return "candidate";
}

function displayName(user: UserDTO): string {
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return full || user.username || user.email;
}

function toSession(tokens: AuthTokensDTO): Session {
  return {
    role: toRole(tokens.user.role),
    name: displayName(tokens.user),
    user: tokens.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

const defaultPathByRole: Record<Role, string> = {
  admin: "/admin/dashboard",
  hr: "/hr/dashboard",
  candidate: "/candidate/jobs",
};

const navByRole: Record<Role, { to: string; labelKey: string; icon: React.ReactNode }[]> = {
  admin: [
    { to: "/admin/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { to: "/admin/approvals", labelKey: "nav.hrApprovals", icon: <UserCheck className="w-[18px] h-[18px]" /> },
    { to: "/admin/jobs", labelKey: "nav.jobOffers", icon: <Briefcase className="w-[18px] h-[18px]" /> },
    { to: "/admin/create-job", labelKey: "nav.createJob", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { to: "/admin/health", labelKey: "nav.systemHealth", icon: <Activity className="w-[18px] h-[18px]" /> },
  ],
  hr: [
    { to: "/hr/dashboard", labelKey: "nav.dashboard", icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    { to: "/hr/jobs", labelKey: "nav.jobOffers", icon: <Briefcase className="w-[18px] h-[18px]" /> },
    { to: "/hr/create-job", labelKey: "nav.createJob", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
  ],
  candidate: [
    { to: "/candidate/jobs", labelKey: "nav.jobBoard", icon: <ClipboardList className="w-[18px] h-[18px]" /> },
    { to: "/candidate/applications", labelKey: "nav.myApplications", icon: <FileText className="w-[18px] h-[18px]" /> },
  ],
};

function initSession(): Session | null {
  const stored = loadStoredAuth();
  if (!stored) return null;
  return {
    role: toRole(stored.user.role),
    name: displayName(stored.user),
    user: stored.user,
    accessToken: stored.accessToken,
    refreshToken: stored.refreshToken,
  };
}

function parseId(value: string | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function RoleLayout({
  role,
  session,
  onLogout,
}: {
  role: Role;
  session: Session;
  onLogout: () => void;
}) {
  const { t } = useTranslation();

  if (session.role !== role) {
    return <Navigate to={defaultPathByRole[session.role]} replace />;
  }

  const translatedItems = React.useMemo(
    () =>
      navByRole[role].map((item) => ({
        to: item.to,
        label: t(item.labelKey),
        icon: item.icon,
      })),
    [role, t],
  );

  return (
    <SidebarShell
      role={role}
      fullName={session.name}
      items={translatedItems}
      onLogout={onLogout}
    >
      <Outlet />
    </SidebarShell>
  );
}

function SubmissionEvaluationRoute({ role }: { role: "admin" | "hr" }) {
  const params = useParams<{ jobId: string }>();
  const jobId = parseId(params.jobId);
  if (jobId == null) {
    return <Navigate to={`/${role}/jobs`} replace />;
  }
  return <CandidateEvaluationDetail backTo={`/${role}/jobs/${jobId}`} />;
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => initSession());
  const navigate = useNavigate();
  useDynamicTitle();

  const handleAuthenticated = (tokens: AuthTokensDTO) => {
    const nextSession = toSession(tokens);
    setSession(nextSession);
    saveStoredAuth({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
    navigate(defaultPathByRole[nextSession.role], { replace: true });
  };

  const handleLogout = async () => {
    if (!session) return;
    try {
      await authApi.logout({ refreshToken: session.refreshToken });
    } catch {
      // local logout still proceeds if backend token was already invalid
    } finally {
      clearStoredAuth();
      setSession(null);
      navigate("/login", { replace: true });
    }
  };

  return (
    <div id="app-wrapper">
      {!session ? (
        <Routes>
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/*" element={<AuthPage onAuthenticated={handleAuthenticated} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to={defaultPathByRole[session.role]} replace />} />
          <Route path="/login" element={<Navigate to={defaultPathByRole[session.role]} replace />} />
          <Route path="/forgot-password" element={<Navigate to={defaultPathByRole[session.role]} replace />} />
          <Route path="/auth/*" element={<Navigate to={defaultPathByRole[session.role]} replace />} />
          <Route path="/settings" element={<RoleLayout role={session.role} session={session} onLogout={() => void handleLogout()} />}>
            <Route index element={<SettingsPage />} />
          </Route>

          <Route path="/admin" element={<RoleLayout role="admin" session={session} onLogout={() => void handleLogout()} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="approvals" element={<HRApprovals />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="create-job" element={<JobOfferCreate backTo="/admin/jobs" />} />
            <Route path="jobs" element={<JobOffersList onSelectJobPath={(job) => `/admin/jobs/${job.id}`} />} />
            <Route path="jobs/:jobId" element={<AdminJobOfferDetail />} />
            <Route path="jobs/:jobId/evaluations/:evaluationId" element={<SubmissionEvaluationRoute role="admin" />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/hr" element={<RoleLayout role="hr" session={session} onLogout={() => void handleLogout()} />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<HRDashboard createJobPath="/hr/create-job" />} />
            <Route path="create-job" element={<JobOfferCreate backTo="/hr/dashboard" />} />
            <Route path="jobs" element={<JobOffersList onSelectJobPath={(job) => `/hr/jobs/${job.id}`} />} />
            <Route path="jobs/:jobId" element={<HrJobOfferDetail />} />
            <Route path="jobs/:jobId/evaluations/:evaluationId" element={<SubmissionEvaluationRoute role="hr" />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          <Route path="/candidate" element={<RoleLayout role="candidate" session={session} onLogout={() => void handleLogout()} />}>
            <Route index element={<Navigate to="jobs" replace />} />
            <Route path="jobs" element={<JobBoard />} />
            <Route path="jobs/:jobId" element={<CandidateJobDetail />} />
            <Route path="applications" element={<MyApplications />} />
            <Route path="*" element={<Navigate to="jobs" replace />} />
          </Route>

          <Route path="*" element={<Navigate to={defaultPathByRole[session.role]} replace />} />
        </Routes>
      )}
    </div>
  );
}
