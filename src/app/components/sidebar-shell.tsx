import { LogOut, Menu, Settings, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { LanguageSwitcher } from "./LanguageSwitcher";
const logoUrl = new URL("../../imports/image.png", import.meta.url).href;

export type Role = "admin" | "hr" | "candidate";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface SidebarShellProps {
  role: Role;
  fullName: string;
  items: NavItem[];
  onLogout: () => void;
  children: ReactNode;
}

const roleSubtitleKey: Record<Role, string> = {
  admin: "role.adminConsole",
  hr: "role.hrPortal",
  candidate: "role.candidatePortal",
};

const roleBadgeColor: Record<Role, string> = {
  admin: "bg-[#E7EFF5] text-[#0369A1]",
  hr: "bg-[#E7EFF5] text-[#0369A1]",
  candidate: "bg-[#E7EFF5] text-[#0369A1]",
};

export function SidebarShell({
  role,
  fullName,
  items,
  onLogout,
  children,
}: SidebarShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <div className="h-screen w-screen bg-muted md:flex overflow-hidden">
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className={`fixed top-1/2 left-0 z-50 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-r-md shadow-sm md:hidden ${
          isMobileOpen ? "hidden" : ""
        }`}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close sidebar overlay"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[#F0F9FF] text-[#0C4A6E] flex flex-col p-4 transition-transform duration-150 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:sticky md:top-0 md:h-screen max-h-screen overflow-y-auto`}
      >
        <div className="flex justify-end md:hidden">
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-md p-2 text-[#0C4A6E]/70 hover:bg-[#E7EFF5] hover:text-[#0369A1]"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-8">
          <div className="w-20 h-20 flex items-center justify-center mb-3 mx-auto">
            <img src={logoUrl} alt="Djezzy" className="w-full h-full object-contain" />
          </div>
          <div className="text-[#0C4A6E] text-center" style={{ fontSize: 15, fontWeight: 600, lineHeight: "20px" }}>
            {t("common.appName")}
          </div>
          <div className="text-[#0C4A6E]/70 text-center" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.6px" }}>
            {t(roleSubtitleKey[role])}
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-2">
          {items.map((item) => {
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) => `flex items-center gap-4 px-4 py-2 rounded-md text-left transition-colors ${
                  isActive ? "bg-[#E7EFF5] text-[#0369A1]" : "text-[#0C4A6E] hover:bg-[#E7EFF5] hover:text-[#0369A1]"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                <span style={{ fontSize: 14 }}>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[#E7EFF5] pt-4 space-y-3">
          <div className="px-4">
            <span
              className={`inline-block px-2.5 py-1 rounded-md ${roleBadgeColor[role]}`}
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.5px" }}
            >
              {role.toUpperCase()}
            </span>
            <p className="mt-2 text-[#0C4A6E]/70" style={{ fontSize: 13 }}>
              {fullName}
            </p>
          </div>
          <NavLink
            to="/settings"
            onClick={() => setIsMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                isActive ? "bg-[#E7EFF5] text-[#0369A1]" : "text-[#0C4A6E] hover:bg-[#E7EFF5] hover:text-[#0369A1]"
              }`
            }
            aria-label="Settings"
          >
            <Settings className="w-[18px] h-[18px]" />
            <span style={{ fontSize: 14 }}>{t("nav.settings")}</span>
          </NavLink>
          <button
            onClick={() => {
              setIsMobileOpen(false);
              onLogout();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-md w-full text-[#0C4A6E] hover:bg-[#E7EFF5] hover:text-[#0369A1]"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span style={{ fontSize: 14 }}>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-full bg-background text-foreground flex flex-col">
        <header className="flex-none border-b border-border bg-background px-4 py-3 md:px-8">
          <div className="flex items-center justify-end gap-3">
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
