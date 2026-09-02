import Link from "next/link";
import TagSEO from "@/components/TagSEO";
import Navbar from "@/components/Navbar";

export default function TermsPage() {
  return (
    <>
      <TagSEO
        canonicalSlug="terms"
        title="Terms of Service | ShowYourBrand"
        description="Terms of Service for ShowYourBrand - Read our terms and conditions for using our GEO platform."
      />

      <div className="min-h-screen bg-ink-100">
        <Navbar />

        {/* Content */}
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-white/50">
            <h1 className="font-heading text-4xl font-medium text-gray-900 mb-8">
              Terms of Service
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: February 17, 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing or using ShowYourBrand (&quot;the Service&quot;),
                  operated by ShowYourBrand, you agree to be bound by these
                  Terms of Service (&quot;Terms&quot;). If you disagree with any
                  part of these Terms, you may not access or use the Service.
                </p>
                <p className="text-gray-600 mb-4">
                  These Terms constitute a legally binding agreement between you
                  (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) and
                  ShowYourBrand (&quot;we,&quot; &quot;us,&quot; or
                  &quot;our&quot;) regarding your use of the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 mb-4">
                  ShowYourBrand provides a Generative Engine Optimization (GEO)
                  platform that helps businesses analyze and improve their
                  visibility across AI-powered search engines. Our services
                  include:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>GEO Audits:</strong> Analysis of your website&apos;s
                    visibility across 4 major AI engines (ChatGPT, Claude,
                    Perplexity, DeepSeek) using 100 AI-generated prompts
                  </li>
                  <li>
                    <strong>GEO Health Score:</strong> A proprietary score
                    (0-100%) measuring your brand&apos;s AI search presence
                  </li>
                  <li>
                    <strong>Competitive Analysis:</strong> Side-by-side
                    comparison with up to 5 competitors per audit
                  </li>
                  <li>
                    <strong>HTML & Schema.org Scanning:</strong> Technical
                    analysis of your website structure, meta tags, headings, and
                    structured data
                  </li>
                  <li>
                    <strong>AI-Optimized Recommendations:</strong> Actionable
                    suggestions including FAQ generation, schema markup, content
                    optimizations, and priority-ranked action items
                  </li>
                  <li>
                    <strong>PDF Report Generation:</strong> Comprehensive
                    downloadable reports with executive summaries
                  </li>
                  <li>
                    <strong>White-Label Reports:</strong> Agency-branded reports
                    (Premium plan only)
                  </li>
                  <li>
                    <strong>Dashboard & History:</strong> Track your GEO score
                    over time and monitor progress
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. User Accounts
                </h2>
                <p className="text-gray-600 mb-4">
                  To use our Service, you must:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Create an account with accurate and complete information
                  </li>
                  <li>
                    Maintain the security and confidentiality of your account
                    credentials
                  </li>
                  <li>
                    Be at least 18 years of age or have legal capacity to enter
                    into this agreement
                  </li>
                  <li>
                    Not share your account with others or allow unauthorized
                    access
                  </li>
                  <li>
                    Promptly notify us of any unauthorized use of your account
                  </li>
                  <li>
                    Ensure that the websites you submit for analysis are owned
                    or authorized by you
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  You are solely responsible for all activities that occur under
                  your account. We reserve the right to suspend or terminate
                  accounts that violate these Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Subscription Plans and Payments
                </h2>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  4.1 Plans and Pricing
                </h3>
                <p className="text-gray-600 mb-4">
                  ShowYourBrand offers the following plans:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>Basic (€199 one-time):</strong> 1 GEO audit, ChatGPT
                    analysis, 1 competitor, 100 AI prompts, PDF report, HTML
                    scan
                  </li>
                  <li>
                    <strong>Pro (€399 one-time):</strong> 1 GEO audit, all 4 AI
                    engines, 5 competitors, 100 AI prompts, PDF report +
                    executive summary, FAQ generation, dashboard with history
                  </li>
                  <li>
                    <strong>Premium (€799/month):</strong> 20 audits per month,
                    all 4 AI engines, unlimited competitors, white-label
                    reports, bulk management, dedicated account manager, +€35
                    per extra audit
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  4.2 Billing
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    One-time plans (Basic, Pro) are charged once at the time of
                    purchase
                  </li>
                  <li>
                    Premium subscriptions are billed monthly in advance on the
                    same day each month
                  </li>
                  <li>
                    All payments are processed securely through Stripe in Euros
                    (€)
                  </li>
                  <li>
                    Prices are exclusive of applicable taxes (VAT) which will be
                    added at checkout
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  4.3 Refunds
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    One-time plans: Refund available within 14 days if audit has
                    not been started
                  </li>
                  <li>
                    Premium subscriptions: No refund for the current billing
                    period; you may cancel at any time and retain access until
                    the end of your current billing cycle
                  </li>
                  <li>
                    If our Service fails to deliver a complete audit due to a
                    technical issue on our end, we will provide a replacement
                    audit or a full refund at your choice
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  4.4 Price Changes
                </h3>
                <p className="text-gray-600 mb-4">
                  We may adjust pricing with 30 days&apos; prior written notice.
                  Price changes will not affect active Premium subscriptions
                  until the next renewal date. One-time plans purchased before a
                  price change will be honored at the original price.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Acceptable Use
                </h2>
                <p className="text-gray-600 mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Use the Service for any illegal or unauthorized purpose
                  </li>
                  <li>
                    Attempt to reverse-engineer, decompile, or extract our
                    proprietary algorithms
                  </li>
                  <li>
                    Scrape, crawl, or automate access to our Service without
                    express written permission
                  </li>
                  <li>
                    Submit malicious URLs, phishing sites, or content intended
                    to exploit our systems
                  </li>
                  <li>
                    Submit URLs of websites you do not own or are not authorized
                    to audit
                  </li>
                  <li>
                    Resell, redistribute, or sublicense access to our Service
                    without a Premium plan
                  </li>
                  <li>
                    Use white-label features to misrepresent our reports as your
                    proprietary technology
                  </li>
                  <li>
                    Attempt to circumvent usage limits, rate limits, or
                    authentication mechanisms
                  </li>
                  <li>
                    Upload or transmit viruses, malware, or other harmful code
                  </li>
                  <li>
                    Violate any applicable local, national, or international law
                    or regulation
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-600 mb-4">
                  The Service, including its design, code, algorithms, GEO
                  Health Score methodology, branding, and all original content,
                  is owned by ShowYourBrand and protected by international
                  copyright, trademark, and intellectual property laws.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Your content:</strong> You retain full ownership of
                  your website content, business data, and any material you
                  submit. By using our Service, you grant us a limited,
                  non-exclusive license to access and analyze your publicly
                  available web content solely for the purpose of providing GEO
                  audit services.
                </p>
                <p className="text-gray-600 mb-4">
                  <strong>Audit reports:</strong> You own the audit reports
                  generated for your business. You may share, distribute, or
                  publish these reports as you see fit. Premium plan users may
                  white-label reports and present them under their own branding.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Disclaimer of Warranties
                </h2>
                <p className="text-gray-600 mb-4">
                  The Service is provided &quot;as is&quot; and &quot;as
                  available&quot; without warranties of any kind, whether
                  express or implied. Specifically, we do not guarantee:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    That implementing our recommendations will result in
                    specific improvements in AI visibility, search rankings, or
                    business outcomes
                  </li>
                  <li>
                    Continuous, uninterrupted, or error-free access to the
                    Service
                  </li>
                  <li>
                    100% accuracy of AI analysis results, as AI models evolve
                    and update their training data regularly
                  </li>
                  <li>
                    Compatibility with all websites, CMS platforms, or hosting
                    configurations
                  </li>
                  <li>
                    That AI engines will continue to cite or reference your
                    brand after optimization
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  Our GEO Health Score is a proprietary metric designed to
                  provide directional guidance. It should not be considered a
                  guarantee of performance or taken as professional consulting
                  advice.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-600 mb-4">
                  To the maximum extent permitted by law, ShowYourBrand shall
                  not be liable for any indirect, incidental, special,
                  consequential, or punitive damages, including but not limited
                  to loss of profits, loss of data, loss of business
                  opportunities, or other intangible losses resulting from:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Your use of or inability to use the Service</li>
                  <li>
                    Any changes to AI models that affect your visibility scores
                  </li>
                  <li>Unauthorized access to your account or data</li>
                  <li>
                    Third-party actions, including AI provider policy changes or
                    API outages
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  Our total liability for any claim arising from or relating to
                  these Terms or the Service shall not exceed the amount you
                  paid to us in the 12 months preceding the claim.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Data Processing
                </h2>
                <p className="text-gray-600 mb-4">
                  When providing our Service, we process data in accordance with
                  our{" "}
                  <Link
                    href="/privacy"
                    className="text-accent hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  . Key processing activities include:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Querying AI APIs (OpenAI, Anthropic, Perplexity, DeepSeek)
                    with prompts related to your business
                  </li>
                  <li>
                    Scanning publicly available HTML content of URLs you provide
                  </li>
                  <li>
                    Storing audit results and snapshots of your business data at
                    the time of each audit
                  </li>
                  <li>
                    Generating and storing PDF reports in secure cloud storage
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  We use the snapshot pattern for all audit data: business data
                  is captured at the time of the audit and stored independently,
                  ensuring historical accuracy even if your data changes later.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Termination
                </h2>
                <p className="text-gray-600 mb-4">
                  We may terminate or suspend your account immediately, without
                  prior notice, for conduct that we believe violates these
                  Terms, is harmful to other users, or is otherwise detrimental
                  to the Service. Specifically:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Violation of acceptable use policies will result in
                    immediate suspension
                  </li>
                  <li>
                    Repeated failed payment attempts may result in account
                    suspension
                  </li>
                  <li>
                    Upon termination, you will lose access to your dashboard and
                    audit history
                  </li>
                  <li>
                    You may request export of your data within 30 days of
                    account termination
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  You may terminate your account at any time by contacting
                  support@ShowYourBrand.com. For Premium subscriptions,
                  cancellation takes effect at the end of the current billing
                  period.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Force Majeure
                </h2>
                <p className="text-gray-600 mb-4">
                  We shall not be liable for any failure or delay in performing
                  our obligations where such failure or delay results from
                  events beyond our reasonable control, including but not
                  limited to: natural disasters, pandemics, government actions,
                  changes in law, internet outages, AI provider service
                  disruptions, or cyberattacks.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Changes to Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these Terms at any time. We
                  will notify users of any material changes via email or through
                  the Service at least 15 days before they take effect. Your
                  continued use of the Service after the effective date
                  constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Governing Law & Dispute Resolution
                </h2>
                <p className="text-gray-600 mb-4">
                  These Terms shall be governed by and construed in accordance
                  with the laws of France, without regard to conflict of law
                  provisions. The French consumer protection code (Code de la
                  consommation) applies to consumer users where applicable.
                </p>
                <p className="text-gray-600 mb-4">
                  Any disputes arising from these Terms or the use of the
                  Service shall first be addressed through good-faith
                  negotiation. If unresolved within 30 days, disputes shall be
                  submitted to the exclusive jurisdiction of the courts of
                  Paris, France.
                </p>
                <p className="text-gray-600 mb-4">
                  EU consumers may also use the European Online Dispute
                  Resolution platform at ec.europa.eu/consumers/odr.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  14. Severability
                </h2>
                <p className="text-gray-600 mb-4">
                  If any provision of these Terms is found to be unenforceable
                  or invalid, that provision will be limited or eliminated to
                  the minimum extent necessary so that these Terms shall
                  otherwise remain in full force and effect.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  15. Contact Us
                </h2>
                <p className="text-gray-600 mb-4">
                  For questions about these Terms of Service:
                </p>
                <ul className="list-none text-gray-600 space-y-2">
                  <li>
                    <strong>Email:</strong> legal@ShowYourBrand
                  </li>
                  <li>
                    <strong>Support:</strong> support@ShowYourBrand.com
                  </li>
                  <li>
                    <strong>Website:</strong> ShowYourBrand
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 bg-white/70 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            © 2026 ShowYourBrand. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
