<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { dateFnsLocale } from '#lib/shared/datetime.js';
	import { locale } from '#lib/shared/locale.svelte.js';
	import { contractions } from './contractions.svelte.js';
	import { formatClock, formatSpoken } from './stats/stats.js';

	let announcement = $state('');

	const running = $derived(contractions.isRunning);
	const sinceLast = $derived(contractions.sinceLast);
	const hasReadout = $derived(running || sinceLast !== null);
	const readout = $derived(running ? contractions.elapsed : (sinceLast ?? 0));
	const label = $derived(
		running
			? m['contractions.elapsed']()
			: sinceLast !== null
				? m['contractions.sinceLast']()
				: m['contractions.noneYet']()
	);

	$effect(() => {
		const id = setInterval(() => contractions.tick(), 1000);
		const onVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				contractions.tick();
			}
		};
		document.addEventListener('visibilitychange', onVisibilityChange);

		return () => {
			clearInterval(id);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});

	function toggle() {
		if (contractions.isRunning) {
			contractions.stop();
			announcement = m['contractions.recordedAnnouncement']({
				duration: formatSpoken(contractions.lastDuration ?? 0, dateFnsLocale(locale.current))
			});
		} else {
			contractions.start();
			announcement = m['contractions.startedAnnouncement']();
		}
		contractions.tick();
	}
</script>

<section class="flex flex-col items-center gap-6 card preset-tonal-surface p-6">
	<div class="text-center">
		<p class="text-sm opacity-75">{label}</p>
		<p
			role="timer"
			aria-live="off"
			data-testid="readout"
			class="font-mono text-6xl tabular-nums {running ? 'text-primary-700-300' : ''}"
		>
			{hasReadout ? formatClock(readout) : '–:––'}
		</p>
	</div>

	<button
		type="button"
		onclick={toggle}
		class="btn min-h-32 w-full text-2xl {running
			? 'preset-filled-error-500'
			: 'preset-filled-primary-500'}"
	>
		{running ? m['contractions.stop']() : m['contractions.start']()}
	</button>

	<dl class="grid w-full grid-cols-2 gap-4 text-center">
		<div>
			<dt class="text-sm opacity-75">{m['contractions.lastDuration']()}</dt>
			<dd data-testid="last-duration" class="font-mono text-2xl tabular-nums">
				{contractions.lastDuration === null ? '–:––' : formatClock(contractions.lastDuration)}
			</dd>
		</div>
		<div>
			<dt class="text-sm opacity-75">{m['contractions.lastInterval']()}</dt>
			<dd data-testid="last-interval" class="font-mono text-2xl tabular-nums">
				{contractions.lastInterval === null ? '–:––' : formatClock(contractions.lastInterval)}
			</dd>
		</div>
	</dl>

	<p class="sr-only" aria-live="polite">{announcement}</p>
</section>
