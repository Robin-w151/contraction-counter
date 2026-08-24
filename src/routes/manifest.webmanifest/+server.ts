import { asset, resolve } from '$app/paths';

export const prerender = true;

export function GET() {
	return Response.json(
		{
			name: 'Contraction Counter',
			short_name: 'Contractions',
			description: 'Time and log contractions.',
			start_url: resolve('/'),
			scope: resolve('/'),
			display: 'standalone',
			orientation: 'portrait',
			background_color: '#282a36',
			theme_color: '#282a36',
			lang: 'en',
			icons: [
				{ src: asset('icon.svg'), sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
				{ src: asset('icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
				{ src: asset('icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
				{
					src: asset('icon-maskable-512.png'),
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable'
				}
			]
		},
		{ headers: { 'content-type': 'application/manifest+json' } }
	);
}
