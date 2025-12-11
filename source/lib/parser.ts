import { Job } from './types.js';

export const INTERNATIONAL_KEYWORDS = [
    'global', 'worldwide', 'anywhere',
    'eu ', 'europe', 'uk', 'united kingdom', 'london', 'berlin', 'germany',
    'canada', 'toronto', 'vancouver', 'montreal', 'australia', 'sydney',
    'netherlands', 'amsterdam', 'sweden', 'stockholm', 'france', 'paris',
    'ireland', 'dublin', 'singapore', 'apac', 'emea', 'latam', 'brazil',
    'india', 'bangalore', 'switzerland', 'zurich', 'outside us',
    'remote (world', 'remote (everyone)', 'remote (global)'
];

export const US_KEYWORDS = [
    'us only', 'usa only', 'u.s. only', 'united states', 'usa', 'america',
    'sf', 'san francisco', 'bay area', 'nyc', 'new york', 'seattle',
    'austin', 'boston', 'los angeles', 'chicago', 'denver', 'palo alto',
    'menlo park', 'mountain view', 'sunnyvale', 'santa monica', 'culver city',
    'cambridge, ma', 'dc', 'washington', 'est timezone', 'pst timezone', 'cst timezone',
    'us timezone', 'us citizens'
];

export function isStrictlyUsOnly(text: string): boolean {
    const lowerText = text.toLowerCase();

    // 1. Clear indicators of International / Non-US availability (KEEP)
    for (const kw of INTERNATIONAL_KEYWORDS) {
        if (lowerText.includes(kw)) {
            return false; // Explicit non-US location
        }
    }

    // Handle "Remote" separately
    if (lowerText.includes('remote')) {
        // Regex to catch "remote...us" patterns
        // e.g. "Remote (US)", "Remote-friendly (US)", "Remote in US"
        const usRemotePattern = /remote[\s\-\w]*\(?u\.?s\.?\)?/;

        if (usRemotePattern.test(lowerText)) {
            // Continue to US checks
        } else if (!/remote/.test(lowerText)) {
            // safeguard
        } else {
            // "Remote" without explicit US indicator. 
            // We rely on absence of US keywords to Keep.
        }
    }

    // 2. Indicators of US-only restrictions (DISCARD)
    for (const kw of US_KEYWORDS) {
        if (lowerText.includes(kw)) {
            return true;
        }
    }

    // "US" standalone check
    // Matches " US ", "(US)", "United States" word boundaries
    if (/\b(us|usa|u\.s\.)\b/.test(lowerText)) {
        return true;
    }

    return false; // Keep by default
}

export function parseJobsOutput(markdownContent: string): Job[] {
    const jobs: Job[] = [];
    const blocks = markdownContent.split('\n---\n');

    let currentId = '';
    let currentUser = '';
    let currentAge = '';

    blocks.forEach((block, index) => {
        if (!block.trim() || block.includes('Hacker News: Who is Hiring?')) {
            return;
        }

        const lines = block.trim().split('\n').filter(l => l.trim().length > 0);
        let jobHeaderLine: string | null = null;
        let website: string | undefined;

        // Parse each line
        for (const line of lines) {
            // Meta lines are usually "## N. Posted by x" or "*age*"
            if (line.startsWith('## ')) {
                const parts = line.replace('## ', '').split('. Posted by ');
                // currentId = parts[0]; 
                currentUser = parts[1] || 'Unknown';
                continue;
            }
            if (line.startsWith('*') && line.endsWith('*')) {
                currentAge = line.replace(/\*/g, '').trim();
                continue;
            }
            if (line.startsWith('Total postings')) {
                continue;
            }

            // First non-meta line is usually the Header
            if (jobHeaderLine === null) {
                jobHeaderLine = line;
            }

            // Try to extract first link
            if (!website) {
                const match = line.match(/https?:\/\/[^\s)\]]+/);
                if (match) {
                    website = match[0];
                }
            }
        }

        if (jobHeaderLine) {
            // Extract Company Name simple approach
            let company = jobHeaderLine;
            if (company.includes('|')) {
                company = company.split('|')[0].trim();
            } else if (company.includes(' - ') && company.length < 100) {
                company = company.split(' - ')[0].trim();
            }

            // Clean company name
            company = company.split('[')[0].trim();
            company = company.replace(/[(-[,]+$/, '').trim(); // rstrip ' (-[,' equivalent

            if (company.length > 50 || company.includes('point by')) {
                // Probably not a valid company name, or parsing artifact
                // but we still keep the job, just use header as company fallback or "Unknown"
                if (company.includes('point by')) company = "Unknown";
            }

            // Reconstruct content without the header line and meta lines
            const contentLines = lines.filter(line => {
                const isMeta = line.startsWith('## ') || (line.startsWith('*') && line.endsWith('*')) || line.startsWith('Total postings');
                const isHeader = line === jobHeaderLine;
                return !isMeta && !isHeader;
            });

            // Join with newlines
            const cleanContent = contentLines.join('\n').trim();

            const isUs = isStrictlyUsOnly(jobHeaderLine);
            const lowerHeader = jobHeaderLine.toLowerCase();

            jobs.push({
                id: String(index),
                user: currentUser,
                age: currentAge,
                header: jobHeaderLine,
                company: company,
                location: 'Unknown',
                url: website,
                content: cleanContent,
                isUsOnly: isUs,
                isRemote: lowerHeader.includes('remote'),
                isVisa: lowerHeader.includes('visa'),
                sourceLine: 0
            });
        }
    });

    return jobs;
}
