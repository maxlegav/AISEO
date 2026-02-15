"""
Locality Classifier — Determines how geographically anchored a business is.

Uses a dictionary-based approach on businessType with fallback heuristics
based on whether city/country are provided.
"""

from models.business import LocalityTier

# Business types that serve a physical, walk-in audience
HYPER_LOCAL_TYPES: set[str] = {
    "coffee-shop", "coffee", "cafe", "café",
    "restaurant", "bistro", "brasserie", "pizzeria", "pizza",
    "bar", "pub", "wine-bar",
    "bakery", "boulangerie", "patisserie", "pâtisserie",
    "barber", "barbershop", "hair-salon", "coiffeur",
    "nail-salon", "spa", "massage",
    "gym", "fitness", "crossfit", "yoga-studio", "yoga",
    "dentist", "doctor", "pharmacy", "pharmacie", "clinic",
    "florist", "fleuriste",
    "hotel", "hostel", "bed-and-breakfast", "guesthouse",
    "boutique", "shop", "store", "magasin",
    "dry-cleaner", "pressing", "laundry",
    "tattoo", "tattoo-parlor",
    "car-wash", "garage", "mechanic",
    "real-estate-agency", "agency",
    "coworking", "coworking-space",
    "nursery", "daycare", "crèche",
    "veterinarian", "vet",
    "optician", "opticien",
    "ice-cream", "glacier",
    "juice-bar", "smoothie",
    "food-truck",
    "escape-room", "bowling", "cinema",
}

# Business types that are inherently online / borderless
GLOBAL_TYPES: set[str] = {
    "saas", "software", "app", "platform",
    "e-commerce", "ecommerce", "dropshipping", "marketplace",
    "fintech", "crypto", "blockchain",
    "media", "news", "blog", "publisher",
    "consulting", "consulting-firm",
    "edtech", "online-education", "mooc",
    "ai", "machine-learning",
    "cloud", "hosting", "infrastructure",
    "vpn", "cybersecurity",
    "gaming", "game-studio",
    "streaming", "podcast",
}


def classify_locality_tier(
    business_type: str,
    city: str | None,
    country: str | None,
) -> LocalityTier:
    """
    Classify a business into a locality tier.

    Priority:
    1. Dictionary match on normalized business_type
    2. Fallback heuristic: city → hyper_local, country only → national, neither → global
    """
    normalized = business_type.lower().strip().replace(" ", "-").replace("_", "-")

    if normalized in HYPER_LOCAL_TYPES:
        return LocalityTier.HYPER_LOCAL
    if normalized in GLOBAL_TYPES:
        return LocalityTier.GLOBAL

    # Fallback: use location signals
    if city:
        return LocalityTier.HYPER_LOCAL
    if country:
        return LocalityTier.NATIONAL
    return LocalityTier.GLOBAL
