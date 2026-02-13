// vite.config.ts
import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

// 1. Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	build: {
		lib: {
			// 2. The entry point of your library
			entry: resolve(__dirname, 'src/index.ts'),
			// 3. The name of the exposed global variable (for CDN/script tags)
			name: 'ClassyScroll',
			// 4. Output filenames (classy-scroll.js and classy-scroll.umd.cjs)
			fileName: 'classy-scroll',
		},
		rollupOptions: {
			// 5. Externalize dependencies you don't want bundled (e.g. react, lodash)
			// Since you have zero runtime dependencies, this can remain empty.
			external: [],
			output: {
				globals: {},
			},
		},
	},
	plugins: [
		// 6. Generate type definitions (.d.ts files)
		dts({
			exclude: ['**/*.test.ts', 'test/**'],
			insertTypesEntry: true,
			tsconfigPath: './tsconfig.json', 
		}),
	],
});
