/*
SEN-015 bridge support for Repeater.
- Accepts requests from history and stores repeater session entries.
*/

'use strict';

const { randomUUID } = require('node:crypto');

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

class RepeaterService {
	constructor() {
		this.entries = [];
	}

	async send({ request } = {}) {
		if (!request) {
			throw new Error('repeater:send requires a request payload');
		}

		const now = Date.now();
		const responseBody = 'Repeater request queued (network replay in SEN-016)';
		const entry = {
			id: randomUUID(),
			createdAt: now,
			request: clone(request),
			response: {
				id: randomUUID(),
				timestamp: now,
				statusCode: 200,
				statusMessage: 'OK',
				headers: { 'content-type': 'text/plain; charset=utf-8' },
				body: responseBody,
				bodyLength: Buffer.byteLength(responseBody, 'utf8'),
			},
		};

		this.entries.unshift(entry);
		if (this.entries.length > 200) {
			this.entries.splice(200);
		}

		return {
			response: clone(entry.response),
			entry: clone(entry),
		};
	}

	async listHistory() {
		return { items: clone(this.entries) };
	}
}

function createRepeaterService() {
	return new RepeaterService();
}

const defaultRepeaterService = createRepeaterService();

module.exports = defaultRepeaterService;
module.exports.RepeaterService = RepeaterService;
module.exports.createRepeaterService = createRepeaterService;
