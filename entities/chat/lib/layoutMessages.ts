import type { ChatMessage } from '../model/types';

/** Place of a bubble in a run of consecutive messages from one author. */
export type BubblePosition = 'single' | 'first' | 'middle' | 'last';

export type MessageLayout = {
    message: ChatMessage;
    position: BubblePosition;
    /** Show a centered timestamp above the message. */
    showTimestamp: boolean;
};

/** Messages closer than this (same author) are stacked into one group. */
const GROUP_GAP_MS = 5 * 60 * 1000;
/** A pause longer than this starts a new timestamped section. */
const TIMESTAMP_GAP_MS = 30 * 60 * 1000;

const gap = (a: ChatMessage, b: ChatMessage) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const joins = (a: ChatMessage | undefined, b: ChatMessage | undefined) =>
    Boolean(a && b && a.author.id === b.author.id && gap(a, b) <= GROUP_GAP_MS);

/** Groups an oldest-first message list into runs and timestamped sections. */
export function layoutMessages(messages: ChatMessage[]): MessageLayout[] {
    const timestamped = messages.map(
        (message, index) => index === 0 || gap(messages[index - 1], message) > TIMESTAMP_GAP_MS,
    );

    return messages.map((message, index) => {
        const withPrevious = !timestamped[index] && joins(messages[index - 1], message);
        const withNext = !timestamped[index + 1] && joins(message, messages[index + 1]);

        const position: BubblePosition = withPrevious
            ? withNext
                ? 'middle'
                : 'last'
            : withNext
              ? 'first'
              : 'single';

        return { message, position, showTimestamp: timestamped[index] };
    });
}
