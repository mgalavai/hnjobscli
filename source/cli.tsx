#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import fs from 'fs';
import path from 'path';
import App from './ui.js';
import { parseJobsOutput } from './lib/parser.js';

const cli = meow(
    `
	Usage
	  $ hn-jobs [input-file]

	Options
	  --exclude-us  Start with US jobs excluded
      --fetch       Fetch latest thread before starting

	Examples
	  $ hn-jobs jobs_output.md
      $ hn-jobs --fetch
`,
    {
        importMeta: import.meta,
        flags: {
            excludeUs: {
                type: 'boolean',
                default: false
            },
            fetch: {
                type: 'boolean'
            }
        },
    },
);

import { Job } from './lib/types.js';

import { fetchLatestWhoIsHiringId, fetchThreadJobs } from './lib/fetcher.js';

const run = async () => {
    let initialJobs: Job[] = [];

    // FETCH MODE
    if (cli.flags.fetch) {
        // We can't use Ink's render for simple console logs easily mixed with full mode, 
        // but since we are about to enter full app mode, simple console logs are fine before that.
        // OR we just assume it's fast enough or use a simple spinner before rendering App.

        try {
            console.log('Searching for latest "Who is hiring?" thread...');
            const thread = await fetchLatestWhoIsHiringId();
            console.log(`Found: ${thread.title} (${thread.date.toDateString()})`);

            console.log('Fetching jobs from Algolia...');
            initialJobs = await fetchThreadJobs(thread.id);
            console.log(`Parsed ${initialJobs.length} jobs.`);

            // Save to file for caching/next time
            // We need to convert back to markdown? Or just save JSON?
            // The existing parser expects markdown. 
            // For now, let's just run in-memory, but maybe save a JSON cache?
            // User requested "automagically finds jobs_output.md", so maybe we should save to it 
            // to support the workflow of "fetch once, run many times".
            // But converting back to Markdown is extra work. 
            // Let's explicitly save as `jobs.json` if we fetch, and support loading JSON too.
            // For now, just InMemory is fine for V0, or we overwrite jobs_output.md with a simple format.
            // Let's keep it simple: Start App with these jobs.

        } catch (error) {
            console.error('Error fetching jobs:', error);
            process.exit(1);
        }

    } else {
        // FILE MODE
        let inputFile = cli.input[0];
        let filePath: string;

        if (inputFile) {
            filePath = path.resolve(process.cwd(), inputFile);
        } else {
            // Try defaults
            const defaultName = 'jobs_output.md';
            const localPath = path.resolve(process.cwd(), defaultName);
            const parentPath = path.resolve(process.cwd(), '..', defaultName);

            if (fs.existsSync(localPath)) {
                filePath = localPath;
            } else if (fs.existsSync(parentPath)) {
                filePath = parentPath;
            } else {
                filePath = localPath;
            }
        }

        if (!fs.existsSync(filePath)) {
            if (!cli.flags.fetch) {
                console.error(`Error: File not found at ${filePath}.\nChecked parent directory as well.\nUse --fetch to download data directly.`);
                process.exit(1);
            }
        } else {
            const content = fs.readFileSync(filePath, 'utf-8');
            initialJobs = parseJobsOutput(content);
        }
    }

    render(<App initialJobs={initialJobs} />);
};

run();
