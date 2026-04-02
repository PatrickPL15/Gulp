/*
SEN-020 Embedded browser service
- Creates lightweight browser sessions managed by main process.
- Navigates targets through the Sentinel proxy listener.
- Returns textual previews for renderer-side embedded display.
*/

'use strict';

const http = require('node:http');
const { URL } = require('node:url');
const { randomUUID } = require('node:crypto');

const MAX_PREVIEW_BYTES = 1 * 1024 * 1024;

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function isTextContent(contentType = '') {
	const value = String(contentType || '').toLowerCase();
	return value.startsWith('text/') || value.includes('json') || value.includes('xml') || value.includes('javascript');
}

function requestViaProxy(proxyPort, targetUrl) {
	return new Promise((resolve, reject) => {
		const req = http.request({
			hostname: '127.0.0.1',
			port: proxyPort,
			method: 'GET',
			path: targetUrl.toString(),
			agent: false,
			headers: {
				host: targetUrl.host,
			},
			timeout: 30_000,
		}, res => {
			const chunks = [];
			let total = 0;

			res.on('data', chunk => {
				total += chunk.length;
				if (total > MAX_PREVIEW_BYTES) {
					req.destroy(new Error('Embedded browser preview exceeded 1 MB limit'));
					return;
				}
				chunks.push(Buffer.from(chunk));
			});

			res.on('end', () => {
				const bodyBuffer = Buffer.concat(chunks);
				const contentType = String(res.headers['content-type'] || '').split(';')[0] || '';
				resolve({
					statusCode: res.statusCode || 502,
					statusMessage: res.statusMessage || 'Bad Gateway',
					headers: res.headers || {},
					contentType,
					body: isTextContent(contentType) ? bodyBuffer.toString('utf8') : null,
					bodyLength: bodyBuffer.length,
				});
			});
		});

		req.on('error', reject);
		req.on('timeout', () => {
			req.destroy(new Error('Embedded browser request timed out after 30 seconds'));
		});
		req.end();
	});
}

class EmbeddedBrowserService {
	constructor(options = {}) {
		this.sessions = new Map();
		this.getProxyStatus = options.getProxyStatus;
		this.startProxy = options.startProxy;
	}

	setProxyAdapters({ getProxyStatus, startProxy } = {}) {
		if (typeof getProxyStatus === 'function') {
			this.getProxyStatus = getProxyStatus;
		}
		if (typeof startProxy === 'function') {
			this.startProxy = startProxy;
		}
	}

	async ensureProxyReady() {
		if (typeof this.getProxyStatus !== 'function' || typeof this.startProxy !== 'function') {
			throw new Error('Embedded browser proxy adapters are not configured');
		}

		const status = await this.getProxyStatus();
		if (status && status.running && Number.isInteger(status.port) && status.port > 0) {
			return status.port;
		}

		const started = await this.startProxy({ port: (status && status.port) || 8080 });
		return started.port;
	}

	createSession({ name } = {}) {
		const id = randomUUID();
		const session = {
			id,
			name: String(name || `Session ${this.sessions.size + 1}`),
			currentUrl: '',
			statusCode: null,
			contentType: '',
			bodyPreview: '',
			updatedAt: Date.now(),
		};
		this.sessions.set(id, session);
		return clone(session);
	}

	listSessions() {
		return {
			items: [...this.sessions.values()]
				.sort((left, right) => right.updatedAt - left.updatedAt)
				.map(session => clone(session)),
		};
	}

	async navigate({ sessionId, url } = {}) {
		if (!sessionId || !this.sessions.has(sessionId)) {
			throw new Error('embedded browser session not found');
		}

		const targetUrl = new URL(String(url || ''));
		if (!['http:', 'https:'].includes(targetUrl.protocol)) {
			throw new Error('embedded browser only supports http/https URLs');
		}

		const proxyPort = await this.ensureProxyReady();
		const response = await requestViaProxy(proxyPort, targetUrl);

		const session = this.sessions.get(sessionId);
		session.currentUrl = targetUrl.toString();
		session.statusCode = response.statusCode;
		session.contentType = response.contentType;
		session.bodyPreview = response.body || '';
		session.updatedAt = Date.now();
		this.sessions.set(sessionId, session);

		return {
			session: clone(session),
			response: clone(response),
			proxy: { port: proxyPort },
		};
	}
}

function createEmbeddedBrowserService(options = {}) {
	return new EmbeddedBrowserService(options);
}

const defaultEmbeddedBrowserService = createEmbeddedBrowserService();

module.exports = defaultEmbeddedBrowserService;
module.exports.EmbeddedBrowserService = EmbeddedBrowserService;
module.exports.createEmbeddedBrowserService = createEmbeddedBrowserService;
