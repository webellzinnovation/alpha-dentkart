/**
 * Generate searchable keyword tokens from a product name/description.
 * Used for Firestore `array-contains-any` search queries.
 *
 * Example:
 *   generateKeywords("Colgate Total Toothpaste 150g")
 *   → ["colgate", "total", "toothpaste", "150g", "colgate total", "total toothpaste"]
 */
export declare function generateKeywords(text: string): string[];
/**
 * Generate keyword tokens from multiple product fields.
 */
export declare function generateProductKeywords(product: {
    name?: string;
    description?: string;
    brandName?: string;
    categoryName?: string;
}): string[];
//# sourceMappingURL=generateKeywords.d.ts.map