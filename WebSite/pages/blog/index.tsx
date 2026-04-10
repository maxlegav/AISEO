import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { GetStaticProps } from "next";
import TagSEO from "@/components/TagSEO";
import Navbar from "@/components/Navbar";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import config from "@/config";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

interface Props {
  posts: BlogPost[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const CATEGORY_COLORS: Record<string, string> = {
  "GEO Strategy": "bg-purple-50 text-purple-700",
  "GEO Basics": "bg-blue-50 text-blue-700",
  "AI Search": "bg-orange-50 text-orange-700",
  "Technical GEO": "bg-green-50 text-green-700",
  "Content Strategy": "bg-pink-50 text-pink-700",
  "Case Study": "bg-amber-50 text-amber-700",
  "Research": "bg-cyan-50 text-cyan-700",
  "Measurement": "bg-indigo-50 text-indigo-700",
  "GEO Audit": "bg-red-50 text-red-700",
};

export default function BlogIndex({ posts }: Props) {
  return (
    <>
      <TagSEO
        canonicalSlug="blog"
        title="GEO Blog: How to Appear on ChatGPT, Claude & Perplexity | ShowYourBrand"
        description="Expert articles on Generative Engine Optimization (GEO), AI search trends, and how to make your brand visible to ChatGPT, Claude, Perplexity, Gemini and Grok."
        og={{
          title: "GEO Blog: How to Appear on ChatGPT, Claude & Perplexity",
          description: "Expert articles on GEO strategy, AI search optimization, and how to make your brand visible across all major AI engines.",
          image: `${config.siteUrl}/og-homepage.jpeg`,
          url: `${config.siteUrl}/blog`,
        }}
      />
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "ShowYourBrand GEO Blog",
              description: "Expert articles on Generative Engine Optimization (GEO), AI search trends, and how to make your brand visible to ChatGPT, Claude, Perplexity, Gemini and Grok.",
              url: `${config.siteUrl}/blog`,
              publisher: {
                "@type": "Organization",
                name: config.appName,
                url: config.siteUrl,
                logo: {
                  "@type": "ImageObject",
                  url: `${config.siteUrl}/syb_logo_transparent.png`,
                },
              },
              hasPart: posts.map((p) => ({
                "@type": "BlogPosting",
                headline: p.title,
                url: `${config.siteUrl}/blog/${p.slug}`,
                datePublished: new Date(p.date).toISOString(),
                articleSection: p.category,
              })),
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: config.siteUrl },
                { "@type": "ListItem", position: 2, name: "Blog", item: `${config.siteUrl}/blog` },
              ],
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <Navbar />

        {/* Hero */}
        <section className="pt-32 pb-12 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 bg-purple-100 border border-purple-200 rounded-full px-4 py-1.5 mb-6">
              <span className="text-purple-700 text-sm font-semibold tracking-wide">
                GEO INSIGHTS
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4 tracking-tight">
              The GEO Blog
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Expert articles on AI search optimization, GEO strategy, and how
              to make your brand visible across all major AI models.
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="pb-24 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const categoryColor = CATEGORY_COLORS[post.category] || "bg-gray-50 text-gray-700";
                return (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <article className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col cursor-pointer">
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${categoryColor}`}>
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-400">{post.readTime}</span>
                      </div>
                      <h2 className="text-base font-semibold text-gray-900 mb-3 leading-snug flex-1 line-clamp-3">
                        {post.title}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                        <span className="text-xs font-semibold text-purple-600 group-hover:underline">
                          Read more →
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/40 py-8 px-4 bg-white/20">
          <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/syb_logo_transparent.png" alt="ShowYourBrand" width={24} height={24} />
              <span className="text-sm font-semibold text-gray-900">ShowYourBrand</span>
            </Link>
            <p className="text-sm text-gray-500">© 2026 ShowYourBrand. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const contentDir = path.join(process.cwd(), "content/blog");
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

  const posts: BlogPost[] = files
    .map((filename) => {
      const slug = filename.replace(".md", "");
      const fileContent = fs.readFileSync(path.join(contentDir, filename), "utf-8");
      const { data } = matter(fileContent);
      return {
        slug,
        title: data.title as string,
        excerpt: data.excerpt as string,
        date: data.date as string,
        category: data.category as string,
        readTime: data.readTime as string,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { props: { posts } };
};
