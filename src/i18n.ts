import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./i18n/locales/en";
import fr from "./i18n/locales/fr";

const LANGUAGE_STORAGE_KEY = "app-language";

const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
};

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage = savedLanguage === "fr" || savedLanguage === "en" ? savedLanguage : "en";

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

i18n.on("languageChanged", (language) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
});

export default i18n;
