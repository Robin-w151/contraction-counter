<script lang="ts">
	import { contractions } from '#lib/contractions/contractions.svelte.ts';
	import ContractionTimer from '#lib/contractions/ContractionTimer.svelte';
	import Rule511Card from '#lib/contractions/Rule511Card.svelte';
	import { m } from '#lib/paraglide/messages.js';

	let confirmingClear = $state(false);
	let confirmTimer: ReturnType<typeof setTimeout> | undefined;

	function requestClear() {
		if (!confirmingClear) {
			confirmingClear = true;
			confirmTimer = setTimeout(() => (confirmingClear = false), 4000);
			return;
		}

		clearTimeout(confirmTimer);
		confirmingClear = false;
		contractions.clear();
	}
</script>

<p class="mb-4 text-center opacity-75">{m['app.tagline']()}</p>

<ContractionTimer />
<Rule511Card />

{#if contractions.records.length > 0}
	<div class="mt-4 flex justify-center">
		<button type="button" onclick={requestClear} class="btn preset-tonal-error btn-sm">
			{confirmingClear ? m['contractions.clearConfirm']() : m['contractions.clear']()}
		</button>
	</div>
{/if}
