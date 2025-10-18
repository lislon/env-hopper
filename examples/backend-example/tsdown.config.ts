import { defineConfig } from "tsdown";

export default defineConfig({
    platform: 'node',
    sourcemap: true,
    alias: {
        '#': './src'
    }
});