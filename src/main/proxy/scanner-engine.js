/*
SEN-021 scanner baseline
- Maintains scan job registry.
- Applies scope checks before active targets are queued.
*/

'use strict';

const { EventEmitter } = require('node:events');
const { randomUUID } = require('node:crypto');

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

class ScannerEngine extends EventEmitter {
	constructor(options = {}) {
		super();
		this.scopeEvaluator = typeof options.scopeEvaluator === 'function' ? options.scopeEvaluator : null;
		this.jobs = new Map();
		this.resultsByScanId = new Map();
	}

	setScopeEvaluator(evaluator) {
		this.scopeEvaluator = typeof evaluator === 'function' ? evaluator : null;
		return { ok: true };
	}

	async start({ targets = [], config = {} } = {}) {
		const scanId = randomUUID();
		const normalizedTargets = Array.isArray(targets)
			? targets.map(target => String(target || '').trim()).filter(Boolean)
			: [];

		const inScopeTargets = this.scopeEvaluator
			? normalizedTargets.filter(target => this.scopeEvaluator({ url: target }))
			: normalizedTargets;
		const skippedTargets = normalizedTargets.filter(target => !inScopeTargets.includes(target));

		const job = {
			id: scanId,
			status: 'completed',
			startedAt: Date.now(),
			updatedAt: Date.now(),
			config: clone(config),
			targets: inScopeTargets,
			skippedTargets,
		};

		this.jobs.set(scanId, job);
		this.resultsByScanId.set(scanId, []);
		this.emit('progress', {
			scanId,
			pct: 100,
			finding: null,
			skippedTargets: clone(skippedTargets),
		});
		return { scanId };
	}

	async stop({ scanId } = {}) {
		const job = this.jobs.get(scanId);
		if (!job) {
			return { ok: false };
		}
		job.status = 'stopped';
		job.updatedAt = Date.now();
		this.jobs.set(scanId, job);
		return { ok: true };
	}

	async results({ scanId, page = 0, pageSize = 50 } = {}) {
		const all = this.resultsByScanId.get(scanId) || [];
		const safePage = Math.max(0, Number(page) || 0);
		const safePageSize = Math.max(1, Number(pageSize) || 50);
		const offset = safePage * safePageSize;
		return {
			findings: clone(all.slice(offset, offset + safePageSize)),
			total: all.length,
		};
	}
}

function createScannerEngine(options = {}) {
	return new ScannerEngine(options);
}

const defaultScannerEngine = createScannerEngine();

module.exports = defaultScannerEngine;
module.exports.ScannerEngine = ScannerEngine;
module.exports.createScannerEngine = createScannerEngine;
