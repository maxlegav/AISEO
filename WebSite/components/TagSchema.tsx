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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is GEO (Generative Engine Optimization)?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "GEO (Generative Engine Optimization) is the practice of optimizing your website and content to be visible and cited by all major AI engines: ChatGPT, Claude, Perplexity, Gemini, Grok and others. As more users turn to AI for answers, GEO ensures your brand appears in those responses.",
                },
              },
              {
                "@type": "Question",
                name: "How do I appear in ChatGPT or AI search results?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "To appear in ChatGPT and other AI search results, you need to optimize your website for GEO: add structured data (Schema.org), ensure your content is factual and well-cited, add an llms.txt file, and make sure AI crawlers can access your site via robots.txt. ShowYourBrand audits your visibility across 100 AI prompts and gives you a prioritized action plan.",
                },
              },
              {
                "@type": "Question",
                name: "How long does a GEO audit take?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "A complete GEO audit typically takes 10-15 minutes to process. We analyze your website across 100 AI prompts, scan your HTML structure, and generate comprehensive recommendations. You receive real-time progress updates during the process.",
                },
              },
              {
                "@type": "Question",
                name: "Does GEO replace SEO?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "No, GEO complements traditional SEO. While SEO optimizes for search engine rankings, GEO ensures your content is structured and presented in ways that AI systems can understand and cite. Both work together to maximize your online visibility.",
                },
              },
              {
                "@type": "Question",
                name: "Which AI models does ShowYourBrand analyze?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "We analyze your visibility across all major AI platforms: ChatGPT (OpenAI), Claude (Anthropic), Perplexity, Gemini (Google) and Grok (xAI). Each model has different training data and citation patterns, so we test across all of them to give you a complete picture.",
                },
              },
              {
                "@type": "Question",
                name: "Do you offer white-label reports for agencies?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes. Our Agency plan includes fully customizable white-label dashboards with your branding. You can add your logo, colors, and share a custom link with your clients so they see your agency, not ShowYourBrand.",
                },
              },
            ],
          }),
        }}
      ></script>
    </Head>
  );
};

export default TagSchema;
