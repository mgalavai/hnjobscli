import React from 'react';
import { Box, Text } from 'ink';
import { Job } from '../lib/types.js';

interface JobDetailPaneProps {
    job: Job | null;
    scrollOffset: number;
    isActive: boolean;
}

export const JobDetailPane = ({ job, scrollOffset, isActive }: JobDetailPaneProps) => {
    if (!job) {
        return (
            <Box padding={2} borderColor="gray" borderStyle="single" height="100%">
                <Text color="gray">Select a job to view details</Text>
            </Box>
        );
    }

    const maxLines = 15; // Approximate visible lines in box
    const lines = job.content.split('\n');
    const visibleLines = lines.slice(scrollOffset, scrollOffset + maxLines).join('\n');

    return (
        <Box
            flexDirection="column"
            padding={1}
            borderColor={isActive ? 'green' : 'white'}
            borderStyle={isActive ? 'double' : 'round'}
            height="100%"
        >
            <Box marginBottom={1}>
                <Text bold color="cyan">{job.header}</Text>
            </Box>
            <Box flexGrow={1} overflow="hidden">
                <Text>{visibleLines}</Text>
            </Box>
            <Box marginTop={1} borderStyle="single" borderColor="gray">
                <Text dimColor>
                    Posted by {job.user} • {job.age} • Line: {scrollOffset + 1}/{lines.length}
                </Text>
            </Box>
        </Box>
    );
};
