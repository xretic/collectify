import Pusher from 'pusher';

const {
    PUSHER_APP_ID: appId,
    NEXT_PUBLIC_PUSHER_KEY: key,
    PUSHER_SECRET: secret,
    NEXT_PUBLIC_PUSHER_CLUSTER: cluster,
} = process.env;

export const pusherEnabled = Boolean(appId && key && secret && cluster);

export const pusher = pusherEnabled
    ? new Pusher({
          appId: appId!,
          key: key!,
          secret: secret!,
          cluster: cluster!,
          useTLS: true,
      })
    : null;

export function userChannelName(userId: number) {
    return `private-user-${userId}`;
}
