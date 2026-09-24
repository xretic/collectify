import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
    ...nextVitals,
    ...nextTs,
    {
        rules: {
            // User content (avatars, banners, item images) comes from arbitrary
            // hosts and is rendered with plain <img>; the Next image optimizer is
            // deliberately limited to local assets (see next.config.ts).
            '@next/next/no-img-element': 'off',
        },
    },
    globalIgnores([
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        'generated/**',
        'collectify-generator/**',
    ]),
]);

export default eslintConfig;
