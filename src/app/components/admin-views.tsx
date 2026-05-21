import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Activity, CheckCircle2, Circle, Loader2, Mail, RefreshCw, UserCheck, Users } from "lucide-react";
import { adminApi, formatDate, formatScoreOutOfTen, hrApi, systemApi, type ExternalServiceStatusDTO, type UserDTO } from "../api";

function MetricCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 md:p-6 ${highlight ? "border-primary border-2" : ""}`}>
      <div className="mb-3 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground" style={{ fontSize: 13 }}>
          {label}
        </span>
        <div className={`w-9 h-9 rounded-md flex items-center justify-center ${highlight ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          {icon}
        </div>
      </div>
      <div className={`text-2xl font-bold md:text-3xl ${highlight ? "text-primary" : "text-foreground"}`}>{value}</div>
    </Card>
  );
}

export function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<UserDTO[]>([]);
  const [totalCvsProcessed, setTotalCvsProcessed] = useState(0);
  const [averageScore, setAverageScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const [pendingHr, stats] = await Promise.all([adminApi.listPendingHr(), hrApi.dashboardStats()]);
        if (cancelled) return;
        setPending(pendingHr);
        setTotalCvsProcessed(stats.totalCvsProcessed);
        setAverageScore(stats.averageMatchScore);
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
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("dashboard.admin.title")}</h1>
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          {t("dashboard.admin.subtitle")}
        </p>
      </div>
      {error && (
        <Card className="p-4 border-destructive/20 bg-destructive/10 text-destructive" style={{ fontSize: 13 }}>
          {error}
        </Card>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard label={t("dashboard.admin.totalCvsProcessed")} value={String(totalCvsProcessed)} icon={<Users className="w-4 h-4" />} />
        <MetricCard label={t("dashboard.admin.averageMatchScore")} value={formatScoreOutOfTen(averageScore)} icon={<Activity className="w-4 h-4" />} />
        <MetricCard label={t("dashboard.admin.pendingHrApprovals")} value={String(pending.length)} icon={<UserCheck className="w-4 h-4" />} highlight />
      </div>
      <Card className="p-6">
        <h3 style={{ fontSize: 16, fontWeight: 600 }} className="mb-4">
          {t("dashboard.admin.recentHrAccounts")}
        </h3>
        {loading ? (
          <div className="text-muted-foreground">{t("dashboard.admin.loading")}</div>
        ) : pending.length === 0 ? (
          <div className="text-muted-foreground">{t("dashboard.admin.noPendingHrAccounts")}</div>
        ) : (
          <div className="space-y-3">
            {pending.slice(0, 5).map((user) => (
              <div key={user.id} className="flex flex-col items-start justify-between gap-1 border-b border-border pb-3 last:border-0 md:flex-row md:items-center">
                <div style={{ fontSize: 14 }}>
                  <span style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</span>{" "}
                  <span className="text-muted-foreground">({user.email})</span>
                </div>
                <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                  {formatDate(user.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

type HealthLevel = "operational" | "degraded" | "critical";

function normalizeServiceName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findServiceByAlias(
  services: ExternalServiceStatusDTO[],
  aliases: string[],
): ExternalServiceStatusDTO | null {
  return (
    services.find((service) => {
      const normalized = normalizeServiceName(service.name);
      return aliases.some((alias) => normalized.includes(alias));
    }) ?? null
  );
}

function latencyFromMessage(message: string | null, fallback: number | null): number | null {
  if (message) {
    const match = message.match(/(\d+)\s*ms/i);
    if (match) return Number.parseInt(match[1], 10);
  }
  return fallback;
}

function formatRelativeTime(
  value: string | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Math.max(Date.now() - date.getTime(), 0);
  if (diffMs < 60_000) return t("systemHealth.justNow");
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return t("systemHealth.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("systemHealth.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("systemHealth.daysAgo", { count: days });
}

function resolveHealthLevel(reachable: boolean, latencyMs: number | null): HealthLevel {
  if (!reachable) return "critical";
  if (latencyMs != null && latencyMs > 1000) return "degraded";
  return "operational";
}

function StatusBadge({
  checking,
  level,
  labels,
}: {
  checking: boolean;
  level: HealthLevel;
  labels: { checking: string; critical: string; degraded: string; operational: string };
}) {
  if (checking) {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        <Circle className="h-2.5 w-2.5 fill-current text-muted-foreground" />
        {labels.checking}
      </span>
    );
  }

  if (level === "critical") {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
        <Circle className="h-2.5 w-2.5 animate-pulse fill-current text-red-600" />
        {labels.critical}
      </span>
    );
  }

  if (level === "degraded") {
    return (
      <span className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Circle className="h-2.5 w-2.5 fill-current text-amber-500" />
        {labels.degraded}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
      <Circle className="h-2.5 w-2.5 fill-current text-green-600" />
      {labels.operational}
    </span>
  );
}

export function SystemHealth() {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("");
  const [services, setServices] = useState<ExternalServiceStatusDTO[]>([]);
  const [timestamp, setTimestamp] = useState<string>(new Date().toISOString());
  const [requestLatencyMs, setRequestLatencyMs] = useState<number | null>(null);

  const loadHealth = useCallback(async () => {
    const startedAt = performance.now();
    setChecking(true);
    setError("");
    try {
      const data = await systemApi.health();
      const elapsed = Math.round(performance.now() - startedAt);
      setApiStatus(data.apiStatus ?? "");
      setServices(data.externalServices ?? []);
      setTimestamp(data.timestamp || new Date().toISOString());
      setRequestLatencyMs(elapsed);
    } catch (err) {
      setApiStatus("DOWN");
      setServices([]);
      setTimestamp(new Date().toISOString());
      setRequestLatencyMs(null);
      setError(err instanceof Error ? err.message : t("systemHealth.errors.load"));
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const ocrService = findServiceByAlias(services, ["ocrservice", "ocr", "pdf"]);
  const aiService = findServiceByAlias(services, ["aiengine", "n8n", "evaluation", "llm"]);
  const databaseService = findServiceByAlias(services, ["database", "postgres", "postgresql", "mysql", "db"]);
  const mainApiReachable = apiStatus.toUpperCase() === "UP" && !error;

  const cards = [
    {
      name: t("systemHealth.services.mainApi"),
      latencyMs: requestLatencyMs,
      reachable: mainApiReachable,
      lastChecked: timestamp,
    },
    {
      name: t("systemHealth.services.database"),
      latencyMs: latencyFromMessage(databaseService?.message ?? null, requestLatencyMs),
      reachable: databaseService ? databaseService.reachable : mainApiReachable,
      lastChecked: timestamp,
    },
    {
      name: t("systemHealth.services.ocrService"),
      latencyMs: latencyFromMessage(ocrService?.message ?? null, requestLatencyMs),
      reachable: ocrService?.reachable ?? false,
      lastChecked: timestamp,
    },
    {
      name: t("systemHealth.services.aiEngine"),
      latencyMs: latencyFromMessage(aiService?.message ?? null, requestLatencyMs),
      reachable: aiService?.reachable ?? false,
      lastChecked: timestamp,
    },
  ];

  return (
    <div className="max-w-[1200px] space-y-6 bg-background">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{t("systemHealth.title")}</h1>
          <p className="text-muted-foreground" style={{ fontSize: 14 }}>
            {t("systemHealth.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => void loadHealth()}
          disabled={checking}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
          {checking ? t("systemHealth.checking") : t("common.actions.refresh")}
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-destructive" style={{ fontSize: 13 }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((service) => {
          const level = resolveHealthLevel(service.reachable, service.latencyMs);
          return (
            <div key={service.name} className="rounded-md border border-border bg-background p-4 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col items-start gap-3 md:flex-row md:items-start md:justify-between">
                <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
                <StatusBadge
                  checking={checking}
                  level={level}
                  labels={{
                    checking: t("systemHealth.checking"),
                    critical: t("systemHealth.critical"),
                    degraded: t("systemHealth.degraded"),
                    operational: t("systemHealth.operational"),
                  }}
                />
              </div>
              <div className="space-y-3">
                <div className="flex flex-col items-start justify-between gap-1 text-sm md:flex-row md:items-center">
                  <span className="text-muted-foreground">{t("systemHealth.latency")}</span>
                  <span className="font-semibold text-foreground">
                    {checking ? t("systemHealth.checking") : service.latencyMs != null ? `${service.latencyMs}ms` : "—"}
                  </span>
                </div>
                <div className="flex flex-col items-start justify-between gap-1 text-sm md:flex-row md:items-center">
                  <span className="text-muted-foreground">{t("systemHealth.lastChecked")}</span>
                  <span className="font-semibold text-foreground">{formatRelativeTime(service.lastChecked, t)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function HRApprovals() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<UserDTO[]>([]);

  const loadPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminApi.listPendingHr();
      setPending(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.hrApprovals.errors.loadPending"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const approve = async (userId: number) => {
    setBusyId(userId);
    setError("");
    try {
      await adminApi.approveHr(userId);
      setPending((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.hrApprovals.errors.approveFailed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t("admin.hrApprovals.title")}</h1>
        <p className="text-muted-foreground" style={{ fontSize: 14 }}>
          {t("admin.hrApprovals.subtitle")}
        </p>
      </div>

      {error && (
        <Card className="p-4 border-destructive/20 bg-destructive/10 text-destructive" style={{ fontSize: 13 }}>
          {error}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-4 border-primary border-2 md:p-6">
          <div className="mb-3 flex flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-muted-foreground" style={{ fontSize: 13 }}>{t("admin.hrApprovals.pendingApprovals")}</span>
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-primary md:text-3xl">{pending.length}</div>
        </Card>
      </div>

      {loading ? (
        <Card className="p-6 text-muted-foreground">{t("admin.hrApprovals.loading")}</Card>
      ) : pending.length === 0 ? (
        <Card className="p-6 text-center md:p-12">
          <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 600 }}>{t("admin.hrApprovals.allCaughtUp")}</h3>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 14 }}>
            {t("admin.hrApprovals.noPending")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pending.map((user) => {
            const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
            return (
              <Card key={user.id} className="p-4 flex flex-col items-start gap-4 md:p-6 md:flex-row md:items-center md:gap-6">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0" style={{ fontSize: 16, fontWeight: 700 }}>
                  {initials || "HR"}
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{user.firstName} {user.lastName}</h3>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700" style={{ fontSize: 11, fontWeight: 600 }}>
                      {user.hrApprovalStatus}
                    </span>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-muted-foreground sm:flex-row sm:items-center sm:gap-5" style={{ fontSize: 13 }}>
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                    <span>{t("admin.hrApprovals.registeredOn", { date: formatDate(user.createdAt) })}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => void approve(user.id)}
                    disabled={busyId === user.id}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {busyId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : t("admin.hrApprovals.approve")}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
