import js from '@eslint/js';
import globals from 'globals';
export default [{ ignores: ['docs/**', 'public/**', 'node_modules/**', '.build-history/**'] }, js.configs.recommended, { languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: { ...globals.browser, ...globals.node } }, rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } }];
