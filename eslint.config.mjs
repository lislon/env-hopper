import nx from "@nx/eslint-plugin";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

const GLOB_INCLUDE = ['**/*.{js,ts,tsx}']

const GLOB_EXCLUDE = [
  '**/.nx/**',
  '**/build/**',
  '**/coverage/**',
  '**/dev-dist/**',
  '**/snap/**'
]


export default [{
    name: 'env-hopper/ignores',
    ignores: GLOB_EXCLUDE,
}, {
    plugins: {
        "@nx": nx,
    },
}, {
    files: GLOB_INCLUDE,

    rules: {
        "@nx/enforce-module-boundaries": ["error", {
            enforceBuildableLibDependency: true,
            allow: [],

            depConstraints: [{
                sourceTag: "*",
                onlyDependOnLibsWithTags: ["*"],
            }],
        }],
    },
}, ...compat.extends("plugin:@nx/typescript").map(config => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
})), {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {},
}, ...compat.extends("plugin:@nx/javascript").map(config => ({
    ...config,
    files: ["**/*.js", "**/*.jsx"],
})), {
    files: ["**/*.js", "**/*.jsx"],
    rules: {},
}, {
    files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.spec.js", "**/*.spec.jsx"],

    languageOptions: {
        globals: {
            ...globals.jest,
        },
    },

    rules: {},
}];
