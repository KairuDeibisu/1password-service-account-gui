import { VaultItem } from "./useItems";

function levenshteinDistance(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= b.length; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,      // deletion
                    dp[i][j - 1] + 1,      // insertion
                    dp[i - 1][j - 1] + 1   // substitution
                );
            }
        }
    }

    return dp[a.length][b.length];
}

const ctx: Worker = self as any;
const TOP = 10;

ctx.onmessage = (e: MessageEvent<{ items: VaultItem[]; searchTerm: string }>) => {
    const { items, searchTerm } = e.data;

    if (searchTerm === "") {
        // If searchTerm is empty, return all items
        ctx.postMessage(items);
        return;
    }

    const loweredSearchTerm = searchTerm.toLowerCase();

    // Filter items that contain the search term in title, category, or tags (if tags exist)
    const matchingItems = items.filter(item =>
        item.title.toLowerCase().includes(loweredSearchTerm) ||
        item.category.toLowerCase().includes(loweredSearchTerm) ||
        (item.tags && item.tags.some(tag => tag.toLowerCase().includes(loweredSearchTerm)))
    );

    const distances = matchingItems.map(item => {
        const titleDistance = levenshteinDistance(item.title.toLowerCase(), loweredSearchTerm);
        const categoryDistance = levenshteinDistance(item.category.toLowerCase(), loweredSearchTerm);

        // Minimum distance based only on title and category
        return {
            item,
            distance: Math.min(titleDistance, categoryDistance)
        };
    });

    // Sort by distance and select the top results
    const filteredItems = distances
        .sort((a, b) => a.distance - b.distance)
        .slice(0, TOP)
        .map(({ item }) => item);

    // Send the filtered and sorted items back to the main thread
    ctx.postMessage(filteredItems);
};
