<script lang="ts">
	import './layout.css';
	import { asset, resolve } from '$app/paths';
	import AppLayout from '#lib/shared/components/AppLayout.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={asset('icon.svg')} />
	<link rel="manifest" href={resolve('/manifest.webmanifest')} />
	<link rel="apple-touch-icon" href={asset('apple-touch-icon.png')} />
</svelte:head>

<AppLayout>
	{@render children()}
</AppLayout>
