import he from 'he';
import { Job } from './types.js';
import { isStrictlyUsOnly } from './parser.js';

const ALGOLIA_API = 'https://hn.algolia.com/api/v1';

interface AlgoliaHit {
    objectID: string;
    title?: string;
    created_at: string;
    created_at_i: number;
    url?: string;
    author: string;
    points?: number;
    story_text?: string;
    comment_text?: string;
    num_comments?: number;
    story_id?: number;
    story_title?: string;
    story_url?: string;
    parent_id?: number;
    children?: AlgoliaHit[];
}

export async function fetchLatestWhoIsHiringId(): Promise<{ id: string; title: string; date: Date }> {
    const params = new URLSearchParams({
        tags: 'story,author_whoishiring',
        query: 'Who is hiring?',
        hitsPerPage: '1'
    });

    const response = await fetch(`${ALGOLIA_API}/search_by_date?${params}`);
    if (!response.ok) {
        throw new Error(`Algolia API error: ${response.statusText}`);
    }

    const data = await response.json() as { hits: AlgoliaHit[] };
    if (!data.hits || data.hits.length === 0) {
        throw new Error("No 'Who is hiring?' thread found via Algolia.");
    }

    const hit = data.hits[0];
    return {
        id: hit.objectID,
        title: hit.title || 'Unknown Title',
        date: new Date(hit.created_at)
    };
}

export async function fetchThreadJobs(threadId: string): Promise<Job[]> {
    // Fetch the full item tree (including comments)
    // Note: for very large threads strict API limits might apply, but usually 'items' endpoint works well.
    // Alternatively we could use search with tags=comment,story_X
    const response = await fetch(`${ALGOLIA_API}/items/${threadId}`);

    if (!response.ok) {
        throw new Error(`Failed to fetch thread ${threadId}: ${response.statusText}`);
    }

    const root = await response.json() as AlgoliaHit;

    if (!root.children) {
        return [];
    }

    const jobs: Job[] = [];

    // Traverse top-level comments
    root.children.forEach((comment, index) => {
        if (!comment.comment_text) return;

        // We only care about top-level items typically, similar to the python script
        // The python script had an option to include nested, but defaults to top-level.
        // We'll stick to top-level for the main list, but maybe append child text?
        // For now: Top-level only.

        const rawText = comment.comment_text;
        const decodedText = he.decode(rawText);

        // Basic HTML cleanup to Text
        // 1. Replace <p> with \n\n
        // 2. Replace <br> with \n
        // 3. Replace <a href="...">...</a> with [link](...)
        // 4. Strip other tags

        let cleaned = decodedText
            .replace(/<p>/g, '\n\n')
            .replace(/<\/p>/g, '')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_match, url, text) => {
                return `[link](${url})${text}`; // Simplify format to match existing expected style or markdown
            });

        // Final strip of any remaining tags
        cleaned = cleaned.replace(/<[^>]*>/g, '');
        cleaned = cleaned.trim();

        // Extract lines
        const lines = cleaned.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return;

        const header = lines[0]; // First line is usually the header

        // Is it Us Only?
        const isUs = isStrictlyUsOnly(header);
        const lowerHeader = header.toLowerCase();

        // Extract company (naive)
        let company = header.split('|')[0].split('-')[0].trim();
        if (company.length > 50) company = "Unknown";

        // Extract URL from first line if possible
        const urlMatch = header.match(/\[link\]\((.*?)\)/);
        const url = urlMatch ? urlMatch[1] : undefined;

        // Reconstruct content without header for display
        // similar to what we did in parser.ts recently
        const contentBody = lines.slice(1).join('\n').trim();

        jobs.push({
            id: comment.objectID,
            user: comment.author,
            age: calculateAge(new Date(comment.created_at)),
            header: header,
            company: company,
            location: 'Unknown',
            url: url,
            content: contentBody || header, // Fallback if no body
            isUsOnly: isUs,
            isRemote: lowerHeader.includes('remote'),
            isVisa: lowerHeader.includes('visa'),
            sourceLine: 0
        });
    });

    return jobs;
}

function calculateAge(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
        return `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
}
