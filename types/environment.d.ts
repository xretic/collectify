export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            DATABASE_URL: string;

            GOOGLE_CLIENT_ID: string;
            GOOGLE_CLIENT_SECRET: string;

            GITHUB_CLIENT_ID: string;
            GITHUB_CLIENT_SECRET: string;

            NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: string;
        }
    }
}
