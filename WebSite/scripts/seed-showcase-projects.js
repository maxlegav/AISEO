/* eslint-disable */
/**
 * Recreate the two showcase projects with hand-written queries.
 *
 * Unlike `seed-demo-projects.js` (8 brands, template prompts), these two are
 * authored: the queries below are what someone actually types for these two
 * businesses, and the answers come from the market model in
 * `lib/llm/demo-answers.ts` rather than a hash. The point is a dashboard whose
 * story holds up — Bioburger owning the "bio" family while losing the generic
 * burger query, Les Chandelles strong on Perplexity and nearly invisible in
 * Google's AI Overview.
 *
 * Usage (dev server must be running):
 *   node scripts/seed-showcase-projects.js
 *   RESET=1 node scripts/seed-showcase-projects.js   # delete + recreate
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL || "showyourbrand@syb.com";
const PASSWORD = process.env.SEED_PASSWORD || "showyourbrand";

/* ------------------------------------------------------------ Bioburger -- */

const BIOBURGER_PROMPTS = [
  // — génériques, la façon dont on tape vraiment
  "meilleur burger paris",
  "meilleurs burgers paris",
  "bon burger paris",
  "top burger paris",
  "burger paris",
  "où manger un burger à paris",
  "meilleur burger france",
  "chaine de burger france",
  "burger paris 2026",
  "classement burger paris",
  "comparatif chaines burger",
  "burger paris centre",
  "burger paris pas cher",
  "burger paris livraison",
  "burger à emporter paris",
  "meilleur cheeseburger paris",
  "burger gourmet paris",
  "burger artisanal paris",
  "restaurant burger paris",
  "fast food paris",

  // — la famille bio / végé, le positionnement de la marque
  "burger bio paris",
  "meilleur burger bio",
  "burger bio france",
  "fast food bio paris",
  "fast food bio france",
  "restaurant bio paris",
  "burger vegan paris",
  "meilleur burger vegan paris",
  "burger végétarien paris",
  "meilleur burger végétarien",
  "burger sans viande paris",
  "fast food healthy paris",
  "manger sain rapidement paris",
  "burger healthy paris",
  "restauration rapide bio",
  "chaine fast food bio",
  "burger bio pas cher",
  "burger bio livraison",
  "où manger bio rapidement à paris",
  "fast food responsable paris",

  // — viande française / circuit court
  "burger viande française",
  "burger viande francaise paris",
  "restaurant viande française paris",
  "burger circuit court",
  "burger local paris",
  "burger produits locaux",
  "restaurant durable paris",
  "fast food responsable",
  "burger éthique paris",
  "restaurant engagé paris",

  // — questions telles qu'on les pose à un assistant
  "quel est le meilleur burger de paris ?",
  "quel burger bio choisir à paris ?",
  "où manger un bon burger bio ?",
  "peux-tu me conseiller un burger à paris ?",
  "quelle chaine de burger est la plus saine ?",
  "quel fast food est vraiment bio ?",
  "existe-t-il un fast food bio en france ?",
  "quel burger pour un végétarien à paris ?",
  "quels burgers éviter à paris ?",
  "quel burger avec de la viande française ?",
  "combien coûte un burger à paris ?",
  "quel burger pour un déjeuner rapide ?",
  "quelle est la meilleure chaine de burgers en france ?",
  "où trouver un burger bio près de moi ?",

  // — comparaisons nommées
  "alternative à big fernand",
  "alternatives à big fernand",
  "big fernand ou bioburger",
  "big fernand avis",
  "concurrent de big fernand",
  "mieux que big fernand",
  "alternative à blend",
  "blend ou bioburger",
  "blend avis",
  "alternative à pny",
  "pny ou bioburger",
  "pny avis",
  "les burgers de papa avis",
  "alternative aux burgers de papa",
  "big fernand ou blend",
  "quelle différence entre big fernand et blend ?",
  "big fernand vs bioburger : lequel choisir ?",

  // — requêtes de marque
  "bioburger",
  "bioburger avis",
  "bioburger prix",
  "bioburger paris",
  "bioburger adresses",
  "bioburger carte",
  "bioburger menu",
  "bioburger c'est bien ?",
  "bioburger est-il vraiment bio ?",
  "qui est bioburger ?",
  "avis clients sur bioburger",
  "bioburger livraison",

  // — prix / budget
  "burger pas cher paris",
  "menu burger prix paris",
  "burger midi pas cher paris",
  "fast food pas cher paris",
  "burger bon rapport qualité prix paris",

  // — longue traîne
  "meilleur burger pour un déjeuner d'affaires à paris",
  "burger bio pour emporter au bureau",
  "où manger un burger bio en famille à paris",
  "burger sans gluten paris",
  "restaurant burger avec option végane paris",
];

/* ------------------------------------------------------ Les Chandelles -- */

const CHANDELLES_PROMPTS = [
  // — génériques du secteur, formulations courtes
  "club libertin paris",
  "meilleur club libertin paris",
  "club échangiste paris",
  "meilleur club échangiste paris",
  "club privé paris",
  "meilleur club privé paris",
  "club libertin france",
  "club libertin paris avis",
  "club échangiste avis",
  "club privé paris avis",
  "club libertin paris prix",
  "club échangiste paris tarif",
  "club libertin paris centre",
  "club privé paris centre",
  "club libertin sélectif paris",
  "club libertin haut de gamme paris",
  "club libertin chic paris",
  "club libertin paris 2026",
  "classement club libertin paris",
  "comparatif clubs libertins paris",
  "top clubs privés paris",
  "liste clubs libertins paris",

  // — usage / conditions, ce que les gens veulent vraiment savoir
  "club libertin paris réservation",
  "club libertin paris horaires",
  "club libertin paris dress code",
  "club libertin paris conditions d'entrée",
  "club libertin paris tarif couple",
  "club libertin paris homme seul",
  "club libertin paris femme seule",
  "comment entrer dans un club libertin",
  "faut-il réserver dans un club libertin",
  "club libertin ouvert ce soir paris",
  "club libertin paris samedi",
  "club libertin paris vendredi",

  // — sortie / nuit, la famille où la marque se noie
  "sortir en couple paris",
  "où sortir à paris ce soir",
  "sortie originale en couple paris",
  "soirée en couple paris",
  "boite de nuit paris",
  "sortie coquine paris",
  "sortie insolite paris",
  "soirée privée paris",
  "où sortir le samedi soir à paris",
  "adresse discrète paris couple",

  // — questions posées à un assistant
  "quel est le meilleur club libertin de paris ?",
  "quel club libertin choisir à paris ?",
  "quels sont les clubs libertins les plus réputés à paris ?",
  "peux-tu me recommander un club privé à paris ?",
  "quel club libertin pour une première fois ?",
  "quel club libertin est le plus sélectif à paris ?",
  "quel club privé accepte les couples débutants ?",
  "quel est le club libertin le plus connu de paris ?",
  "combien coûte l'entrée d'un club libertin à paris ?",
  "comment se passe une soirée en club libertin ?",
  "quels clubs libertins éviter à paris ?",
  "quel club libertin a la meilleure réputation ?",
  "à quoi faire attention avant d'aller en club libertin ?",
  "quelle différence entre club libertin et club échangiste ?",

  // — longue traîne
  "le club libertin le plus réputé de paris",
  "le club privé le plus sélectif de paris",
  "club libertin paris pour couple débutant",
  "club libertin paris ambiance chic",
  "club libertin historique paris",
  "club libertin paris avec restaurant",
  "club libertin paris petit comité",
  "club privé paris ambiance feutrée",

  // — comparaisons nommées
  "alternative au set",
  "le set avis",
  "le set ou les chandelles",
  "concurrent du set",
  "alternative à l'orangerie",
  "l'orangerie avis",
  "l'orangerie ou les chandelles",
  "alternative au 2+2",
  "le 2+2 avis",
  "le 2+2 ou les chandelles",
  "chris et manu avis",
  "alternative à chris et manu",
  "le set ou l'orangerie",
  "quelle différence entre le set et les chandelles ?",
  "quel est le meilleur entre les chandelles et le set ?",

  // — requêtes de marque
  "les chandelles",
  "les chandelles paris",
  "les chandelles avis",
  "les chandelles prix",
  "les chandelles tarif",
  "les chandelles réservation",
  "les chandelles horaires",
  "les chandelles adresse",
  "les chandelles dress code",
  "les chandelles c'est bien ?",
  "les chandelles ça vaut le coup ?",
  "qui est les chandelles ?",
  "avis clients sur les chandelles",
  "retour d'expérience sur les chandelles",
  "les chandelles club privé paris",
];

/* ------------------------------------------------------------- projects -- */

const PROJECTS = [
  {
    brandName: "Bioburger",
    websiteUrl: "https://www.bioburger.fr",
    category: "Restauration rapide bio",
    competitors: ["Big Fernand", "Blend", "PNY", "Les Burgers de Papa"],
    prompts: BIOBURGER_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "Les Chandelles",
    websiteUrl: "https://www.leschandelles.com",
    category: "Club privé parisien",
    competitors: ["Le Set", "L'Orangerie", "Le 2+2", "Chris et Manu"],
    prompts: CHANDELLES_PROMPTS,
    frequency: "daily",
  },
];

/* ----------------------------------------------------------------- http -- */

const cookies = new Map();

function storeCookies(res) {
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const i = pair.indexOf("=");
    if (i > 0) cookies.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

async function req(path, init = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    redirect: "manual",
    headers: {
      cookie: Array.from(cookies, ([k, v]) => `${k}=${v}`).join("; "),
      ...(init.headers || {}),
    },
  });
  storeCookies(res);
  return res;
}

async function login() {
  const { csrfToken } = await (await req("/api/auth/csrf")).json();
  await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken, email: EMAIL, password: PASSWORD, json: "true" }),
  });
  const session = await (await req("/api/auth/session")).json();
  if (!session?.user?.email) throw new Error(`Connexion impossible pour ${EMAIL}`);
  console.log(`✓ connecté : ${session.user.email}`);
}

async function main() {
  await login();

  const existing = await (await req("/api/projects")).json();
  const byName = new Map((existing.data || []).map((p) => [p.brandName, p]));

  for (const spec of PROJECTS) {
    const already = byName.get(spec.brandName);
    if (already) {
      if (process.env.RESET !== "1") {
        console.log(`- ${spec.brandName} : déjà présent (RESET=1 pour recréer)`);
        continue;
      }
      await req(`/api/projects/${already._id}`, { method: "DELETE" });
      console.log(`  ${spec.brandName} : ancien projet supprimé`);
    }

    const res = await req("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...spec,
        llms: ["chatgpt", "aio", "perplexity", "gemini", "claude"],
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      console.error(`✗ ${spec.brandName} : ${json.message || json.error || res.status}`);
      continue;
    }
    console.log(`✓ ${spec.brandName} créé — ${spec.prompts.length} requêtes écrites à la main`);

    const run = await (
      await req(`/api/projects/${json.data._id}/run`, { method: "POST" })
    ).json();
    if (!run?.success) {
      console.error(`  ✗ analyse : ${run?.message || run?.error}`);
      continue;
    }
    console.log(
      `  → ${run.data.resultsStored} résultats, score global ${run.data.globalScore}/100`,
    );
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
