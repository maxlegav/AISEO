import Head from "next/head";
import config from "@/config";


// Strctured Data for Rich Results on Google. Learn more: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
// Find your type here (SoftwareApp, Book...): https://developers.google.com/search/docs/appearance/structured-data/search-gallery
// Use this tool to check data is well structure: https://search.google.com/test/rich-results
// You don't have to use this component, but it increase your chances of having a rich snippet on Google
// I recommend the default one below for software apps: It tells Google your AppName is a Software, and it has a rating of 4.8/5 from 12 reviews
// Fill the fields with your own data
const TagSchema = () => {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: config.appName,
            description:
              "Audit your brand's visibility across 100 AI prompts on all major AI engines: ChatGPT, Claude, Perplexity, Gemini and Grok. Get a GEO Health Score and actionable recommendations to appear in AI answers.",
            image: `${config.siteUrl}/og-homepage.jpeg`,
            url: `${config.siteUrl}/`,
            sameAs: [
              "https://x.com/showyourbrand_",
              "https://www.linkedin.com/company/showyourbrand/",
            ],
            author: {
              "@type": "Organization",
              name: config.appName,
              url: config.siteUrl,
            },
            publisher: {
              "@type": "Organization",
              name: config.appName,
              url: config.siteUrl,
              logo: {
                "@type": "ImageObject",
                url: `${config.siteUrl}/syb_logo_transparent.png`,
              },
            },
            datePublished: "2025-01-01",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              ratingCount: "24",
            },
            offers: [
              {
                "@type": "Offer",
                name: "Data",
                description: "1 GEO audit: raw JSON for developers and SEO experts",
                price: "29.00",
                priceCurrency: "EUR",
                priceSpecification: { "@type": "UnitPriceSpecification", priceType: "https://schema.org/OneTimePurchase" },
              },
              {
                "@type": "Offer",
                name: "Starter",
                description: "1 complete GEO audit with dashboard access",
                price: "79.00",
                priceCurrency: "EUR",
                priceSpecification: { "@type": "UnitPriceSpecification", priceType: "https://schema.org/OneTimePurchase" },
              },
              {
                "@type": "Offer",
                name: "Pro",
                description: "Monthly GEO audits with progress tracking",
                price: "59.00",
                priceCurrency: "EUR",
                priceSpecification: { "@type": "UnitPriceSpecification", priceType: "https://schema.org/RecurringCharge", billingIncrement: 1, unitCode: "MON" },
              },
              {
                "@type": "Offer",
                name: "Agency",
                description: "15 client GEO audits per month with white-label reports",
                price: "599.00",
                priceCurrency: "EUR",
                priceSpecification: { "@type": "UnitPriceSpecification", priceType: "https://schema.org/RecurringCharge", billingIncrement: 1, unitCode: "MON" },
              },
            ],
          }),
        }}
      ></script>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: config.appName,
            url: config.siteUrl,
            logo: `${config.siteUrl}/syb_logo_transparent.png`,
            sameAs: [
              "https://x.com/showyourbrand_",
              "https://www.linkedin.com/company/showyourbrand/",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "contact@showyourbrand.app",
            },
          }),
        }}
      ></script>
    </Head>
  );
};

export default TagSchema;
