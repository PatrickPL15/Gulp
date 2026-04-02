/*
SEN-015 bridge support for Intruder.
- Accepts request-derived attack configs and returns deterministic results.
*/

'use strict';

const { randomUUID } = require('node:crypto');

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

class IntruderEngine {
	constructor() {
		this.configById = new Map();
		this.attackById = new Map();
		this.resultsByAttackId = new Map();
	}

	async configure({ config } = {}) {
		if (!config || typeof config !== 'object') {
			throw new Error('intruder:configure requires a config object');
		}

		const configId = randomUUID();
		this.configById.set(configId, clone(config));
		return { ok: true, configId };
	}

	async start({ configId } = {}) {
		const config = this.configById.get(configId);
		if (!config) {
			throw new Error(`intruder:start received unknown configId ${configId}`);
		}

		const attackId = randomUUID();
		const payloads = Array.isArray(config.payloads) && config.payloads.length > 0
			? config.payloads
			: ['default'];

		const results = payloads.map((payload, index) => ({
			id: randomUUID(),
			attackId,
			position: index,
			payload: String(payload),
			statusCode: 200,
			length: 0,
			duration: 0,
			data: {
				requestSummary: `${config.method || 'GET'} ${config.path || '/'}`,
			},
		}));

		this.attackById.set(attackId, { status: 'completed', configId });
		this.resultsByAttackId.set(attackId, results);
		return { attackId };
	}

	async stop({ attackId } = {}) {
		if (!this.attackById.has(attackId)) {
			return { ok: false };
		}

		const attack = this.attackById.get(attackId);
		attack.status = 'stopped';
		this.attackById.set(attackId, attack);
		return { ok: true };
	}

	async results({ attackId, page = 0, pageSize = 50 } = {}) {
		const all = this.resultsByAttackId.get(attackId) || [];
		const offset = page * pageSize;
		const items = all.slice(offset, offset + pageSize);
		return { results: clone(items), total: all.length };
	}
}

function createIntruderEngine() {
	return new IntruderEngine();
}

const defaultIntruderEngine = createIntruderEngine();

module.exports = defaultIntruderEngine;
module.exports.IntruderEngine = IntruderEngine;
module.exports.createIntruderEngine = createIntruderEngine;
