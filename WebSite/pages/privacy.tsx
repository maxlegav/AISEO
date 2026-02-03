import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TagSEO from "@/components/TagSEO";

export default function PrivacyPage() {
  return (
    <>
      <TagSEO
        canonicalSlug="privacy"
        title="Privacy Policy | ShowYourBrand.ai"
        description="Privacy Policy for ShowYourBrand.ai - Learn how we collect, use, and protect your data."
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
              Privacy Policy
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                Last updated: February 2, 2026
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-600 mb-4">
                  ShowYourBrand.ai (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting
                  your privacy. This Privacy Policy explains how we collect, use,
                  disclose, and safeguard your information when you use our GEO
                  (Generative Engine Optimization) platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Personal Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Name and email address when you create an account</li>
                  <li>Payment information processed securely through Stripe</li>
                  <li>Website URLs you submit for analysis</li>
                  <li>Communication preferences</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Usage Information
                </h3>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Browser type and device information</li>
                  <li>IP address and location data</li>
                  <li>Pages visited and features used</li>
                  <li>Audit results and reports generated</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Provide and maintain our GEO analysis services</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send you audit results and recommendations</li>
                  <li>Improve our AI algorithms and platform features</li>
                  <li>Communicate about updates and new features</li>
                  <li>Respond to your inquiries and support requests</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Data Security
                </h2>
                <p className="text-gray-600 mb-4">
                  We implement industry-standard security measures including:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>SSL/TLS encryption for all data transmission</li>
                  <li>AES-256 encryption for sensitive data at rest</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Secure payment processing through Stripe</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Data Retention
                </h2>
                <p className="text-gray-600 mb-4">
                  We retain your data for as long as your account is active or as
                  needed to provide services. Audit reports are stored for 12
                  months. You may request deletion of your data at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Third-Party Services
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the following third-party services:
                </p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Stripe for payment processing</li>
                  <li>Google Analytics for usage analytics</li>
                  <li>Vercel for hosting and infrastructure</li>
                  <li>AI APIs (OpenAI, Anthropic, etc.) for audit analysis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Your Rights
                </h2>
                <p className="text-gray-600 mb-4">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your data in a portable format</li>
                  <li>Opt out of marketing communications</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Contact Us
                </h2>
                <p className="text-gray-600 mb-4">
                  For privacy-related inquiries, please contact us at:
                </p>
                <p className="text-gray-600">
                  Email: privacy@showyourbrand.ai
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
