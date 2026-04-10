// ShowYourBrand - Sitemap Configuration
module.exports = {
  siteUrl: process.env.SITE_URL || "https://showyourbrand.app",
  generateRobotsTxt: false, // we manage robots.txt manually in /public
  // Exclude protected routes from sitemap
  exclude: ["/dashboard", "/dashboard/*", "/api/*", "/settings", "/admin/*", "/waitlist"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/settings", "/admin/"] },
    ],
  },
};
