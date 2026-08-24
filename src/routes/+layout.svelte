<script lang="ts">
	import './layout.css';
	import AppLayout from '#lib/shared/components/AppLayout.svelte';
	import favicon from '#lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<AppLayout>
	{@render children()}
</AppLayout>
