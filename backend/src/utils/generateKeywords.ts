/**
 * Generate searchable keyword tokens from a product name/description.
 * Used for Firestore `array-contains-any` search queries.
 *
 * Example:
 *   generateKeywords("Colgate Total Toothpaste 150g")
 *   → ["colgate", "total", "toothpaste", "150g", "colgate total", "total toothpaste"]
 */
export function generateKeywords(text: string): string[] {
    if (!text) return [];

    const cleaned = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

    const words = cleaned.split(/\s+/).filter(w => w.length >= 2);

    // Single words
    const keywords = new Set<string>(words);

    // Bigrams (pairs of consecutive words) for better phrase matching
    for (let i = 0; i < words.length - 1; i++) {
        keywords.add(`${words[i]} ${words[i + 1]}`);
    }

    // Prefix substrings for autocomplete-style matching (first word only, up to 5 chars)
    if (words[0]) {
        for (let len = 2; len <= Math.min(words[0].length, 5); len++) {
            keywords.add(words[0].substring(0, len));
        }
    }

    return Array.from(keywords);
}

/**
 * Generate keyword tokens from multiple product fields.
 */
export function generateProductKeywords(product: {
    name?: string;
    description?: string;
    brandName?: string;
    categoryName?: string;
}): string[] {
    const allText = [
        product.name || '',
        product.brandName || '',
        product.categoryName || '',
    ].join(' ');

    return generateKeywords(allText);
}
