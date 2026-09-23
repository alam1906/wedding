import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	envDir: '../..',
	envPrefix: ['VITE_', 'PUBLIC_'],
	server: {
		port: 5174,
		strictPort: true
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				experimental: {
					async: true
				},
				// Force runes mode for project code while leaving dependencies unchanged.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: '200.html', precompress: true })
		})
	]
});
