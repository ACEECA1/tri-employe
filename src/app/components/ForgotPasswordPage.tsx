import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api";

type Step = "request" | "reset";

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [success, setSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleRequestCode = () => {
    setError("");
    setInfo("");
    setSuccess(false);
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(t("forgotPassword.errors.invalidEmail"));
      return;
    }

    setBusy(true);
    setEmail(trimmedEmail);
    setStep("reset");
    setInfo(t("forgotPassword.info.sent"));
    setBusy(false);

    void authApi.requestPasswordReset(trimmedEmail).catch((err) => {
      setInfo("");
      setError(err instanceof Error ? err.message : t("forgotPassword.errors.sendCodeFailed"));
      setStep("request");
    });
  };

  const handleResetPassword = async () => {
    setError("");
    setInfo("");
    setSuccess(false);
    const trimmedEmail = email.trim();
    const trimmedCode = code.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError(t("forgotPassword.errors.invalidEmail"));
      return;
    }
    if (!trimmedCode) {
      setError(t("forgotPassword.errors.codeRequired"));
      return;
    }
    if (newPassword.length < 8) {
      setError(t("forgotPassword.errors.minPassword"));
      return;
    }

    setBusy(true);
    try {
      await authApi.resetPassword(trimmedEmail, trimmedCode, newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forgotPassword.errors.resetFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-4 border border-gray-200 md:p-8">
        {step === "request" ? (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 md:text-2xl">{t("forgotPassword.requestTitle")}</h1>
            <p className="text-sm text-gray-600 mb-6">
              {t("forgotPassword.requestDescription")}
            </p>

            {info && <p className="text-sm text-green-600 mb-4">{info}</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

            <div className="space-y-2 mb-5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                {t("forgotPassword.emailAddress")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-[#ED1C24] disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleRequestCode()}
              disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#ED1C24] hover:bg-[#c81820] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("forgotPassword.sendResetCode")}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-4 text-sm text-gray-600 hover:text-gray-900"
            >
              ← {t("auth.backToSignIn")}
            </button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-gray-900 mb-2 md:text-2xl">{t("forgotPassword.resetTitle")}</h1>
            <p className="text-sm text-gray-600 mb-6">
              {t("forgotPassword.resetDescription")}
            </p>

            {info && <p className="text-sm text-green-600 mb-4">{info}</p>}
            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {success && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {t("forgotPassword.success")}
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div className="space-y-2">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                  {t("forgotPassword.verificationCode")}
                </label>
                <input
                  id="otp"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={busy || success}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-[#ED1C24] disabled:opacity-50"
                  placeholder="Enter code"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  {t("forgotPassword.newPassword")}
                </label>
                <div className="relative w-full">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={busy || success}
                    className="w-full rounded-md border border-gray-300 px-3 pr-10 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-[#ED1C24] disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showNewPassword ? t("auth.a11y.hideNewPassword") : t("auth.a11y.showNewPassword")}
                    disabled={busy || success}
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {!success ? (
              <button
                type="button"
                onClick={() => void handleResetPassword()}
                disabled={busy}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[#ED1C24] hover:bg-[#c81820] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : t("forgotPassword.resetPassword")}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full inline-flex items-center justify-center rounded-md bg-[#ED1C24] hover:bg-[#c81820] text-white px-4 py-2 text-sm font-medium"
              >
                {t("forgotPassword.returnToLogin")}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
