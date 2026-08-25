import { browser } from '$app/env';
import { nowOffsetString, toOffsetString } from '#lib/shared/datetime.js';
import { durationOf, elapsedSince, evaluate511, intervalOf } from './stats/stats.js';
import * as storage from './storage/storage.js';
import type { Contraction, OffsetDateTime, PersistedState, Rule511 } from './types.js';

// Nothing this brief is a contraction — it is a double tap on the toggle.
const MIN_RECORDABLE_MS = 3_000;

class Contractions {
	records = $state<Contraction[]>([]);
	runningStart = $state<OffsetDateTime | null>(null);

	now = $state<Date>(new Date());

	constructor() {
		if (!browser) return;
		this.adopt(storage.load(this.now));
		addEventListener('storage', (event) => {
			if (event.key === null || event.key === storage.STORAGE_KEY) {
				this.adopt(storage.load(new Date()));
			}
		});
	}

	get isRunning(): boolean {
		return this.runningStart !== null;
	}

	get elapsed(): number {
		return this.runningStart === null ? 0 : elapsedSince(this.runningStart, this.now);
	}

	get last(): Contraction | undefined {
		return this.records.at(-1);
	}

	get lastDuration(): number | null {
		return this.last ? durationOf(this.last) : null;
	}

	get lastInterval(): number | null {
		if (this.records.length < 2) {
			return null;
		}

		return intervalOf(this.records.at(-2)!, this.records.at(-1)!);
	}

	get sinceLast(): number | null {
		return this.last ? elapsedSince(this.last.start, this.now) : null;
	}

	get rule511(): Rule511 {
		return evaluate511(this.records, this.now);
	}

	start() {
		if (this.isRunning) return;
		this.runningStart = nowOffsetString();
		this.persist();
	}

	stop(): boolean {
		const start = this.runningStart;
		if (start === null) return false;

		const end = new Date();
		if (elapsedSince(start, end) < MIN_RECORDABLE_MS) {
			this.discard();
			return false;
		}

		this.records = [...this.records, { start, end: toOffsetString(end) }];
		this.runningStart = null;
		this.persist();
		return true;
	}

	discard() {
		if (this.runningStart === null) return;
		this.runningStart = null;
		this.persist();
	}

	clear() {
		this.records = [];
		this.runningStart = null;
		if (browser) storage.clear();
	}

	tick() {
		this.now = new Date();
	}

	private adopt(state: PersistedState) {
		this.records = state.records;
		this.runningStart = state.running;
	}

	private persist() {
		if (!browser) {
			return;
		}

		this.records = storage.mergeRecords(storage.load(this.now).records, this.records);
		storage.save({ records: this.records, running: this.runningStart });
	}
}

export const contractions = new Contractions();
