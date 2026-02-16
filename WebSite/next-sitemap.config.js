// ShowYourBrand - Sitemap Configuration
module.exports = {
  siteUrl: process.env.SITE_URL || "https://ShowYourBrand.com",
  generateRobotsTxt: true,
  // Exclude protected routes from sitemap
  exclude: ["/dashboard/*", "/api/*"],
};
