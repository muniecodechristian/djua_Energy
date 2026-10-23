/**
 * Utilitaire pour nettoyer les réponses générées par les modèles d'IA (Gemini, Claude, etc.)
 * Retire tous les caractères d'étoiles (*, **, ***) et formate les listes et titres proprement.
 */
export function cleanAiText(text) {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remplacer les puces markdown (* item ou - item) par une vraie puce élégante •
    .replace(/^[\t ]*[\*\-][\t ]+/gm, '• ')
    // Remplacer les triples étoiles ***texte*** par texte
    .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
    // Remplacer les doubles étoiles **texte** par texte
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remplacer les simples étoiles *texte* par texte
    .replace(/\*(.*?)\*/g, '$1')
    // Supprimer tout astérisque résiduel
    .replace(/\*/g, '')
    // Supprimer les dièses de titre markdown (ex: "### Analyse" -> "Analyse")
    .replace(/^[\t ]*#{1,6}[\t ]+/gm, '')
    // Normaliser les espaces consécutifs sur une même ligne
    .replace(/[^\S\r\n]+/g, ' ')
    .trim();
}

export default cleanAiText;
