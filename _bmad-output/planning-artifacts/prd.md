---
stepsCompleted:
  [
    "step-01-init",
    "step-02-discovery",
    "step-03-success",
    "step-04-journeys",
    "step-05-domain",
    "step-06-innovation",
    "step-07-project-type",
    "step-08-scoping",
    "step-09-functional",
    "step-10-nonfunctional",
  ]
inputDocuments:
  - "/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/planning-artifacts/product-brief-ShowYourBrand-2026-01-13.md"
  - "/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/project-context.md"
  - "/Users/maxlemoinegavoille/Desktop/Projets/ShowYourBrand/_bmad-output/analysis/brainstorming-session-2026-01-12.md"
workflowType: "prd"
project_name: "ShowYourBrand"
author: "Maxlemoinegavoille"
date: "2026-01-14"
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 1
projectType: "greenfield"
classification:
  projectType: "saas_b2b"
  domain: "marketing_tech_seo_geo"
  complexity: "medium"
  projectContext: "greenfield"
  businessModel: "dual_oneshot_subscription"
  pricingModel: "incremental_per_url"
  architecture: "two_service"
---

# Product Requirements Document - ShowYourBrand

**Author:** Maxlemoinegavoille
**Date:** 2026-01-14

## Executive Summary

### Vision

ShowYourBrand is a GEO (Generative Engine Optimization) audit platform that makes businesses visible in AI search engines like ChatGPT, Claude, and Perplexity. As traditional search shifts from Google to conversational AI, businesses are becoming invisible in recommendations. ShowYourBrand systematically tests hundreds of AI prompts, identifies visibility gaps, and provides actionable recommendations to optimize for AI discovery.

### Product Differentiator

**First comprehensive GEO audit platform** combining:

- Systematic AI visibility measurement (100 prompt battery testing across all plans)
- Productized SaaS delivery (vs ad-hoc GEO consulting)
- AI-powered recommendations (FAQ generation, schema markup, alt text optimization)
- Professional agency-grade UI with actionable technical reports

### Target Users & Distribution Model

**Primary:** Marketing agencies (B2B2B distribution channel)
**Secondary:** Business owners, freelance marketers, developers

**Go-to-Market Strategy:** Agencies adopt ShowYourBrand, resell GEO audits to clients → rapid market penetration

### MVP Scope - 8 Core Features (8-10 Weeks, 2 Developers)

1. Visual Site Health Dashboard (professional UI, GEO score 0-100%)
2. Prompt Gap Analysis (test 100 prompts across 4 AI engines, all plans)
3. HTML Scanner (schema detection, meta tags, heading structure, alt text audit)
4. AI-Optimized Content Suggestions (FAQ generation, schema snippets, keyword recommendations)
5. Comprehensive Report Generation (PDF with executive + technical sections)
6. Payment Management (Stripe: Basic €100 one-shot, Pro €200 one-shot, Premium €500/month subscription)
7. Internationalization Architecture (English + French, extensible for future languages)
8. Google Search Console & Analytics (conditional: if free and easy to implement)

### Success Metrics

**3 Months:** 10-15 agencies, 100+ audits delivered, €10K MRR, 70%+ users apply recommendations
**12 Months:** 30+ agencies, 500+ audits/month, €50K MRR, 70%+ report measurable AI visibility improvement

### Market Opportunity & Timing

**First-mover advantage:** 12-18 month window before giants (Ahrefs, SEMrush) pivot to GEO
**Category creation:** Define "GEO audit" as standard product category (like SEO audits)
**Validation approach:** Launch fast, validate quickly, pivot if wrong (lean startup philosophy)

### Budget & Resources

**Team:** 2 full-time developers, 8-10 weeks sprint
**Budget:** €18-28K (dev + AI API costs + infrastructure)
**Philosophy:** Premium Walking Skeleton - impeccable UI from day 1, manual backend processes acceptable for MVP

---

## Success Criteria

### User Success - Le Moment "Ça Marche!"

**Le moment critique de succès:**

**Pour les Agences:**
Un client de l'agence dit: **"J'étais invisible dans les IA, maintenant je suis trouvé! Un client m'a dit qu'il m'a trouvé grâce à ChatGPT!"**

Ce n'est PAS:

- ❌ Un score GEO qui monte de 47% → 72% (trop technique, pas fiable)
- ❌ Un développeur qui implémente des balises (trop précis, pas l'objectif final)

C'est:

- ✅ **Être trouvé facilement dans les recommandations IA**
- ✅ **Clients rapportent "ChatGPT m'a recommandé vous"**
- ✅ **Visibilité concrète dans les réponses d'IA, pas juste des métriques**

**Indicateurs de succès utilisateur (3 mois):**

- 60%+ des utilisateurs rapportent avoir reçu au moins 1 mention client "Je t'ai trouvé via ChatGPT/Claude/Perplexity"
- 70%+ des utilisateurs appliquent minimum 3 recommandations du rapport
- Agences utilisent ShowYourBrand reports dans 80%+ de leurs client strategy meetings

**Indicateurs de succès utilisateur (6-12 mois):**

- Business owners peuvent citer des exemples concrets de clients venus via IA
- Agences ajoutent 5-10 nouveaux clients GEO par mois
- GEO devient KPI standard aux côtés du SEO traditionnel

---

### Business Success

**Phase 1: MVP Launch (Mois 1-3)**

- **Validation marché:** 10-15 agences partenaires actives
- **Preuve de concept:** 100+ audits livrés
- **Feedback qualité:** 80%+ retours positifs sur actionabilité des rapports
- **Première traction revenue:** €10K MRR

**Phase 2: Scale (Mois 4-12)**

- **Croissance agences:** 20-30 agences partenaires
- **Volume audits:** 300+ audits/mois (Mois 6), 500+ audits/mois (Mois 12)
- **Revenue target:** €45-50K monthly à Mois 12
  - Breakdown: 30 Premium subscriptions × €500/mois = €15K + 100 Basic one-shots × €100 = €10K + 75 Pro one-shots × €200 = €15K + Extra audits = €5K
- **Market position:** Reconnu comme "THE GEO audit tool"
- **Retention:** 80%+ retention rate, churn < 5%/mois

**Phase 3: Expand (An 2+)**

- **Geographic expansion:** 30%+ revenue non-EU
- **Product expansion:** Phase 2 features based on feedback
- **ARPU increase:** +25% via premium features

**North Star Metric:**

- **Total GEO Audits Delivered Per Month** → Target: 500 audits/mois à Mois 12

**KPIs Primaires (tracking hebdomadaire):**

1. **Agency Acquisition:** 3-5 nouvelles agences/mois
2. **Agency Activation:** 90%+ run first audit within 7 days
3. **MRR Growth Rate:** 15-20% month-over-month (premiers 6 mois)
4. **Audit Completion Rate:** 85%+ complete full audit flow
5. **User Success Rate:** 70%+ re-run audits (tracking improvement)

---

### Technical Success - Crédibilité du Ranking GEO

**LE RISQUE CRITIQUE:**
Si quelqu'un utilise ShowYourBrand, applique les recommandations, et son **ranking GEO n'augmente PAS** ou augmente **PEU** → le produit perd toute crédibilité.

**Success = Viabilité Prouvée du Produit:**

**Critères de viabilité technique (NON-NÉGOCIABLES):**

1. **Amélioration Mesurable Réelle (70%+ des cas):**
   - Utilisateurs qui appliquent ≥3 recommandations ET re-testent après 3 mois → amélioration visible de leur présence dans les réponses IA
   - Mesure: Prompt testing avant/après montre augmentation du nombre de prompts où le business apparaît
   - Target: +15 à +30 points d'amélioration sur batteries de tests (100-500 prompts)

2. **Précision des Recommandations:**
   - Les suggestions de contenu (FAQ, schema markup, alt text) doivent être **directement applicables** et **réellement efficaces**
   - Validation: 80%+ des utilisateurs disent "recommandations claires, spécifiques, implémentables"
   - Pas de recommandations vagues style "améliorez votre SEO" → TOUT doit être actionnable

3. **Métriques Alternatives si Score GEO Insuffisant:**
   - Si score GEO seul n'est pas assez fiable → proposer métriques complémentaires:
     - Nombre de prompts où business apparaît (sur batterie de X prompts testés)
     - Position dans les réponses (1ère mention vs 5ème mention)
     - Catégories de prompts couvertes (ex: apparaît dans 7/10 catégories)
   - Focus sur **amélioration tangible et mesurable**, pas juste un chiffre arbitraire

4. **Rapport Generation Success Rate:**
   - 99%+ rapports générés avec succès (pas de crash, pas d'échec)
   - < 2 minutes temps de génération par audit (backend optimisé)
   - Tous les audits payés doivent être livrés sans erreur

5. **Data Quality & AI Integration:**
   - Prompt testing fiable sur ChatGPT, Claude, Perplexity, DeepSeek
   - Web scraping précis (structure HTML, metadata, schema markup)
   - Suggestions de contenu générées par IA (FAQ, alt text) = qualité professionnelle

**Indicateurs de Viabilité Technique:**

- **70%+ des utilisateurs** qui appliquent recommandations voient amélioration mesurable
- **80%+ des utilisateurs** disent "recommandations claires et actionnables"
- **99%+ audit success rate** (pas de rapports échoués)
- **< 0.5 tickets/user/month** (produit clair, peu de questions)

---

### Measurable Outcomes - What "Winning" Looks Like

**3 Mois:**

- ✅ 10-15 agences utilisent activement ShowYourBrand
- ✅ 100+ audits livrés avec succès
- ✅ €10K MRR atteint
- ✅ 70%+ utilisateurs appliquent ≥3 recommandations
- ✅ Premier feedback "mon client m'a trouvé via ChatGPT" collecté

**6 Mois:**

- ✅ 20+ agences partenaires
- ✅ 300+ audits/mois
- ✅ €25K MRR
- ✅ Premier case study publié
- ✅ "GEO audit" ranking Top 5 Google

**12 Mois:**

- ✅ 30+ agences partenaires
- ✅ 500+ audits/mois (North Star atteint)
- ✅ €50K MRR
- ✅ Reconnu comme "the GEO audit platform"
- ✅ 80%+ customer retention
- ✅ 70%+ utilisateurs rapportent amélioration visible de présence IA

---

## Product Scope

### MVP - Minimum Viable Product (Focalisé GEO)

**Philosophy: Premium Walking Skeleton**

- **Backend/Processes:** Can be manual initially (founder validation)
- **Frontend/UX:** Must be impeccable and professional from day 1
- **Target users:** Marketing agencies demand polished, professional tools

**8 Core MVP Features:**

**1. 🔴 Visual Site Health Dashboard (CRITIQUE)**

- Dashboard clair et simple qui explique la situation actuelle
- Vue 3 couleurs (rouge/orange/vert) + GEO Health score (0-100%)
- Top 3-5 problèmes prioritaires avec explications plain-language
- Competitor comparison charts
- **Pourquoi critique:** Communication bridge entre insight et action

**2. 🔴 Prompt Gap Analysis - Batteries de Tests (CRITIQUE)**

- Tester 100-500 prompts pour voir si business apparaît dans réponses IA
- Comparer avec 3-5 concurrents
- Montrer: "Vous apparaissez dans 23/100 prompts (23%), concurrent X dans 67/100 (67%)"
- Parallel AI API calls (ChatGPT, Claude, Perplexity, DeepSeek)
- **Pourquoi critique:** Mesure directe de la visibilité IA - c'est le cœur du GEO!

**3. 🔴 HTML Scanner (CRITIQUE - ADDED TO MVP)**

- Schema.org markup detection (Organization, FAQPage, Product, etc.)
- Meta tags analysis (title, description, Open Graph)
- Heading structure audit (H1-H6)
- Image alt text audit (identify missing/poor alt text)
- Content keyword extraction (top 20-30 keywords)
- Recommendations for improvement
- **Pourquoi critique:** Comprendre ce que l'IA voit actuellement dans le site

**4. 🔴 AI-Optimized Content Suggestions (CRITIQUE)**

- Générer FAQ optimisées basées sur prompts communs de l'industrie (10-15 Q&A)
- Suggérer schema.org markup avec code copy-paste ready
- Proposer alt text pour images (AI-generated)
- Keyword recommendations
- **Pourquoi critique:** Actionnable strategy - pas juste diagnostic, mais solutions concrètes!

**5. 🔴 Comprehensive Report Generation (CRITIQUE)**

- Rapport PDF téléchargeable avec:
  - Dashboard visuel simple (pour business owner)
  - Détails techniques précis (pour développeur)
  - Code snippets copy-paste ready
  - Priorisation claire (🔴🟠🟢)
- MongoDB GridFS storage (preferred over Vercel Blob)
- Email notification when ready
- **Pourquoi critique:** Deliverable final que l'agence/client reçoit et utilise

**6. 🔴 Payment Management (CRITIQUE)**

- Stripe integration for one-shots (Basic €100, Pro €200) + subscription (Premium €500/month)
- One-shot payments with feature differentiation (AI engines, competitors, history)
- Premium subscription with 20 audits included + €20/extra
- Customer portal for payment management
- Webhook handling for payments + subscription lifecycle
- **Pourquoi critique:** Revenue model enablement

**7. 🔴 Internationalization (i18n) Architecture (CRITIQUE - ADDED TO MVP)**

- Built-in i18n support (next-i18next)
- **MVP languages:** English + French
- Extensible for future languages (adding new language = 1-2 days of translation)
- Language switcher in UI
- Localized PDF reports
- **Pourquoi critique:** Multi-language from day 1 ensures easy geographic expansion

**8. 🟡 Google Search Console & Analytics (CONDITIONAL MVP)**

- **Free APIs:** No cost
- **OAuth integration:** If simple implementation (< 1 week)
- **Value:** Correlate GEO with traditional SEO metrics
- **Decision:** Research Week 1, include if easy, defer if complex

**Architecture MVP:**

- Next.js (Vercel): Dashboard, auth, payments, MongoDB, Stripe
- Service séparé (local puis AWS): Prompt testing, AI API calls, scraping, report generation

---

### Growth Features (Post-MVP - Phase 2)

**Après validation du MVP (€10K MRR, 80%+ feedback positif):**

1. **White-Label Advanced** - Custom branding complet (logo, colors, domain) for agencies
2. **Custom Prompt Testing** - User-defined prompts (MVP: pre-defined seulement)
3. **Citation Deep-Dive** - Tracker quelles sources IA cite quand il mentionne business
4. **Team Accounts / RBAC** - Multi-user accounts for agencies
5. **Weekly GEO Health Emails** - Automated engagement and monitoring
6. **Multi-Language GEO** - Additional languages beyond EN/FR (German, Spanish, Italian)
7. **Real-Time GEO Monitoring** - Alertes "votre visibilité a baissé de 15% cette semaine"
8. **Backlink GEO Influence Tracker** - Analyser quels backlinks améliorent visibilité IA

**Critères pour Phase 2:**

- MVP prouve product-market fit (€10K MRR, 80%+ feedback positif)
- Features basées sur feedback utilisateurs réels
- Priorisation selon demande client vs effort dev

---

### Vision (Future - An 2-3)

**Long-Term Ambition:**
Devenir le **standard de l'industrie** pour la mesure GEO - comme Moz's Domain Authority pour SEO.

**Vision Features:**

- **Predictive GEO Analytics:** ML pour prédire prompts populaires 3-6 mois à l'avance
- **GEO Optimization Automation:** IA génère et publie automatiquement contenu optimisé
- **AI Training Data Presence Checker:** Vérifier si business est dans training data des LLMs
- **Enterprise API:** Intégrer ShowYourBrand dans marketing tech stacks existants
- **Citation Intelligence:** Reverse-engineer quelles sources influencent le plus les IA
- **Market Expansion:** US, APAC markets avec strategies GEO localisées
- **"GEO Score" Industry Standard:** Quand quelqu'un dit "notre GEO score est 78", tout le monde en marketing sait ce que ça signifie

**Success = Industry Leadership:**

- Référence incontournable pour GEO (comme Ahrefs l'est pour SEO)
- Standard de mesure adopté par l'industrie
- Partenariats potentiels avec OpenAI/Anthropic (si opportunité)

---

## User Journeys

### Journey 1: Sophie - L'Agence qui Découvre le GEO

**Persona:** Sophie Mercier, 38 ans, Directrice d'Agence Marketing (12 employés)

**Opening Scene - Le Moment de Panique:**

C'est lundi matin. Sophie est en meeting avec son client le plus important (budget annuel €80K). Le client lance: _"Mon concurrent m'a dit que ChatGPT recommande son restaurant mais jamais le mien. Vous pouvez faire quelque chose?"_

Sophie hésite. Elle maîtrise le SEO traditionnel, mais le GEO? Aucune idée. Elle improvise: _"On va analyser ça et revenir vers vous."_

Après le meeting, Sophie panique. Si elle n'a pas de réponse, le client risque d'aller voir ailleurs. Elle Google "AI search optimization" et trouve peu d'outils crédibles. **Elle a 48h pour trouver une solution.**

**Rising Action - La Découverte:**

Sophie découvre ShowYourBrand via une pub LinkedIn: _"L'IA peut ne JAMAIS parler de vous - êtes-vous invisible?"_

Elle s'inscrit (offre agence), ajoute l'URL du client, lance l'audit. **10 minutes plus tard**, le rapport est prêt.

Elle ouvre le dashboard:

- **GEO Health Score: 34%** (rouge)
- **Prompt Gap Analysis: Le client apparaît dans 18/100 prompts (18%), le concurrent dans 72/100 (72%)**
- Top 3 problèmes critiques affichés clairement

Sophie comprend IMMÉDIATEMENT le problème. Le rapport propose des actions concrètes:

- Ajouter FAQ schema markup (code fourni)
- Optimiser 15 images sans alt text (suggestions IA)
- Créer section FAQ (10 questions générées)

**Climax - Le Moment de Vérité:**

Sophie présente le rapport au client mercredi. Elle montre le dashboard visuel simple, explique: _"Vous êtes invisible dans 82% des recherches IA. Voici exactement comment on corrige ça."_

Le client est **bluffé**: _"Personne ne m'avait jamais montré ça aussi clairement! On fait quoi maintenant?"_

Sophie propose un package GEO Optimization (nouveau service!) à €3,500 avec:

- Implémentation des recommandations ShowYourBrand
- Re-test après 3 mois
- Suivi mensuel

**Le client signe immédiatement.**

**Resolution - La Nouvelle Réalité:**

**3 mois plus tard:**

- Sophie a ajouté 8 autres clients au package GEO
- Revenue additionnel: €28K (8 clients × €3,500)
- ShowYourBrand coût: €500/mois (10 URLs), ROI = 56x
- Le premier client rapport: _"Un client m'a dit 'ChatGPT m'a recommandé vous'!"_

Sophie a trouvé son différenciateur. Elle est la seule agence locale à proposer GEO. **Elle dort mieux la nuit.**

---

### Journey 2: Marc - Le Business Owner qui Veut Être Trouvé

**Persona:** Marc Dubois, 52 ans, Propriétaire de 3 Restaurants Bio à Paris

**Opening Scene - L'Inquiétude Grandissante:**

Marc a investi €50K dans le SEO ces 2 dernières années. Il est #3 sur Google pour "restaurant bio Paris". Pourtant, le trafic **stagne**.

Lors d'un dîner, un ami lui dit: _"J'ai demandé à ChatGPT où manger bio à Paris. Il m'a donné 5 adresses, mais pas la tienne! Pourtant tu es excellent!"_

Marc teste lui-même. ChatGPT, Claude, Perplexity - **aucun ne mentionne ses restaurants** dans les recommandations. Il demande à son agence marketing. Réponse floue: _"On va regarder ça."_ Rien ne se passe.

**Marc réalise: Il est invisible dans l'ère de l'IA.** Et il ne sait pas comment corriger.

**Rising Action - La Prise en Main:**

Marc voit une pub Instagram: _"L'IA peut ne JAMAIS parler de vous - Test gratuit."_

Il clique, entre l'URL de son site, paye €200 pour un audit Pro complet.

**15 minutes plus tard**, il reçoit un email: _"Votre rapport GEO est prêt!"_

Il ouvre le dashboard:

- **GEO Health Score: 41%** (orange)
- **Vous apparaissez dans 25/100 prompts (25%)**
- **Votre concurrent "Le Potager" apparaît dans 63/100 (63%)**

Marc voit exactement **pourquoi** il est invisible:

- ❌ Pas de FAQ sur le site (les IA adorent les FAQ)
- ❌ Avis Google non intégrés au site
- ❌ Schema.org manquant (les IA ne comprennent pas la structure)

Le rapport propose des solutions **ultra-claires**:

- "Ajoutez ce code dans votre page À Propos" (code fourni)
- "Créez cette section FAQ" (10 questions déjà rédigées)
- "Optimisez ces 12 photos de plats" (alt texts suggérés)

**Climax - L'Implementation et le Re-Test:**

Marc transmet le rapport à Emma (sa développeuse freelance). Elle implémente les 3 recommandations prioritaires en **2 heures** (grâce au code copy-paste).

**3 mois plus tard**, Marc paye €200 pour un nouveau Pro audit:

- **GEO Health Score: 67%** (vert!)
- **Vous apparaissez dans 54/100 prompts (54%)** - +29 points!

**Resolution - Le ROI Tangible:**

**6 mois après:**

- Marc reçoit 2-3 clients/semaine qui disent: _"ChatGPT m'a recommandé vous"_
- Il estime +€15K revenue additionnel (30 clients × €500 panier moyen)
- Investment ShowYourBrand: €200 (Pro audit) + €200 (re-test) = €400
- **ROI = 37x**

Marc décide de souscrire au Premium (€500/mois) pour suivre l'évolution de ses 3 restaurants avec des audits réguliers. Il dort mieux, sachant qu'il est **visible dans l'ère de l'IA.**

---

### Journey 3: Julien - Le Freelancer qui se Différencie

**Persona:** Julien Moreau, 29 ans, SEO Freelancer depuis 3 ans

**Opening Scene - La Concurrence Écrase:**

Julien galère. Les grosses agences écrasent les prix sur le SEO classique. Il facture €1,200/mois pour du SEO, ses concurrents font pareil pour €600/mois avec des équipes offshore.

Il perd 3 clients en 2 mois. **Il a besoin d'un différenciateur ou il coule.**

Un soir, scrolling LinkedIn, il voit un post: _"GEO = le nouveau SEO. Les business sont invisibles dans ChatGPT."_

Julien clique, lit l'article. **Lightbulb moment:** Personne dans son réseau ne parle de GEO. **C'est un océan bleu.**

**Rising Action - Le Repositionnement:**

Julien s'inscrit à ShowYourBrand (plan freelancer €79/mois, 3 URLs incluses).

Il contacte 5 anciens prospects qui l'avaient refusé:

_"Bonjour, depuis notre dernier échange, j'ai ajouté une expertise GEO (Generative Engine Optimization). J'ai fait un audit gratuit de votre site. Les résultats sont surprenants - vous apparaissez dans seulement 19% des recherches IA. Puis-je vous montrer le rapport?"_

**4/5 acceptent un call.**

Sur le call, Julien partage l'écran, montre le dashboard ShowYourBrand:

- Visuel clair et **non-technique** (le prospect comprend instantanément)
- Comparaison avec concurrents (impact émotionnel fort)
- Solutions actionables (pas de jargon)

**3/4 signent** un package SEO + GEO à €1,800/mois (vs €1,200 avant).

**Climax - Le Premier Success Story:**

Le premier client (e-commerce bio) applique les recommandations GEO de Julien.

**3 mois plus tard**, le client appelle Julien, excité:

_"Julien, on a eu 8 commandes cette semaine de gens qui ont dit 'ChatGPT vous a recommandé!' Ça n'arrivait JAMAIS avant!"_

Julien demande un témoignage. Le client accepte avec enthousiasme.

**Resolution - Le Repositionnement Réussi:**

**6 mois plus tard:**

- Julien a 12 clients sur package SEO + GEO (€1,800/mois chacun) = €21,600 MRR
- ShowYourBrand coût: €500/mois (Premium avec 20 audits, white-label pour ses clients)
- Il se positionne comme **"Expert SEO + GEO"** (seul dans sa région)
- Il charge **50% plus cher** que la concurrence et les clients payent (valeur perçue)
- Il publie du contenu LinkedIn sur le GEO → devient thought leader local

Julien a sauvé son business. Il ne concurrence plus sur le prix, mais sur l'expertise unique. **Il dort mieux la nuit.**

---

### Journey 4: Emma - La Dev qui Reçoit des Instructions Claires

**Persona:** Emma Lefebvre, 26 ans, Développeuse Full-Stack Freelance

**Opening Scene - La Demande Vague:**

Emma reçoit un email de Marc (client restaurant):

_"Salut Emma, il faut qu'on soit mieux référencé dans ChatGPT. Peux-tu faire quelque chose? Budget: €500. Urgent."_

Emma soupire. **C'est la 3ème demande floue cette semaine.** Elle n'a aucune idée:

- Qu'est-ce que "être référencé dans ChatGPT" signifie techniquement?
- Par où commencer?
- Comment mesurer le succès?

Elle Google pendant 2 heures. Articles vagues, conseils contradictoires, rien de concret. Elle facture quand même les 2 heures (€120), mais elle sait qu'elle n'a **rien produit d'utile**.

Elle répond à Marc: _"Il faut faire du schema markup, des FAQ, optimiser le contenu... Je peux creuser si tu veux?"_

Marc est frustré par la réponse floue.

**Rising Action - Le Rapport Salvateur:**

**2 semaines plus tard**, Marc lui transfert un email: _"Emma, j'ai fait faire un audit GEO. Voici le rapport. Peux-tu implémenter les 3 trucs prioritaires?"_

Emma ouvre le PDF ShowYourBrand. **Ses yeux s'illuminent:**

**Page 5 - Recommandations Techniques:**

1. **🔴 Ajouter Schema.org Organization**
   - **Où:** Page À Propos, dans le `<head>`
   - **Code exact fourni** (15 lignes de JSON-LD copy-paste ready)
   - **Impact:** Les IA comprendront qui vous êtes

2. **🔴 Créer Section FAQ**
   - **Où:** Homepage, après la section "Nos Valeurs"
   - **Contenu fourni:** 10 questions + réponses rédigées
   - **Code HTML fourni** avec FAQPage schema intégré

3. **🟠 Optimiser Alt Text Images**
   - **Liste des 12 images** avec alt text suggéré pour chacune
   - **Exemple:** `alt="Plat bio végétarien avec légumes de saison du marché local Paris"`

**Emma est soufflée:** C'est **exactement** ce dont elle a besoin. Pas de jargon marketing, pas de stratégie floue. **Des instructions précises, du code prêt, des localisations exactes.**

**Climax - Implementation Rapide:**

Emma ouvre VS Code. Elle implémente les 3 recommandations en **1h45**:

- Copy-paste le schema.org (5 min)
- Crée la section FAQ avec le HTML fourni (30 min)
- Modifie les 12 alt texts (1h10)

Elle commit, push, deploy. **Total: 1h45 de travail facturé à €60/h = €105.**

Elle envoie à Marc: _"Fait! Les 3 recommandations prioritaires sont live. J'ai mis 1h45."_

Marc répond immédiatement: _"Merci Emma! Super rapide, c'est exactement ce que je voulais!"_

**Resolution - La Relation Client Améliorée:**

**3 mois plus tard:**

Marc teste à nouveau avec ShowYourBrand. Score passe de 41% → 67%. Il est ravi.

Il appelle Emma: _"Emma, j'ai un nouveau rapport ShowYourBrand pour optimiser encore plus. Tu peux implémenter les 5 nouvelles recommandations?"_

Emma accepte avec plaisir. Elle sait que ce sera **clair, précis, facturé rapidement.**

**Pour Emma:**

- Moins de frustration (instructions claires vs demandes floues)
- Travail facturable efficace (pas de recherche non facturée)
- Client satisfait (résultats mesurables)
- Relation client améliorée (communication claire)

Emma recommande ShowYourBrand à 2 autres clients qui lui font des demandes vagues. **Elle dort mieux la nuit** (moins de stress lié aux demandes floues).

---

### Journey Requirements Summary

Ces 4 parcours révèlent les **capabilities critiques** nécessaires pour ShowYourBrand:

**From Sophie's Journey (Agency):**

- Multi-URL management (gérer plusieurs clients)
- White-label report generation (branding agence)
- Competitive analysis dans dashboard (montrer gap vs concurrents)
- Visual dashboard non-technique (pour présenter aux clients)
- Pricing par URL incrémental

**From Marc's Journey (Business Owner):**

- One-shot audit purchase flow
- Simple dashboard avec score clair (couleurs rouge/orange/vert)
- Prompt Gap Analysis visible (XX/100 prompts)
- Report PDF téléchargeable
- Re-test capability (tracking amélioration)
- Subscription upgrade path (one-shot → abonnement)

**From Julien's Journey (Freelancer):**

- Affordable freelancer tier (€79/mois, 3-5 URLs)
- Audit reports shareable avec prospects
- Competitive comparison (pour pitch sales)
- Case study generation capability (témoignages clients)
- LinkedIn-worthy data visualization (content marketing)

**From Emma's Journey (Developer):**

- Technical report section séparée du dashboard visuel
- Copy-paste ready code snippets (schema.org, HTML, alt texts)
- Precise location instructions ("Page À Propos, dans `<head>`")
- Prioritization claire (🔴🟠🟢)
- Plain language + technical precision combo

---

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. Multi-Dimensional Innovation (Market + Product + Methodology)**

ShowYourBrand innovates across THREE dimensions simultaneously:

**A) Systematic AI Visibility Measurement**

- **Innovation:** First platform to systematically test 100-500 AI prompts at scale to measure business visibility
- **Novelty:** Current market = manual checking ("let me search ChatGPT for my business"). ShowYourBrand = automated, comprehensive, repeatable testing battery
- **Competitive moat:** Methodology and prompt libraries that scale

**B) GEO as Productized SaaS**

- **Innovation:** Transform ad-hoc GEO consulting into self-service SaaS product
- **Novelty:** Today = scattered consultants doing custom GEO work. ShowYourBrand = democratized, accessible, repeatable
- **Market creation:** Defining the "GEO audit" as a product category (like SEO audits became standard)

**C) Unified SEO + GEO Dashboard**

- **Innovation:** First to combine traditional SEO health + AI visibility in single platform
- **Novelty:** Existing tools = SEO only (Ahrefs, SEMrush). ShowYourBrand = holistic search visibility (Google + AI)
- **User benefit:** One dashboard for complete visibility measurement vs fragmented tools

**2. Meta-Innovation: Using AI to Optimize FOR AI**

- **Concept:** AI-generated content suggestions (FAQ, schema, alt text) specifically optimized for AI consumption
- **Novelty:** Most tools optimize content for humans. ShowYourBrand optimizes for AI understanding/citation
- **Technical innovation:** LLM-powered recommendations (GPT-4/Claude) trained to think like search AIs

**3. First-Mover Category Creation**

- **"GEO Score" as Industry Standard:** Like Moz's Domain Authority became THE SEO metric, ShowYourBrand aims to define GEO measurement
- **Market timing:** Entering before Ahrefs/SEMrush pivot to GEO = 12-18 month window to establish leadership
- **Network effect potential:** Early users define what "good GEO" means → standard adoption

**4. White-Label Distribution Innovation**

- **Go-to-market innovation:** Agencies as distribution channel (not just end-users)
- **Novelty:** SEO tools sell to agencies AND businesses separately. ShowYourBrand = agencies resell to scale faster
- **Business model innovation:** B2B2B vs traditional B2B

---

### Market Context & Competitive Landscape

**Current Market State (January 2026):**

**GEO Market Maturity: Emergent**

- **Problem awareness:** HIGH (businesses notice AI invisibility)
- **Solution awareness:** LOW (no established GEO tools yet)
- **Market education needed:** MEDIUM (SEO analogy helps, but "GEO" is new term)

**Competitive Landscape:**

**Direct Competitors: ~0**

- No established GEO audit platforms exist
- Scattered consultants doing custom GEO work (not scalable, not productized)

**Potential Future Competitors:**

1. **Ahrefs/SEMrush:** Will eventually pivot to GEO (12-18 month lag estimated)
2. **OpenAI/Anthropic:** Could build native "optimize for our AI" tools
3. **New entrants:** Other startups seeing the same opportunity

**ShowYourBrand's Window:** 12-18 months to establish category leadership before giants pivot

**Why First-Mover Advantage Matters Here:**

- **Definition power:** First to market defines what "GEO audit" means
- **Data advantage:** Early prompt testing builds proprietary methodology
- **Customer lock-in:** Agencies who adopt first become advocates
- **Brand = category:** "ShowYourBrand score" could become "Domain Authority" equivalent

---

### Validation Approach - Lean Startup Philosophy

**Core Philosophy:** Launch fast → Validate quickly → Pivot if wrong

**Phase 1: Rapid MVP Launch (Month 1-3)**

**Primary Validation Question:**

> "Will businesses/agencies pay for GEO audits?"

**Success Metrics:**

- 10-15 agencies sign up within 3 months
- 100+ audits delivered
- 80%+ say reports are "actionable and valuable"
- €10K MRR achieved

**Validation Methods:**

1. **Customer Feedback Loops:**
   - Weekly calls with first 10 agencies
   - "What would make this 10x better?"
   - Track feature requests by frequency

2. **Usage Analytics:**
   - % who run 2nd audit (retention signal)
   - % who upgrade one-shot → subscription (value signal)
   - Time spent in dashboard (engagement signal)

3. **Real-World Impact Tracking:**
   - Collect testimonials: "Client said ChatGPT recommended me"
   - Before/after GEO score improvements
   - Track correlation: recommendations applied → visibility improved

**Phase 2: Product-Market Fit Iteration (Month 4-6)**

**Secondary Validation Questions:**

> "Do our recommendations ACTUALLY improve AI visibility?"
> "Which features drive the most value?"

**Iteration Approach:**

- A/B test different recommendation types
- Identify which suggestions correlate with biggest improvements
- Double down on what works, cut what doesn't

**Phase 3: Scale Decision (Month 6-12)**

**Go/No-Go Decision Criteria:**

**GO (Scale):** If by Month 6:

- ✅ €25K MRR achieved
- ✅ 70%+ users report measurable improvement
- ✅ Churn < 5%/month
- ✅ Organic word-of-mouth growth visible
- **Action:** Raise funding, hire team, scale marketing

**PIVOT:** If by Month 6:

- ❌ MRR < €10K (no traction)
- ❌ High churn (>15%/month)
- ❌ Users say "nice report but doesn't help"
- **Action:** Pivot based on learnings (see Risk Mitigation below)

---

### Risk Mitigation - All-In Bet with Pivot Options

**Primary Risk:** GEO adoption slower than expected OR optimization doesn't work reliably

**Mitigation Strategy: "Pivot, Don't Die"**

**Pivot Option 1: SEO + GEO Hybrid**

- **If:** GEO alone isn't enough to justify price
- **Then:** Add comprehensive SEO auditing (HTML health, backlinks, technical SEO)
- **Positioning:** "Complete search visibility" (Google + AI)
- **Effort:** Medium (leverage existing scanning infrastructure)

**Pivot Option 2: AI Content Optimization Tool**

- **If:** Businesses care more about AI-generated content than AI visibility measurement
- **Then:** Focus on AI content generation features (FAQ generator, schema injector, alt text)
- **Positioning:** "AI-powered content optimizer"
- **Effort:** Low (features already planned)

**Pivot Option 3: White-Label SEO Platform**

- **If:** Agencies love the white-label model but GEO isn't sticky
- **Then:** Become white-label SEO audit platform for agencies
- **Positioning:** "Agency-first SEO tool"
- **Effort:** Medium (add traditional SEO features)

**Pivot Option 4: Vertical Focus**

- **If:** GEO works but only for specific industries (restaurants, e-commerce, SaaS, etc.)
- **Then:** Go deep on highest-performing vertical
- **Positioning:** "GEO for [vertical]"
- **Effort:** Low (focus marketing, customize prompts)

**Pivot Decision Framework:**

**Signals to watch (Months 1-6):**

- Which user segment has highest retention? (agencies vs business owners vs freelancers)
- Which features get used most? (GEO vs SEO vs content generation)
- Which industries respond best? (restaurants vs e-commerce vs B2B SaaS)
- What do churned users say? ("Too technical" vs "Didn't improve visibility" vs "Too expensive")

**Decision Rule:**

- If clear signal emerges → Pivot fast (within 4-6 weeks)
- If mixed signals → Run focused experiments
- If no traction anywhere → Shut down gracefully (max 9-12 months burn)

---

### Innovation Risk Acceptance

**Acknowledged Big Bets:**

1. **"GEO will matter as much as SEO"** - ALL-IN bet
2. **"Launch fast beats perfect"** - Lean startup over waterfall
3. **"Agencies as distribution"** - B2B2B vs direct B2B
4. **"First-mover wins"** - Speed over polish

**Risk Philosophy:**

- ✅ Test the big bet quickly (3-6 months)
- ✅ Pivot based on real market feedback
- ✅ Fail fast if wrong, succeed fast if right
- ❌ NOT hedging with half-measures
- ❌ NOT building "everything" before launching

**Why This Approach Fits:**

- GEO market = emergent (no playbook exists)
- Window for first-mover = limited (12-18 months)
- Cost of being wrong = controllable (MVP budget < €30K)
- Cost of being slow = losing category leadership

---

## SaaS B2B Specific Requirements

### Project-Type Overview

**ShowYourBrand SaaS Architecture:**

- **Single-tenant accounts** with multi-project management
- **B2B2B model** (agencies reselling to clients) + Direct B2B (business owners)
- **Subscription + One-shot dual model** with project-based scaling
- **Lean MVP approach** - simple, focused, no over-engineering

---

### Technical Architecture Considerations

**1. Tenant Model - Simple Single-User Architecture**

**Tenant Structure:**

- 1 Account = 1 User (agency OR business owner OR freelancer)
- No team/sub-accounts for MVP
- No role-based access control (RBAC) for MVP
- Each user manages their own projects independently

**Project Structure:**

- 1 Project = 1 Brand/Business to audit
  - Primary: 1 URL (e.g., `https://example.com`)
  - Optional: Sub-URLs (e.g., `https://example.com/blog`, `https://example.com/shop`)
- Each project contains:
  - Brand name
  - Primary URL
  - Optional sub-URLs
  - Competitor URLs (for comparison)
  - Audit history
  - Generated reports

**Data Model:**

```
User (Account)
  ├── userId
  ├── email, name
  ├── subscriptionTier (basic/pro/premium)
  ├── stripeCustomerId
  └── Projects[]
       ├── projectId
       ├── brandName
       ├── primaryUrl
       ├── subUrls[]
       ├── competitorUrls[]
       └── Audits[]
            ├── auditId
            ├── geoScore
            ├── promptTestResults
            ├── htmlScan (schema, meta, headings, images, keywords)
            ├── recommendations
            └── reportPdfUrl (MongoDB GridFS storage)
```

**Future Consideration (Post-MVP):**

- Team accounts with RBAC (Admin, Member, Viewer roles)
- White-label sub-accounts for agencies
- Agency-level billing with per-project allocation

---

### Pricing Model - One-Shots + Subscription

**Pricing Structure: 2 One-Shot Tiers + 1 Subscription**

**Key Principle:** One-shots (Basic/Pro) for single audits with different feature levels. Subscription (Premium) for agencies/enterprises with volume needs and advanced features.

---

**BASIC (One-Shot) - €100**

- **Type:** Single audit purchase
- **AI Engines:** ChatGPT only
- **Competitors:** 1 competitor analysis
- **Dashboard:** ✅ Yes (reset with each new audit purchase, no history)
- **PDF Report:** ✅ Yes, with code snippets
- **Historical Tracking:** ❌ No (new dashboard each time)
- **White-label:** ❌ No
- **Target User:** Business owners wanting a quick GEO health check
- **Cost:** ~€20 | **Margin:** €80 (80%)

---

**PRO (One-Shot) - €200**

- **Type:** Single audit purchase
- **AI Engines:** All 4 (ChatGPT, Claude, Perplexity, DeepSeek)
- **Competitors:** Up to 5 competitor analysis
- **Dashboard:** ✅ Yes (persistent with history)
- **PDF Report:** ✅ Yes, with code snippets
- **Historical Tracking:** ✅ Yes (compare audits over time)
- **White-label:** ❌ No
- **Target User:** Businesses wanting comprehensive GEO analysis with tracking
- **Cost:** ~€20 | **Margin:** €180 (90%)

---

**PREMIUM (Subscription) - €500/month**

- **Type:** Monthly subscription
- **Audits Included:** 20 audits/month
- **Extra Audits:** +€20 per audit beyond 20
- **AI Engines:** All 4 (ChatGPT, Claude, Perplexity, DeepSeek)
- **Competitors:** Unlimited competitor analysis
- **Dashboard:** ✅ Yes (persistent with full history)
- **PDF Report:** ✅ Yes, with code snippets
- **Historical Tracking:** ✅ Yes (full evolution tracking across all audits)
- **White-label:** ✅ Yes (custom branding on PDF reports)
- **Target User:** Marketing agencies, enterprises with multiple clients/projects
- **Cost:** ~€400 (20 audits) | **Margin:** €100 minimum (20%)
- **Extra Audit Economics:** €20 cost, €20 price = break-even (strategic choice to retain high-volume clients)

---

**Pricing Comparison Table:**

| Feature                 | Basic €100  | Pro €200        | Premium €500/mo          |
| ----------------------- | ----------- | --------------- | ------------------------ |
| **Type**                | One-shot    | One-shot        | Subscription             |
| **Audits**              | 1           | 1               | 20 included (+€20/extra) |
| **AI Engines**          | ChatGPT     | All 4           | All 4                    |
| **Competitors**         | 1           | 5               | Unlimited                |
| **Dashboard**           | ✅ (resets) | ✅ (persistent) | ✅ (persistent)          |
| **History & Evolution** | ❌          | ✅              | ✅                       |
| **PDF + Code**          | ✅          | ✅              | ✅                       |
| **White-label**         | ❌          | ❌              | ✅                       |

---

**Pricing Strategy Notes:**

- **No cannibalisation:** Basic/Pro are one-shots (no recurring access), Premium is subscription with volume + white-label
- **Clear upgrade path:** Basic → Pro (more AI, more competitors, history) → Premium (volume + white-label)
- **Premium positioning:** Quality signal, not competing on low price
- **Agency-friendly:** Premium designed for agencies reselling to clients

---

### Integration Requirements

**CRITICAL INTEGRATIONS (MVP Must-Have):**

**1. Stripe (Payments)**

- Subscription management (Basic/Pro/Premium tiers)
- One-time payments (one-shot audits)
- Webhook handling for subscription lifecycle events
- Customer portal for plan management
- **Environment:** Both test + production modes

**2. AI APIs (Prompt Testing)**

- **OpenAI API:** ChatGPT prompt testing
- **Anthropic API:** Claude prompt testing
- **Perplexity API:** Perplexity prompt testing
- **DeepSeek API:** DeepSeek prompt testing
- **Rate limiting:** Respect API limits
- **Cost tracking:** Monitor per-audit costs

**3. Resend (Email Service)**

- Audit completion notifications
- Report delivery emails
- Welcome emails
- Subscription confirmations
- Weekly/monthly digest emails (if subscription)

**4. MongoDB (Primary Storage)**

- User accounts + projects + audits
- Report storage (PDF binary data in MongoDB GridFS preferred over Vercel Blob)
- Audit results + recommendations
- Historical tracking

**OPTIONAL INTEGRATIONS (Evaluate if Not Complicated/Expensive):**

**5. Google Search Console API (Optional)**

- **Value:** Correlate AI visibility with traditional SEO performance
- **Requirement:** User must connect their GSC account (OAuth)
- **Decision criteria:**
  - Is API free/affordable?
  - Is OAuth integration straightforward?
  - Does it add significant value to reports?
- **Action:** Research feasibility + cost, include if easy

**6. Google Analytics API (Optional)**

- **Value:** Show traffic sources, correlate with AI visibility improvements
- **Decision criteria:** Same as GSC
- **Action:** Research feasibility + cost, include if easy

**EXPLICITLY OUT OF SCOPE (MVP):**

- ❌ Zapier / Make.com integrations (add complexity, not core value)
- ❌ Slack / Discord notifications (nice-to-have, not critical)
- ❌ Webhooks for third-party integrations (Phase 2)
- ❌ API for external developers (Phase 2)

---

### Data Management & Storage Strategy

**Primary Storage: MongoDB**

**Storage Architecture:**

- **User data:** MongoDB documents
- **Audit results:** MongoDB documents with nested structure
- **PDF Reports:** MongoDB GridFS (binary storage) preferred over Vercel Blob
  - **Rationale:** Simpler architecture, no dependency on Vercel Blob pricing
  - **GridFS:** MongoDB's built-in file storage for large files (PDFs)
  - **Alternative:** If GridFS proves problematic, fallback to Vercel Blob

**Storage Considerations:**

- **Encryption at rest:** MongoDB Atlas handles this by default
- **Retention policy:** Keep all audit history indefinitely (user value)
- **Export capability:** Users can download reports as PDF anytime
- **GDPR compliance:** User data deletion on account closure

---

### Compliance Requirements - Keep It Simple

**MVP Compliance Strategy: Essential Only**

**1. GDPR Basics (EU Users)**

- ✅ Privacy policy clearly stating data usage
- ✅ Cookie consent banner (if using analytics cookies)
- ✅ User data export capability (download all reports)
- ✅ User data deletion (account closure deletes all data)
- ❌ NOT implementing full GDPR apparatus (DPO, DPIA, etc.) for MVP

**2. Payment Compliance**

- ✅ Stripe handles PCI-DSS compliance (we don't store card data)
- ✅ Secure checkout flow via Stripe Checkout

**3. AI API Terms of Service**

- ✅ Comply with OpenAI, Anthropic, Perplexity, DeepSeek terms
- ✅ Don't abuse rate limits
- ✅ Respect API usage policies

**4. Web Scraping Legality**

- ✅ Respect robots.txt
- ✅ Rate limiting (don't overwhelm target servers)
- ✅ User-agent identification
- ✅ Only scrape publicly accessible pages

**5. Data Security Basics**

- ✅ HTTPS everywhere (TLS/SSL)
- ✅ MongoDB Atlas encryption at rest
- ✅ NextAuth secure session management (JWT)
- ✅ Environment variables for secrets (no hardcoded keys)
- ❌ NOT pursuing SOC 2 / ISO 27001 for MVP (overkill, post-PMF)

**Deferred (Post-MVP):**

- Audit logs for enterprise compliance
- SOC 2 Type II certification (if selling to large enterprises)
- HIPAA compliance (not needed for marketing tech)
- Advanced security features (2FA, SSO, etc.)

---

### Authentication & Authorization

**Authentication Model:**

- **NextAuth.js** (as per project-context.md)
- **Providers:**
  - Email/password (credentials provider)
  - Google OAuth (social login)
- **Session strategy:** JWT (stateless)
- **Session duration:** 30 days

**Authorization Model:**

- Simple ownership checks: User can only access their own projects/audits
- No RBAC for MVP (all users have full access to their account)
- API route security: All routes check session + user ownership

**Password Requirements:**

- Minimum 8 characters
- bcrypt hashing (10 rounds)
- No complex requirements for MVP (don't annoy users)

---

### Performance & Scalability Considerations

**Performance Targets:**

**Audit Generation:**

- **Target:** < 2 minutes per audit (100 prompt battery)
- **Approach:** Parallel processing of AI API calls
- **Architecture:** Processing service handles heavy lifting (local → AWS Lambda/ECS)

**Dashboard Load Time:**

- **Target:** < 1 second page load
- **Approach:** Optimized queries, caching, Next.js optimization

**API Response Times:**

- **Target:** < 500ms for dashboard API calls
- **Approach:** Indexed MongoDB queries, lean payloads

**Scalability Strategy:**

**MVP (0-100 users):**

- Next.js on Vercel (auto-scales)
- MongoDB Atlas M10 cluster
- Processing service: Local or single AWS Lambda

**Growth (100-1,000 users):**

- Scale MongoDB cluster (M20/M30)
- Multiple AWS Lambda instances (parallel processing)
- CDN for static assets

**Scale (1,000+ users):**

- Evaluate dedicated processing infrastructure (ECS/EKS)
- Consider queue system (SQS) for audit jobs
- Redis caching layer for hot data

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach: Premium Walking Skeleton**

**Core Philosophy:**

- **Backend/Processes:** Can be manual initially (founder-in-the-loop validation)
- **Frontend/UX:** Must be impeccable and professional from day 1
- **Target users:** Marketing agencies demand polished, professional tools
- **Strategy:** "Look premium, validate lean"

**Why This Approach:**

- **Agencies won't adopt ugly tools** - UI/UX quality = credibility signal
- **Manual processes = learning opportunity** - Founder verifies reports, understands user needs deeply
- **Fast execution** - 2 devs can ship polished UI in 8-10 weeks
- **Smart trade-off** - Invest where it matters (UI), lean where you can learn (processes)

**Resource Requirements:**

**Team Structure:**

- **2 Developers** (full-time, 8-10 weeks sprint)
- **Founder:** Product + design direction + early customer validation
- **Budget:** ~€18-28K for MVP (dev salaries + AI API costs + infra)

**Development Timeline:**

- **Weeks 1-2:** Auth + i18n architecture + basic dashboard + Stripe integration
- **Weeks 3-4:** HTML Scanner + Audit engine (AI APIs, scraping)
- **Weeks 5-6:** AI content generation + recommendations
- **Weeks 7-8:** Report PDF generation + UI polish (make it beautiful!)
- **Weeks 9-10:** Google APIs integration (optional) + testing + first beta users
- **Week 11+:** Launch to first 20-30 agencies

---

### Internationalization Strategy

**MVP Launch Languages:**

- 🇬🇧 **English** (primary)
- 🇫🇷 **French** (secondary - critical for French market)

**Post-MVP Language Additions:**

- 🇩🇪 German (Month 6-12 if European expansion)
- 🇪🇸 Spanish (Month 6-12 if European expansion)
- 🇮🇹 Italian (Year 2)

**Technical Implementation:**

- Translation files: `/locales/en.json`, `/locales/fr.json`
- User language preference stored in database
- Reports generated in user's preferred language
- UI language switcher in header

**Effort to Add New Language:**

- **With architecture:** 1-2 days (translate JSON file)
- **Without architecture:** 2-4 weeks (refactor entire codebase)

---

### HTML Scanner Detailed Scope

**What It Scans:**

**1. Schema.org Markup:**

- Organization, Person, Product, FAQPage, BreadcrumbList
- Detection format: JSON-LD, Microdata, RDFa
- Report: Present vs Missing schemas

**2. Meta Tags:**

- Title, Description (length, keyword usage)
- Open Graph (og:title, og:description, og:image)
- Twitter Cards
- AI-friendly assessment

**3. Heading Structure:**

- H1, H2, H3-H6 hierarchy
- Keyword usage in headings
- Structural clarity for AI

**4. Images:**

- Total count
- With/without alt text
- Alt text quality assessment
- Specific images needing improvement

**5. Content Keywords:**

- Top 20-30 keywords/phrases
- Keyword density
- Semantic relevance
- Missing keyword suggestions

**Output in Report:**

**"What AI Sees Now" Section:**

- ✅ "Organization schema present"
- ❌ "Missing FAQPage schema"
- ⚠️ "5/15 images lack alt text"
- 📊 "Top keywords: restaurant, organic, Paris, healthy"

**"How to Improve" Section:**

- "Add FAQ schema (code provided)"
- "Optimize these 5 images (alt text suggestions)"
- "Add keywords: farm-to-table, sustainable, local-produce"

---

### Google APIs Integration Strategy

**Decision Criteria:**

**Week 1 Research Task:**

1. Test OAuth flow complexity
2. Evaluate data quality and value
3. Assess user friction

**Include in MVP if:**

- ✅ OAuth setup < 4 hours dev time
- ✅ No additional user friction (1-click connect)
- ✅ APIs provide actionable insights

**Defer to Phase 2 if:**

- ❌ Complex OAuth (requires extensive setup)
- ❌ User must manually configure/approve multiple times
- ❌ Data quality questionable

**Most Likely Outcome:** Include both (Google APIs are well-documented, OAuth is straightforward)

**Value Proposition:**

- **Search Console:** Show traditional SEO performance + GEO correlation
- **Analytics:** Traffic sources, user behavior, ROI measurement
- **Combined:** "You're invisible in AI but visible in Google - here's the gap"

---

### MVP Success Criteria - Go/No-Go Decision

**Month 3 Checkpoint:**

**GO (Continue to Phase 2):**

- ✅ 10-15 agencies signed up
- ✅ 100+ audits delivered
- ✅ €10K MRR achieved
- ✅ 80%+ say "professional and actionable"
- ✅ 3+ testimonials: "Client found via ChatGPT after recommendations"

**ITERATE (Adjust MVP):**

- ⚠️ 5-10 agencies, €5-8K MRR
- ⚠️ 60-70% positive feedback
- **Action:** Fix UX, improve reports, re-launch

**PIVOT (Change Direction):**

- ❌ < 5 agencies, < €5K MRR
- ❌ Churn > 20%/month
- ❌ "Nice but doesn't help" feedback
- **Action:** Execute pivot (SEO+GEO, content tool, vertical, white-label)

**SHUT DOWN:**

- ❌ No traction after 3 months
- ❌ Negative feedback
- ❌ No runway / burned out
- **Action:** Graceful shutdown, document learnings

---

## Functional Requirements

### 1. User Management & Authentication

- **FR1:** Users can create an account using email/password
- **FR2:** Users can authenticate using Google OAuth
- **FR3:** Users can reset their password via email
- **FR4:** Users can view and edit their profile information
- **FR5:** Users can select their preferred language (English or French)
- **FR6:** Users can delete their account and all associated data
- **FR7:** System can maintain secure user sessions for 30 days

---

### 2. Project Management

- **FR8:** Users can create a new project by providing brand name and primary URL
- **FR9:** Users can add optional sub-URLs to a project (e.g., /blog, /shop)
- **FR10:** Users can add up to 5 competitor URLs for comparison analysis
- **FR11:** Users can view a list of all their projects
- **FR12:** Users can edit project details (brand name, URLs)
- **FR13:** Users can delete a project and all its audit history
- **FR14:** Users can manage multiple projects based on their subscription tier (1 for Basic, 5 for Pro, 10+ for Premium)

---

### 3. Audit Engine & Analysis

- **FR15:** Users can initiate a GEO audit for any project
- **FR16:** System can test project visibility across 100 AI prompts (consistent across all subscription tiers)
- **FR17:** System can query multiple AI engines (ChatGPT, Claude, Perplexity, DeepSeek) in parallel
- **FR18:** System can calculate a GEO Health Score (0-100%) based on audit results
- **FR19:** System can compare project visibility against competitor URLs
- **FR20:** System can identify which prompt categories show strongest/weakest visibility
- **FR21:** System can track audit history over time for trend analysis
- **FR22:** Users can view detailed prompt test results (which prompts mentioned the business, which didn't)

---

### 4. HTML Scanner & Technical Analysis

- **FR23:** System can scan website HTML structure (homepage + key pages)
- **FR24:** System can detect existing schema.org markup (Organization, Person, Product, FAQPage, etc.)
- **FR25:** System can analyze meta tags (title, description, Open Graph, Twitter Cards)
- **FR26:** System can evaluate heading structure (H1-H6 hierarchy)
- **FR27:** System can audit images for alt text presence and quality
- **FR28:** System can extract top 30 content keywords from scanned pages, ranked by importance (frequency, relevance, TF-IDF scoring)
- **FR29:** System can identify missing schema markup opportunities
- **FR30:** System can assess AI-friendliness of existing content structure

---

### 5. AI-Powered Recommendations

- **FR31:** System can generate 10 FAQ questions and answers based on user-provided business category (selected during audit setup questionnaire)
- **FR32:** System can provide copy-paste ready schema.org code snippets (JSON-LD format)
- **FR33:** System can suggest optimized alt text for images without descriptions
- **FR34:** System can recommend additional keywords to improve AI visibility
- **FR35:** System can prioritize recommendations using 3-level system (🔴 Critical / 🟠 Important / 🟢 Nice-to-have)
  - **Priority Criteria:**
    - 🔴 **Critical:** Blocks AI visibility AND easy to implement (< 1 hour development time)
    - 🟠 **Important:** Moderate impact on visibility AND moderate effort to implement
    - 🟢 **Nice-to-have:** Low impact OR high implementation effort
- **FR36:** System can provide plain-language explanations for each recommendation (Grade 8 reading level, minimal technical jargon)
- **FR37:** System can generate implementation instructions specifying exact code locations

---

### 6. Dashboard & Visualization

- **FR38:** Users can view GEO Health Score prominently displayed with color-coding (red/orange/green)
- **FR39:** Users can view Prompt Gap Analysis visualization showing percentage visibility
- **FR40:** Users can view competitor comparison charts (user vs 3-5 competitors)
- **FR41:** Users can view top 3-5 priority issues with plain-language descriptions
- **FR42:** Users can drill down into detailed audit results
- **FR43:** Users can view audit history timeline for a project
- **FR44:** Users can compare multiple audits to track improvement over time
- **FR45:** Users can switch dashboard language between English and French

---

### 7. Report Generation & Distribution

- **FR46:** System can generate professional PDF reports from audit results (with brand logo header, clean typography, visual charts/graphics, comprehensive audit details)
- **FR47:** Reports can include executive summary (1 page, visual, for business owners)
- **FR48:** Reports can include technical details (5-10 pages, code snippets, for developers)
- **FR49:** Reports can be localized in user's preferred language (English or French)
- **FR50:** Users can download PDF reports from the dashboard
- **FR51:** System can store PDF reports securely (MongoDB GridFS)
- **FR52:** Users can receive email notification when report is ready
- **FR53:** Users can share report download links with team members or clients

---

### 8. Payments & Subscription Management

- **FR54:** Users can purchase Basic one-shot audit (€100, ChatGPT only, 1 competitor, no history)
- **FR55:** Users can purchase Pro one-shot audit (€200, all 4 AI engines, 5 competitors, with history)
- **FR56:** Users can subscribe to Premium tier (€500/month, 20 audits included, unlimited competitors, white-label)
- **FR57:** Premium subscribers can purchase extra audits beyond 20 at €20/audit
- **FR58:** Premium subscribers can cancel their subscription
- **FR59:** Users can access Stripe Customer Portal to manage payment methods
- **FR60:** System can process payment events via Stripe webhooks (one-time purchases + subscription lifecycle)
- **FR61:** System can restrict features based on purchase type:
  - Basic: ChatGPT only, 1 competitor, dashboard resets each purchase
  - Pro: All AI engines, 5 competitors, persistent dashboard with history
  - Premium: All AI engines, unlimited competitors, history, white-label PDF

---

### 9. Email Notifications

- **FR63:** Users can receive welcome email upon account creation
- **FR64:** Users can receive audit completion notification with download link
- **FR65:** Users can receive subscription confirmation emails
- **FR66:** Users can receive payment receipts via email

---

### 10. Integration Capabilities (Conditional MVP)

- **FR67:** Users can connect their Google Search Console account (OAuth)
- **FR68:** System can retrieve traditional SEO performance metrics from Google Search Console
- **FR69:** Users can connect their Google Analytics account (OAuth)
- **FR70:** System can retrieve traffic and user behavior data from Google Analytics
- **FR71:** Dashboard can display correlation between GEO visibility and traditional SEO/traffic metrics

---

### 11. Data Management & Compliance

- **FR72:** System can encrypt sensitive data at rest (email, password hashes, payment info, API keys, business details - using MongoDB Atlas encryption)
- **FR73:** System can export all user data in machine-readable format (GDPR compliance)
- **FR74:** System can permanently delete all user data upon account closure
- **FR75:** System can respect robots.txt when scraping websites
- **FR76:** System can rate-limit web scraping requests to avoid overwhelming target servers
- **FR77:** System can identify itself with descriptive user-agent string when making web requests (format: "ShowYourBrand-Bot/1.0 (+https://ShowYourBrand.com/bot)")

---

### 12. Admin Interface & Operations

**Purpose:** Founder/admin needs oversight and control over all platform operations to monitor quality, debug issues, and manually intervene when necessary.

**Design Philosophy:** Functional over beautiful - simple back-office interface with complete data visibility and control capabilities.

- **FR78:** Admins can access dedicated admin dashboard (separate from user dashboard, protected route)
- **FR79:** Admins can view list of all audits across all users with filters (status, date, user, business name)
- **FR80:** Admins can view detailed audit information including:
  - User details (name, email, subscription tier)
  - Business details (name, URL, industry)
  - Audit status (Queued, In Progress, Completed, Failed)
  - GEO Health Score and key metrics
  - Prompt test results (which prompts passed/failed)
  - Generated recommendations
  - PDF report download link
  - Processing logs and timestamps
- **FR81:** Admins can view complete user dashboard for any audit (see exactly what user sees)
- **FR82:** Admins can manually edit audit data if corrections needed (with audit trail logging)
- **FR83:** Admins can manually re-generate PDF reports for any audit
- **FR84:** Admins can view platform-wide statistics:
  - Total audits run (daily, weekly, monthly)
  - Success rate (completed vs failed audits)
  - Average audit processing time
  - User subscription distribution (Basic/Pro/Premium)
  - Revenue metrics (MRR, churn rate)
- **FR85:** Admins can search and filter audits by:
  - User email
  - Business name
  - Date range
  - Audit status
  - GEO score range
- **FR86:** Admins can view error logs and debug information for failed audits
- **FR87:** Admins can manually trigger audit retry for failed audits
- **FR88:** Admins can view raw API responses from AI engines (ChatGPT, Claude, Perplexity, DeepSeek) for debugging

**Access Control:**

- Admin interface protected by separate authentication (admin-only credentials)
- Admin actions logged with timestamp and admin user ID
- No user should have access to admin interface (even Premium subscribers)

**MVP Scope Note:**

- Admin interface must be functional from MVP launch (founder validation and quality control)
- UI polish not critical (simple table views + forms acceptable)
- Can use basic styling (no Dreelio-level polish required for admin)

---

## Non-Functional Requirements

### Performance Requirements

**NFR-P1: Audit Completion Reliability**

- **Requirement:** GEO audits must complete successfully with 10-minute timeout (anti-hang protection)
- **Rationale:** Quality takes priority over speed. Focus is on complete, accurate results, not arbitrary time limits. Audits taking 5-10 minutes acceptable if thorough. Timeout prevents infinite hangs only.
- **Target:** Most audits complete in 5-8 minutes (quality thoroughness)
- **Perception Note:** Longer processing time = higher perceived value (not "too quick = superficial")
- **Measurement:** Monitor audit success rate (completed / initiated), track timeout occurrences, alert if timeout rate > 5%

**NFR-P2: Dashboard Load Performance**

- **Requirement:** Dashboard pages must load in under 2 seconds for 95th percentile users
- **Rationale:** Premium UI expectation for agency users. Slow dashboards = perceived low quality
- **Measurement:** Lighthouse performance score > 85, Core Web Vitals green (LCP < 2.5s, FID < 100ms, CLS < 0.1)

**NFR-P3: API Response Time**

- **Requirement:** API endpoints must respond in under 1 second for 95th percentile (excluding audit generation)
- **Rationale:** Smooth UX requires snappy API responses for dashboard interactions
- **Measurement:** APM monitoring of API routes, P95 response time tracking, alert if P95 > 1s

**NFR-P4: Parallel AI API Processing**

- **Requirement:** Prompt testing must query 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek) in parallel, not sequentially
- **Rationale:** Sequential processing would take 4x longer, increasing audit time and timeout risk
- **Measurement:** Audit logs show parallel execution (audit time ≈ slowest API, not sum of all)

**NFR-P5: PDF Generation Reliability**

- **Requirement:** PDF report generation must complete within 2 minutes (processed asynchronously with email notification)
- **Rationale:** Quality over speed. Comprehensive reports with charts/graphics may require processing time. Async processing prevents user waiting.
- **Measurement:** Track PDF generation time, alert if timeout rate > 2%

---

### Security Requirements

**NFR-S1: Data Encryption at Rest**

- **Requirement:** All sensitive user data must be encrypted at rest using MongoDB Atlas encryption
- **Rationale:** GDPR compliance, user trust, competitive table stakes
- **Measurement:** MongoDB Atlas encryption enabled for cluster, verified in config
- **MVP Acceptance:** Encryption enabled from launch (non-negotiable)

**NFR-S2: Secure Authentication**

- **Requirement:** Passwords must be hashed using bcrypt (min 10 rounds - OWASP recommended minimum, industry standard for password security), session tokens must be JWT with secure flags
- **Rationale:** Prevent credential theft, session hijacking. 10 rounds provides strong protection while maintaining acceptable login performance.
- **Measurement:** Code review of auth implementation, security audit

**NFR-S3: HTTPS Everywhere**

- **Requirement:** All traffic must be served over HTTPS (TLS 1.2+), no mixed content
- **Rationale:** Prevent man-in-the-middle attacks, Google ranking signal, user trust
- **Measurement:** SSL Labs A+ rating, no browser warnings
- **MVP Acceptance:** Vercel handles this by default (verify no HTTP fallback)

**NFR-S4: API Key Protection**

- **Requirement:** AI API keys, Stripe keys, database credentials must never be exposed in client-side code or logs
- **Rationale:** Leaked keys = financial loss, data breach
- **Measurement:** Code review, environment variable audit, log sanitization
- **MVP Acceptance:** All secrets in environment variables, never committed to Git

**NFR-S5: Payment Security (PCI-DSS)**

- **Requirement:** Payment processing must be PCI-DSS compliant (via Stripe, no card data stored)
- **Rationale:** Legal requirement for payment processing, user trust
- **Measurement:** Stripe handles compliance, verify no card data touches our servers
- **MVP Acceptance:** Stripe Checkout/Elements only (never handle raw card data)

**NFR-S6: User Data Isolation**

- **Requirement:** Users must only access their own projects, audits, reports (no cross-user data leakage)
- **Rationale:** Privacy violation, competitive intelligence risk
- **Measurement:** Security audit of API routes, test with multiple accounts
- **MVP Acceptance:** All API routes check session + userId ownership

---

### Reliability Requirements

**NFR-R1: Audit Success Rate**

- **Requirement:** 95%+ of paid audits must complete successfully and deliver a report
- **Rationale:** Users pay for audits. Failed audits = refunds, churn, reputation damage
- **Measurement:** Track (completed audits / total initiated audits), alert if success rate drops below 95%

**NFR-R2: Platform Uptime**

- **Requirement:** Dashboard and authentication must maintain 99%+ uptime (Vercel SLA baseline)
- **Rationale:** Agencies present reports to clients during business hours. Downtime = lost sales opportunities
- **Measurement:** Uptime monitoring (e.g., StatusPage, Pingdom), track monthly availability percentage

**NFR-R3: Graceful AI API Degradation**

- **Requirement:** If 1+ AI APIs fail (OpenAI, Claude, Perplexity, DeepSeek), audit must complete with remaining APIs and display warning to user (minimum 2 APIs required to generate report)
- **Rationale:** External API reliability beyond our control. Partial data better than no data.
- **Measurement:** Test individual API failures, verify audit completes with clear warnings indicating which APIs failed

**NFR-R4: Data Backup & Recovery**

- **Requirement:** User data and audit results must be backed up daily, recoverable within 24 hours
- **Rationale:** Data loss = catastrophic user trust breach
- **Measurement:** MongoDB Atlas handles automated backups, verify restore procedure
- **MVP Acceptance:** MongoDB Atlas default backups enabled (test restore once)

**NFR-R5: Error Monitoring & Alerting**

- **Requirement:** Critical errors must be logged and alert founders within 5 minutes
- **Rationale:** Fast incident response = less user impact
- **Measurement:** Error tracking tool (Sentry, LogRocket) configured, test alerts
- **MVP Acceptance:** Email alerts for 5xx errors, payment failures, audit crashes

---

### Scalability Requirements

**NFR-SC1: Concurrent User Support**

- **Requirement:** Platform must support 100 concurrent users without degradation
- **Rationale:** MVP target = 15 agencies × 3-5 users per agency ≈ 50-75 users, need 2x headroom
- **Measurement:** Load testing with 100 concurrent sessions
- **MVP Acceptance:** Vercel auto-scaling handles this (verify with synthetic testing)

**NFR-SC2: Audit Volume Capacity**

- **Requirement:** System must handle 500 audits/month (North Star metric at Month 12)
- **Rationale:** Business success depends on audit volume scaling
- **Measurement:** Track monthly audit volume, monitor processing queue depth
- **MVP Acceptance:** 100 audits/month capacity (scale infra as needed)

**NFR-SC3: Database Scalability**

- **Requirement:** MongoDB must scale to 10,000 audits + 1,000 users without performance degradation
- **Rationale:** 12-month growth projection (500 audits/month × 12 + history)
- **Measurement:** Query performance monitoring, index optimization
- **MVP Acceptance:** MongoDB Atlas M10 sufficient (upgrade to M20 if query times degrade)

**NFR-SC4: Processing Service Horizontal Scaling**

- **Requirement:** Audit processing service must scale horizontally (add more instances as load increases)
- **Rationale:** Audit generation = resource-intensive (AI API calls, scraping, PDF). Single instance = bottleneck
- **Measurement:** Processing service can run multiple instances in parallel
- **MVP Acceptance:** Single instance sufficient for MVP (< 100 audits/month), architect for horizontal scaling

---

### Integration Requirements

**NFR-I1: Stripe Webhook Reliability**

- **Requirement:** Stripe webhooks must be idempotent and handle retries gracefully
- **Rationale:** Stripe retries failed webhooks. Duplicate processing = billing errors
- **Measurement:** Test webhook retries, verify idempotency logic
- **MVP Acceptance:** Webhook signature validation + idempotency key checks

**NFR-I2: AI API Rate Limiting Compliance**

- **Requirement:** System must respect AI API rate limits (OpenAI, Claude, Perplexity, DeepSeek) with exponential backoff on 429 errors (1s → 2s → 4s → 8s, max 4 retries, 15s total timeout per request)
- **Rationale:** Exceeding rate limits = API blocks, failed audits. Exponential backoff prevents overwhelming rate-limited APIs.
- **Measurement:** Rate limit tracking, monitor 429 error frequency and retry success rates

**NFR-I3: Email Deliverability**

- **Requirement:** Transactional emails (audit completion, welcome) must have 95%+ delivery rate
- **Rationale:** Users expect email notifications. Low deliverability = support tickets
- **Measurement:** Resend dashboard monitoring, track bounce/spam rates
- **MVP Acceptance:** SPF/DKIM configured, monitor Resend metrics

**NFR-I4: Google API Reliability (Conditional)**

- **Requirement:** If Google Search Console/Analytics integrated, API failures must not block audit completion
- **Rationale:** Google APIs optional data source. Failure should not break core flow
- **Measurement:** Test Google API failures, verify audit completes with warnings
- **MVP Acceptance:** Google data shown if available, graceful "Data unavailable" if API fails

---

### Accessibility Requirements

**NFR-A1: WCAG 2.1 Level A Compliance**

- **Requirement:** Dashboard must meet WCAG 2.1 Level A accessibility standards (semantic HTML, alt text, keyboard navigation)
- **Rationale:** Legal requirement (EU), inclusive design, SEO benefit
- **Measurement:** Lighthouse accessibility score > 90, axe DevTools audit
- **MVP Acceptance:** Major accessibility violations fixed (not perfect, but usable)

**NFR-A2: Keyboard Navigation**

- **Requirement:** All interactive elements must be accessible via keyboard (no mouse-only interactions)
- **Rationale:** Accessibility, power users prefer keyboard
- **Measurement:** Manual keyboard navigation test, tab order verification
- **MVP Acceptance:** Core flows (create project, run audit, download report) keyboard-accessible

**NFR-A3: Screen Reader Compatibility**

- **Requirement:** Dashboard must be navigable with screen readers (NVDA, JAWS, VoiceOver)
- **Rationale:** Accessibility for visually impaired users
- **Measurement:** Test with at least one screen reader
- **MVP Acceptance:** Major sections (navigation, dashboard, forms) screen reader friendly

---

### Internationalization Requirements

**NFR-I18N1: Language Switching**

- **Requirement:** Users must be able to switch UI language between English and French without page reload
- **Rationale:** Smooth UX for bilingual users, reduce friction
- **Measurement:** Test language switcher, verify instant UI update
- **MVP Acceptance:** Language switcher works, preference persisted in database

**NFR-I18N2: Localized Reports**

- **Requirement:** PDF reports must be generated in user's preferred language (English or French)
- **Rationale:** Agencies present reports to French-speaking clients
- **Measurement:** Generate reports in both languages, verify content localized
- **MVP Acceptance:** All report sections translated (executive summary, recommendations, technical details)

**NFR-I18N3: Language Extensibility**

- **Requirement:** Adding a new language (e.g., German) must require < 2 days of work (translation only, no code changes)
- **Rationale:** Fast geographic expansion depends on easy localization
- **Measurement:** Document process, estimate effort for 3rd language
- **MVP Acceptance:** i18n architecture in place (next-i18next), translation files separated from code

---
