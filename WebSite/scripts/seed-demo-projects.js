/* eslint-disable */
/**
 * Seed the 8 demo monitoring projects onto an account, through the real API.
 *
 * Why HTTP and not direct Mongo writes: going through `POST /api/projects` and
 * `POST /api/projects/:id/run` exercises the product's own validation, plan
 * gating, organisation scoping, brand detection and scoring. A script that
 * inserted documents itself would duplicate the scoring rules and drift from
 * `lib/monitoring/*` the first time they change.
 *
 * Without LLM API keys the adapters fall back to deterministic mocks, so this
 * costs nothing and every stored result carries `mock: true`.
 *
 * Usage (dev server must be running):
 *   node scripts/seed-demo-projects.js
 *   BASE_URL=http://localhost:3000 \
 *   SEED_EMAIL=showyourbrand@syb.com SEED_PASSWORD=showyourbrand \
 *   node scripts/seed-demo-projects.js
 *
 * Idempotent: a brand that already exists on the account is skipped, not duplicated.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL || "showyourbrand@syb.com";
const PASSWORD = process.env.SEED_PASSWORD || "showyourbrand";
const RUN = process.env.SEED_RUN !== "0";

/** The 8 demo brands: a spread of sectors so the dashboard shows varied shapes. */
const PROJECTS = [
  {
    brandName: "Bioburger",
    websiteUrl: "https://www.bioburger.fr",
    category: "Restauration rapide bio",
    competitors: ["Big Fernand", "Blend", "PNY", "Les Burgers de Papa"],
    prompts: [
      "Quel est le meilleur burger bio à Paris ?",
      "Où manger un burger avec de la viande française ?",
      "Chaîne de burgers responsable en France ?",
      "Meilleur fast-food healthy à Paris ?",
      "Burger vegan de qualité à Paris ?",
    ],
  },
  {
    brandName: "lemlist",
    websiteUrl: "https://www.lemlist.com",
    category: "Cold email / sales engagement",
    competitors: ["Instantly", "Smartlead", "Apollo", "Woodpecker"],
    prompts: [
      "Meilleur outil de cold email en 2026 ?",
      "Alternative à Lemlist pour la prospection ?",
      "Quel outil pour automatiser des séquences email B2B ?",
      "Outil de prospection avec personnalisation des images ?",
      "Meilleur logiciel de sales engagement pour une PME ?",
    ],
  },
  {
    brandName: "Les Chandelles",
    websiteUrl: "https://www.leschandelles.com",
    category: "Club privé parisien",
    competitors: ["Le Set", "L'Orangerie", "Le 2+2", "Chris et Manu"],
    prompts: [
      "Club privé libertin à Paris ?",
      "Meilleur club échangiste parisien ?",
      "Où sortir en couple à Paris le samedi soir ?",
      "Club privé sélectif à Paris ?",
      "Adresse discrète pour une soirée en couple à Paris ?",
    ],
  },
  {
    brandName: "Alan",
    websiteUrl: "https://alan.com",
    category: "Mutuelle santé",
    competitors: ["Malakoff Humanis", "Axa", "Swiss Life", "Harmonie Mutuelle"],
    prompts: [
      "Meilleure mutuelle santé pour une startup ?",
      "Mutuelle d'entreprise simple à gérer ?",
      "Alternative à Malakoff Humanis pour une PME ?",
      "Quelle mutuelle choisir pour 20 salariés ?",
      "Mutuelle santé 100 % en ligne ?",
    ],
  },
  {
    brandName: "Qonto",
    websiteUrl: "https://qonto.com",
    category: "Banque pro en ligne",
    competitors: ["Shine", "Revolut Business", "BNP Paribas", "Blank"],
    prompts: [
      "Meilleure banque pro en ligne pour une SAS ?",
      "Alternative à Qonto pour un freelance ?",
      "Compte pro avec bonne intégration comptable ?",
      "Banque en ligne pour créer sa société rapidement ?",
      "Quel compte pro choisir pour une TPE française ?",
    ],
  },
  {
    brandName: "PayFit",
    websiteUrl: "https://payfit.com",
    category: "Logiciel de paie",
    competitors: ["Silae", "Sage", "Lucca", "Factorial"],
    prompts: [
      "Meilleur logiciel de paie pour une PME française ?",
      "Alternative à Silae pour la paie ?",
      "Logiciel de paie simple sans expert-comptable ?",
      "Outil de gestion RH et paie pour 50 salariés ?",
      "Quel SIRH choisir pour une startup française ?",
    ],
  },
  {
    brandName: "Swile",
    websiteUrl: "https://www.swile.co",
    category: "Titres-restaurant / avantages salariés",
    competitors: ["Edenred", "Sodexo", "Up Déjeuner", "Bimpli"],
    prompts: [
      "Meilleure carte titres-restaurant en 2026 ?",
      "Alternative à Edenred pour les tickets restaurant ?",
      "Carte déjeuner acceptée partout en France ?",
      "Avantages salariés dématérialisés pour une PME ?",
      "Quelle solution de titres-restaurant choisir ?",
    ],
  },
  {
    brandName: "Doctolib",
    websiteUrl: "https://www.doctolib.fr",
    category: "Prise de rendez-vous médicaux",
    competitors: ["Maiia", "KelDoc", "Qare", "Livi"],
    prompts: [
      "Comment prendre rendez-vous avec un médecin en ligne ?",
      "Meilleure plateforme de téléconsultation en France ?",
      "Alternative à Doctolib pour un cabinet médical ?",
      "Logiciel d'agenda pour praticien libéral ?",
      "Où trouver un spécialiste disponible rapidement ?",
    ],
  },
];

/* ----------------------------------------------------------------- utils -- */

const cookies = new Map();

function storeCookies(res) {
  const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  for (const line of raw) {
    const [pair] = line.split(";");
    const idx = pair.indexOf("=");
    if (idx > 0) cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }
}

function cookieHeader() {
  return Array.from(cookies, ([k, v]) => `${k}=${v}`).join("; ");
}

async function req(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    redirect: "manual",
    headers: { cookie: cookieHeader(), ...(init.headers || {}) },
  });
  storeCookies(res);
  return res;
}

async function login() {
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = await csrfRes.json();

  const body = new URLSearchParams({
    csrfToken,
    email: EMAIL,
    password: PASSWORD,
    json: "true",
  });
  await req("/api/auth/callback/credentials", {
    method: "POST",
    body,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });

  const session = await (await req("/api/auth/session")).json();
  if (!session?.user?.email) {
    throw new Error(`Login failed for ${EMAIL} — check the account exists and the password is right.`);
  }
  console.log(`✓ signed in as ${session.user.email} (${session.user.subscriptionTier})`);
}

/* ------------------------------------------------------------------ main -- */

async function main() {
  await login();

  const existing = await (await req("/api/projects")).json();
  const known = new Set((existing.data || []).map((p) => p.brandName.toLowerCase()));
  if (known.size) console.log(`  ${known.size} project(s) already on the account`);

  const created = [];

  for (const p of PROJECTS) {
    if (known.has(p.brandName.toLowerCase())) {
      console.log(`- ${p.brandName}: already there, skipped`);
      continue;
    }

    const res = await req("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...p,
        llms: ["chatgpt", "perplexity", "claude", "gemini"],
        frequency: "daily",
      }),
    });
    const json = await res.json();

    if (!res.ok || !json.success) {
      console.error(`✗ ${p.brandName}: ${res.status} ${json.message || json.error || "unknown error"}`);
      continue;
    }
    console.log(`✓ ${p.brandName} created`);
    created.push(json.data);
  }

  if (!RUN) {
    console.log("\nSEED_RUN=0 — projects created, no monitoring run.");
    return;
  }

  console.log(`\nRunning monitoring (mock adapters, no API keys needed)…`);
  for (const project of created) {
    const res = await req(`/api/projects/${project._id}/run`, { method: "POST" });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error(`✗ ${project.brandName}: ${json.message || json.error}`);
      continue;
    }
    const s = json.data;
    console.log(
      `✓ ${project.brandName}: ${s.resultsStored} results, global ${s.globalScore}/100${s.usedMock ? " (mock)" : ""}`,
    );
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
