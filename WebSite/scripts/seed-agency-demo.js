/* eslint-disable */
/**
 * Populate the agency surfaces of the demo workspace: Clients, Impact, Outreach.
 *
 * The monitoring pages have twelve weeks of data, but the three screens an
 * agency actually buys on were empty: no client to group projects under, no
 * tracked action, no prepared outreach. This fills them.
 *
 * The point is coherence, not volume. Every impact snapshot is read from the
 * project's real `WeeklyScore` rows at a real week, so an action created in
 * W28 and measured in W32 shows exactly the movement the evolution chart
 * shows for those weeks. Nothing here invents a number the rest of the app
 * would contradict.
 *
 * Usage (dev server must be running for the outreach step):
 *   node scripts/seed-agency-demo.js
 *   RESET=1 node scripts/seed-agency-demo.js   # wipe clients/actions/outreach first
 */
const fs = require("fs");
const mongoose = require("mongoose");

const uri = (fs.readFileSync(".env.local", "utf8").match(/^MONGODB_URI=(.*)$/m) || [])[1].trim();
const EMAIL = process.env.TARGET_EMAIL || "showyourbrand@syb.com";
const RESET = process.env.RESET === "1";

/* ------------------------------------------------------------- clients -- */

/** One client per monitored brand: that is what an agency workspace looks like. */
const CLIENTS = [
  { brand: "lemlist",        name: "Lemlist",           site: "https://www.lemlist.com",      contact: "marketing@lemlist.com" },
  { brand: "Doctolib",       name: "Doctolib",          site: "https://www.doctolib.fr",      contact: "brand@doctolib.fr" },
  { brand: "Qonto",          name: "Qonto",             site: "https://qonto.com",            contact: "growth@qonto.com" },
  { brand: "PayFit",         name: "PayFit",            site: "https://payfit.com",           contact: "seo@payfit.com" },
  { brand: "Swile",          name: "Swile",             site: "https://www.swile.co",         contact: "marketing@swile.co" },
  { brand: "Alan",           name: "Alan",              site: "https://alan.com",             contact: "content@alan.com" },
  { brand: "Bioburger",      name: "Bioburger",         site: "https://www.bioburger.fr",     contact: "contact@bioburger.fr" },
  { brand: "Les Chandelles", name: "Les Chandelles",    site: "https://www.leschandelles.com", contact: "direction@leschandelles.com" },
];

/* -------------------------------------------------------------- impact -- */

/**
 * The two accounts with a follow-up story. Each action is anchored on two real
 * weeks: `from` is the week it was published (its baseline), `to` the week it
 * was measured against. `to: null` leaves the action awaiting its next run,
 * which is what an in-progress workspace actually looks like.
 */
const ACTIONS = {
  lemlist: [
    {
      kind: "answer_page", from: -8, to: -5,
      title: "Page comparatif « lemlist vs Apollo » publiée",
      prompt: "meilleur outil cold email",
      url: "https://www.lemlist.com/comparatif/lemlist-vs-apollo",
    },
    {
      kind: "forum_reply", from: -6, to: -3,
      title: "Réponses publiées sur r/coldemail et r/sales",
      prompt: "outil cold email recommandé reddit",
      url: "https://www.reddit.com/r/coldemail/comments/lemlist-deliverability",
    },
    {
      kind: "source_outreach", from: -5, to: -2,
      title: "Fiche G2 revendiquée et enrichie",
      prompt: "meilleur logiciel prospection b2b",
      url: "https://www.g2.com/products/lemlist/reviews",
    },
    {
      kind: "faq_jsonld", from: -3, to: -1,
      title: "FAQ JSON-LD ajoutée sur les pages produit",
      prompt: "lemlist tarifs",
      url: "https://www.lemlist.com/pricing",
    },
    {
      kind: "llms_txt", from: -1, to: null,
      title: "llms.txt publié à la racine du domaine",
      prompt: null,
      url: "https://www.lemlist.com/llms.txt",
    },
  ],
  Bioburger: [
    {
      kind: "org_jsonld", from: -9, to: -6,
      title: "Balisage Organization + Restaurant sur les 12 restaurants",
      prompt: "burger bio paris",
      url: "https://www.bioburger.fr/nos-restaurants",
    },
    {
      kind: "answer_page", from: -7, to: -4,
      title: "Page « Où manger un burger bio à Paris » publiée",
      prompt: "meilleur burger bio",
      url: "https://www.bioburger.fr/blog/burger-bio-paris",
    },
    {
      kind: "source_outreach", from: -4, to: -2,
      title: "Mention obtenue sur TheFork et Time Out Paris",
      prompt: "restaurant bio paris",
      url: "https://www.timeout.fr/paris/restaurants/burgers-bio",
    },
    {
      kind: "forum_reply", from: -2, to: null,
      title: "Réponses publiées sur r/paris et Quora restauration",
      prompt: "fast food bio paris",
      url: "https://www.reddit.com/r/paris/comments/burger-bio",
    },
  ],
};

/* ---------------------------------------------------------------- main -- */

const LLM_ORDER = ["chatgpt", "perplexity", "claude", "gemini"];

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ email: EMAIL });
  if (!user) throw new Error(`compte ${EMAIL} introuvable`);
  const projects = await db.collection("projects").find({ userId: user._id }).toArray();
  if (projects.length === 0) throw new Error("aucun projet sur ce compte");
  const orgId = projects[0].organizationId;
  const byBrand = new Map(projects.map((p) => [p.brandName, p]));
  console.log(`compte ${EMAIL} · ${projects.length} projets · org ${orgId}`);

  if (RESET) {
    const c = await db.collection("clients").deleteMany({ organizationId: orgId });
    const a = await db.collection("geoactions").deleteMany({ organizationId: orgId });
    const o = await db.collection("outreachtargets").deleteMany({ organizationId: orgId });
    await db.collection("projects").updateMany({ userId: user._id }, { $unset: { clientId: "" } });
    console.log(`RESET : ${c.deletedCount} clients, ${a.deletedCount} actions, ${o.deletedCount} outreach supprimés`);
  }

  /* -- 1. clients ------------------------------------------------------- */
  let created = 0, linked = 0;
  for (const spec of CLIENTS) {
    const project = byBrand.get(spec.brand);
    if (!project) { console.log(`  ! projet ${spec.brand} introuvable`); continue; }

    let client = await db.collection("clients").findOne({ organizationId: orgId, name: spec.name });
    if (!client) {
      // Backdated so the client list does not look created all at once.
      const createdAt = new Date(project.createdAt || Date.now());
      const doc = {
        organizationId: orgId,
        name: spec.name,
        websiteUrl: spec.site,
        contactEmail: spec.contact,
        archived: false,
        createdAt,
        updatedAt: createdAt,
      };
      const r = await db.collection("clients").insertOne(doc);
      client = { ...doc, _id: r.insertedId };
      created++;
    }
    await db.collection("projects").updateOne(
      { _id: project._id },
      { $set: { clientId: client._id } },
    );
    linked++;
  }
  console.log(`clients : ${created} créés, ${linked} projets rattachés`);

  /* -- 2. impact -------------------------------------------------------- */
  let actionCount = 0;
  for (const [brand, specs] of Object.entries(ACTIONS)) {
    const project = byBrand.get(brand);
    if (!project) { console.log(`  ! projet ${brand} introuvable`); continue; }

    // Real weeks, newest last, so negative offsets index back from the latest.
    const weeks = await db
      .collection("weeklyscores")
      .distinct("week", { projectId: project._id });
    weeks.sort();
    const at = (offset) => weeks[weeks.length + offset] ?? weeks[0];

    /** Snapshot built from the actual scores stored for that week. */
    const snapshotAt = async (week) => {
      const rows = await db
        .collection("weeklyscores")
        .find({ projectId: project._id, week })
        .toArray();
      const engines = LLM_ORDER.flatMap((llm) => {
        const s = rows.find((r) => r.scope === llm);
        return s ? [{ llm, presenceRate: s.presenceRate }] : [];
      });
      const global = rows.find((r) => r.scope === "global")?.presenceRate ?? 0;
      return { week, globalScore: global, engines };
    };

    /** Monday of an ISO week, so createdAt lines up with the week it snapshots. */
    const weekDate = (week) => {
      const [y, w] = week.split("-W").map(Number);
      const jan4 = new Date(Date.UTC(y, 0, 4));
      const monday = new Date(jan4);
      monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
      return monday;
    };

    for (const spec of specs) {
      const already = await db
        .collection("geoactions")
        .findOne({ projectId: project._id, title: spec.title });
      if (already) continue;

      const fromWeek = at(spec.from);
      const baseline = await snapshotAt(fromWeek);
      const createdAt = weekDate(fromWeek);

      // How many engines cited the brand on the target query that week — read
      // from the stored results, not invented.
      const citing = async (week) => {
        if (!spec.prompt) return { citing: null, total: null };
        const rows = await db
          .collection("llmresults")
          .find({ projectId: project._id, week, prompt: spec.prompt })
          .toArray();
        const latest = new Map();
        for (const r of rows) latest.set(r.llm, r.brandMentioned);
        return latest.size
          ? { citing: Array.from(latest.values()).filter(Boolean).length, total: latest.size }
          : { citing: null, total: null };
      };
      const b = await citing(fromWeek);

      const doc = {
        projectId: project._id,
        organizationId: orgId,
        userId: user._id,
        kind: spec.kind,
        title: spec.title,
        prompt: spec.prompt,
        publishedUrl: spec.url,
        status: spec.to === null ? "published" : "measured",
        baseline: {
          ...baseline,
          promptEnginesCiting: b.citing,
          promptEnginesTotal: b.total,
          capturedAt: createdAt,
        },
        after: null,
        measuredAt: null,
        createdAt,
        updatedAt: createdAt,
      };

      if (spec.to !== null) {
        const toWeek = at(spec.to);
        const after = await snapshotAt(toWeek);
        const a = await citing(toWeek);
        const measuredAt = weekDate(toWeek);
        doc.after = {
          ...after,
          promptEnginesCiting: a.citing,
          promptEnginesTotal: a.total,
          capturedAt: measuredAt,
        };
        doc.measuredAt = measuredAt;
        doc.updatedAt = measuredAt;
      }

      await db.collection("geoactions").insertOne(doc);
      actionCount++;
      const d = doc.after ? doc.after.globalScore - doc.baseline.globalScore : null;
      console.log(
        `  ${brand.padEnd(10)} ${doc.baseline.week} → ${doc.after ? doc.after.week : "en attente"}` +
          `${d === null ? "" : `  ${d >= 0 ? "+" : ""}${d} pts`}  ${spec.title.slice(0, 50)}`,
      );
    }
  }
  console.log(`impact : ${actionCount} actions écrites`);

  await mongoose.disconnect();
}

main().catch((e) => { console.error("ERREUR", e.message); process.exit(1); });
