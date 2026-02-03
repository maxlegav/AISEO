import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TagSEO from "@/components/TagSEO";

export default function TermsPage() {
  return (
    <>
      <TagSEO
        canonicalSlug="terms"
        title="Terms of Service | ShowYourBrand.ai"
        description="Terms of Service for ShowYourBrand.ai - Read our terms and conditions for using our GEO platform."
      />

      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-orange-100">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <span className="font-semibold text-gray-900 tracking-tight">
                  SHOWYOURBRAND
                </span>
              </Link>

              <Link
                href="/"
                className="flex items-center gap-2 text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to home</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border border-white/50">
            <h1 className="font-heading text-4xl font-medium text-gray-900 mb-8">
              Terms of Service
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: February 2, 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Agreement to Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing or using ShowYourBrand.ai (&quot;the Service&quot;), you
                  agree to be bound by these Terms of Service. If you disagree
                  with any part of these terms, you may not access the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Description of Service
                </h2>
                <p className="text-gray-600 mb-4">
                  ShowYourBrand.ai provides Generative Engine Optimization (GEO)
                  services, including:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Website visibility audits across AI platforms</li>
                  <li>Competitive analysis and benchmarking</li>
                  <li>AI-optimized content recommendations</li>
                  <li>GEO Health Score tracking</li>
                  <li>PDF report generation</li>
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
                  <li>Create an account with accurate information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be at least 18 years old or have parental consent</li>
                  <li>Not share your account with others</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Subscription and Payments
                </h2>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Billing
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Subscriptions are billed monthly in advance</li>
                  <li>All fees are non-refundable unless otherwise stated</li>
                  <li>Prices may change with 30 days notice</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Plan Limits
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Starter: 5 audits per month</li>
                  <li>Pro: 20 audits per month</li>
                  <li>Agency: Unlimited audits</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Acceptable Use
                </h2>
                <p className="text-gray-600 mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Use the Service for illegal purposes</li>
                  <li>Attempt to reverse-engineer our algorithms</li>
                  <li>Scrape or automate access without permission</li>
                  <li>Submit malicious URLs or content</li>
                  <li>Resell access without an Agency subscription</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Intellectual Property
                </h2>
                <p className="text-gray-600 mb-4">
                  The Service and its original content, features, and
                  functionality are owned by ShowYourBrand.ai and are protected
                  by international copyright, trademark, and other intellectual
                  property laws.
                </p>
                <p className="text-gray-600 mb-4">
                  You retain ownership of your website content. By using our
                  Service, you grant us a limited license to analyze your
                  publicly available content for audit purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Disclaimer of Warranties
                </h2>
                <p className="text-gray-600 mb-4">
                  The Service is provided &quot;as is&quot; without warranties of any
                  kind. We do not guarantee:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Specific improvements in AI visibility</li>
                  <li>Continuous, uninterrupted access to the Service</li>
                  <li>Accuracy of all AI analysis results</li>
                  <li>Compatibility with all websites or platforms</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-gray-600 mb-4">
                  In no event shall ShowYourBrand.ai be liable for any indirect,
                  incidental, special, consequential, or punitive damages,
                  including loss of profits, data, or other intangible losses
                  resulting from your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Termination
                </h2>
                <p className="text-gray-600 mb-4">
                  We may terminate or suspend your account immediately, without
                  prior notice, for conduct that we believe violates these Terms
                  or is harmful to other users or the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Changes to Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  We reserve the right to modify these Terms at any time. We will
                  notify users of any material changes via email or through the
                  Service. Continued use after changes constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Governing Law
                </h2>
                <p className="text-gray-600 mb-4">
                  These Terms shall be governed by the laws of France, without
                  regard to conflict of law provisions. Any disputes shall be
                  resolved in the courts of Paris, France.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Contact Us
                </h2>
                <p className="text-gray-600 mb-4">
                  For questions about these Terms, please contact us at:
                </p>
                <p className="text-gray-600">
                  Email: legal@showyourbrand.ai
                </p>
              </section>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200/50 bg-white/70 backdrop-blur-sm py-8">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            © 2026 ShowYourBrand.ai. All rights reserved.
          </div>
        </footer>
      </div>
    </>
  );
}
