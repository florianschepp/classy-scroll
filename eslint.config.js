import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import jsonc from 'eslint-plugin-jsonc';

export default [
	// 1. Ignore build artifacts
	{ ignores: ['dist', 'node_modules', 'coverage'] },

	// 2. Base Configs
	...tseslint.configs.recommended,
	...jsonc.configs['flat/recommended-with-jsonc'],

	// 3. Main Project Rules (Tabs + Browser Globals)
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		plugins: {
			'@stylistic': stylistic,
		},
		languageOptions: {
			// Required so ESLint knows 'window' and 'document' exist
			globals: globals.browser, 
		},
		rules: {
			// Indentation: Use 1 literal tab character per level
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-tabs': 'off',

			// Semicolons: Always
			'@stylistic/semi': ['error', 'always'],

			// Quotes: Single quotes for JS/TS
			'@stylistic/quotes': ['error', 'single'],

			// Commas: Trailing commas for cleaner git diffs
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
		},
	},
	{
		files: ['**/*.json'],
		plugins: {
			'@stylistic': stylistic, // <--- THIS WAS MISSING!
		},
		rules: {
			'@stylistic/indent': ['error', 'tab'], // Format JSON with tabs too
			'@stylistic/quotes': ['error', 'double'], // JSON requires double quotes
		},
	},
];
