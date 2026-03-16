"""
3 brand configs for the GEO audit simulation.

Each dict maps 1:1 to AuditRequest fields.
Used by generate_prompts.py to pre-generate 3×100 prompts via claude CLI.
"""

BRANDS = [
    {
        # ── E-COMMERCE ─────────────────────────────────────────────────────
        "slug": "ankorstore",
        "businessName": "Ankorstore",
        "businessUrl": "https://fr.ankorstore.com/",
        "businessType": "marketplace B2B e-commerce",
        "category": "marketplace wholesale B2B pour retailers indépendants",
        "description": (
            "Ankorstore est une marketplace B2B européenne qui connecte des marques "
            "indépendantes avec des retailers (boutiques, concept stores, épiceries fines, "
            "librairies). Elle permet aux commerçants indépendants de commander en petites "
            "quantités auprès de plus de 30 000 marques avec des conditions avantageuses : "
            "paiement différé 60 jours, retours gratuits sur la première commande, "
            "et livraison centralisée. Fondée en France en 2019, présente dans toute l'Europe."
        ),
        "language": "fr",
        "localityTier": "global",
        "targetKeywords": [
            "marketplace wholesale",
            "fournisseur boutique indépendante",
            "commander en gros petites quantités",
            "plateforme B2B marques",
            "Ankorstore",
        ],
        "uniqueSellingPoints": [
            "Paiement différé 60 jours pour les retailers",
            "Retours gratuits sur la première commande",
            "30 000+ marques européennes indépendantes",
            "Commandes en petites quantités sans minimum élevé",
            "Plateforme 100% dédiée aux commerçants indépendants",
        ],
        "competitorNames": ["Faire", "Orderchamp", "Mable", "RangeMe"],
        "competitorUrls": [
            "https://faire.com",
            "https://www.orderchamp.com",
            "https://mable.com",
            "https://www.rangeme.com",
        ],
        "targetAudience": (
            "Gérants de boutiques indépendantes, concept stores, épiceries fines, "
            "librairies indépendantes, boutiques de mode — cherchant à s'approvisionner "
            "en marques originales sans passer par les grossistes traditionnels."
        ),
        "servicesOrProducts": [
            "Marketplace wholesale B2B",
            "Accès à 30 000+ marques indépendantes",
            "Paiement différé 60 jours",
            "Retours gratuits première commande",
            "Livraison centralisée multi-marques",
        ],
        "yearFounded": 2019,
        "country": "France",
        "priceRange": "wholesale",
    },
    {
        # ── SAAS ────────────────────────────────────────────────────────────
        "slug": "creatify",
        "businessName": "Creatify",
        "businessUrl": "https://creatify.ai/",
        "businessType": "saas",
        "category": "AI-powered video ad creation platform",
        "description": (
            "Creatify is an AI-powered video ad creation platform that lets marketers, "
            "e-commerce brands, and agencies generate product video ads in minutes. "
            "Users input a product URL or images and the AI generates multiple video ad "
            "variations with AI avatars, realistic voiceovers, and auto-written scripts. "
            "Built specifically for performance marketing — Meta, TikTok, YouTube ads. "
            "Used by 1M+ marketers worldwide."
        ),
        "language": "en",
        "localityTier": "global",
        "targetKeywords": [
            "AI video ad creator",
            "automated video ads",
            "product video generator AI",
            "AI ad maker",
            "Creatify AI",
        ],
        "uniqueSellingPoints": [
            "Generate video ads from a product URL in under 2 minutes",
            "AI avatars and lifelike voiceovers in 29 languages",
            "Bulk generation: multiple ad variations at once",
            "Built specifically for performance marketing (Meta, TikTok, YouTube)",
            "No video editing skills required",
        ],
        "competitorNames": ["AdCreative.ai", "Invideo AI", "HeyGen", "Waymark", "Arcads"],
        "competitorUrls": [
            "https://adcreative.ai",
            "https://invideo.io",
            "https://heygen.com",
            "https://waymark.com",
            "https://arcads.ai",
        ],
        "targetAudience": (
            "Performance marketers, DTC e-commerce brands, marketing agencies, "
            "social media managers — who need high-volume video ad production "
            "without a video production team."
        ),
        "servicesOrProducts": [
            "AI video ad generation from product URL",
            "AI avatar spokesperson videos",
            "Bulk ad variation creation",
            "Script auto-generation",
            "Multi-language voiceovers",
        ],
        "yearFounded": 2023,
        "priceRange": "mid",
    },
    {
        # ── PHYSICAL BUSINESS ───────────────────────────────────────────────
        "slug": "maison_du_laser",
        "businessName": "Maison du Laser",
        "businessUrl": "https://www.maisondulaser.fr/",
        "businessType": "centre médical épilation laser",
        "category": "épilation laser et médecine esthétique",
        "description": (
            "Maison du Laser est une chaîne de centres médicaux spécialisés dans "
            "l'épilation laser permanente et la médecine esthétique, avec 6 centres "
            "en France et à Bruxelles (Paris 11e, 12e, 14e, 15e, Argenteuil, Bruxelles). "
            "Chaque traitement est suivi médicalement par des médecins certifiés. "
            "La chaîne se distingue par son positionnement accessible et inclusif, "
            "avec une consultation médicale gratuite avant tout passage et une efficacité "
            "reconnue sur tous les phototypes de peau."
        ),
        "language": "fr",
        "localityTier": "national",
        "city": "Paris",
        "country": "France",
        "targetKeywords": [
            "épilation laser Paris",
            "centre épilation laser médical",
            "épilation laser permanente",
            "Maison du Laser",
            "épilation laser définitive",
        ],
        "uniqueSellingPoints": [
            "Suivi médical par des médecins certifiés",
            "Consultation médicale gratuite avant traitement",
            "Efficace sur tous les phototypes (peaux foncées incluses)",
            "6 centres accessibles en Île-de-France et Bruxelles",
            "Positionnement tarifaire accessible",
        ],
        "competitorNames": ["Lazeo", "Alfa Laser", "Epilium & Skin", "Dépil Tech"],
        "competitorUrls": [
            "https://www.lazeo.com",
            "https://alfa-laser.com",
            "https://www.epilium-paris.com",
            "https://www.depiltech.fr",
        ],
        "targetAudience": (
            "Femmes et hommes cherchant une solution d'épilation définitive, "
            "toutes typologies de peau, soucieux d'un suivi médical sérieux "
            "à un tarif accessible. Aussi : personnes à peau foncée ayant "
            "été refusées ailleurs."
        ),
        "servicesOrProducts": [
            "Épilation laser permanente (visage, aisselles, maillot, jambes)",
            "Épilation laser hommes",
            "Suppression de tatouage",
            "Anti-vergetures",
            "Médecine esthétique (injections acide hyaluronique)",
            "Peeling chimique",
            "Traitement cicatrices",
        ],
        "certifications": ["Médecins certifiés", "Suivi médical réglementaire"],
        "priceRange": "accessible",
        "yearFounded": 2010,
        "region": "Île-de-France",
    },
]
