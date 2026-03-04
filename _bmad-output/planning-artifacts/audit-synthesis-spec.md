# Spécification Technique — Synthèse d'Audit GEO (Recommendations Engine)

> Document issu de la session de conception du 2026-03-04.
> Complète `audit-engine-spec.md` avec la couche de synthèse qui lie HTML scan + résultats IA en recommandations actionnables.

---

## 1. Contexte et problème

### État actuel du dashboard

La page audit (`/[username]/audits/[auditId]`) affiche **deux rapports séparés** :
- Les résultats HTML scan (schema.org, meta tags, robots.txt, llms.txt, keywords, etc.)
- Les résultats IA (400 réponses, categoryScores, levelScores, mention rates)

**Le problème :** L'utilisateur voit des métriques mais pas le **lien causal**. Il sait que son score discovery est à 23%, il sait que son FAQ schema est absent, mais il ne comprend pas que l'un explique l'autre — ni comment corriger.

### Ce que doit produire la synthèse

Un rapport unifié qui répond à ces trois questions :

1. **Pourquoi** mon score est-il ce qu'il est ? (lien HTML → score IA)
2. **Quoi** corriger en priorité ? (liste actionnables triés par impact)
3. **Comment** exactement ? (code prêt à copier-coller, contenu rédigé)

---

## 2. Types de recommandations générées

### 2.1 Recommandations techniques (déterministes)

Issues détectées automatiquement depuis le HTML scan :

| Problème | Condition de déclenchement | Sévérité |
|----------|---------------------------|----------|
| `robots.txt` absent | `htmlScan.robotsTxtAnalysis.exists === false` | high |
| `llms.txt` absent | `htmlScan.llmsTxtAnalysis.exists === false` | high |
| FAQ schema manquant | `htmlScan.schemaOrg.hasFAQ === false` | critical si discovery < 40% |
| Meta description absente/courte | `len(description) < 100` | medium |
| Images sans alt text | `htmlScan.imageAltText.missing > 0` | medium |
| Sitemap absent | `htmlScan.sitemapAnalysis.exists === false` | medium |
| H1 manquant ou multiple | `htmlScan.headingStructure.h1Count !== 1` | medium |
| Schema Organization manquant | `htmlScan.schemaOrg.hasOrganization === false` | high |
| Schema Product/Service manquant | dépend de la catégorie business | high |

### 2.2 Recommandations de contenu (cross-référencées avec scores IA)

Issues qui nécessitent de croiser HTML + résultats IA :

| Pattern détecté | Recommandation |
|----------------|----------------|
| Level 1 < 20% AND Level 5 > 60% | Problème de notoriété, pas de contenu → page "À propos" enrichie, Wikipedia |
| Category discovery < 30% AND pas de FAQ schema | Ajouter FAQ schema avec les vraies questions non répondues |
| Category comparison < 25% | Ajouter page comparatif, schema Competitor |
| Category reputation < 40% | Ajouter schema Review/AggregateRating, page témoignages |
| Concurrent cité 3× plus sur "comparison" | Analyse de ce que le concurrent a que vous n'avez pas |

### 2.3 Recommandations personnalisées (générées par LLM)

Les plus précieuses : les prompts de niveau 2-3 sans aucune mention deviennent des **suggestions de FAQ avec le vrai contenu rédigé**, des **meta descriptions optimisées**, et du **contenu llms.txt personnalisé**.

---

## 3. Architecture du pipeline de synthèse

### Position dans le pipeline global

```
1. Génération des 100 prompts (LLM)
2. Exécution des 400 requêtes IA (4 workers parallèles)
3. Détection des mentions (Regex + Fuzzy)
4. Calcul des scores (category/level scores, auditEngineScore)
5. HTML scan (parallèle aux étapes 2-4)
6. ← Tous les scores et données disponibles →

   NEW ↓
6.5 SYNTHÈSE (3 phases)
    ├── Phase A : Règles déterministes → liste d'issues
    ├── Phase B : Extraction des prompt gaps → questions sans réponse
    └── Phase C : 1 appel LLM → recommandations avec contenu concret

7. Écriture MongoDB complète (scores + recommendations)
8. Status → review_pending
```

### Coût ajouté

| Phase | Coût |
|-------|------|
| Phase A (règles déterministes) | $0.00 |
| Phase B (extraction gaps) | $0.00 |
| Phase C (1 appel LLM GPT-4o-mini) | ~$0.02–0.04 |
| **Total ajouté par audit** | **~$0.03** |

---

## 4. Implémentation Python détaillée

### 4.1 Phase A — Détection d'issues (déterministe)

```python
def detect_issues(html_scan: dict, category_scores: dict, level_scores: dict) -> list[dict]:
    """
    Analyse le HTML scan et les scores IA pour produire une liste d'issues structurées.
    Entièrement déterministe, pas de coût API.
    """
    issues = []

    # ── TECHNICAL ──────────────────────────────────────────────────────────────

    if not html_scan.get('robotsTxtAnalysis', {}).get('exists'):
        issues.append({
            "type": "technical",
            "id": "no_robots_txt",
            "severity": "high",
            "html_finding": "robots.txt absent",
            "ai_impact": None
        })

    if not html_scan.get('llmsTxtAnalysis', {}).get('exists'):
        issues.append({
            "type": "technical",
            "id": "no_llms_txt",
            "severity": "high",
            "html_finding": "llms.txt absent — les IA modernes lisent ce fichier comme les moteurs lisent robots.txt",
            "ai_impact": None
        })

    if not html_scan.get('sitemapAnalysis', {}).get('exists'):
        issues.append({
            "type": "technical",
            "id": "no_sitemap",
            "severity": "medium",
            "html_finding": "sitemap.xml absent",
            "ai_impact": None
        })

    # ── SCHEMA.ORG ─────────────────────────────────────────────────────────────

    schema = html_scan.get('schemaOrg', {})
    discovery_score = category_scores.get('discovery', {}).get('score', 0)

    if not schema.get('hasFAQ'):
        issues.append({
            "type": "schema",
            "id": "no_faq_schema",
            "severity": "critical" if discovery_score < 40 else "high",
            "html_finding": "Pas de FAQPage schema markup",
            "ai_impact": f"Score discovery: {round(discovery_score)}% — les IA ne répondent pas aux questions sur votre activité"
        })

    if not schema.get('hasOrganization'):
        issues.append({
            "type": "schema",
            "id": "no_organization_schema",
            "severity": "high",
            "html_finding": "Pas de Organization schema markup",
            "ai_impact": "Les IA manquent d'infos structurées sur votre entreprise (nom, description, coordonnées)"
        })

    # ── META TAGS ──────────────────────────────────────────────────────────────

    meta = html_scan.get('metaTags', {})
    description = meta.get('description', '') or ''
    if not description or len(description) < 100:
        issues.append({
            "type": "meta",
            "id": "weak_meta_description",
            "severity": "medium",
            "html_finding": f"Meta description: '{description[:80]}...' ({len(description)} chars, recommandé: 150-160)",
            "ai_impact": "Les IA citent souvent la meta description pour présenter un site"
        })

    # ── CROSS-REFERENCING NIVEAU/SCORE ─────────────────────────────────────────

    l1 = level_scores.get('level1', {}).get('avgMentionRate', 0)
    l5 = level_scores.get('level5', {}).get('avgMentionRate', 0)

    if l1 < 0.20 and l5 > 0.60:
        issues.append({
            "type": "content",
            "id": "low_brand_awareness",
            "severity": "critical",
            "html_finding": "Contenu insuffisant pour les requêtes génériques",
            "ai_impact": (
                f"Vous êtes connu quand on vous cite directement ({round(l5*100)}% niveau 5) "
                f"mais invisible sur requêtes larges ({round(l1*100)}% niveau 1). "
                "Problème de notoriété, pas de contenu."
            )
        })

    comparison_score = category_scores.get('comparison', {}).get('score', 0)
    if comparison_score < 25:
        issues.append({
            "type": "content",
            "id": "weak_comparison_visibility",
            "severity": "high",
            "html_finding": "Pas de contenu comparatif sur le site",
            "ai_impact": f"Score comparison: {round(comparison_score)}% — vous n'êtes pas cité face à vos concurrents"
        })

    return issues
```

### 4.2 Phase B — Extraction des prompt gaps

```python
def extract_prompt_gaps(prompt_results: list, category_scores: dict) -> list[dict]:
    """
    Identifie les questions posées aux IA auxquelles le business n'a pas répondu.
    Les prompts niveau 2-3 sans mention = opportunités FAQ directes.
    """
    gaps = []

    for prompt in prompt_results:
        # Niveau 2 (niche) ou 3 (quasi-direct) avec 0% de mention
        if prompt['level'] in [2, 3] and prompt['mentionRate'] == 0:
            gaps.append({
                "question": prompt['question'],
                "level": prompt['level'],
                "category": prompt['category'],
                "promptId": prompt['promptId']
            })

    # Prioriser par catégorie la plus faible en score
    weakest_categories = sorted(
        category_scores.items(),
        key=lambda x: x[1].get('score', 0)
    )[:3]  # Top 3 catégories les plus faibles

    priority_gaps = []
    by_category = {}
    for g in gaps:
        by_category.setdefault(g['category'], []).append(g)

    for cat, _ in weakest_categories:
        # Prendre max 3 questions par catégorie faible
        priority_gaps.extend(by_category.get(cat, [])[:3])

    # Compléter avec d'autres gaps jusqu'à 10 max
    other_gaps = [g for g in gaps if g not in priority_gaps]
    priority_gaps.extend(other_gaps[:max(0, 10 - len(priority_gaps))])

    return priority_gaps[:10]
```

### 4.3 Phase C — Appel LLM de synthèse

```python
import json
import openai

def call_llm_synthesis(
    business_snapshot: dict,
    issues: list,
    prompt_gaps: list,
    category_scores: dict,
    level_scores: dict,
    competitor_results: list
) -> dict:
    """
    1 seul appel LLM (GPT-4o-mini ou Claude Haiku) qui génère les recommandations
    avec le vrai contenu prêt à copier-coller.

    Coût estimé : ~$0.02-0.04 par audit.
    """

    # Résumé concurrents pour contexte
    competitor_summary = []
    for comp in competitor_results[:3]:  # Max 3 concurrents
        competitor_summary.append({
            "url": comp.get('competitorUrl'),
            "auditEngineScore": round(comp.get('auditEngineScore', 0)),
            "mentionRate": round(comp.get('mentionRate', 0) * 100),
            "bestCategory": max(
                comp.get('categoryScores', {}).items(),
                key=lambda x: x[1],
                default=("unknown", 0)
            )[0]
        })

    system_prompt = """Tu es un expert en GEO (Generative Engine Optimization).
Tu analyses les résultats d'un audit de visibilité IA et génères des recommandations
concrètes et actionnables pour améliorer la présence du business dans les réponses des IA.
Tu réponds EXCLUSIVEMENT en JSON valide. Pas de markdown, pas de commentaires."""

    user_prompt = f"""
## Business à optimiser
- Nom : {business_snapshot['name']}
- URL : {business_snapshot['primaryUrl']}
- Catégorie : {business_snapshot.get('category', 'non précisée')}
- Description : {business_snapshot.get('description', 'non précisée')}
- Mots-clés cibles : {', '.join(business_snapshot.get('targetKeywords', []))}

## Scores IA par catégorie (0-100)
{json.dumps({k: round(v.get('score', 0)) for k, v in category_scores.items()}, indent=2)}

## Scores par niveau de spécificité (0-100)
{json.dumps({k: round(v.get('score', 0)) for k, v in level_scores.items()}, indent=2)}

## Concurrents (pour référence)
{json.dumps(competitor_summary, indent=2)}

## Problèmes détectés (HTML + corrélation IA)
{json.dumps(issues, indent=2)}

## Questions posées aux IA où le business N'A PAS été mentionné
(ce sont de vraies questions posées par des utilisateurs aux IA génératives)
{json.dumps([g['question'] for g in prompt_gaps], indent=2)}

## INSTRUCTIONS
Génère 5 à 10 recommandations actionnables, triées par priorité décroissante (critical en premier).
Pour chaque recommandation :
- Explique le lien causal HTML → score IA en 1-2 phrases simples
- Fournis le code ou contenu EXACT prêt à copier-coller (pas de placeholder)
- Pour les FAQ : rédige les vraies paires Q/R basées sur les questions non répondues ci-dessus
- Pour llms.txt : génère le vrai contenu du fichier pour ce business
- Pour meta description : rédige le vrai texte optimisé (150-160 chars)
- Pour schema JSON-LD : génère le JSON complet et valide

## FORMAT DE RÉPONSE (JSON strict)
{{
  "recommendations": [
    {{
      "id": "identifiant-unique-kebab-case",
      "priority": "critical | high | medium | low",
      "category": "schema | meta | content | technical | faq",
      "title": "Titre court actionnable (max 60 chars)",
      "why": "Explication du lien cause-effet en 1-2 phrases",
      "estimatedScoreGain": 12,
      "impactCategories": ["discovery", "comparison"],
      "implementation": {{
        "type": "json_ld | meta_tag | robots_txt | llms_txt | page_content | html_attr",
        "instructions": "Ce que le client doit faire concrètement (où, comment)",
        "code": "Le code ou contenu exact prêt à copier-coller"
      }},
      "relatedQuestions": ["question 1 des prompt gaps liée à cette reco"]
    }}
  ],
  "summary": {{
    "criticalCount": 2,
    "highCount": 3,
    "totalEstimatedGain": 35,
    "topPriority": "Une phrase sur l'action la plus urgente"
  }}
}}
"""

    client = openai.OpenAI()  # ou anthropic.Anthropic() selon le modèle choisi
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=4000
    )

    return json.loads(response.choices[0].message.content)
```

### 4.4 Fonction principale d'orchestration

```python
def generate_recommendations(audit_data: dict) -> dict:
    """
    Point d'entrée principal de la synthèse.
    Appelé après le calcul de tous les scores (étape 6.5).

    Returns:
        dict avec "recommendations" et "summary"
    """
    html_scan = audit_data.get('htmlScan', {})
    category_scores = audit_data.get('categoryScores', {})
    level_scores = audit_data.get('levelScores', {})
    prompt_results = audit_data.get('promptResults', [])
    competitor_results = audit_data.get('competitorResults', [])
    business_snapshot = audit_data.get('businessSnapshot', {})

    # Phase A : détection déterministe
    issues = detect_issues(html_scan, category_scores, level_scores)

    # Phase B : extraction des prompt gaps
    prompt_gaps = extract_prompt_gaps(prompt_results, category_scores)

    # Phase C : synthèse LLM
    recommendations = call_llm_synthesis(
        business_snapshot=business_snapshot,
        issues=issues,
        prompt_gaps=prompt_gaps,
        category_scores=category_scores,
        level_scores=level_scores,
        competitor_results=competitor_results
    )

    return recommendations
```

---

## 5. Exemple de sortie concrète

Pour un site de chaussures artisanales avec discovery à 23% et llms.txt absent :

```json
{
  "recommendations": [
    {
      "id": "faq-schema-discovery",
      "priority": "critical",
      "category": "faq",
      "title": "Ajouter un FAQ Schema sur la page d'accueil",
      "why": "14 questions sur votre activité n'ont reçu aucune réponse des IA. Un FAQPage schema permet aux IA de citer directement vos réponses quand un utilisateur pose ces questions.",
      "estimatedScoreGain": 18,
      "impactCategories": ["discovery", "product"],
      "implementation": {
        "type": "json_ld",
        "instructions": "Insérer dans le <head> de votre page d'accueil (index.html ou _document.tsx)",
        "code": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"FAQPage\",\n  \"mainEntity\": [\n    {\n      \"@type\": \"Question\",\n      \"name\": \"Où acheter des chaussures artisanales en cuir fabriquées en France ?\",\n      \"acceptedAnswer\": {\n        \"@type\": \"Answer\",\n        \"text\": \"MaisonCuir.fr est une maison française spécialisée dans les chaussures artisanales en cuir pleine fleur, entièrement fabriquées à Lyon depuis 2015.\"\n      }\n    },\n    {\n      \"@type\": \"Question\",\n      \"name\": \"Quelles sont les alternatives artisanales aux grandes marques de chaussures ?\",\n      \"acceptedAnswer\": {\n        \"@type\": \"Answer\",\n        \"text\": \"MaisonCuir propose une alternative haut de gamme aux grandes marques avec des chaussures fabriquées à la main en cuir français, sur-mesure possible.\"\n      }\n    }\n  ]\n}\n</script>"
      },
      "relatedQuestions": [
        "Où acheter des chaussures artisanales en cuir fabriquées en France ?",
        "Marques françaises de chaussures artisanales vendues en ligne ?"
      ]
    },
    {
      "id": "llms-txt-creation",
      "priority": "high",
      "category": "technical",
      "title": "Créer le fichier llms.txt",
      "why": "Les IA modernes (Claude, GPT-4, Perplexity) lisent llms.txt pour comprendre un site, comme les moteurs de recherche lisent robots.txt. Votre site n'en a pas.",
      "estimatedScoreGain": 8,
      "impactCategories": ["discovery", "reputation"],
      "implementation": {
        "type": "llms_txt",
        "instructions": "Créer le fichier à la racine de votre site : /public/llms.txt (accessible sur https://maisoncuir.fr/llms.txt)",
        "code": "# MaisonCuir\n\n> Maison française de chaussures artisanales en cuir, fondée à Lyon en 2015.\n\nMaisonCuir crée des chaussures artisanales en cuir pleine fleur 100% fabriquées en France. Chaque paire est assemblée à la main par nos artisans lyonnais selon les méthodes traditionnelles de la cordonnerie française.\n\n## Produits\n- Derbies cuir homme (cuir pleine fleur, semelle cuir)\n- Boots artisanales femme (cuir vachette français)\n- Mocassins cuir (disponibles en sur-mesure)\n- Chaussures de ville sur-mesure\n\n## Notre engagement\n- Fabrication 100% française (Lyon)\n- Cuir sourcé en France et en Europe\n- Garantie à vie sur la structure\n- Service de ressemelage disponible\n\n## Contact\n- Site : https://maisoncuir.fr\n- Email : contact@maisoncuir.fr\n- Showroom : 12 Rue de la République, 69001 Lyon"
      },
      "relatedQuestions": []
    },
    {
      "id": "meta-description-optimization",
      "priority": "medium",
      "category": "meta",
      "title": "Optimiser la meta description avec vos mots-clés cibles",
      "why": "Votre meta description actuelle (67 chars) est trop courte. Les IA citent souvent la meta description pour présenter un site quand elles le recommandent.",
      "estimatedScoreGain": 6,
      "impactCategories": ["reputation", "trust"],
      "implementation": {
        "type": "meta_tag",
        "instructions": "Remplacer votre meta description actuelle dans le <head>",
        "code": "<meta name=\"description\" content=\"MaisonCuir : chaussures artisanales en cuir pleine fleur, 100% fabriquées à Lyon. Derbies, boots et mocassins sur-mesure. Livraison France & Europe.\" />"
      },
      "relatedQuestions": [
        "MaisonCuir.fr est fiable pour acheter en ligne ?"
      ]
    }
  ],
  "summary": {
    "criticalCount": 1,
    "highCount": 2,
    "totalEstimatedGain": 32,
    "topPriority": "Ajouter le FAQ Schema — action unique avec le plus grand impact sur le score discovery (+18 pts)"
  }
}
```

---

## 6. Schéma MongoDB — Champ à ajouter

Dans le document `Audit`, ajouter le champ `recommendations` :

```typescript
// Dans AuditSchema (audit-engine-spec.md section 11)
recommendations: [
  {
    id: { type: String, required: true },
    priority: {
      type: String,
      enum: ["critical", "high", "medium", "low"],
      required: true
    },
    category: {
      type: String,
      enum: ["schema", "meta", "content", "technical", "faq"],
      required: true
    },
    title: { type: String, required: true },
    why: { type: String, required: true },
    estimatedScoreGain: { type: Number, min: 0, max: 100 },
    impactCategories: [String],
    implementation: {
      type: { type: String },       // "json_ld" | "meta_tag" | "robots_txt" | "llms_txt" | etc.
      instructions: String,
      code: String,                  // Contenu exact prêt à copier
    },
    relatedQuestions: [String],
    status: {
      type: String,
      enum: ["pending", "implemented"],
      default: "pending"
    }
  }
],
recommendationsSummary: {
  criticalCount: Number,
  highCount: Number,
  totalEstimatedGain: Number,
  topPriority: String,
}
```

---

## 7. Intégration dans le dashboard WebSite

### Ce que le dashboard doit afficher (nouvelle section)

Remplacer la présentation brute des données par un onglet **"Recommandations"** :

```
┌─────────────────────────────────────────────────────────────────┐
│  PLAN D'ACTION GEO — 7 recommandations                          │
│  Gain estimé si tout implémenté : +32 pts GEO                   │
├─────────────────────────────────────────────────────────────────┤
│  🔴 CRITIQUE                                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Ajouter un FAQ Schema sur la page d'accueil             │    │
│  │ Impact : +18 pts · Discovery + Product                   │    │
│  │ [Voir le code] [Marquer comme implémenté]                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  🟠 HIGH                                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Créer le fichier llms.txt                               │    │
│  │ Impact : +8 pts · Discovery + Reputation                │    │
│  │ [Voir le contenu] [Marquer comme implémenté]            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

La section "Questions non répondues" dans le dashboard peut pointer vers les recommandations correspondantes.

---

## 8. Décisions architecturales prises

| Décision | Choix | Raison |
|----------|-------|--------|
| Où faire la synthèse | Serveur Python | Cohérence avec le PDF, une seule source de vérité en DB |
| Quand | Après calcul des scores, avant écriture MongoDB | Tout dans la même transaction |
| LLM pour synthèse | GPT-4o-mini (ou Claude Haiku) | Coût ~$0.03, suffisant pour le niveau de personnalisation |
| Règles déterministes | Oui (Phase A) | Issues techniques = pas besoin de LLM |
| Prompt gaps | Max 10 questions | Éviter de surcharger le contexte LLM |
| Stockage | Champ `recommendations[]` dans Audit | Simple, cohérent avec snapshot pattern |
| Status `implemented` | Prévu mais non prioritaire MVP | Future feature : tracking d'implémentation |

---

## 9. Questions ouvertes (à décider)

1. **Modèle LLM pour la synthèse** : GPT-4o-mini ou Claude Haiku ? (préférence pour cohérence avec le reste du stack)
2. **Règles Phase A** : liste complète à définir avec le HTML scanner réel (dépend de ce que le scanner retourne exactement)
3. **Nombre de recommandations max** : 5-10 semble raisonnable, à valider avec l'UX
4. **Gain estimé** : affiché tel quel (LLM-generated) ou calibré avec un modèle de scoring réel ?
5. **Re-génération** : si l'admin veut re-générer les reco sans refaire l'audit → endpoint `/api/audits/[id]/regen-recommendations` ?

---

*Dernière mise à jour : 2026-03-04*
*Document lié : `audit-engine-spec.md`*
