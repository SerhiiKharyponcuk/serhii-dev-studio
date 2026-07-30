import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const origin = (process.env.VITE_SITE_URL ?? "http://localhost:5173").replace(/\/$/, "");
const staticRoutes = [
  "",
  "about",
  "portfolio",
  "services",
  "pricing",
  "reviews",
  "faq",
  "contact",
  "order",
  "privacy",
  "terms",
  "cookies"
];
const projects = [
  "waves-arcade",
  "metro-shop",
  "developer-portfolio",
  "ip-information-website"
].map((slug) => `portfolio/${slug}`);
const services = [
  "landing-page",
  "business-website",
  "portfolio-website",
  "online-shop",
  "admin-dashboard",
  "client-dashboard",
  "minecraft-store",
  "custom-web-application",
  "website-redesign",
  "website-maintenance"
].map((slug) => `services/${slug}`);
const urls = [...staticRoutes, ...projects, ...services]
  .map((route) => `  <url><loc>${origin}/${route}</loc></url>`)
  .join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
const robots = `User-agent: *\nAllow: /\nDisallow: /dashboard/\nDisallow: /admin/\nSitemap: ${origin}/sitemap.xml\n`;
await Promise.all([
  writeFile(fileURLToPath(new URL("../public/sitemap.xml", import.meta.url)), xml, "utf8"),
  writeFile(fileURLToPath(new URL("../public/robots.txt", import.meta.url)), robots, "utf8")
]);
