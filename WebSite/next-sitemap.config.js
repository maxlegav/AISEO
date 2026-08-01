// ShowYourBrand - Sitemap Configuration
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

module.exports = {
  siteUrl: process.env.SITE_URL || "https://showyourbrand.app",
  generateRobotsTxt: false, // managed manually in /public/robots.txt
  exclude: [
    "/dashboard",
    "/dashboard/*",
    "/api/*",
    "/settings",
    "/admin/*",
    "/waitlist",
    // Experimental alternative landing: noindex, must not be advertised either.
    "/testlanding",
    "/checkout/*",
    "/forgot-password",
    "/reset-password",
    "/username-setup",
    "/500",
    "/share/*",
    "/projects/*",
    "/*/",          // dynamic [username] routes
  ],
  transform: async (config, url) => {
    let priority = 0.7;
    let lastmod = new Date().toISOString();
    let changefreq = "weekly";

    if (url === "/") {
      priority = 1.0;
      changefreq = "daily";
    } else if (url === "/blog") {
      priority = 0.9;
      changefreq = "daily";
    } else if (url.startsWith("/blog/")) {
      priority = 0.8;
      changefreq = "monthly";
      const slug = url.replace("/blog/", "");
      const filePath = path.join(process.cwd(), "content/blog", `${slug}.md`);
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data } = matter(raw);
        if (data.date) lastmod = new Date(data.date).toISOString();
      } catch (_) {}
    } else if (["/privacy", "/terms", "/login", "/signup"].includes(url)) {
      priority = 0.4;
      changefreq = "yearly";
    }

    return { loc: url, changefreq, priority, lastmod };
  },
};
