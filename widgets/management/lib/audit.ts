const verdictLabels: Record<string, string> = {
    GUILTY: 'Guilty',
    NO_VIOLATION: 'No violation',
    INSUFFICIENT_EVIDENCE: 'Insufficient evidence',
    DUPLICATE: 'Duplicate',
};

const roleLabels: Record<string, string> = {
    Admin: 'admin',
    Moderator: 'moderator',
    Verified: 'verified',
};

const sanctionLabels: Record<string, string> = {
    ACCOUNT: 'account ban',
    COMMENTS: 'comments mute',
    MESSENGER: 'messenger mute',
};

const directActionLabels: Record<string, string> = {
    'delete-user': 'Deleted user account',
    'delete-comment': 'Deleted comment',
    'delete-collection': 'Deleted collection',
    'impersonate-user': 'Signed in as user',
};

export function formatAuditAction(action: string) {
    const [type, value] = action.split(':');

    if (type === 'grant') return `Granted ${roleLabels[value] ?? humanize(value)}`;
    if (type === 'revoke') return `Revoked ${roleLabels[value] ?? humanize(value)}`;
    if (type === 'sanction') return `Applied ${sanctionLabels[value] ?? humanize(value)}`;
    if (type === 'revoke-sanction') {
        return `Revoked ${sanctionLabels[value] ?? humanize(value)}`;
    }
    if (type === 'report') {
        return `Closed report: ${verdictLabels[value] ?? humanize(value)}`;
    }

    return directActionLabels[action] ?? humanize(action);
}

function humanize(value = '') {
    return value
        .split(/[-_:]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}
