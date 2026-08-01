import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SeoManager } from "../components/SeoManager";
import { useI18n } from "../i18n/I18nProvider";

export function PublicLayout() {
  const { t } = useI18n();
  return (
    <>
      <SeoManager />
      <a className="skip-link" href="#main-content">
        {t("Skip to content")}
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
