import TagSEO from "@/components/TagSEO";
import TagSchema from "@/components/TagSchema";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <>
      <TagSEO
        canonicalSlug=""
        title="AISEO - AI SEO Optimization Platform"
        description="Optimize your website for AI search engines with advanced SEO analysis and recommendations."
      />
      <TagSchema />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI SEO Optimization Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Optimize your website for AI search engines with advanced analysis and recommendations
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Powerful Features for AI SEO
            </h2>
            <div className="grid md:grid-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">GEO Health Score</h3>
                <p className="text-gray-600">
                  Measure your website's visibility across AI search engines
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Technical Analysis</h3>
                <p className="text-gray-600">
                  Scan HTML, schema markup, meta tags, and content structure
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">AI Recommendations</h3>
                <p className="text-gray-600">
                  Get actionable, copy-paste ready optimization suggestions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>© 2026 AISEO. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
