import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { localeNames, locales, translations, type Locale } from "./translations";

const storageKey = "serhii-dev-locale";

function normalizeLocale(value?: string | null): Locale {
  const short = value?.toLowerCase().split("-")[0];
  return locales.includes(short as Locale) ? (short as Locale) : "en";
}

function initialLocale() {
  const queryLocale = new URLSearchParams(window.location.search).get("lang");
  if (queryLocale) return normalizeLocale(queryLocale);
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(storageKey);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }
  return normalizeLocale(stored || window.navigator.language);
}

type I18nValue = {
  locale: Locale;
  localeNames: typeof localeNames;
  setLocale: (locale: Locale) => void;
  t: (source: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (value: string | Date) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(storageKey, nextLocale);
    } catch {
      // The active session still keeps the selected locale.
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const value = useMemo<I18nValue>(() => {
    const t = (source: string) => translations[locale][source] ?? source;
    return {
      locale,
      localeNames,
      setLocale,
      t,
      formatCurrency: (amount, currency = "USD") =>
        new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount),
      formatDate: (input) =>
        new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(input))
    };
  }, [locale, setLocale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("I18nProvider is missing");
  return value;
}
