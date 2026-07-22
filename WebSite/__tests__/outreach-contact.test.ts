import { describe, it, expect } from "vitest";
import { extractEmail } from "@/lib/outreach/contact";

describe("extractEmail", () => {
  it("reads a mailto link on the target domain", () => {
    const html = `<a href="mailto:contact@sortiraparis.com">écrire</a>`;
    expect(extractEmail(html, "sortiraparis.com")).toBe("contact@sortiraparis.com");
  });

  it("reads a plain address in the page text", () => {
    const html = `<p>Contactez la rédaction : redaction@g2.com</p>`;
    expect(extractEmail(html, "g2.com")).toBe("redaction@g2.com");
  });

  it("prefers an editorial mailbox over a generic one", () => {
    const html = `info@site.com presse@site.com`;
    expect(extractEmail(html, "site.com")).toBe("presse@site.com");
  });

  it("prefers an address on the target's own domain", () => {
    const html = `partner@other.com hello@site.com`;
    expect(extractEmail(html, "site.com")).toBe("hello@site.com");
  });

  it("ignores no-reply and asset noise", () => {
    const html = `noreply@site.com sprite@2x.png logo@sentry.io`;
    expect(extractEmail(html, "site.com")).toBeNull();
  });

  it("returns null when no email is present", () => {
    expect(extractEmail("<p>no contact here</p>", "site.com")).toBeNull();
    expect(extractEmail("", "site.com")).toBeNull();
  });
});
