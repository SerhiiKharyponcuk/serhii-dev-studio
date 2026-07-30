import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SeoManager } from "../components/SeoManager";

export function PublicLayout() {
  return (
    <>
      <SeoManager />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <main id="main-content">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
