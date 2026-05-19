import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { loadStoredAuth, saveStoredAuth, type UpdateUserDTO, userApi } from "../api";

const inputClassName =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#ED1C24] focus:border-[#ED1C24]";

export function SettingsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const user = await userApi.getCurrentUser();
        setFirstName(user.firstName ?? "");
        setLastName(user.lastName ?? "");
        setEmail(user.email ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : t("settings.errors.loadProfile"));
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setError(t("settings.errors.requiredNames"));
      return;
    }

    const hasPasswordChangeInput = Boolean(currentPassword || newPassword || confirmNewPassword);
    if (hasPasswordChangeInput) {
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setError(t("settings.errors.completePasswordFields"));
        return;
      }
      if (newPassword.length < 8) {
        setError(t("settings.errors.passwordMinLength"));
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError(t("settings.errors.passwordMismatch"));
        return;
      }
    }

    const payload: UpdateUserDTO = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };

    if (hasPasswordChangeInput) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    setSaving(true);
    try {
      const updatedUser = await userApi.updateUserProfile(payload);
      setFirstName(updatedUser?.firstName ?? payload.firstName);
      setLastName(updatedUser?.lastName ?? payload.lastName);
      setEmail(updatedUser?.email ?? payload.email ?? email);

      const stored = loadStoredAuth();
      if (stored?.accessToken && stored.refreshToken && stored.user) {
        saveStoredAuth({
          ...stored,
          user: {
            ...stored.user,
            firstName: updatedUser?.firstName ?? payload.firstName,
            lastName: updatedUser?.lastName ?? payload.lastName,
            email: updatedUser?.email ?? payload.email ?? email,
          },
        });
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSuccessMessage(t("settings.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.errors.updateProfile"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="-m-4 p-4 min-h-[calc(100vh-4rem)] bg-gray-50 md:-m-8 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-xl font-semibold text-gray-900 md:text-2xl">{t("settings.title")}</h1>
          <p className="mt-1 text-sm text-gray-600">{t("settings.subtitle")}</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">{t("settings.loading")}</span>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSave(event)} className="space-y-6 md:space-y-8">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {successMessage && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {successMessage}
              </div>
            )}

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("settings.personalInfo")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="settings-first-name">
                    {t("settings.firstName")}
                  </label>
                  <input
                    id="settings-first-name"
                    className={inputClassName}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={saving}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="settings-last-name">
                    {t("settings.lastName")}
                  </label>
                  <input
                    id="settings-last-name"
                    className={inputClassName}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <label className="block text-sm font-medium text-gray-700" htmlFor="settings-email">
                  {t("settings.emailAddress")}
                </label>
                <input
                  id="settings-email"
                  type="email"
                  className={`${inputClassName} bg-gray-50 text-gray-600`}
                  value={email}
                  readOnly
                  disabled
                />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-medium text-gray-900 mb-4">{t("settings.changePassword")}</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="settings-current-password">
                    {t("settings.currentPassword")}
                  </label>
                  <div className="relative w-full">
                    <input
                      id="settings-current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      className={`${inputClassName} pr-10`}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={showCurrentPassword ? t("auth.a11y.hideCurrentPassword") : t("auth.a11y.showCurrentPassword")}
                      disabled={saving}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="settings-new-password">
                    {t("settings.newPassword")}
                  </label>
                  <div className="relative w-full">
                    <input
                      id="settings-new-password"
                      type={showNewPassword ? "text" : "password"}
                      className={`${inputClassName} pr-10`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={showNewPassword ? t("auth.a11y.hideNewPassword") : t("auth.a11y.showNewPassword")}
                      disabled={saving}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700" htmlFor="settings-confirm-new-password">
                    {t("settings.confirmNewPassword")}
                  </label>
                  <div className="relative w-full">
                    <input
                      id="settings-confirm-new-password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      className={`${inputClassName} pr-10`}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      disabled={saving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label={showConfirmNewPassword ? t("auth.a11y.hideConfirmPassword") : t("auth.a11y.showConfirmPassword")}
                      disabled={saving}
                    >
                      {showConfirmNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#ED1C24] hover:bg-[#c81820] text-white px-5 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {t("settings.saveChanges")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
