<script lang="ts">
	import './layout.css';
	import AppLayout from '#lib/shared/components/AppLayout.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href="/icon.svg" /></svelte:head>

<AppLayout>
	{@render children()}
</AppLayout>
