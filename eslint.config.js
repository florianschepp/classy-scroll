import globals from 'globals';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import jsonc from 'eslint-plugin-jsonc';

export default [
	{ ignores: ['dist', 'node_modules', 'coverage'] },
	...tseslint.configs.recommended,
	...jsonc.configs['flat/recommended-with-jsonc'],
	{
		files: ['**/*.{js,mjs,cjs,ts}'],
		plugins: {
			'@stylistic': stylistic,
		},
		languageOptions: {
			globals: globals.browser, 
		},
		rules: {
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-tabs': 'off',
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
		},
	},
	{
		files: ['**/*.json'],
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/quotes': ['error', 'double'], 
		},
	},
];
