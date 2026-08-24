<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { CheckCircle, XCircle } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import { contractions } from './contractions.svelte.js';

	const rule = $derived(contractions.rule511);
	const criteria = $derived([
		{ ok: rule.durationOk, text: m['rule511.duration']() },
		{ ok: rule.intervalOk, text: m['rule511.interval']() },
		{ ok: rule.hourOk, text: m['rule511.hour']() }
	]);
</script>

<section class="mt-4 space-y-4 card preset-tonal-surface p-6" aria-labelledby="rule511-title">
	<h2 id="rule511-title" class="h4">{m['rule511.title']()}</h2>

	<ul class="space-y-2">
		{#each criteria as criterion (criterion.text)}
			<li class="flex items-center gap-2">
				<Icon
					src={criterion.ok ? CheckCircle : XCircle}
					size="20"
					theme="mini"
					aria-hidden="true"
					class={criterion.ok ? 'text-success-500' : 'opacity-40'}
				/>
				<span class={criterion.ok ? '' : 'opacity-60'}>{criterion.text}</span>
				<span class="sr-only">
					{criterion.ok ? m['rule511.criterionMet']() : m['rule511.criterionNotMet']()}
				</span>
			</li>
		{/each}
	</ul>

	<p
		data-testid="rule511-verdict"
		aria-live="polite"
		class={rule.met ? 'font-semibold text-success-600-400' : 'opacity-75'}
	>
		{rule.met ? m['rule511.met']() : m['rule511.notMet']()}
	</p>

	<p class="text-xs opacity-60">{m['rule511.disclaimer']()}</p>
</section>
