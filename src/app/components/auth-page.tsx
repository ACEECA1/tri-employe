import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { AlertCircle, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { authApi, type AuthTokensDTO } from "../api";
const logoUrl = new URL("../../imports/image.png", import.meta.url).href;

type AuthMode = "login" | "register-candidate" | "register-hr" | "verify";

const authPathByMode: Record<AuthMode, string> = {
  login: "/auth/login",
  "register-candidate": "/auth/register/candidate",
  "register-hr": "/auth/register/hr",
  verify: "/auth/verify",
};

function resolveMode(pathname: string): AuthMode | null {
  if (pathname === "/auth/login") return "login";
  if (pathname === "/auth/register/candidate") return "register-candidate";
  if (pathname === "/auth/register/hr") return "register-hr";
  if (pathname === "/auth/verify") return "verify";
  return null;
}

interface AuthPageProps {
  onAuthenticated: (tokens: AuthTokensDTO) => void;
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const mode = useMemo(() => resolveMode(location.pathname), [location.pathname]);
  const activeMode = mode ?? "login";
  const [otp, setOtp] = useState("");
  const [name, setName] = useState({ first: "", last: "" });
  const [username, setUsername] = useState("");
  const [identity, setIdentity] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  const activeEmail = useMemo(() => verificationEmail || email, [verificationEmail, email]);

  useEffect(() => {
    if (!mode) {
      navigate(authPathByMode.login, { replace: true });
    }
  }, [mode, navigate]);

  const clearMessages = () => {
    setError("");
    setInfo("");
  };

  const handleLogin = async () => {
    clearMessages();
    if (!identity.trim() || !password) {
      setError(t("auth.errors.loginMissingFields"));
      return;
    }
    setBusy(true);
    try {
      const tokens = await authApi.login({
        usernameOrEmail: identity.trim(),
        password,
      });
      onAuthenticated(tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errors.loginFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = () => {
    clearMessages();
    const trimmedUsername = username.trim();
    const trimmedFirstName = name.first.trim();
    const trimmedLastName = name.last.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedFirstName || !trimmedLastName || !trimmedEmail || !password) {
      setError(t("auth.errors.completeAllFields"));
      return;
    }
    if (trimmedUsername.length < 3) {
      setError(t("auth.errors.usernameMinLength"));
      return;
    }
    if (trimmedFirstName.length < 2 || trimmedLastName.length < 2) {
      setError(t("auth.errors.nameMinLength"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError(t("auth.errors.invalidEmail"));
      return;
    }
    if (password.length < 8) {
      setError(t("auth.errors.passwordMinLength"));
      return;
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)) {
      setError(t("auth.errors.passwordNeedAlphanumeric"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordsMismatch"));
      return;
    }

    const registerMode: AuthMode = activeMode === "register-hr" ? "register-hr" : "register-candidate";
    const payload = {
      username: trimmedUsername,
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      email: trimmedEmail,
      password,
    };

    setBusy(true);
    setVerificationEmail(trimmedEmail);
    setInfo(t("auth.success.verificationSent"));
    navigate(authPathByMode.verify);
    setBusy(false);

    const request = registerMode === "register-hr" ? authApi.registerHr(payload) : authApi.registerCandidate(payload);
    void request.catch((err) => {
      setInfo("");
      setError(err instanceof Error ? err.message : t("auth.errors.registrationFailed"));
      navigate(authPathByMode[registerMode]);
    });
  };

  const handleVerify = async () => {
    clearMessages();
    if (!activeEmail.trim() || otp.trim().length < 4) {
      setError(t("auth.errors.verificationInput"));
      return;
    }
    setBusy(true);
    try {
      await authApi.verify({ email: activeEmail.trim(), code: otp.trim() });
      navigate(authPathByMode.login);
      setIdentity(username || email);
      setInfo(t("auth.success.verified"));
      setOtp("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errors.verificationFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    clearMessages();
    if (!activeEmail.trim()) {
      setError(t("auth.errors.enterEmailFirst"));
      return;
    }
    setBusy(true);
    try {
      await authApi.resendVerification({ email: activeEmail.trim() });
      setInfo(t("auth.success.resent"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.errors.resendFailed"));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    clearMessages();
    navigate(authPathByMode[next]);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-8">
        <div className="flex flex-col items-center gap-3 mb-6">
          <img src={logoUrl} alt="Djezzy" className="w-20 h-20 object-contain" />
          <div className="text-lg font-semibold md:text-xl">{t("common.appName")}</div>
          <div className="text-gray-500 text-center" style={{ fontSize: 13 }}>
            {activeMode === "verify" ? t("auth.verifyEmail") : activeMode.startsWith("register") ? t("auth.createAccount") : t("auth.signInToContinue")}
          </div>
        </div>

        {info && (
          <div className="bg-green-50 border border-green-200 rounded-md p-2.5 text-green-700 mb-4" style={{ fontSize: 12 }}>
            {info}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2.5 text-red-700 flex items-start gap-2 mb-4" style={{ fontSize: 12 }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {activeMode === "login" && (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identity">{t("auth.usernameOrEmail")}</Label>
                <Input
                  id="identity"
                  placeholder="username or you@company.com"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative w-full">
                  <Input
                    id="password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showLoginPassword ? t("auth.a11y.hidePassword") : t("auth.a11y.showPassword")}
                  >
                    {showLoginPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={() => void handleLogin()} disabled={busy} className="w-full bg-[#ED1C24] hover:bg-[#c81820] text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.signIn")}
              </Button>
              <div className="text-right">
                <button
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-[#ED1C24] hover:underline"
                  disabled={busy}
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </div>

            <div className="text-center mt-5 text-gray-600" style={{ fontSize: 13 }}>
              {t("auth.noAccount")}{" "}
              <button onClick={() => switchMode("register-candidate")} className="text-[#ED1C24]" style={{ fontWeight: 600 }}>
                {t("auth.register")}
              </button>
            </div>
          </>
        )}

        {(activeMode === "register-candidate" || activeMode === "register-hr") && (
          <>
            <div className="bg-gray-100 rounded-lg p-1 flex gap-1 mb-5">
              <button
                onClick={() => switchMode("register-candidate")}
                className={`flex-1 py-2 rounded-md ${activeMode === "register-candidate" ? "bg-white shadow-sm text-[#ED1C24]" : "text-gray-600"}`}
                style={{ fontSize: 12, fontWeight: 600 }}
                disabled={busy}
              >
                {t("auth.candidate")}
              </button>
              <button
                onClick={() => switchMode("register-hr")}
                className={`flex-1 py-2 rounded-md ${activeMode === "register-hr" ? "bg-white shadow-sm text-[#ED1C24]" : "text-gray-600"}`}
                style={{ fontSize: 12, fontWeight: 600 }}
                disabled={busy}
              >
                {t("auth.hr")}
              </button>
            </div>

            {activeMode === "register-hr" && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-amber-800" style={{ fontSize: 12 }}>
                  {t("auth.hrApprovalNote")}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>{t("auth.firstName")}</Label>
                  <Input value={name.first} onChange={(e) => setName({ ...name, first: e.target.value })} disabled={busy} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("auth.lastName")}</Label>
                  <Input value={name.last} onChange={(e) => setName({ ...name, last: e.target.value })} disabled={busy} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.username")}</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.email")}</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.password")}</Label>
                <div className="relative w-full">
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={busy}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showRegisterPassword ? t("auth.a11y.hidePassword") : t("auth.a11y.showPassword")}
                  >
                    {showRegisterPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{t("auth.confirmPassword")}</Label>
                <div className="relative w-full">
                  <Input
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={busy}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showRegisterConfirmPassword ? t("auth.a11y.hideConfirmPassword") : t("auth.a11y.showConfirmPassword")}
                  >
                    {showRegisterConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button onClick={() => void handleRegister()} disabled={busy} className="w-full bg-[#ED1C24] hover:bg-[#c81820] text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.createAccountBtn")}
              </Button>
            </div>

            <div className="text-center mt-5 text-gray-600" style={{ fontSize: 13 }}>
              {t("auth.alreadyHaveAccount")}{" "}
              <button onClick={() => switchMode("login")} className="text-[#ED1C24]" style={{ fontWeight: 600 }}>
                {t("auth.signIn")}
              </button>
            </div>
          </>
        )}

        {activeMode === "verify" && (
          <div className="flex flex-col items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-green-600" />
            </div>
            <div className="text-center text-gray-600" style={{ fontSize: 13 }}>
              {t("auth.verifyCodeHint", { email: activeEmail || "your email" })}
            </div>
            <div className="w-full space-y-1.5">
              <Label>{t("auth.email")}</Label>
              <Input type="email" value={activeEmail} onChange={(e) => setVerificationEmail(e.target.value)} disabled={busy} />
            </div>
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button onClick={() => void handleVerify()} disabled={busy} className="w-full bg-[#ED1C24] hover:bg-[#c81820] text-white">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.verifyEmailBtn")}
            </Button>
            <button onClick={() => void handleResend()} disabled={busy} className="text-[#ED1C24]" style={{ fontSize: 12, fontWeight: 600 }}>
              {t("auth.resendCode")}
            </button>
            <button onClick={() => switchMode("login")} className="text-gray-500" style={{ fontSize: 12 }}>
              {t("auth.backToSignIn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
