/*
SEN-014 Protocol support
- HTTP/1.1 interception runtime on a configurable port.
- Integration with intercept engine, rules engine, and history logging.
*/

'use strict';

const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');
const { randomUUID } = require('node:crypto');
const interceptEngineModule = require('./intercept-engine');
const historyLogModule = require('./history-log');
const rulesEngineModule = require('./rules-engine');

const MAX_REQUEST_BYTES = 25 * 1024 * 1024; // 25 MB

function normalizeHeaders(rawHeaders = {}) {
	const normalized = {};
	for (const [name, value] of Object.entries(rawHeaders || {})) {
		const key = String(name).toLowerCase();
		if (Array.isArray(value)) {
			normalized[key] = value.join(', ');
		} else {
			normalized[key] = value === undefined ? '' : String(value);
		}
	}
	return normalized;
}

function isTextualContentType(contentType = '') {
	const value = String(contentType || '').toLowerCase();
	if (!value) {
		return false;
	}

	return (
		value.startsWith('text/') ||
		value.includes('json') ||
		value.includes('xml') ||
		value.includes('javascript') ||
		value.includes('x-www-form-urlencoded')
	);
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let accumulated = 0;
		req.on('data', chunk => {
			accumulated += chunk.length;
			if (accumulated > MAX_REQUEST_BYTES) {
				req.destroy(new Error('Request body exceeds 25 MB size limit'));
				return;
			}
			chunks.push(Buffer.from(chunk));
		});
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

function parseHostAndPort(hostHeader = '', protocol = 'http:') {
	const raw = String(hostHeader || '').trim();
	const defaultPort = protocol === 'https:' ? 443 : 80;

	if (!raw) {
		return { host: 'localhost', port: defaultPort };
	}

	if (raw.startsWith('[')) {
		const end = raw.indexOf(']');
		if (end > 0) {
			const host = raw.slice(1, end);
			const rest = raw.slice(end + 1);
			if (rest.startsWith(':')) {
				const port = Number(rest.slice(1));
				if (Number.isInteger(port) && port > 0 && port <= 65535) {
					return { host, port };
				}
			}
			return { host, port: defaultPort };
		}
	}

	const colonCount = (raw.match(/:/g) || []).length;
	if (colonCount === 1) {
		const separator = raw.lastIndexOf(':');
		const host = raw.slice(0, separator);
		const port = Number(raw.slice(separator + 1));
		if (host && Number.isInteger(port) && port > 0 && port <= 65535) {
			return { host, port };
		}
	}

	return { host: raw, port: defaultPort };
}

function formatAuthority(host, port, protocol = 'http:') {
	const defaultPort = protocol === 'https:' ? 443 : 80;
	let name = String(host || 'localhost');

	if (name.includes(':') && !name.startsWith('[') && !name.endsWith(']')) {
		name = `[${name}]`;
	}

	if (Number.isInteger(port) && port > 0 && port !== defaultPort) {
		return `${name}:${port}`;
	}

	return name;
}

function resolveTargetUrl(request) {
	if (request.url && /^https?:\/\//i.test(request.url)) {
		return new URL(request.url);
	}

	const protocol = request.tls ? 'https:' : 'http:';
	const parsedHost = parseHostAndPort(request.headers && request.headers.host, protocol);
	const host = request.host || parsedHost.host;
	const port = request.port || parsedHost.port;
	const authority = formatAuthority(host, port, protocol);
	const path = request.path || '/';
	return new URL(`${protocol}//${authority}${path}`);
}

/**
 * Standalone HTTP forwarder.  Used by both ProtocolSupport and RepeaterService.
 * Returns a response object that includes a `rawBody` Buffer and `rawBodyBase64`
 * for callers that need raw bytes (hex viewer, binary replay).
 *
 * @param {object} request - Canonical HttpRequest model.
 * @returns {Promise<object>} Canonical HttpResponse plus `rawBody` Buffer.
 */
const FORWARD_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 25 * 1024 * 1024; // 25 MB

async function forwardRequest(request) {
	const requestStart = Date.now();
	const targetUrl = resolveTargetUrl(request);
	const client = targetUrl.protocol === 'https:' ? https : http;
	const headers = normalizeHeaders(request.headers || {});

	delete headers['proxy-connection'];
	headers.host = targetUrl.host;

	// Strip hop-by-hop headers (RFC 2616 §13.5.1) so they are not forwarded upstream.
	const perConnectionHeaders = String(headers['connection'] || '')
		.split(',')
		.map(h => h.trim().toLowerCase())
		.filter(Boolean);
	const hopByHopNames = [
		'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
		'te', 'trailers', 'upgrade', ...perConnectionHeaders,
	];
	for (const name of hopByHopNames) {
		delete headers[name];
	}

	let bodyBuffer = Buffer.alloc(0);
	if (typeof request.body === 'string') {
		bodyBuffer = Buffer.from(request.body, 'utf8');
	} else if (typeof request.rawBodyBase64 === 'string' && request.rawBodyBase64.length > 0) {
		try {
			bodyBuffer = Buffer.from(request.rawBodyBase64, 'base64');
		} catch {
			bodyBuffer = Buffer.alloc(0);
		}
	}

	delete headers['content-length'];
	delete headers['transfer-encoding'];
	if (bodyBuffer.length > 0) {
		headers['content-length'] = String(bodyBuffer.length);
	}

	return new Promise((resolve, reject) => {
		const upstreamReq = client.request({
			protocol: targetUrl.protocol,
			hostname: targetUrl.hostname,
			port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
			method: request.method || 'GET',
			path: `${targetUrl.pathname}${targetUrl.search}`,
			headers,
			timeout: FORWARD_TIMEOUT_MS,
		}, upstreamRes => {
			const ttfb = Date.now() - requestStart;
			const chunks = [];
			let accumulated = 0;

			upstreamRes.on('data', chunk => {
				accumulated += chunk.length;
				if (accumulated > MAX_RESPONSE_BYTES) {
					upstreamReq.destroy(new Error('Upstream response exceeds 25 MB size limit'));
					return;
				}
				chunks.push(Buffer.from(chunk));
			});
			upstreamRes.on('end', () => {
				const rawBody = Buffer.concat(chunks);
				const contentType = String(upstreamRes.headers['content-type'] || '').split(';')[0] || '';
				const decodedBody = isTextualContentType(contentType)
					? rawBody.toString('utf8')
					: null;
				const timestamp = Date.now();
				resolve({
					id: randomUUID(),
					requestId: request.id,
					connectionId: request.connectionId,
					timestamp,
					statusCode: upstreamRes.statusCode || 502,
					statusMessage: upstreamRes.statusMessage || 'Bad Gateway',
					headers: normalizeHeaders(upstreamRes.headers),
					contentType,
					body: decodedBody,
					bodyLength: rawBody.length,
					rawBodyBase64: rawBody.length > 0 ? rawBody.toString('base64') : null,
					timings: {
						sendStart: 0,
						ttfb,
						total: timestamp - requestStart,
					},
					rawBody,
				});
			});
		});

		upstreamReq.on('error', reject);
		upstreamReq.on('timeout', () => {
			upstreamReq.destroy(new Error(`Upstream request timed out after ${FORWARD_TIMEOUT_MS / 1000} seconds`));
		});

		if (bodyBuffer.length > 0) {
			upstreamReq.write(bodyBuffer);
		}
		upstreamReq.end();
	});
}

class ProtocolSupport {
	constructor(options = {}) {
		this.interceptEngine = options.interceptEngine || interceptEngineModule;
		this.historyLog = options.historyLog || historyLogModule;
		this.rulesEngine = options.rulesEngine || rulesEngineModule;
		this.scopeEvaluator = typeof options.scopeEvaluator === 'function' ? options.scopeEvaluator : null;
		this.server = null;
		this.port = 0;
	}

	setScopeEvaluator(evaluator) {
		this.scopeEvaluator = typeof evaluator === 'function' ? evaluator : null;
		return { ok: true };
	}

	async start({ port = 8080 } = {}) {
		if (this.server) {
			return { port: this.port, status: 'running' };
		}

		this.server = http.createServer((req, res) => {
			this.handleHttpRequest(req, res).catch(async error => {
				const fallbackStatus = 502;
				res.writeHead(fallbackStatus, { 'content-type': 'text/plain; charset=utf-8' });
				res.end('Sentinel proxy upstream error');

				try {
					await this.historyLog.logTraffic({
						kind: 'http',
						request: {
							id: randomUUID(),
							connectionId: randomUUID(),
							timestamp: Date.now(),
							method: req.method || 'GET',
							url: req.url || '/',
							host: String(req.headers.host || ''),
							port,
							path: req.url || '/',
							queryString: '',
							headers: normalizeHeaders(req.headers || {}),
							body: null,
							protocol: 'HTTP/1.1',
							tls: false,
							tags: [],
							comment: `forwarding failed: ${error.message}`,
							inScope: false,
						},
						response: {
							id: randomUUID(),
							requestId: '',
							connectionId: '',
							timestamp: Date.now(),
							statusCode: fallbackStatus,
							statusMessage: 'Bad Gateway',
							headers: { 'content-type': 'text/plain; charset=utf-8' },
							contentType: 'text/plain',
							body: 'Sentinel proxy upstream error',
							bodyLength: 28,
							timings: { sendStart: 0, ttfb: 0, total: 0 },
						},
					});
				} catch {
					// Ignore history write failures in fallback path.
				}
			});
		});

		await new Promise((resolve, reject) => {
			this.server.once('error', reject);
			this.server.listen(port, '127.0.0.1', () => resolve());
		});

		const address = this.server.address();
		this.port = address && typeof address === 'object' ? address.port : port;
		return { port: this.port, status: 'running' };
	}

	async stop() {
		if (!this.server) {
			return { status: 'stopped' };
		}

		const server = this.server;
		this.server = null;
		this.port = 0;

		await new Promise((resolve, reject) => {
			server.close(error => (error ? reject(error) : resolve()));
		});

		return { status: 'stopped' };
	}

	getStatus() {
		return {
			running: !!this.server,
			port: this.port,
			intercepting: typeof this.interceptEngine.isEnabled === 'function'
				? this.interceptEngine.isEnabled()
				: !!this.interceptEngine.interceptEnabled,
		};
	}

	async handleHttpRequest(req, res) {
		const bodyBuffer = await readBody(req);
		const timestamp = Date.now();
		const connectionId = randomUUID();
		const normalizedHeaders = normalizeHeaders(req.headers || {});
		const contentType = normalizedHeaders['content-type'] || '';
		const bodyText = bodyBuffer.length > 0 && isTextualContentType(contentType)
			? bodyBuffer.toString('utf8')
			: null;
		const rawBodyBase64 = bodyBuffer.length > 0 ? bodyBuffer.toString('base64') : null;

		const target = /^https?:\/\//i.test(req.url || '') ? new URL(req.url) : null;
		const parsedHost = parseHostAndPort(normalizedHeaders.host || '', 'http:');
		const requestModel = {
			id: randomUUID(),
			connectionId,
			timestamp,
			method: (req.method || 'GET').toUpperCase(),
			url: target ? target.toString() : (req.url || '/'),
			host: target ? target.hostname : parsedHost.host,
			port: target ? Number(target.port || (target.protocol === 'https:' ? 443 : 80)) : parsedHost.port,
			path: target ? `${target.pathname || '/'}${target.search || ''}` : (req.url || '/'),
			queryString: target ? (target.search || '').replace(/^\?/, '') : '',
			headers: normalizedHeaders,
			body: bodyText,
			rawBodyBase64,
			protocol: 'HTTP/1.1',
			tls: false,
			tags: [],
			comment: '',
			inScope: this.scopeEvaluator ? this.scopeEvaluator({
				protocol: target ? target.protocol.replace(':', '') : 'http',
				host: target ? target.hostname : parsedHost.host,
				port: target ? Number(target.port || (target.protocol === 'https:' ? 443 : 80)) : parsedHost.port,
				path: target ? `${target.pathname || '/'}${target.search || ''}` : (req.url || '/'),
			}) : false,
		};

		const result = await this.interceptEngine.captureRequest(requestModel, async forwardedRequest => {
			return this.forwardHttpRequest(forwardedRequest);
		});

		if (result.action === 'dropped') {
			await this.historyLog.logTraffic({
				kind: 'http',
				request: result.request,
				response: null,
			});

			res.writeHead(499, { 'content-type': 'text/plain; charset=utf-8' });
			res.end('Request dropped by Sentinel proxy');
			return;
		}

		const responseModel = result.response;

		await this.historyLog.logTraffic({
			kind: 'http',
			request: result.request,
			response: {
				...responseModel,
				rawBody: undefined,
			},
		});

		res.writeHead(responseModel.statusCode, responseModel.statusMessage, responseModel.headers || {});
		res.end(responseModel.rawBody || Buffer.from(responseModel.body || '', 'utf8'));
	}

	async forwardHttpRequest(request) {
		return forwardRequest(request);
	}
}

function createProtocolSupport(options = {}) {
	return new ProtocolSupport(options);
}

const defaultProtocolSupport = createProtocolSupport();

module.exports = defaultProtocolSupport;
module.exports.ProtocolSupport = ProtocolSupport;
module.exports.createProtocolSupport = createProtocolSupport;
module.exports.forwardRequest = forwardRequest;
