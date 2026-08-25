import { assets, immutable, prerendered } from '$app/manifest';
import { self as sw } from '$app/service-worker';

const root = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
const precache = [...immutable, ...assets, ...prerendered].map(({ path }) => root + path);
const precached = new Set(precache);

const CACHE = `cache-${hash(precache.join(','))}`;

sw.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(precache)));
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

	event.respondWith(respond(event, url));
});

async function respond(event: FetchEvent, url: URL) {
	const request = event.request;
	const cache = await caches.open(CACHE);

	if (url.origin === location.origin && precached.has(url.pathname)) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}

	try {
		const response = await fetch(request);
		if (url.origin === location.origin && response.ok && response.type === 'basic') {
			event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
		}
		return response;
	} catch (error) {
		const cached = await cache.match(request);
		if (cached) return cached;

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
