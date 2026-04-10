import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { GetStaticProps, GetStaticPaths } from "next";
import TagSEO from "@/components/TagSEO";
import Navbar from "@/components/Navbar";
import { BlogPost } from "./index";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import config from "@/config";

interface Props {
  post: BlogPost;
  content: string;
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
  Research: "bg-cyan-50 text-cyan-700",
  Measurement: "bg-indigo-50 text-indigo-700",
  "GEO Audit": "bg-red-50 text-red-700",
};

// Simple but robust markdown-to-HTML renderer
function renderMarkdown(md: string): string {
  const lines = md.trim().split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Code block
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").trimStart().startsWith("```")) {
        codeLines.push(
          (lines[i] ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
        );
        i++;
      }
      output.push(
        `<pre class="bg-gray-900 text-emerald-400 rounded-xl p-5 overflow-x-auto text-sm my-6 leading-relaxed font-mono"><code>${codeLines.join("\n")}</code></pre>`
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      const text = inlineFormat(line.slice(3));
      output.push(
        `<h2 class="text-2xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b border-gray-100">${text}</h2>`
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      const text = inlineFormat(line.slice(4));
      output.push(
        `<h3 class="text-lg font-semibold text-gray-900 mt-8 mb-3">${text}</h3>`
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (/^-{3,}$/.test(line.trim())) {
      output.push('<hr class="border-gray-200 my-8" />');
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const text = inlineFormat(line.slice(2));
      output.push(
        `<blockquote class="border-l-4 border-purple-400 pl-4 py-1 my-4 text-gray-600 italic bg-purple-50/40 rounded-r-lg">${text}</blockquote>`
      );
      i++;
      continue;
    }

    // Unordered list
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("- ")) {
        items.push(
          `<li class="flex gap-2.5 items-start"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0"></span><span>${inlineFormat((lines[i] ?? "").slice(2))}</span></li>`
        );
        i++;
      }
      output.push(
        `<ul class="my-4 space-y-2 text-gray-700">${items.join("")}</ul>`
      );
      continue;
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i] ?? "")) {
        const text = (lines[i] ?? "").replace(/^\d+\.\s/, "");
        items.push(
          `<li class="flex gap-3 items-start"><span class="mt-0.5 w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0">${num}</span><span class="text-gray-700">${inlineFormat(text)}</span></li>`
        );
        num++;
        i++;
      }
      output.push(`<ol class="my-4 space-y-3">${items.join("")}</ol>`);
      continue;
    }

    // Table
    if (line.startsWith("|")) {
      const rows: string[] = [];
      let isFirst = true;
      while (i < lines.length && (lines[i] ?? "").startsWith("|")) {
        const row = lines[i] ?? "";
        if (/^\|[-| ]+\|$/.test(row.trim())) {
          i++;
          continue; // separator row
        }
        const cells = row
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (isFirst) {
          rows.push(
            `<tr>${cells.map((c) => `<th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50 border-b border-gray-200">${inlineFormat(c)}</th>`).join("")}</tr>`
          );
          isFirst = false;
        } else {
          rows.push(
            `<tr class="border-b border-gray-100 hover:bg-gray-50/50">${cells.map((c) => `<td class="px-4 py-3 text-sm text-gray-600">${inlineFormat(c)}</td>`).join("")}</tr>`
          );
        }
        i++;
      }
      output.push(
        `<div class="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm"><table class="w-full text-sm">${rows.join("")}</table></div>`
      );
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    output.push(
      `<p class="text-gray-700 leading-relaxed my-3">${inlineFormat(line)}</p>`
    );
    i++;
  }

  return output.join("\n");
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class=\"font-semibold text-gray-900\">$1</strong>")
    .replace(/\*(.*?)\*/g, "<em class=\"italic\">$1</em>")
    .replace(/`([^`]+)`/g, "<code class=\"bg-gray-100 text-purple-700 px-1.5 py-0.5 rounded text-sm font-mono\">$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener">$1</a>');
}

export default function BlogPostPage({ post, content }: Props) {
  const categoryColor =
    CATEGORY_COLORS[post.category] || "bg-gray-50 text-gray-700";

  return (
    <>
      <TagSEO
        canonicalSlug={`blog/${post.slug}`}
        title={`${post.title} – ShowYourBrand Blog`}
        description={post.excerpt}
        og={{
          title: `${post.title} – ShowYourBrand Blog`,
          description: post.excerpt,
          image: `${config.siteUrl}/og-homepage.jpeg`,
          url: `${config.siteUrl}/blog/${post.slug}`,
        }}
      >
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={new Date(post.date).toISOString()} />
        <meta property="article:section" content={post.category} />
        <meta property="article:tag" content="GEO" />
        <meta property="article:tag" content="Generative Engine Optimization" />
        <meta property="article:tag" content={post.category} />
      </TagSEO>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              image: `${config.siteUrl}/og-homepage.jpeg`,
              url: `${config.siteUrl}/blog/${post.slug}`,
              datePublished: new Date(post.date).toISOString(),
              dateModified: new Date(post.date).toISOString(),
              author: {
                "@type": "Organization",
                name: "ShowYourBrand",
                url: config.siteUrl,
              },
              publisher: {
                "@type": "Organization",
                name: "ShowYourBrand",
                url: config.siteUrl,
                logo: {
                  "@type": "ImageObject",
                  url: `${config.siteUrl}/syb_logo_transparent.png`,
                },
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `${config.siteUrl}/blog/${post.slug}`,
              },
              articleSection: post.category,
              keywords: `GEO, Generative Engine Optimization, AI search, ${post.category}`,
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-100 via-40% to-orange-100">
        <Navbar />

        {/* Content */}
        <div className="pt-24 pb-24 px-4">
          <div className="container mx-auto max-w-3xl">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
              <Link href="/blog" className="hover:text-purple-600 transition-colors font-medium">
                ← Blog
              </Link>
              <span>/</span>
              <span className="text-gray-400 truncate max-w-xs">{post.category}</span>
            </div>

            {/* Article card */}
            <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Article Header */}
              <div className="p-8 md:p-12 pb-8 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-5">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${categoryColor}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-400">{post.readTime}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-400">{formatDate(post.date)}</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  {post.title}
                </h1>

                <p className="text-lg text-gray-500 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Article Body */}
              <div
                className="p-8 md:p-12 pt-8"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
              />

              {/* CTA Banner */}
              <div className="mx-8 md:mx-12 mb-10 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#334155] p-8 text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80 text-xs font-semibold tracking-wide">GEO AUDIT</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready to see how AI describes your brand?
                </h3>
                <p className="text-gray-300 text-sm mb-6 max-w-md mx-auto">
                  100 prompts across all major AI engines. Full technical scan. Prioritized action plan. Starts at €29.
                </p>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-2 bg-white text-[#1E293B] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors text-sm shadow-lg"
                >
                  See our pricing →
                </Link>
              </div>
            </article>

            {/* Back to blog */}
            <div className="mt-8 text-center">
              <Link
                href="/blog"
                className="text-sm text-gray-500 hover:text-purple-600 transition-colors font-medium"
              >
                ← Back to all articles
              </Link>
            </div>
          </div>
        </div>

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

export const getStaticPaths: GetStaticPaths = async () => {
  const contentDir = path.join(process.cwd(), "content/blog");
  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));
  const paths = files.map((f) => ({ params: { slug: f.replace(".md", "") } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const filePath = path.join(process.cwd(), "content/blog", `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const post: BlogPost = {
    slug,
    title: data.title as string,
    excerpt: data.excerpt as string,
    date: data.date as string,
    category: data.category as string,
    readTime: data.readTime as string,
  };

  return { props: { post, content } };
};
