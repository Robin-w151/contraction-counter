<script lang="ts">
	import { locale, locales } from '#lib/shared/locale.svelte.js';
	import { m } from '#lib/paraglide/messages.js';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
</script>

<SegmentedControl
	value={locale.current}
	onValueChange={(details) => locale.set(details.value as (typeof locales)[number])}
>
	<SegmentedControl.Label class="sr-only">{m['language.label']()}</SegmentedControl.Label>
	<SegmentedControl.Control>
		{#each locales as value (value)}
			<SegmentedControl.Item {value}>
				<SegmentedControl.ItemText>
					<span aria-hidden="true">{value.toUpperCase()}</span>
					<span class="sr-only">{locale.label(value)}</span>
				</SegmentedControl.ItemText>
				<SegmentedControl.ItemHiddenInput />
			</SegmentedControl.Item>
		{/each}
		<SegmentedControl.Indicator />
	</SegmentedControl.Control>
</SegmentedControl>
