import type { OffsetDateTime } from '#lib/shared/datetime.js';

export type { OffsetDateTime };

export type Contraction = {
	start: OffsetDateTime;
	end: OffsetDateTime;
};

export type Rule511 = {
	durationOk: boolean;
	intervalOk: boolean;
	hourOk: boolean;
	met: boolean;
};

export type PersistedState = {
	records: Contraction[];
	running: OffsetDateTime | null;
};
