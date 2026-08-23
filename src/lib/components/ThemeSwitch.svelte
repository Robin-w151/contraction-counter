<script lang="ts">
	import { theme } from '#lib/theme.svelte.js';
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Moon, Sun } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';

	const checked = $derived(theme.mode === 'dark');
</script>

<Switch {checked} onCheckedChange={(details) => theme.set(details.checked ? 'dark' : 'light')}>
	<Switch.Control>
		<Switch.Thumb>
			<Icon src={checked ? Moon : Sun} size="14" theme="mini" aria-hidden="true" />
		</Switch.Thumb>
	</Switch.Control>
	<Switch.Label class="sr-only">Dark mode</Switch.Label>
	<Switch.HiddenInput role="switch" />
</Switch>
