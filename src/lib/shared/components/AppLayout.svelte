<script lang="ts">
	import AppHeader from './AppHeader.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		delete document.documentElement.dataset.appLoading;
		document.documentElement.removeAttribute('aria-busy');
	});
</script>

<div data-app-root class="flex min-h-screen flex-col">
	<AppHeader />
	<main class="mx-auto w-full max-w-4xl flex-1 p-4">
		{@render children()}
	</main>
</div>
