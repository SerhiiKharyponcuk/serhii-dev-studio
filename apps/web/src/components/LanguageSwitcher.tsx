import { Languages } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useI18n } from "../i18n/I18nProvider";
import { locales, type Locale } from "../i18n/translations";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, localeNames, setLocale, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const changeLanguage = (nextLocale: Locale) => {
    setLocale(nextLocale);
    const params = new URLSearchParams(location.search);
    if (nextLocale === "en") params.delete("lang");
    else params.set("lang", nextLocale);
    void navigate({ pathname: location.pathname, search: params.toString() }, { replace: true });
  };
  return (
    <label className={`language-switcher ${compact ? "w-full" : ""}`}>
      <Languages aria-hidden="true" size={16} />
      <span className="sr-only">{t("Language")}</span>
      <select
        aria-label={t("Language")}
        value={locale}
        onChange={(event) => changeLanguage(event.target.value as Locale)}
      >
        {locales.map((item) => (
          <option key={item} value={item}>
            {localeNames[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
