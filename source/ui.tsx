import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Job } from './lib/types.js';
import { JobListItem } from './components/JobListItem.js';
import { JobDetailPane } from './components/JobDetailPane.js';
import fs from 'fs';
import path from 'path';

interface AppProps {
    initialJobs: Job[];
}

export default function App({ initialJobs = [] }: AppProps) {
    const { exit } = useApp();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activePane, setActivePane] = useState<'list' | 'details'>('list');
    const [detailScroll, setDetailScroll] = useState(0);

    // Filters
    const [filterStrictUs, setFilterStrictUs] = useState(false);
    const [filterRemote, setFilterRemote] = useState(false);
    const [filterVisa, setFilterVisa] = useState(false);

    // Notification
    const [notification, setNotification] = useState<string | null>(null);

    // Derived State
    const filteredJobs = useMemo(() => {
        let jobs = initialJobs;
        if (filterStrictUs) jobs = jobs.filter(job => !job.isUsOnly);
        if (filterRemote) jobs = jobs.filter(job => job.isRemote);
        if (filterVisa) jobs = jobs.filter(job => job.isVisa);
        return jobs;
    }, [initialJobs, filterStrictUs, filterRemote, filterVisa]);

    const activeJob = filteredJobs[selectedIndex] || null;

    // Viewport for List (Simple scrolling)
    const LIST_HEIGHT = 15;
    const [listScrollOffset, setListScrollOffset] = useState(0);

    // Reset details scroll when job changes
    useEffect(() => {
        setDetailScroll(0);
    }, [selectedIndex]);

    // Adjust scroll when selection changes
    useEffect(() => {
        if (selectedIndex < listScrollOffset) {
            setListScrollOffset(selectedIndex);
        } else if (selectedIndex >= listScrollOffset + LIST_HEIGHT) {
            setListScrollOffset(selectedIndex - LIST_HEIGHT + 1);
        }
    }, [selectedIndex, listScrollOffset]);

    // Input Handling
    useInput((input, key) => {
        if (key.escape || input === 'q') {
            exit();
        }

        if (key.tab) {
            setActivePane(prev => prev === 'list' ? 'details' : 'list');
            return;
        }

        if (activePane === 'list') {
            if (key.downArrow) {
                setSelectedIndex(prev => Math.min(prev + 1, filteredJobs.length - 1));
            }
            if (key.upArrow) {
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
            // Filter Toggles only in list mode? Or globally?
            // Let's keep filters global for now
        }

        if (activePane === 'details') {
            if (key.downArrow) {
                setDetailScroll(prev => prev + 1);
            }
            if (key.upArrow) {
                setDetailScroll(prev => Math.max(prev - 1, 0));
            }
            // Navigate prev/next posting while in reading mode
            if (key.rightArrow) {
                setSelectedIndex(prev => Math.min(prev + 1, filteredJobs.length - 1));
            }
            if (key.leftArrow) {
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            }
        }

        // Filter Toggles
        if (input === '1') setFilterStrictUs(p => !p);
        if (input === '2') setFilterRemote(p => !p);
        if (input === '3') setFilterVisa(p => !p);

        // Export
        if (input === 'x') {
            const outPath = path.resolve(process.cwd(), 'jobs_filtered.md');
            const content = filteredJobs.map(j => j.content + "\n\n---\n\n").join('');
            fs.writeFileSync(outPath, content);
            setNotification(`Exported ${filteredJobs.length} jobs to jobs_filtered.md`);
            setTimeout(() => setNotification(null), 3000);
        }
    });

    const visibleJobs = filteredJobs.slice(listScrollOffset, listScrollOffset + LIST_HEIGHT);

    return (
        <Box flexDirection="column" padding={1} height={30}>
            {/* Header */}
            <Box flexDirection="column" marginBottom={1}>
                <Box borderStyle="classic" borderColor="green" paddingX={1} marginBottom={1}>
                    <Text bold color="green">HN JOBS CLI</Text>
                </Box>
                <Box borderStyle="double" borderColor="cyan" paddingX={1}>
                    <Text>
                        Total: <Text color="green">{initialJobs.length}</Text> |
                        Filtered: <Text color="yellow">{filteredJobs.length}</Text> |
                        <Text dimColor> Press Tab:Focus | 1:No-US 2:Remote 3:Visa | x:Export q:Quit</Text>
                    </Text>
                </Box>
                {/* Active Filter Indicators */}
                <Box marginTop={0}>
                    <Text>Filters: </Text>
                    <Text color={filterStrictUs ? 'green' : 'gray'}>[1] No-US </Text>
                    <Text color={filterRemote ? 'green' : 'gray'}>[2] Remote </Text>
                    <Text color={filterVisa ? 'green' : 'gray'}>[3] Visa </Text>
                </Box>
            </Box>

            {/* Main Split View */}
            <Box flexDirection="row" flexGrow={1} height={LIST_HEIGHT + 2}>
                {/* Left Pane: List */}
                <Box
                    flexDirection="column"
                    width="35%"
                    borderStyle={activePane === 'list' ? 'double' : 'single'}
                    borderColor={activePane === 'list' ? 'green' : 'blue'}
                >
                    {visibleJobs.map((job, i) => (
                        <JobListItem
                            key={job.id}
                            job={job}
                            isSelected={listScrollOffset + i === selectedIndex}
                        />
                    ))}
                    {visibleJobs.length === 0 && <Text>No jobs match filters.</Text>}
                </Box>

                {/* Right Pane: Details */}
                <Box flexDirection="column" flexGrow={1} marginLeft={1}>
                    <JobDetailPane
                        job={activeJob}
                        scrollOffset={detailScroll}
                        isActive={activePane === 'details'}
                    />
                </Box>
            </Box>

            {/* Notification Bar */}
            {notification && (
                <Box borderColor="green" borderStyle="round" paddingX={1} marginTop={1}>
                    <Text color="green">{notification}</Text>
                </Box>
            )}
        </Box>
    );
}
