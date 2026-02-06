export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;

            NEXT_PUBLIC_GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;

            NEXT_PUBLIC_GITHUB_CLIENT_ID: string;
            GITHUB_CLIENT_ID: string;
            GITHUB_CLIENT_SECRET: string;

            NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: string;
            REDIS_URL: string;
        }
    }
}
