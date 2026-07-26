import { Outlet } from "react-router";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { SeoManager } from "../components/SeoManager";

export function PublicLayout() {
  return (
    <>
      <SeoManager />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
