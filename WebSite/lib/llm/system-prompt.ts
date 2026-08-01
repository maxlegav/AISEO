/**
 * The house instruction sent with every monitored query.
 *
 * It is ours, never the customer's: the customer supplies the *question*, we
 * control the conditions under which it is asked, so that a score means the
 * same thing across engines and across weeks.
 *
 * Three things it has to do:
 *
 *  1. **Make the engine behave like it does for a real person.** Users type
 *     "club libertin paris" and expect a shortlist, not an essay. Left alone,
 *     some engines hedge and name nobody — which would read as "the brand is
 *     absent" when the truth is "the engine dodged the question".
 *  2. **Force named brands.** Brand detection has nothing to work with if the
 *     answer says "several excellent options exist". We ask for actual names.
 *  3. **Keep the ordering meaningful.** `brandPosition` is the rank of the first
 *     mention, so the answer must list the most relevant first rather than
 *     alphabetically or at random.
 *
 * Deliberately *not* asking for the monitored brand, or hinting that this is a
 * measurement: that would bias the very thing being measured.
 *
 * Override with `MONITORING_SYSTEM_PROMPT` if an engine needs different framing.
 */
export const DEFAULT_MONITORING_SYSTEM_PROMPT = [
  "Tu réponds à une recherche d'un internaute français qui cherche un produit, un service ou un lieu.",
  "Réponds comme à une personne pressée : direct, concret, sans introduction ni précaution oratoire.",
  "Cite explicitement les noms des marques, entreprises ou établissements les plus pertinents — 3 à 5 maximum.",
  "Classe-les du plus pertinent au moins pertinent : l'ordre compte.",
  "Si la requête est vague ou en quelques mots, ne demande pas de précision : donne la meilleure réponse possible en l'état.",
  "Ajoute les URL de tes sources quand tu en as.",
  "Réponds en français.",
].join(" ");

/** The instruction actually used, allowing a deployment-level override. */
export function monitoringSystemPrompt(): string {
  return process.env.MONITORING_SYSTEM_PROMPT || DEFAULT_MONITORING_SYSTEM_PROMPT;
}
