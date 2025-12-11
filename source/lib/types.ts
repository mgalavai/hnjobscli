export interface Job {
    id: string; // "1. Posted by user" or just UUID
    user: string;
    age: string;
    header: string; // First line of content usually
    company: string;
    location: string; // derived best guess
    url?: string;
    content: string; // Full markdown content
    isUsOnly: boolean;
    isRemote: boolean;
    isVisa: boolean;
    sourceLine: number;
}
