import { describe, it, expect } from "vitest";
import { classifyChannel, CHANNEL_META } from "@/lib/outreach/channel";
import { buildMockDraft, type OutreachContext } from "@/lib/outreach/draft";

describe("classifyChannel", () => {
  it("maps known platforms to their channel (incl. subdomains)", () => {
    expect(classifyChannel("reddit.com")).toBe("reddit");
    expect(classifyChannel("www.reddit.com")).toBe("reddit");
    expect(classifyChannel("old.reddit.com")).toBe("reddit");
    expect(classifyChannel("fr.quora.com")).toBe("quora");
    expect(classifyChannel("medium.com")).toBe("medium");
    expect(classifyChannel("youtube.com")).toBe("youtube");
    expect(classifyChannel("news.ycombinator.com")).toBe("forum");
    expect(classifyChannel("g2.com")).toBe("review_platform");
    expect(classifyChannel("capterra.fr")).toBe("review_platform");
    expect(classifyChannel("tripadvisor.fr")).toBe("listing");
    expect(classifyChannel("fr.wikipedia.org")).toBe("wikipedia");
    expect(classifyChannel("linkedin.com")).toBe("social");
  });

  it("returns null for a regular editorial site (email discovery path)", () => {
    expect(classifyChannel("sortiraparis.com")).toBeNull();
    expect(classifyChannel("https://www.leblogdunjournaliste.fr/article")).toBeNull();
    expect(classifyChannel("")).toBeNull();
  });

  it("does not match a lookalike domain that only contains a platform name", () => {
    expect(classifyChannel("notreddit.com")).toBeNull();
    expect(classifyChannel("reddit.com.evil.net")).toBeNull();
  });
});

const base: Omit<OutreachContext, "channel"> = {
  brandName: "lemlist",
  websiteUrl: "https://www.lemlist.com",
  category: "cold email B2B",
  domain: "reddit.com",
  sampleUrl: "https://www.reddit.com/r/sales/comments/xyz",
  engines: ["chatgpt", "perplexity"],
  citations: 3,
};

describe("buildMockDraft is channel-aware", () => {
  it("email keeps a subject and an opt-out", () => {
    const d = buildMockDraft({ ...base, domain: "sortiraparis.com", channel: "email" });
    expect(d.subject).toContain("lemlist");
    expect(d.body.toUpperCase()).toContain("STOP");
    expect(d.body).not.toContain("—");
  });

  it("reddit produces a post to publish, no subject, no email STOP wording", () => {
    const d = buildMockDraft({ ...base, channel: "reddit" });
    expect(d.subject).toBe("");
    expect(d.body).toContain("lemlist");
    expect(d.body).toContain("Reddit");
    expect(d.body.toUpperCase()).not.toContain("STOP");
    expect(d.body).not.toContain("—");
  });

  it("review platform produces a listing-claim plan, not an email", () => {
    const d = buildMockDraft({ ...base, domain: "g2.com", channel: "review_platform" });
    expect(d.subject).toBe("");
    expect(d.body).toMatch(/revendiquez|fiche/i);
    expect(d.body).not.toMatch(/répondez STOP/i);
  });

  it("wikipedia stays neutral and mentions sourcing", () => {
    const d = buildMockDraft({
      ...base,
      domain: "fr.wikipedia.org",
      channel: "wikipedia",
    });
    expect(d.body).toMatch(/neutralit|source/i);
  });
});

describe("CHANNEL_META", () => {
  it("only the email channel uses an email address", () => {
    expect(CHANNEL_META.email.usesEmail).toBe(true);
    for (const kind of ["reddit", "quora", "medium", "review_platform", "listing"] as const) {
      expect(CHANNEL_META[kind].usesEmail).toBe(false);
    }
  });
});
