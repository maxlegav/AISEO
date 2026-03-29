import TagSEO from "@/components/TagSEO";
import Navbar from "@/components/Navbar";

export default function PrivacyPage() {
  return (
    <>
      <TagSEO
        canonicalSlug="privacy"
        title="Privacy Policy | ShowYourBrand"
        description="Privacy Policy for ShowYourBrand - Learn how we collect, use, and protect your data."
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100">
        <Navbar />

        {/* Content */}
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-white/50">
            <h1 className="font-heading text-4xl font-medium text-gray-900 mb-8">
              Privacy Policy
            </h1>

            {/* GDPR Badge */}
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-green-800 text-sm">GDPR Compliant — EU Data Protection</div>
                <div className="text-green-700 text-xs mt-0.5">Your data is processed in accordance with Regulation (EU) 2016/679. You have full rights over your personal data.</div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: February 17, 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-600 mb-4">
                  ShowYourBrand (&quot;we,&quot; &quot;our,&quot; or
                  &quot;us&quot;) operates the ShowYourBrand platform, a
                  Generative Engine Optimization (GEO) audit service that
                  analyzes how brands are represented and cited by AI search
                  engines including ChatGPT, Claude, Perplexity, and DeepSeek.
                </p>
                <p className="text-gray-600 mb-4">
                  This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our platform,
                  visit our website at ShowYourBrand, or interact with our
                  services. By using our Service, you consent to the data
                  practices described in this policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  2.1 Account Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Name and email address when you create an account or join
                    our waitlist
                  </li>
                  <li>
                    Password (stored as a bcrypt hash, never in plaintext)
                  </li>
                  <li>Language preference (English or French)</li>
                  <li>Subscription tier and billing status</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  2.2 Business & Audit Data
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Website URLs you submit for GEO analysis (primary URL and
                    sub-pages)
                  </li>
                  <li>
                    Competitor URLs you provide for comparison (up to 5 per
                    audit)
                  </li>
                  <li>Business category and industry information</li>
                  <li>
                    Audit results including GEO Health Scores, AI citation data,
                    and recommendations
                  </li>
                  <li>
                    HTML scan results (schema.org data, meta tags, heading
                    structure, keyword analysis)
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  2.3 Payment Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Payment details are processed exclusively through Stripe and
                    never stored on our servers
                  </li>
                  <li>
                    We store only your Stripe Customer ID for subscription
                    management
                  </li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  2.4 Usage & Technical Data
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Browser type, device information, and operating system
                  </li>
                  <li>IP address and approximate geographic location</li>
                  <li>
                    Pages visited, features used, and interaction patterns
                  </li>
                  <li>Referral source and session duration</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  2.5 Waitlist Data
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Email address provided during waitlist registration</li>
                  <li>
                    Survey responses (how you found us, GEO experience level,
                    budget range)
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    Provide, operate, and maintain our GEO audit and analysis
                    services
                  </li>
                  <li>Process payments and manage your subscription</li>
                  <li>
                    Generate GEO Health Score reports, competitor analyses, and
                    optimization recommendations
                  </li>
                  <li>
                    Send audit results, PDF reports, and actionable
                    recommendations
                  </li>
                  <li>
                    Improve our AI analysis algorithms and platform features
                  </li>
                  <li>
                    Communicate service updates, new features, and platform news
                  </li>
                  <li>
                    Respond to support requests and provide customer assistance
                  </li>
                  <li>
                    Detect and prevent fraudulent activity or abuse of our
                    Service
                  </li>
                  <li>
                    Comply with legal obligations and enforce our Terms of
                    Service
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Legal Basis for Processing (GDPR Art. 6)
                </h2>
                <p className="text-gray-600 mb-4">
                  We process your personal data only where a valid legal basis exists under GDPR Article 6:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>Performance of a contract (Art. 6(1)(b)):</strong> Account creation, subscription management,
                    audit execution, and delivery of results — all necessary to provide the service you signed up for.
                  </li>
                  <li>
                    <strong>Legitimate interests (Art. 6(1)(f)):</strong> Platform security, fraud prevention, service
                    improvement, and aggregated analytics (where your individual data is not identifiable).
                  </li>
                  <li>
                    <strong>Legal obligation (Art. 6(1)(c)):</strong> Retention of financial records as required by
                    French tax law (6 years) and compliance with applicable regulations.
                  </li>
                  <li>
                    <strong>Consent (Art. 6(1)(a)):</strong> Marketing communications and optional analytics cookies —
                    you can withdraw consent at any time.
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  <strong>Data Controller:</strong> ShowYourBrand SAS, France. Contact: privacy@showyourbrand.app
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Data Security
                </h2>
                <p className="text-gray-600 mb-4">
                  We take data security seriously and implement
                  industry-standard measures including:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    SSL/TLS encryption for all data transmission between your
                    browser and our servers
                  </li>
                  <li>
                    AES-256-GCM encryption for sensitive data at rest in our
                    database
                  </li>
                  <li>Bcrypt password hashing (never stored in plaintext)</li>
                  <li>
                    Secure payment processing through Stripe (PCI DSS Level 1
                    compliant)
                  </li>
                  <li>
                    JWT-based authentication with secure session management
                  </li>
                  <li>
                    Regular security audits and dependency vulnerability
                    scanning
                  </li>
                  <li>
                    Input sanitization to prevent injection attacks (XSS, SQL
                    injection, MongoDB operators)
                  </li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Data Retention
                </h2>
                <p className="text-gray-600 mb-4">
                  We retain your data for as long as your account is active or
                  as needed to provide our services:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>Account data:</strong> Retained until you request
                    account deletion
                  </li>
                  <li>
                    <strong>Audit reports and results:</strong> Stored for 12
                    months from generation date
                  </li>
                  <li>
                    <strong>PDF reports:</strong> Stored in secure cloud storage
                    (Vercel Blob) for the retention period
                  </li>
                  <li>
                    <strong>Waitlist data:</strong> Retained until platform
                    launch or upon your request for deletion
                  </li>
                  <li>
                    <strong>Payment records:</strong> Retained as required by
                    applicable tax and accounting laws (minimum 6 years in
                    France)
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  You may request deletion of your personal data at any time by
                  contacting us. Note that we may retain certain data as
                  required by law or for legitimate business purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Third-Party Services
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the following third-party services to operate our
                  platform:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>Stripe</strong> — Payment processing (PCI DSS Level
                    1 compliant)
                  </li>
                  <li>
                    <strong>MongoDB Atlas</strong> — Database hosting (SOC 2
                    Type II certified)
                  </li>
                  <li>
                    <strong>Vercel</strong> — Application hosting and deployment
                  </li>
                  <li>
                    <strong>Resend</strong> — Transactional email delivery
                  </li>
                  <li>
                    <strong>OpenAI API</strong> — ChatGPT analysis for GEO
                    audits
                  </li>
                  <li>
                    <strong>Anthropic API</strong> — Claude analysis for GEO
                    audits
                  </li>
                  <li>
                    <strong>Perplexity API</strong> — Perplexity analysis for
                    GEO audits
                  </li>
                  <li>
                    <strong>DeepSeek API</strong> — DeepSeek analysis for GEO
                    audits
                  </li>
                  <li>
                    <strong>Google OAuth</strong> — Optional social login
                    provider
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  Each third-party service has its own privacy policy governing
                  how it handles your data. We encourage you to review their
                  respective policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. International Data Transfers
                </h2>
                <p className="text-gray-600 mb-4">
                  Your data may be processed in countries outside the European
                  Economic Area (EEA), including the United States (for AI API
                  providers and cloud hosting). Where we transfer data outside
                  the EEA, we ensure appropriate safeguards are in place,
                  including Standard Contractual Clauses (SCCs) approved by the
                  European Commission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Your Rights (GDPR)
                </h2>
                <p className="text-gray-600 mb-4">
                  Under the General Data Protection Regulation (GDPR) and
                  applicable French data protection law, you have the following
                  rights:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>
                    <strong>Right of Access:</strong> Request a copy of the
                    personal data we hold about you
                  </li>
                  <li>
                    <strong>Right to Rectification:</strong> Request correction
                    of inaccurate or incomplete data
                  </li>
                  <li>
                    <strong>Right to Erasure:</strong> Request deletion of your
                    personal data (&quot;right to be forgotten&quot;)
                  </li>
                  <li>
                    <strong>Right to Data Portability:</strong> Receive your
                    data in a structured, machine-readable format
                  </li>
                  <li>
                    <strong>Right to Restrict Processing:</strong> Request
                    limitation of how we process your data
                  </li>
                  <li>
                    <strong>Right to Object:</strong> Object to processing based
                    on legitimate interests or direct marketing
                  </li>
                  <li>
                    <strong>Right to Withdraw Consent:</strong> Withdraw consent
                    at any time where processing is based on consent
                  </li>
                </ul>
                <p className="text-gray-600 mb-4">
                  To exercise any of these rights, contact us at
                  privacy@ShowYourBrand. We will respond within 30 days as
                  required by GDPR.
                </p>
                <p className="text-gray-600 mb-4">
                  You also have the right to lodge a complaint with the French
                  data protection authority (CNIL — Commission Nationale de
                  l&apos;Informatique et des Libert&eacute;s) at www.cnil.fr.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Cookies & Tracking
                </h2>
                <p className="text-gray-600 mb-4">
                  We use essential cookies required for the platform to function
                  properly (authentication, session management, language
                  preferences). We do not use third-party advertising cookies.
                  We may use analytics cookies to understand how our platform is
                  used — you can opt out at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Children&apos;s Privacy
                </h2>
                <p className="text-gray-600 mb-4">
                  Our Service is not intended for individuals under the age of
                  18. We do not knowingly collect personal data from children.
                  If we become aware that we have collected data from a child,
                  we will take steps to delete it promptly.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Changes to This Policy
                </h2>
                <p className="text-gray-600 mb-4">
                  We may update this Privacy Policy from time to time. We will
                  notify you of any material changes by posting the updated
                  policy on this page and updating the &quot;Last updated&quot;
                  date. For significant changes, we will also notify you by
                  email.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Contact Us
                </h2>
                <p className="text-gray-600 mb-4">
                  For privacy-related inquiries or to exercise your data rights:
                </p>
                <ul className="list-none text-gray-600 space-y-2">
                  <li>
                    <strong>Email:</strong> privacy@ShowYourBrand
                  </li>
                  <li>
                    <strong>General support:</strong> support@ShowYourBrand.com
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
