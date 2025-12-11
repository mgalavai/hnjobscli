import React from 'react';
import { Box, Text } from 'ink';
import { Job } from '../lib/types.js';

interface JobListItemProps {
    job: Job;
    isSelected: boolean;
}

export const JobListItem = ({ job, isSelected }: JobListItemProps) => {
    const label = job.company || job.header.slice(0, 30);
    const flags = [];
    if (job.isRemote) flags.push('Rem');
    if (job.isVisa) flags.push('Visa');
    // if (!job.isUsOnly) flags.push('Intl');

    const flagStr = flags.length > 0 ? `[${flags.join(',')}]` : '';

    return (
        <Box
            paddingX={1}
            borderStyle={isSelected ? 'round' : undefined}
            borderColor={isSelected ? 'blue' : 'cyan'}
        >
            <Text color={isSelected ? 'blue' : 'green'} wrap="truncate-end">
                {isSelected ? '> ' : '  '}
                <Text bold>{label}</Text>
                <Text dimColor> {flagStr}</Text>
            </Text>
        </Box>
    );
};
