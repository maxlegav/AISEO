"""Comprehensive stopwords for keyword extraction.

Provides hardcoded French and English stopword sets that are always available,
with optional NLTK augmentation when the corpus is installed.
"""

# ---------------------------------------------------------------------------
# French stopwords (~220 words)
# Base: NLTK french corpus + common words missing from NLTK
# ---------------------------------------------------------------------------
FRENCH_STOPWORDS: set[str] = {
    # --- Articles, determinants, pronoms ---
    "au", "aux", "ce", "ces", "de", "des", "du", "la", "le", "les", "un",
    "une", "cette", "cet", "celui", "celle", "ceux", "celles",
    "lequel", "laquelle", "lesquels", "lesquelles", "auquel", "auxquels",
    "auxquelles", "duquel", "desquels", "desquelles",
    # --- Pronoms personnels / possessifs / demonstratifs ---
    "je", "tu", "il", "elle", "on", "nous", "vous", "ils", "elles",
    "me", "te", "se", "lui", "leur", "eux", "moi", "toi", "soi",
    "ma", "ta", "sa", "mon", "ton", "son", "mes", "tes", "ses",
    "nos", "vos", "notre", "votre", "leurs",
    "cela", "ceci", "celui-ci", "celui-la", "celle-ci", "celle-la",
    # --- Prepositions ---
    "dans", "avec", "pour", "par", "sur", "sous", "vers", "chez",
    "entre", "depuis", "sans", "contre", "avant", "apres", "après",
    "pendant", "selon", "malgre", "malgré", "jusque",
    # --- Conjonctions ---
    "et", "ou", "ni", "mais", "donc", "car", "que", "quand", "comme",
    "si", "sinon", "lorsque", "puisque", "quoique",
    # --- Adverbes courants ---
    "ne", "pas", "plus", "moins", "bien", "mal", "très", "tres", "trop",
    "assez", "peu", "beaucoup", "encore", "deja", "déjà", "aussi",
    "toujours", "jamais", "parfois", "souvent", "vraiment", "seulement",
    "alors", "ensuite", "enfin", "ici", "ailleurs", "partout",
    "plutot", "plutôt", "autant", "tant", "ainsi", "comment",
    "pourquoi", "combien", "maintenant",
    # --- Verbes auxiliaires / courants (formes conjuguees) ---
    "avoir", "être", "etre", "fait", "faire", "peut", "sont", "est",
    "suis", "sommes", "etes", "êtes", "etait", "était", "etaient", "étaient",
    "sera", "seront", "serait", "seraient",
    "avons", "avez", "ont", "avait", "avaient", "aura", "auront",
    "aurait", "auraient",
    "fut", "fus", "fumes", "fûmes", "furent",
    "fait", "font", "fais", "faisait", "ferait", "fera",
    "peut", "peuvent", "pouvait", "pourrait", "pourra",
    "doit", "doivent", "devait", "devrait", "devra",
    "veut", "veux", "voulait", "voudrait",
    "faut",
    # --- Adjectifs / pronoms indefinis ---
    "tout", "toute", "tous", "toutes", "autre", "autres",
    "meme", "même", "mêmes", "chaque", "quelque", "quelques",
    "certains", "certaines", "plusieurs", "aucun", "aucune",
    "quel", "quelle", "quels", "quelles",
    "qui", "que", "quoi", "dont", "ou", "où",
    # --- Mots-outils divers ---
    "rien", "personne", "voici", "voila", "voilà",
    "dessus", "dessous", "dedans", "dehors",
    "cependant", "pourtant", "neanmoins", "néanmoins",
    "toutefois", "autrement",
    # --- Lettres isolees (contractions) ---
    "qu", "c", "d", "j", "l", "m", "n", "s", "t", "y",
}

# ---------------------------------------------------------------------------
# English stopwords (~175 words)
# Base: NLTK english corpus + common additions
# ---------------------------------------------------------------------------
ENGLISH_STOPWORDS: set[str] = {
    # --- Articles / determiners ---
    "a", "an", "the", "this", "that", "these", "those",
    # --- Pronouns ---
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
    "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself",
    "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
    # --- Prepositions ---
    "in", "on", "at", "to", "for", "of", "with", "from", "by",
    "about", "into", "through", "during", "before", "after",
    "above", "below", "between", "under", "over", "against",
    "along", "across", "behind", "beyond", "within", "without",
    # --- Conjunctions ---
    "and", "but", "or", "nor", "so", "yet", "both", "either", "neither",
    "not", "only", "than", "when", "while", "if", "because", "although",
    "since", "unless", "until",
    # --- Common verbs ---
    "is", "am", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "having", "do", "does", "did", "doing",
    "will", "would", "shall", "should", "may", "might", "must", "can", "could",
    "get", "got", "make", "made",
    # --- Adverbs ---
    "very", "really", "also", "just", "more", "most", "much", "many",
    "some", "any", "each", "every", "all", "few", "no", "other",
    "such", "too", "quite", "rather", "enough",
    "here", "there", "where", "when", "how", "why", "what", "which", "who",
    "whom", "whose",
    "now", "then", "again", "once", "already", "always", "never",
    "often", "sometimes", "still",
    # --- Other function words ---
    "own", "same", "able", "even",
    "well", "back", "still", "else",
}


def get_stopwords(language: str = "fr") -> set[str]:
    """Return comprehensive stopwords for the given language.

    Always returns a non-empty set. The hardcoded lists above are the
    primary source; NLTK words are merged in when the corpus is available.
    """
    base = FRENCH_STOPWORDS | ENGLISH_STOPWORDS

    try:
        from nltk.corpus import stopwords as nltk_sw

        stop_lang = "french" if language == "fr" else "english"
        base = base | set(nltk_sw.words(stop_lang))
        other = "english" if language == "fr" else "french"
        base = base | set(nltk_sw.words(other))
    except (ImportError, LookupError):
        pass  # hardcoded lists are sufficient

    return base
