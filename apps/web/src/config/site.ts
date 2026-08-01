export const site = {
  name: "Serhii Dev Studio",
  developer: "Serhii Kharyponchuk",
  title: "Frontend & Full Stack JavaScript Developer",
  location: "Netherlands",
  description:
    "I build modern, fast and scalable websites and web applications for businesses, startups and online projects.",
  email: "hello@serhiidev.com",
  technologies: [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "Prisma",
    "PostgreSQL",
    "Tailwind CSS",
    "REST API"
  ]
} as const;

export const brand = {
  logoMark: "S",
  primaryColor: "#6366f1",
  accentColor: "#8b5cf6",
  backgroundColor: "#070812"
} as const;

export const services = [
  {
    slug: "landing-page",
    name: "Landing Page",
    price: 750,
    time: "1–2 weeks",
    description: "A focused, conversion-ready page for a product, service or campaign.",
    features: ["Responsive custom UI", "Lead capture form", "SEO foundation", "Analytics-ready"]
  },
  {
    slug: "business-website",
    name: "Business Website",
    price: 1500,
    time: "3–5 weeks",
    description: "A polished multi-page presence that builds credibility and generates enquiries.",
    features: ["Content architecture", "CMS-ready structure", "Contact workflows", "Technical SEO"]
  },
  {
    slug: "portfolio-website",
    name: "Portfolio Website",
    price: 900,
    time: "2–3 weeks",
    description: "A memorable portfolio that presents your expertise and work with clarity.",
    features: ["Project case studies", "Motion design", "Responsive gallery", "Contact funnel"]
  },
  {
    slug: "online-shop",
    name: "Online Shop",
    price: 2800,
    time: "5–9 weeks",
    description: "A scalable storefront prepared for products, checkout and operations.",
    features: [
      "Product catalogue",
      "Cart experience",
      "Admin-ready API",
      "Payment-ready architecture"
    ]
  },
  {
    slug: "admin-dashboard",
    name: "Admin Dashboard",
    price: 2200,
    time: "4–7 weeks",
    description: "An efficient operations interface for data, workflows and team decisions.",
    features: ["Role-based access", "Tables and filters", "Charts", "Audit-ready actions"]
  },
  {
    slug: "client-dashboard",
    name: "Client Dashboard",
    price: 2400,
    time: "4–8 weeks",
    description: "A secure client area for projects, files, messages and payments.",
    features: ["Authentication", "Project tracking", "Files and messages", "Billing views"]
  },
  {
    slug: "minecraft-store",
    name: "Minecraft Store",
    price: 1800,
    time: "3–6 weeks",
    description: "A distinctive, mobile-first store experience for a Minecraft community.",
    features: ["Storefront UI", "Rank presentation", "Server integration-ready", "Admin tools"]
  },
  {
    slug: "custom-web-application",
    name: "Custom Web Application",
    price: 3500,
    time: "6–12+ weeks",
    description: "Purpose-built software designed around your workflow and growth plans.",
    features: ["Product discovery", "Scalable API", "Database design", "Secure deployment"]
  },
  {
    slug: "website-redesign",
    name: "Website Redesign",
    price: 1200,
    time: "2–5 weeks",
    description: "A strategic visual and technical refresh without losing what already works.",
    features: ["UX audit", "Design refresh", "Performance work", "Migration plan"]
  },
  {
    slug: "website-maintenance",
    name: "Website Maintenance",
    price: 180,
    time: "Monthly",
    description: "Reliable improvements, monitoring and technical care after launch.",
    features: ["Updates", "Bug fixes", "Performance checks", "Priority support"]
  }
] as const;

export const projects = [
  {
    slug: "waves-arcade",
    title: "Waves Arcade",
    category: "Web Application",
    accent: "from-blue-500 to-cyan-300",
    description:
      "A modern browser arcade game with levels, achievements, missions, skins, user accounts, admin tools and backend score validation.",
    technologies: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL", "Prisma"]
  },
  {
    slug: "metro-shop",
    title: "Metro Shop",
    category: "E-commerce",
    accent: "from-violet-500 to-fuchsia-400",
    description:
      "A modern online shop concept with responsive design, product cards, interactive animations and mobile-first layout.",
    technologies: ["React", "TypeScript", "Tailwind CSS"]
  },
  {
    slug: "developer-portfolio",
    title: "Developer Portfolio",
    category: "Portfolio",
    accent: "from-indigo-500 to-blue-400",
    description:
      "A personal developer portfolio with responsive design, animations, SEO and project presentation.",
    technologies: ["React", "TypeScript", "Framer Motion"]
  },
  {
    slug: "ip-information-website",
    title: "IP Information Website",
    category: "Web Tool",
    accent: "from-emerald-500 to-cyan-400",
    description:
      "A web interface that displays browser, device, network and approximate IP information in a hacker-style design.",
    technologies: ["JavaScript", "REST API", "Responsive UI"]
  }
] as const;

export const pricing = [
  {
    name: "Basic",
    price: "$750",
    description: "For a landing page, personal page or compact brochure site.",
    features: ["Up to 3 pages", "Responsive design", "Contact form", "SEO essentials"],
    popular: false
  },
  {
    name: "Standard",
    price: "$1,500",
    description: "For a business website, portfolio or integration-rich multi-page site.",
    features: ["Up to 8 pages", "Custom UI system", "Forms and integrations", "Performance setup"],
    popular: true
  },
  {
    name: "Premium",
    price: "$3,500",
    description: "For a shop, client portal, admin panel or complex web application.",
    features: ["Product architecture", "Secure accounts", "Custom backend", "Deployment support"],
    popular: false
  }
] as const;
