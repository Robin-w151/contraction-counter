<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { contractions } from './contractions.svelte.js';
	import ContractionTimer from './ContractionTimer.svelte';
	import Rule511Card from './Rule511Card.svelte';

	let announcement = $state('');
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
		announcement = m['contractions.clearedAnnouncement']();
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

<p data-testid="clear-announcement" class="sr-only" aria-live="polite">{announcement}</p>
