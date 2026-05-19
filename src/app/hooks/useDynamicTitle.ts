import { useEffect, useMemo } from "react";
import { matchPath, useLocation } from "react-router-dom";

const TITLE_SUFFIX = "Djezzy Talent";

const routeTitles: Array<{ pattern: string; title: string }> = [
  { pattern: "/auth/login", title: "Login" },
  { pattern: "/auth/register/candidate", title: "Candidate Registration" },
  { pattern: "/auth/register/hr", title: "HR Registration" },
  { pattern: "/auth/verify", title: "Email Verification" },
  { pattern: "/forgot-password", title: "Forgot Password" },
  { pattern: "/settings", title: "Settings" },

  { pattern: "/admin/dashboard", title: "Admin Dashboard" },
  { pattern: "/admin/approvals", title: "HR Approvals" },
  { pattern: "/admin/health", title: "System Health" },
  { pattern: "/admin/create-job", title: "Create Job" },
  { pattern: "/admin/jobs", title: "Job Offers" },
  { pattern: "/admin/jobs/:jobId", title: "Job Offer Detail" },
  { pattern: "/admin/jobs/:jobId/evaluations/:evaluationId", title: "Evaluation Detail" },

  { pattern: "/hr/dashboard", title: "HR Dashboard" },
  { pattern: "/hr/create-job", title: "Create Job" },
  { pattern: "/hr/jobs", title: "Job Offers" },
  { pattern: "/hr/jobs/:jobId", title: "Job Offer Detail" },
  { pattern: "/hr/jobs/:jobId/evaluations/:evaluationId", title: "Evaluation Detail" },

  { pattern: "/candidate/jobs", title: "Job Board" },
  { pattern: "/candidate/jobs/:jobId", title: "Job Detail" },
  { pattern: "/candidate/applications", title: "My Applications" },
];

function resolveTitle(pathname: string): string {
  const matched = routeTitles.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname));
  if (matched) return matched.title;
  if (pathname.startsWith("/admin")) return "Admin Portal";
  if (pathname.startsWith("/hr")) return "HR Portal";
  if (pathname.startsWith("/candidate")) return "Candidate Portal";
  return "Djezzy Talent";
}

export function useDynamicTitle() {
  const location = useLocation();
  const pageTitle = useMemo(() => resolveTitle(location.pathname), [location.pathname]);

  useEffect(() => {
    document.title = pageTitle === TITLE_SUFFIX ? TITLE_SUFFIX : `${pageTitle} - ${TITLE_SUFFIX}`;
  }, [pageTitle]);
}
