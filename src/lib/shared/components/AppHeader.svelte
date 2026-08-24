<script lang="ts">
	import LanguageSwitch from './LanguageSwitch.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { asset } from '$app/paths';
</script>

<AppBar class="sticky top-0 z-10 border-b border-surface-200-800">
	<AppBar.Toolbar class="mx-auto w-full max-w-4xl grid-flow-col items-center">
		<AppBar.Headline class="flex items-center gap-3">
			<img src={asset('icon.svg')} alt="" class="size-8" />
			<span class="h4 font-bold">{m['app.title']()}</span>
		</AppBar.Headline>
		<AppBar.Trail class="items-center gap-3 justify-self-end">
			<LanguageSwitch />
			<ThemeSwitch />
		</AppBar.Trail>
	</AppBar.Toolbar>
</AppBar>
