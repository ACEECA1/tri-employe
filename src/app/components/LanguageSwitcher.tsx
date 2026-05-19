import { Check, ChevronDown, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type LanguageCode = "en" | "fr";

const LANGUAGES: Array<{ code: LanguageCode; label: string }> = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage: LanguageCode = i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectLanguage = (language: LanguageCode) => {
    void i18n.changeLanguage(language);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("language.switch")}
      >
        <Globe className="h-4 w-4" />
        <span className="min-w-6 text-left uppercase">{currentLanguage}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-40 z-50 bg-white border border-gray-100 rounded-lg shadow-lg py-1 ring-1 ring-black ring-opacity-5 animate-in fade-in-0 slide-in-from-top-1 duration-150"
          role="menu"
        >
          {LANGUAGES.map((language) => {
            const isActive = currentLanguage === language.code;
            return (
              <button
                key={language.code}
                type="button"
                onClick={() => selectLanguage(language.code)}
                className={`w-full text-left flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  isActive ? "text-blue-600 font-semibold" : "text-gray-700"
                }`}
                role="menuitem"
              >
                <span>{language.label}</span>
                {isActive && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
