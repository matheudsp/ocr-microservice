import levenshtein from "fast-levenshtein";

export class TextHelper {
  static normalize(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .trim();
  }

  static calculateSimilarity(needle: string, haystack: string): number {
    if (!needle || !haystack) return 0;
    const cleanHaystack = this.normalize(haystack);
    const cleanNeedle = this.normalize(needle);

    if (cleanHaystack.includes(cleanNeedle)) return 1.0;

    const words = cleanHaystack.split(/\s+/);
    let bestDist = Infinity;
    const needleParts = cleanNeedle.split(" ").length;

    for (let i = 0; i <= words.length - needleParts; i++) {
      const chunk = words.slice(i, i + needleParts).join(" ");
      const dist = levenshtein.get(cleanNeedle, chunk);
      if (dist < bestDist) bestDist = dist;
    }

    const maxLength = Math.max(cleanNeedle.length, 1);
    const similarity = 1 - bestDist / maxLength;

    return Math.max(0, similarity);
  }

  static extractNumbers(text: string): string {
    return text.replace(/\D/g, "");
  }
}
