# Spécification Technique — Audit Engine GEO

> Document de référence pour l'implémentation du moteur d'audit GEO.
> Couvre : génération de prompts, exécution sur 4 IA, détection de mentions, calcul du score, pipeline admin, et intégration avec le HTML Scanner.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Pipeline complète](#2-pipeline-complète)
3. [Génération des prompts (5 niveaux)](#3-génération-des-prompts-5-niveaux)
4. [Catégories transversales](#4-catégories-transversales)
5. [Exécution sur 4 IA](#5-exécution-sur-4-ia)
6. [Détection de mention (Regex + Fuzzy)](#6-détection-de-mention-regex--fuzzy)
7. [Scoring par réponse](#7-scoring-par-réponse)
8. [Agrégation des scores](#8-agrégation-des-scores)
9. [Score GEO final (70/30)](#9-score-geo-final-7030)
10. [Statuts et pipeline Admin](#10-statuts-et-pipeline-admin)
11. [Modèle de données Audit](#11-modèle-de-données-audit)
12. [Prompt Generator — Template LLM](#12-prompt-generator--template-llm)
13. [Seuil de découvrabilité](#13-seuil-de-découvrabilité)
14. [Intégration HTML Scanner](#14-intégration-html-scanner)

---

## 1. Vue d'ensemble

L'Audit Engine est le cœur du produit ShowYourBrand. Il mesure la **visibilité réelle** d'un business dans les réponses des IA génératives (ChatGPT, Claude, Perplexity, Gemini/DeepSeek).

**Principe :** On envoie 100 prompts sur-mesure à 4 moteurs IA, on analyse les 400 réponses pour détecter si le business est mentionné, et on calcule un score de visibilité GEO de 0 à 100%.

**Cible principale :** Sites e-commerce et sites vitrine (pas uniquement des commerces physiques).

**Score GEO final :**

```
GEO Score = (Audit Engine Score × 0.70) + (HTML Scanner Score × 0.30)
```

---

## 2. Pipeline complète

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        PIPELINE AUDIT GEO                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User clique "Lancer l'audit"                                        │
│     → WebSite crée Audit (status: pending) dans MongoDB                 │
│     → WebSite appelle Server Python via REST API + Bearer token         │
│                                                                          │
│  2. Server Python reçoit la requête                                      │
│     → Récupère les métadonnées du business (nom, URL, catégorie,        │
│       description, mots-clés, concurrents)                              │
│     → Status → processing                                               │
│                                                                          │
│  3. Génération des 100 prompts via LLM                                  │
│     → 1 appel à un LLM pas cher (GPT-4o-mini ou Haiku)                 │
│     → Produit 100 prompts JSON adaptés au business                      │
│     → 5 niveaux × 20 prompts chacun                                    │
│                                                                          │
│  4. Exécution des 400 requêtes (100 prompts × 4 IA)                    │
│     → Parallélisation par engine (4 workers)                            │
│     → Chaque worker exécute ses 100 prompts séquentiellement            │
│     → Exponential backoff sur rate limits                               │
│     → Timeout global : 10 minutes                                       │
│     → Minimum 2/4 IA doivent répondre                                  │
│                                                                          │
│  5. Analyse des 400 réponses                                            │
│     → Regex + fuzzy matching sur businessName et primaryUrl             │
│     → Score de qualité (0-3) et position pour chaque réponse            │
│                                                                          │
│  6. Calcul des scores                                                    │
│     → Score par prompt (agrégation des 4 IA)                            │
│     → Score par catégorie (discovery, comparison, etc.)                 │
│     → Score par niveau (1-5)                                            │
│     → Audit Engine Score global (0-100)                                 │
│                                                                          │
│  7. Server écrit TOUT dans MongoDB                                       │
│     → Résultats bruts + scores calculés                                 │
│     → Status → review_pending                                           │
│                                                                          │
│  8. Admin valide dans son dashboard                                      │
│     → Inspecte les résultats                                            │
│     → Valide → status: completed → User reçoit email + voit résultats  │
│     → Rejette → status: rejected → User notifié                        │
│                                                                          │
│  9. Score GEO final calculé (côté WebSite)                              │
│     → GEO = (Audit Engine × 0.70) + (HTML Scanner × 0.30)              │
│     → Affiché sur le dashboard user                                     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Point clé :** Le Server Python écrit directement dans MongoDB. Pas de callback HTTP vers le WebSite. Le WebSite poll la DB (10s interval pour le user) ou l'admin consulte quand il veut.

---

## 3. Génération des prompts (5 niveaux)

Les prompts ne sont **PAS** fixes. Ils sont **générés dynamiquement** par un LLM pour chaque business, à partir de ses métadonnées.

### Structure des 5 niveaux

| Niveau | Nom              | Prompts | Description                                                                               | Objectif                                                        |
| ------ | ---------------- | ------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **1**  | **Large**        | 20      | **5 ultra-larges** + **15 catégorie**                                                     | Mesurer la visibilité sur les requêtes où le trafic est maximal |
| **2**  | **Niche**        | 20      | Requêtes très spécifiques au positionnement du business                                   | Mesurer la visibilité dans sa niche exacte                      |
| **3**  | **Quasi-direct** | 20      | Décrit le business sans le nommer (caractéristiques, localisation, niche)                 | Mesurer si l'IA fait le lien entre description et business      |
| **4**  | **Semi-direct**  | 20      | Mentionne des détails identifiants partiels (ville, niche exacte, caractéristique unique) | Affiner le seuil entre "connu" et "recommandé"                  |
| **5**  | **Direct**       | 20      | Nomme explicitement le business ou l'URL                                                  | Mesurer si l'IA connaît le business quand on le cite            |

### Détail par niveau

#### Niveau 1 — Large (5 ultra-larges + 15 catégorie)

**Ultra-larges (5 prompts) :** Requêtes très génériques que n'importe qui poserait.

- "Quel site pour acheter des chaussures en ligne ?"
- "Recommande-moi un bon e-commerce de mode"
- _Attendu :_ Les géants (Amazon, Zalando) dominent. Score quasi-nul pour la plupart des business. C'est normal — ça sert de baseline.\*

**Catégorie (15 prompts) :** Requêtes avec des filtres de catégorie (pays, style, gamme, type).

- "Meilleur site français pour des chaussures en cuir ?"
- "E-commerce de chaussures artisanales en Europe ?"
- _Attendu :_ Début de visibilité possible pour les business bien positionnés.\*

**Pourquoi ce mélange :** Si on met 20 ultra-larges, on a 20 réponses "Nike, Adidas, Amazon" — zéro insight utile. Le mélange 5+15 donne une baseline réaliste sans gaspiller de prompts.

#### Niveau 2 — Niche (20 prompts)

Requêtes très ciblées sur le positionnement exact du business.

- "Où acheter des chaussures en cuir artisanales fabriquées en France ?"
- "Site e-commerce spécialisé en maroquinerie cuir végétal livraison France"
- "Comparatif des marques de chaussures artisanales françaises en ligne"

_Attendu : C'est ici que les business niche commencent à apparaître._

#### Niveau 3 — Quasi-direct (20 prompts)

Décrit le business par ses caractéristiques **sans le nommer**.

- "Tu connais des marques françaises de chaussures artisanales vendues en ligne ?"
- "Il existe des sites e-commerce qui fabriquent leurs chaussures en cuir eux-mêmes ?"
- "Quelles sont les alternatives artisanales aux grandes marques de chaussures ?"

_Attendu : Si l'IA fait le lien entre la description et le business, c'est un bon signe._

#### Niveau 4 — Semi-direct (20 prompts) ← NOUVEAU

Mentionne des **détails identifiants partiels** : ville, caractéristique très spécifique, niche ultra-précise.

- "Il y a un site artisanal de chaussures basé à Lyon qui fait tout en cuir, tu vois lequel ?"
- "Je cherche une marque française de chaussures en cuir, je crois qu'ils sont à Lyon"
- "Un ami m'a parlé d'un e-commerce de chaussures artisanales françaises, cuir pleine fleur, tu connais ?"

_Attendu : L'IA devrait identifier le business si elle le connaît. C'est le palier critique._

#### Niveau 5 — Direct (20 prompts)

Nomme **explicitement** le business ou l'URL.

- "Tu connais MaisonCuir.fr ?"
- "Que penses-tu de MaisonCuir ?"
- "MaisonCuir.fr est fiable pour acheter en ligne ?"
- "Donne-moi des infos sur le site maisoncuir.fr"

_Attendu : Si même en citant le nom l'IA ne connaît pas → le business est totalement invisible._

---

## 4. Catégories transversales

Chaque prompt est **taggué** avec une catégorie d'intention (indépendante du niveau de spécificité). Ça permet une analyse croisée niveau × catégorie.

| Catégorie       | Ce que ça mesure                              | Exemple                                |
| --------------- | --------------------------------------------- | -------------------------------------- |
| **discovery**   | L'IA recommande-t-elle le business ?          | "Quel site pour acheter X ?"           |
| **comparison**  | L'IA cite le business face aux concurrents ?  | "C'est mieux X ou Y pour Z ?"          |
| **reputation**  | L'IA connaît-elle la réputation du business ? | "X est fiable pour acheter en ligne ?" |
| **product**     | L'IA connaît-elle les produits/services ?     | "Quels produits propose X ?"           |
| **alternative** | L'IA cite le business comme alternative ?     | "Quelle alternative à [concurrent] ?"  |
| **trust**       | L'IA inspire confiance envers le business ?   | "Est-ce sûr d'acheter sur X ?"         |

### Rendu dashboard (radar)

```
discovery  ████░░░░░░ 35%    → "Les IA ne vous recommandent pas spontanément"
comparison ██░░░░░░░░ 15%    → "Vos concurrents sont bien plus visibles"
reputation ███████░░░ 72%    → "Bonne réputation quand on demande spécifiquement"
product    █████░░░░░ 48%    → "Vos produits sont partiellement connus"
alternative████░░░░░░ 38%    → "Rarement cité comme alternative"
trust      ██████░░░░ 62%    → "Confiance correcte quand on demande"
```

---

## 5. Exécution sur 4 IA

### Moteurs cibles

| Moteur     | API            | Modèle           | Coût estimé/prompt |
| ---------- | -------------- | ---------------- | ------------------ |
| ChatGPT    | OpenAI API     | gpt-4o-mini      | ~$0.0003           |
| Claude     | Anthropic API  | claude-3-haiku   | ~$0.0003           |
| Perplexity | Perplexity API | pplx-7b-online   | ~$0.0005           |
| Gemini     | Google AI API  | gemini-1.5-flash | ~$0.0001           |

**Coût total par audit :** ~400 requêtes × ~$0.0003 = **~$0.12/audit** (hors génération de prompts)

### Stratégie de parallélisation

```
                    ┌─── Worker ChatGPT ──→ 100 prompts séquentiels
                    │
Server Python ──────┼─── Worker Claude ────→ 100 prompts séquentiels
                    │
                    ├─── Worker Perplexity ─→ 100 prompts séquentiels
                    │
                    └─── Worker Gemini ────→ 100 prompts séquentiels

→ 4 workers en parallèle, chacun traite ses 100 prompts
→ Temps estimé : 5-8 minutes (vs 20-30 min séquentiel)
```

### Gestion des erreurs

- **Rate limit :** Exponential backoff (1s → 2s → 4s → 8s, max 4 retries)
- **Timeout par requête :** 30 secondes
- **Timeout global :** 10 minutes
- **Seuil minimum :** 2/4 IA doivent répondre pour que l'audit soit valide
- **Fallback :** Si une IA échoue totalement, l'audit continue avec les autres. Le score est calculé sur les IA ayant répondu (mentionné dans les résultats).

---

## 6. Détection de mention (Regex + Fuzzy)

### Pourquoi pas LLM-as-judge ?

**Contexte :** Les cibles sont des sites e-commerce. Quand une IA recommande un site, elle cite le **nom** ou l'**URL**. Il n'y a pas de "mention implicite" comme pour un commerce physique ("le café au coin de la rue").

**Décision :** Regex + fuzzy matching pour le MVP. Simple, rapide, gratuit, et suffisamment fiable pour le use case e-commerce.

### Algorithme de détection

```python
def detect_mention(response: str, business: BusinessSnapshot) -> MentionResult:
    """
    Détecte si le business est mentionné dans la réponse d'une IA.
    Retourne: { mentioned: bool, quality: 0-3, position: int }
    """
    response_lower = response.lower()

    # 1. Match exact sur le nom du business
    name_match = business.name.lower() in response_lower

    # 2. Match sur l'URL (avec et sans www, http, trailing slash)
    url_variants = generate_url_variants(business.primary_url)
    url_match = any(variant in response_lower for variant in url_variants)

    # 3. Match fuzzy sur le nom (pour variantes : "Maison Cuir" vs "MaisonCuir")
    fuzzy_match = fuzz.partial_ratio(business.name.lower(), response_lower) > 85

    # 4. Déterminer si mentionné
    mentioned = name_match or url_match or fuzzy_match

    if not mentioned:
        return { "mentioned": False, "quality": 0, "position": 0 }

    # 5. Calculer la qualité (0-3)
    quality = calculate_quality(response, business)

    # 6. Calculer la position (rang dans la liste de recommandations)
    position = calculate_position(response, business)

    return { "mentioned": True, "quality": quality, "position": position }
```

### Variantes d'URL générées

Pour `https://www.maisoncuir.fr` :

```
maisoncuir.fr
www.maisoncuir.fr
https://maisoncuir.fr
https://www.maisoncuir.fr
maisoncuir (sans extension)
```

### Calcul de qualité (0-3)

| Score | Signification                 | Détection                                                                                                |
| ----- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| **0** | Pas mentionné                 | Aucun match                                                                                              |
| **1** | Mentionné en passant          | Le nom apparaît 1 seule fois, pas dans une recommandation structurée                                     |
| **2** | Recommandé parmi d'autres     | Le nom apparaît dans une liste de recommandations (détecté via patterns : "1.", "- ", "•", numérotation) |
| **3** | Recommandé en premier / focus | Le nom est le premier élément d'une liste OU la réponse est centrée sur le business                      |

### Calcul de position

La position est le **rang** du business dans la réponse :

- Si le business est le 1er cité → position = 1
- Si 2e → position = 2
- etc.

**Détection de rang :** On parse la réponse pour identifier les entités/recommandations (patterns de liste numérotée, tirets, paragraphes) et on détermine dans quel "slot" le business apparaît.

---

## 7. Scoring par réponse

Chaque réponse individuelle (1 prompt × 1 IA) produit un **score unitaire** :

```
responseScore = quality × positionMultiplier
```

### Multiplicateurs de position

| Position      | Multiplicateur | Justification                                 |
| ------------- | -------------- | --------------------------------------------- |
| Rang 1        | ×1.5           | Première recommandation = visibilité maximale |
| Rang 2-3      | ×1.0           | Bien visible, mais pas en tête                |
| Rang 4+       | ×0.7           | Mentionné mais enterré dans la liste          |
| Non mentionné | ×0.0           | Invisible                                     |

### Score max par réponse

```
Score max = 3 (qualité max) × 1.5 (rang 1) = 4.5
```

---

## 8. Agrégation des scores

### 8.1 Score par prompt (agrégation des 4 IA)

```
promptScore = Σ(responseScore pour chaque IA) / (nombre d'IA ayant répondu × 4.5)
```

Résultat : un nombre entre 0.0 et 1.0.

**Exemple :**

```
Prompt "Meilleur site de chaussures artisanales ?" :
  ChatGPT  : qualité 3, rang 1 → 3 × 1.5 = 4.5
  Claude   : qualité 2, rang 3 → 2 × 1.0 = 2.0
  Perplexity: qualité 0         → 0
  Gemini   : qualité 1, rang 5 → 1 × 0.7 = 0.7

promptScore = (4.5 + 2.0 + 0 + 0.7) / (4 × 4.5) = 7.2 / 18 = 0.40
mentionRate = 3/4 = 75%
```

### 8.2 Score par catégorie transversale

```
categoryScore = moyenne(promptScore) pour tous les prompts de cette catégorie
```

### 8.3 Score par niveau de spécificité

```
levelScore = moyenne(promptScore) pour tous les prompts de ce niveau
```

### 8.4 Audit Engine Score global

Moyenne pondérée des scores par catégorie :

| Catégorie       | Poids | Justification                                     |
| --------------- | ----- | ------------------------------------------------- |
| **discovery**   | ×2.0  | C'est le use case #1 : "recommande-moi un X"      |
| **comparison**  | ×1.5  | Très stratégique : être cité face aux concurrents |
| **reputation**  | ×1.2  | Important pour la conversion                      |
| **product**     | ×1.0  | Connaissance des produits/services                |
| **alternative** | ×1.5  | Capturer le trafic des concurrents                |
| **trust**       | ×1.0  | Confiance/fiabilité                               |

```
auditEngineScore = Σ(categoryScore × categoryWeight) / Σ(categoryWeight) × 100
```

Résultat : un nombre entre **0 et 100**.

---

## 9. Score GEO final (70/30)

```
GEO Score = (auditEngineScore × 0.70) + (htmlScannerScore × 0.30)
```

### Pourquoi 70/30 ?

- **70% Audit Engine** = Mesure la **visibilité réelle** (est-ce que les IA te citent ?)
- **30% HTML Scanner** = Mesure le **potentiel d'optimisation** (est-ce que ton site est structuré pour que les IA te trouvent ?)

### Grille de couleur

| Score GEO | Couleur       | Label                 |
| --------- | ------------- | --------------------- |
| 0-30%     | 🔴 Rouge      | Invisible             |
| 31-50%    | 🟠 Orange     | Faible visibilité     |
| 51-70%    | 🟡 Jaune      | Visibilité moyenne    |
| 71-85%    | 🟢 Vert clair | Bonne visibilité      |
| 86-100%   | 💚 Vert       | Excellente visibilité |

### Le HTML Scanner Score

Le HTML Scanner produit son propre score (0-100) basé sur :

- Schema.org markup détecté vs manquant
- Qualité des meta tags (title, description, OG, Twitter)
- Structure des headings (H1-H6)
- Alt text des images
- Top 30 keywords (TF-IDF)
- AI-friendliness globale

**Le HTML Scanner sera implémenté séparément.** Ce document se concentre sur l'Audit Engine. Le score GEO final (70/30) sera calculé côté WebSite une fois les deux scores disponibles.

---

## 10. Statuts et pipeline Admin

### Flow des statuts

```
pending → processing → review_pending → completed
                                      → rejected
          → failed (erreur technique)
```

| Statut           | Qui                   | Description                                          |
| ---------------- | --------------------- | ---------------------------------------------------- |
| `pending`        | Système               | Audit créé, en attente de traitement                 |
| `processing`     | Server Python         | Le serveur traite les 400 requêtes                   |
| `review_pending` | Server Python → Admin | Traitement terminé, en attente de validation admin   |
| `completed`      | Admin                 | Admin a validé → visible par l'utilisateur           |
| `rejected`       | Admin                 | Admin a rejeté (résultats incohérents, erreur, etc.) |
| `failed`         | Server Python         | Erreur technique (timeout, <2 IA disponibles, etc.)  |

### Dashboard Admin — Vue "Audits en attente"

L'admin voit :

1. **Liste des audits `review_pending`** triés par date
2. Pour chaque audit :
   - Business name + URL
   - User (email)
   - Audit Engine Score calculé
   - Nombre d'IA ayant répondu (ex: 3/4)
   - Taux de mention global
   - Boutons : **Valider** | **Rejeter** | **Inspecter**
3. **Vue inspection** :
   - Les 100 prompts avec leurs réponses brutes par IA
   - Les scores détaillés par prompt/catégorie/niveau
   - Les éventuelles anomalies (100% sur niveau 5 mais 0% sur tout le reste = suspect)

### Validation automatique (future)

Pour le MVP, validation manuelle. À terme, on pourra ajouter une **validation automatique** si :

- 3/4+ IA ont répondu
- Pas d'anomalie détectée (pas de score aberrant)
- Le business a déjà eu un audit validé précédemment

---

## 11. Modèle de données Audit

### Schema MongoDB

```typescript
const AuditSchema = new Schema(
  {
    // Références
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    // Statut
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "review_pending",
        "completed",
        "rejected",
        "failed",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    // Snapshot du business au moment de l'audit (pattern snapshot)
    businessSnapshot: {
      name: { type: String, required: true },
      primaryUrl: { type: String, required: true },
      subUrls: [String],
      competitorUrls: [String],
      category: String,
      description: String,
      targetKeywords: [String],
    },

    // Prompts générés pour cet audit
    generatedPrompts: [
      {
        id: { type: Number, required: true }, // 1-100
        level: { type: Number, required: true }, // 1-5
        category: { type: String, required: true }, // discovery, comparison, etc.
        question: { type: String, required: true }, // Le prompt envoyé aux IA
      },
    ],

    // Résultats bruts (400 réponses)
    promptResults: [
      {
        promptId: { type: Number, required: true }, // Réf vers generatedPrompts.id
        level: Number,
        category: String,
        question: String,

        // Réponses par IA
        engines: {
          chatgpt: {
            mentioned: Boolean,
            quality: { type: Number, min: 0, max: 3 },
            position: Number,
            rawResponse: String,
            responseTime: Number, // ms
            error: String, // null si OK
          },
          claude: {
            mentioned: Boolean,
            quality: { type: Number, min: 0, max: 3 },
            position: Number,
            rawResponse: String,
            responseTime: Number,
            error: String,
          },
          perplexity: {
            mentioned: Boolean,
            quality: { type: Number, min: 0, max: 3 },
            position: Number,
            rawResponse: String,
            responseTime: Number,
            error: String,
          },
          gemini: {
            mentioned: Boolean,
            quality: { type: Number, min: 0, max: 3 },
            position: Number,
            rawResponse: String,
            responseTime: Number,
            error: String,
          },
        },

        // Scores calculés pour ce prompt
        promptScore: Number, // 0.0-1.0
        mentionRate: Number, // 0.0-1.0 (ex: 3/4 = 0.75)
      },
    ],

    // Scores agrégés par catégorie
    categoryScores: {
      discovery: { score: Number, promptCount: Number, avgMentionRate: Number },
      comparison: {
        score: Number,
        promptCount: Number,
        avgMentionRate: Number,
      },
      reputation: {
        score: Number,
        promptCount: Number,
        avgMentionRate: Number,
      },
      product: { score: Number, promptCount: Number, avgMentionRate: Number },
      alternative: {
        score: Number,
        promptCount: Number,
        avgMentionRate: Number,
      },
      trust: { score: Number, promptCount: Number, avgMentionRate: Number },
    },

    // Scores agrégés par niveau
    levelScores: {
      level1: { score: Number, promptCount: Number, avgMentionRate: Number },
      level2: { score: Number, promptCount: Number, avgMentionRate: Number },
      level3: { score: Number, promptCount: Number, avgMentionRate: Number },
      level4: { score: Number, promptCount: Number, avgMentionRate: Number },
      level5: { score: Number, promptCount: Number, avgMentionRate: Number },
    },

    // Score final Audit Engine
    auditEngineScore: { type: Number, min: 0, max: 100 },

    // Score HTML Scanner (rempli séparément)
    htmlScannerScore: { type: Number, min: 0, max: 100 },

    // Score GEO final (calculé : engine×0.7 + html×0.3)
    geoScore: { type: Number, min: 0, max: 100 },

    // Seuil de découvrabilité (voir section 13)
    discoverabilityThreshold: {
      level: { type: Number, min: 1, max: 5 }, // À partir de quel niveau le business est trouvé
      description: String, // "Visible à partir du niveau 3 (Niche)"
    },

    // Données concurrents (même 100 prompts testés)
    competitorResults: [
      {
        competitorUrl: String,
        competitorName: String,
        auditEngineScore: Number,
        mentionRate: Number,
        categoryScores: {
          discovery: Number,
          comparison: Number,
          reputation: Number,
          product: Number,
          alternative: Number,
          trust: Number,
        },
        levelScores: {
          level1: Number,
          level2: Number,
          level3: Number,
          level4: Number,
          level5: Number,
        },
      },
    ],

    // Métadonnées
    enginesUsed: [String], // ["chatgpt", "claude", "perplexity", "gemini"]
    enginesSucceeded: [String], // ["chatgpt", "claude", "gemini"] (si perplexity a fail)
    totalPromptsProcessed: Number,
    totalResponsesReceived: Number,
    processingTimeMs: Number,

    // Admin
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    reviewNotes: String,

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Index
AuditSchema.index({ businessId: 1, createdAt: -1 });
AuditSchema.index({ userId: 1, status: 1 });
AuditSchema.index({ status: 1, createdAt: -1 }); // Pour le dashboard admin
```

### Taille estimée d'un document Audit

- 100 prompts × texte = ~50KB
- 400 réponses brutes (rawResponse) = ~200-500KB
- Scores et métadonnées = ~5KB
- **Total : ~300-600KB par audit**

C'est acceptable pour MongoDB (limite par document = 16MB).

---

## 12. Prompt Generator — Template LLM

### Le prompt système envoyé au LLM générateur

````
Tu es un expert en GEO (Generative Engine Optimization). Tu dois générer
exactement 100 prompts de test pour mesurer la visibilité d'un business
dans les réponses des IA génératives.

## Business à analyser
- Nom : {businessName}
- URL : {primaryUrl}
- Catégorie : {category}
- Description : {description}
- Mots-clés cibles : {targetKeywords}
- Concurrents : {competitorNames}

## Structure OBLIGATOIRE : 5 niveaux × 20 prompts

### Niveau 1 — LARGE (20 prompts)
Les 5 PREMIERS prompts sont ULTRA-LARGES : requêtes très génériques que
n'importe qui poserait dans cette catégorie. Le nom du business NE DOIT PAS
apparaître.
Exemples : "Quel site pour acheter des chaussures en ligne ?"

Les 15 SUIVANTS sont de CATÉGORIE : requêtes avec des filtres (pays, style,
gamme, type de produit). Le nom du business NE DOIT PAS apparaître.
Exemples : "Meilleur site français de chaussures en cuir ?"

### Niveau 2 — NICHE (20 prompts)
Requêtes très spécifiques au positionnement exact du business. Le nom du
business NE DOIT PAS apparaître.
Exemples : "Où acheter des chaussures artisanales en cuir made in France ?"

### Niveau 3 — QUASI-DIRECT (20 prompts)
Requêtes qui DÉCRIVENT le business par ses caractéristiques SANS le nommer.
Exemples : "Tu connais des marques françaises de chaussures artisanales
vendues en ligne ?"

### Niveau 4 — SEMI-DIRECT (20 prompts)
Requêtes qui mentionnent des DÉTAILS IDENTIFIANTS PARTIELS : ville,
caractéristique très spécifique, niche ultra-précise, contexte unique.
Le nom PEUT ou NON apparaître (variez).
Exemples : "Il y a un site artisanal de chaussures basé à Lyon qui fait
tout en cuir, tu vois lequel ?"

### Niveau 5 — DIRECT (20 prompts)
Requêtes qui NOMMENT EXPLICITEMENT le business ou l'URL.
Variez les formulations : question directe, demande d'avis, demande d'info.
Exemples : "Tu connais {businessName} ?", "Que penses-tu de {businessName} ?",
"Donne-moi des infos sur {primaryUrl}"

## Catégories transversales
Chaque prompt DOIT être taggué avec UNE catégorie d'intention parmi :
- discovery : l'IA recommanderait-elle ce business ?
- comparison : comparaison avec concurrents
- reputation : avis/fiabilité/confiance
- product : connaissance des produits/services
- alternative : le business comme alternative à un concurrent
- trust : sécurité/fiabilité de l'achat

Répartis les catégories de manière ÉQUILIBRÉE sur les 100 prompts.
Chaque catégorie doit apparaître au moins 10 fois.

## FORMAT DE RÉPONSE

IMPORTANT : Ta réponse DOIT être EXCLUSIVEMENT au format JSON valide.
Ne retourne AUCUN texte en dehors du JSON.
Pas de markdown, pas d'explication, pas de commentaire, pas de ```json```.
Uniquement le JSON brut.

Format attendu :
[
  {
    "id": 1,
    "level": 1,
    "category": "discovery",
    "question": "Quel site recommandes-tu pour acheter des chaussures en ligne ?"
  },
  {
    "id": 2,
    "level": 1,
    "category": "comparison",
    "question": "Quels sont les meilleurs e-commerce de mode en France ?"
  }
]

VÉRIFIE :
- Exactement 100 prompts (id 1 à 100)
- 20 prompts par niveau (level 1 à 5)
- Chaque prompt a un id, level, category, question
- Les catégories sont bien réparties (min 10 par catégorie)
- Niveau 1 : 5 ultra-larges (id 1-5) + 15 catégorie (id 6-20)
- Le JSON est valide et parsable
````

### Coût de génération

- Modèle : GPT-4o-mini ou Claude 3 Haiku
- Input : ~800 tokens (prompt système + métadonnées business)
- Output : ~4000 tokens (100 prompts JSON)
- **Coût : ~$0.01 par audit** — négligeable

### Validation du JSON retourné

```python
def validate_generated_prompts(prompts: list) -> bool:
    """Valide que les 100 prompts sont conformes."""
    assert len(prompts) == 100, "Doit avoir exactement 100 prompts"

    # Vérifier les niveaux
    for level in range(1, 6):
        level_prompts = [p for p in prompts if p["level"] == level]
        assert len(level_prompts) == 20, f"Niveau {level} doit avoir 20 prompts"

    # Vérifier les catégories
    valid_categories = {"discovery", "comparison", "reputation", "product", "alternative", "trust"}
    for p in prompts:
        assert p["category"] in valid_categories, f"Catégorie invalide: {p['category']}"

    # Vérifier répartition des catégories (min 10 chacune)
    from collections import Counter
    cat_counts = Counter(p["category"] for p in prompts)
    for cat in valid_categories:
        assert cat_counts.get(cat, 0) >= 10, f"Catégorie {cat} a moins de 10 prompts"

    # Vérifier les IDs
    ids = [p["id"] for p in prompts]
    assert ids == list(range(1, 101)), "IDs doivent être 1 à 100"

    return True
```

---

## 13. Seuil de découvrabilité

Le **seuil de découvrabilité** est le niveau de spécificité minimum à partir duquel les IA commencent à citer le business.

### Calcul

```python
def calculate_discoverability_threshold(level_scores: dict) -> dict:
    """
    Détermine le niveau à partir duquel le business est trouvé.
    Un niveau est considéré "découvert" si mentionRate > 25% (au moins 1/4 IA).
    """
    THRESHOLD = 0.25

    for level in range(1, 6):
        if level_scores[f"level{level}"]["avgMentionRate"] >= THRESHOLD:
            return {
                "level": level,
                "description": LEVEL_DESCRIPTIONS[level]
            }

    return {
        "level": None,
        "description": "Non découvert — le business est invisible même quand on le cite directement"
    }

LEVEL_DESCRIPTIONS = {
    1: "Excellent — visible sur les requêtes larges (niveau 1)",
    2: "Bon — visible dans sa niche (niveau 2)",
    3: "Moyen — visible quand on décrit ses caractéristiques (niveau 3)",
    4: "Faible — visible uniquement avec des indices très spécifiques (niveau 4)",
    5: "Minimal — visible uniquement quand on le cite par son nom (niveau 5)",
}
```

### Rendu pour l'utilisateur

```
┌──────────────────────────────────────────────────────┐
│  Seuil de découvrabilité : Niveau 3 (Niche)          │
│                                                       │
│  █████████░░░░░░░░░░░░░░  Niveau 1 — 8%  ░░         │
│  ████████████░░░░░░░░░░░  Niveau 2 — 22% ░░         │
│  █████████████████░░░░░░  Niveau 3 — 45% ██ ← seuil │
│  ████████████████████░░░  Niveau 4 — 68% ██         │
│  ██████████████████████░  Niveau 5 — 85% ██         │
│                                                       │
│  💡 Les IA vous trouvent quand la question est très  │
│     spécifique à votre niche, mais pas sur les        │
│     recherches larges où vos concurrents captent      │
│     la majorité du trafic.                            │
└──────────────────────────────────────────────────────┘
```

---

## 14. Intégration HTML Scanner

Le HTML Scanner est **implémenté séparément** et produit un score de 0-100.

### Quand le HTML Scanner intervient

Le HTML Scanner peut être exécuté :

- **En parallèle** de l'Audit Engine (scan HTML pendant que les 400 requêtes IA tournent)
- **Avant** l'Audit Engine (si on veut que les résultats HTML informent la génération de prompts — future amélioration)

### Calcul du GEO Score final

```python
def calculate_geo_score(audit_engine_score: float, html_scanner_score: float) -> float:
    """
    Calcule le score GEO final.
    Appelé côté WebSite une fois les deux scores disponibles.
    """
    return round(audit_engine_score * 0.70 + html_scanner_score * 0.30, 1)
```

### Cas limites

- **HTML Scanner échoue** (site inaccessible) : GEO Score = Audit Engine Score seul (×1.0)
- **Audit Engine échoue** (<2 IA disponibles) : Audit marqué `failed`, pas de score
- **Les deux réussissent** : Formule 70/30 standard

---

## Annexes

### A. Coût par audit (estimation)

| Composant                         | Coût             |
| --------------------------------- | ---------------- |
| Génération des 100 prompts (LLM)  | ~$0.01           |
| 400 requêtes IA (4 engines × 100) | ~$0.12           |
| HTML Scanner (pas de coût API)    | $0.00            |
| **Total**                         | **~$0.13/audit** |

### B. Temps d'exécution estimé

| Phase                       | Durée            |
| --------------------------- | ---------------- |
| Génération prompts          | 5-10s            |
| 400 requêtes IA (parallèle) | 5-8 min          |
| Analyse des réponses        | 2-5s             |
| Calcul des scores           | <1s              |
| Écriture MongoDB            | <1s              |
| **Total**                   | **~5-9 minutes** |

### C. Dépendances techniques

- **Python libraries** : `openai`, `anthropic`, `httpx`, `pymongo`, `fuzzywuzzy`
- **MongoDB** : Version 5+ (pour les index composites)
- **API keys** : OpenAI, Anthropic, Perplexity, Google AI (Gemini)
