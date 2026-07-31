/* eslint-disable */
/**
 * Recreate the demo projects with hand-written queries.
 *
 * Everything here is authored rather than generated: the queries are what
 * someone actually types for each business, and the answers come from the
 * market model in `lib/llm/demo-answers.ts` — real competitors, real sector
 * sources, per-engine standing — rather than a hash. That is what makes the
 * demo dashboards hold up under a practitioner's eye: Bioburger owns the "bio"
 * family and loses the generic burger query, PayFit loses to Silae on the
 * accountant channel, Swile loses to Edenred on the regulatory queries.
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

/* ----------------------------------------------------------------- Alan -- */

const ALAN_PROMPTS = [
  "meilleure mutuelle santé",
  "meilleure mutuelle entreprise",
  "mutuelle entreprise obligatoire",
  "mutuelle pme",
  "mutuelle tpe",
  "mutuelle startup",
  "mutuelle collective pas chère",
  "mutuelle entreprise comparatif",
  "comparatif mutuelle entreprise 2026",
  "classement mutuelles santé",
  "mutuelle entreprise prix",
  "mutuelle entreprise tarif salarié",
  "changer de mutuelle entreprise",
  "résilier mutuelle entreprise",
  "mutuelle santé en ligne",
  "mutuelle 100% en ligne",
  "mutuelle digitale entreprise",
  "mutuelle simple à gérer",
  "mutuelle sans paperasse",
  "mutuelle moderne entreprise",
  "mutuelle remboursement rapide",
  "mutuelle avec application mobile",
  "quelle mutuelle choisir pour une entreprise ?",
  "quelle mutuelle pour une startup ?",
  "quelle mutuelle pour 20 salariés ?",
  "comment choisir une mutuelle d'entreprise ?",
  "quelle est la meilleure mutuelle santé en france ?",
  "quelle mutuelle rembourse le mieux ?",
  "combien coûte une mutuelle d'entreprise ?",
  "quelle mutuelle pour les indépendants ?",
  "quelles mutuelles éviter ?",
  "alternative à malakoff humanis",
  "alternative à harmonie mutuelle",
  "alternative à axa mutuelle",
  "malakoff humanis avis",
  "harmonie mutuelle avis",
  "axa ou alan",
  "malakoff humanis ou alan",
  "alan",
  "alan mutuelle",
  "alan avis",
  "alan prix",
  "alan tarif entreprise",
  "alan remboursement",
  "alan c'est bien ?",
  "alan est-il fiable ?",
  "avis clients sur alan",
  "alan ou malakoff humanis pour une pme",
  "mutuelle entreprise avec téléconsultation incluse",
  "mutuelle entreprise pour salariés à distance",
];

/* ---------------------------------------------------------------- Qonto -- */

const QONTO_PROMPTS = [
  "meilleure banque pro",
  "meilleure banque pro en ligne",
  "banque pro sas",
  "banque pro sasu",
  "banque pro auto entrepreneur",
  "banque pro freelance",
  "compte pro en ligne",
  "compte pro pas cher",
  "compte pro gratuit",
  "ouvrir un compte pro rapidement",
  "compte pro pour créer sa société",
  "banque pro comparatif",
  "comparatif banques pro 2026",
  "classement banques professionnelles",
  "banque pro tarif",
  "compte pro prix",
  "banque pro avec dépôt d'espèces",
  "banque pro avec chéquier",
  "banque pro agence physique",
  "compte pro avec intégration comptable",
  "banque pro avec facturation intégrée",
  "compte pro multi-devises",
  "quelle banque pro choisir pour une sas ?",
  "quelle banque pour un freelance ?",
  "quelle banque pro pour une tpe ?",
  "comment ouvrir un compte pro en ligne ?",
  "quelle est la meilleure néobanque pro ?",
  "quelle banque pro pour déposer le capital social ?",
  "combien coûte un compte pro ?",
  "quelles banques pro éviter ?",
  "alternative à qonto",
  "alternatives à qonto",
  "alternative à shine",
  "shine avis",
  "shine ou qonto",
  "revolut business avis",
  "revolut business ou qonto",
  "blank avis",
  "concurrent de qonto",
  "qonto",
  "qonto avis",
  "qonto prix",
  "qonto tarif",
  "qonto c'est bien ?",
  "qonto est-il fiable ?",
  "qonto dépôt de capital",
  "avis clients sur qonto",
  "banque pro pour une société qui facture à l'étranger",
  "compte pro avec cartes pour les salariés",
  "banque pro avec bon service client",
];

/* --------------------------------------------------------------- PayFit -- */

const PAYFIT_PROMPTS = [
  "meilleur logiciel de paie",
  "logiciel de paie pme",
  "logiciel de paie tpe",
  "logiciel de paie startup",
  "logiciel paie france",
  "logiciel de paie en ligne",
  "logiciel paie automatisé",
  "logiciel de paie simple",
  "logiciel paie sans expert-comptable",
  "logiciel paie comparatif",
  "comparatif logiciels de paie 2026",
  "classement logiciels de paie",
  "logiciel de paie prix",
  "logiciel paie tarif par salarié",
  "logiciel de paie expert-comptable",
  "logiciel paie cabinet comptable",
  "sirh pme",
  "meilleur sirh",
  "logiciel rh et paie",
  "logiciel gestion congés et paie",
  "logiciel paie et notes de frais",
  "quel logiciel de paie choisir ?",
  "quel logiciel de paie pour une pme ?",
  "quel logiciel de paie pour 50 salariés ?",
  "comment automatiser la paie ?",
  "faut-il un expert-comptable avec un logiciel de paie ?",
  "quel sirh pour une startup ?",
  "combien coûte un logiciel de paie ?",
  "quels logiciels de paie éviter ?",
  "quel logiciel de paie est le plus simple ?",
  "alternative à silae",
  "alternatives à silae",
  "silae avis",
  "silae ou payfit",
  "alternative à sage paie",
  "sage paie avis",
  "lucca avis",
  "factorial avis",
  "concurrent de payfit",
  "payfit",
  "payfit avis",
  "payfit prix",
  "payfit tarif",
  "payfit c'est bien ?",
  "payfit est-il fiable ?",
  "avis clients sur payfit",
  "payfit ou silae pour une pme",
  "logiciel de paie pour une entreprise en croissance",
  "logiciel de paie avec déclarations sociales automatiques",
  "logiciel de paie multi-conventions collectives",
];

/* ---------------------------------------------------------------- Swile -- */

const SWILE_PROMPTS = [
  "meilleure carte titre restaurant",
  "carte titre restaurant",
  "titre restaurant entreprise",
  "ticket restaurant entreprise",
  "titres restaurant dématérialisés",
  "carte déjeuner salariés",
  "titre restaurant application",
  "titre restaurant appli mobile",
  "carte restaurant moderne",
  "titre restaurant papier",
  "carnet titres restaurant",
  "titre restaurant comparatif",
  "comparatif titres restaurant 2026",
  "classement cartes titres restaurant",
  "titre restaurant prix employeur",
  "titre restaurant plafond",
  "titre restaurant urssaf",
  "titre restaurant réglementation",
  "avantages salariés entreprise",
  "carte cadeau salariés",
  "titre restaurant accepté partout",
  "quelle carte titre restaurant choisir ?",
  "quel titre restaurant pour une pme ?",
  "comment mettre en place les titres restaurant ?",
  "quel est le meilleur titre restaurant ?",
  "combien coûte un titre restaurant pour l'employeur ?",
  "quels titres restaurant sont acceptés partout ?",
  "faut-il passer aux titres restaurant dématérialisés ?",
  "quels titres restaurant éviter ?",
  "alternative à edenred",
  "alternatives à edenred",
  "edenred avis",
  "edenred ou swile",
  "alternative à pluxee",
  "pluxee avis",
  "up déjeuner avis",
  "bimpli avis",
  "concurrent de swile",
  "swile",
  "swile avis",
  "swile prix",
  "swile tarif entreprise",
  "swile c'est bien ?",
  "swile carte acceptée où ?",
  "avis clients sur swile",
  "swile ou edenred pour une startup",
  "titre restaurant avec application de paiement mobile",
  "solution avantages salariés tout en un",
  "carte titre restaurant pour salariés en télétravail",
];

/* ------------------------------------------------------------- Doctolib -- */

const DOCTOLIB_PROMPTS = [
  "prendre rendez-vous médecin en ligne",
  "rendez-vous médecin en ligne",
  "trouver un médecin rapidement",
  "trouver un généraliste près de chez moi",
  "rendez-vous dentiste en ligne",
  "rendez-vous dermatologue",
  "rendez-vous ophtalmologue rapidement",
  "prendre rdv spécialiste",
  "plateforme rendez-vous médical",
  "site prise de rendez-vous médecin",
  "application rendez-vous médecin",
  "annuaire médecins france",
  "téléconsultation",
  "téléconsultation médecin",
  "meilleure téléconsultation",
  "consultation médecin à distance",
  "ordonnance en ligne",
  "médecin en ligne remboursé",
  "téléconsultation sans rendez-vous",
  "téléconsultation nuit et week-end",
  "logiciel agenda médecin",
  "logiciel gestion cabinet médical",
  "logiciel rendez-vous praticien libéral",
  "agenda en ligne kinésithérapeute",
  "comment prendre rendez-vous avec un médecin en ligne ?",
  "quelle est la meilleure plateforme de rendez-vous médical ?",
  "quelle application pour trouver un médecin ?",
  "comment faire une téléconsultation ?",
  "la téléconsultation est-elle remboursée ?",
  "quel logiciel pour un cabinet médical ?",
  "comment trouver un médecin qui accepte de nouveaux patients ?",
  "quelle alternative à doctolib pour un praticien ?",
  "alternative à doctolib",
  "alternatives à doctolib",
  "concurrent de doctolib",
  "maiia avis",
  "maiia ou doctolib",
  "keldoc avis",
  "qare avis",
  "qare ou doctolib",
  "livi avis",
  "doctolib",
  "doctolib avis",
  "doctolib prix praticien",
  "doctolib tarif",
  "doctolib c'est bien ?",
  "doctolib téléconsultation",
  "avis praticiens sur doctolib",
  "plateforme de rendez-vous pour un cabinet de plusieurs praticiens",
  "solution de rendez-vous médical avec rappel sms",
];

/* -------------------------------------------------------------- lemlist -- */

const LEMLIST_PROMPTS = [
  "meilleur outil cold email",
  "outil cold email",
  "logiciel cold email",
  "outil prospection email",
  "outil emailing b2b",
  "séquence email automatisée",
  "outil de prospection commerciale",
  "sales engagement platform",
  "outil cold email français",
  "cold email comparatif",
  "comparatif outils cold email 2026",
  "classement outils de prospection",
  "outil cold email prix",
  "outil cold email gratuit",
  "délivrabilité cold email",
  "éviter les spams cold email",
  "warmup email",
  "chauffe de boîte mail",
  "outil cold email avec warmup",
  "base de données prospects b2b",
  "outil enrichissement de contacts",
  "trouver des emails professionnels",
  "quel outil pour du cold email ?",
  "quel est le meilleur outil de prospection email ?",
  "comment automatiser sa prospection email ?",
  "comment améliorer la délivrabilité de ses emails ?",
  "quel outil de cold email pour une petite équipe ?",
  "combien coûte un outil de cold email ?",
  "quels outils de prospection éviter ?",
  "quel outil combine base de données et envoi ?",
  "alternative à lemlist",
  "alternatives à lemlist",
  "concurrent de lemlist",
  "instantly avis",
  "instantly ou lemlist",
  "smartlead avis",
  "smartlead ou lemlist",
  "apollo avis",
  "apollo ou lemlist",
  "woodpecker avis",
  "lemlist",
  "lemlist avis",
  "lemlist prix",
  "lemlist tarif",
  "lemlist c'est bien ?",
  "lemlist est-il efficace ?",
  "avis clients sur lemlist",
  "outil cold email avec personnalisation des images",
  "outil de prospection multicanal email et linkedin",
  "outil cold email pour une agence",
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
  {
    brandName: "Alan",
    websiteUrl: "https://alan.com",
    category: "Mutuelle santé d'entreprise",
    competitors: ["Malakoff Humanis", "Harmonie Mutuelle", "Axa", "Swiss Life"],
    prompts: ALAN_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "Qonto",
    websiteUrl: "https://qonto.com",
    category: "Banque professionnelle en ligne",
    competitors: ["Shine", "Revolut Business", "Blank", "BNP Paribas"],
    prompts: QONTO_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "PayFit",
    websiteUrl: "https://payfit.com",
    category: "Logiciel de paie et SIRH",
    competitors: ["Silae", "Sage", "Lucca", "Factorial"],
    prompts: PAYFIT_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "Swile",
    websiteUrl: "https://www.swile.co",
    category: "Titres-restaurant et avantages salariés",
    competitors: ["Edenred", "Pluxee", "Up Déjeuner", "Bimpli"],
    prompts: SWILE_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "Doctolib",
    websiteUrl: "https://www.doctolib.fr",
    category: "Prise de rendez-vous médicaux",
    competitors: ["Maiia", "KelDoc", "Qare", "Livi"],
    prompts: DOCTOLIB_PROMPTS,
    frequency: "daily",
  },
  {
    brandName: "lemlist",
    websiteUrl: "https://www.lemlist.com",
    category: "Cold email et prospection B2B",
    competitors: ["Instantly", "Smartlead", "Apollo", "Woodpecker"],
    prompts: LEMLIST_PROMPTS,
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
        llms: ["chatgpt", "perplexity", "gemini", "claude"],
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
