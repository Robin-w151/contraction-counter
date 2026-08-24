import { browser } from '$app/env';
import { nowOffsetString } from '#lib/shared/datetime.js';
import { durationOf, elapsedSince, evaluate511, intervalOf } from './stats.js';
import * as storage from './storage.js';
import type { Contraction, OffsetDateTime, Rule511 } from './types.js';

class Contractions {
	records = $state<Contraction[]>([]);
	runningStart = $state<OffsetDateTime | null>(null);

	now = $state<Date>(new Date());

	constructor() {
		if (!browser) return;
		const restored = storage.load(this.now);
		this.records = restored.records;
		this.runningStart = restored.running;
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
		if (this.records.length < 2) return null;
		return intervalOf(this.records[this.records.length - 2], this.records[this.records.length - 1]);
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

	stop() {
		const start = this.runningStart;
		if (start === null) return;
		this.records = [...this.records, { start, end: nowOffsetString() }];
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

	private persist() {
		if (browser) {
			storage.save({ records: this.records, running: this.runningStart });
		}
	}
}

export const contractions = new Contractions();
