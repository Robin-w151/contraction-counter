import { assets, immutable, prerendered } from '$app/manifest';
import { self as sw } from '$app/service-worker';

const root = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
const precache = [...immutable, ...assets, ...prerendered].map(({ path }) => root + path);
const precached = new Set(precache);

const CACHE = `cache-${hash(precache.join(','))}`;

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(precache))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
			)
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

	event.respondWith(respond(event.request, url));
});

async function respond(request: Request, url: URL) {
	const cache = await caches.open(CACHE);

	// Precached files are content-hashed or part of the prerendered shell — cache wins.
	if (url.origin === location.origin && precached.has(url.pathname)) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}

	try {
		const response = await fetch(request);
		if (url.origin === location.origin && response.ok && response.type === 'basic') {
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) return cached;

		// Deep links that were never visited still get the prerendered shell offline.
		if (request.mode === 'navigate') {
			const shell = await cache.match(root);
			if (shell) return shell;
		}

		throw error;
	}
}

function hash(value: string) {
	let h = 5381;
	for (let i = 0; i < value.length; i++) h = (h * 33) ^ value.charCodeAt(i);
	return (h >>> 0).toString(36);
}
