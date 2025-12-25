/**
 * Generate a URL-friendly slug from a string
 * Example: "Colgate - PeriGard Toothpaste (90 g)" → "colgate-perigard-toothpaste-90-g"
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        // Replace special characters with spaces
        .replace(/[^\w\s-]/g, ' ')
        // Replace multiple spaces/hyphens with single hyphen
        .replace(/[\s_-]+/g, '-')
        // Remove leading/trailing hyphens
        .replace(/^-+|-+$/g, '');
}

/**
 * Create a unique slug by appending ID if needed
 * Example: "colgate-toothpaste" + 123 → "colgate-toothpaste-123"
 */
export function createUniqueSlug(name: string, id: number): string {
    const baseSlug = generateSlug(name);
    return `${baseSlug}-${id}`;
}

/**
 * Extract ID from a slug
 * Example: "colgate-toothpaste-123" → 123
 */
export function extractIdFromSlug(slug: string): number | null {
    const match = slug.match(/-(\d+)$/);
    return match ? parseInt(match[1]) : null;
}
