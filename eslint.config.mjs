import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
    // 1. Browser Environment (Default for JS files)
    {
        files: ["**/*.js"],
        ignores: ["bin/**/*.js", "eslint.config.mjs"], // Ignore Node files here
        languageOptions: {
            globals: {
                ...globals.browser,
                mermaid: "readonly",
                Sortable: "readonly",
                Panzoom: "readonly"
            },
            ecmaVersion: "latest",
            sourceType: "module"
        },
        rules: {
            "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
            "no-undef": "warn"
        }
    },
    // 2. Node.js Environment (Only for bin/cli.js)
    {
        files: ["bin/**/*.js"],
        languageOptions: {
            globals: {
                ...globals.node
            },
            sourceType: "commonjs"
        }
    },
    // 3. Recommended Rules
    pluginJs.configs.recommended,
];
