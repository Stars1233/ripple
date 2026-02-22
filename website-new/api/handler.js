/**
 * Vercel Serverless Function handler.
 *
 * Vercel's Node.js runtime calls serverless functions with (IncomingMessage, ServerResponse),
 * but Ripple's production handler expects Web Fetch (Request => Response).
 *
 * We manually construct the Web Request here instead of using adapter-node's
 * nodeRequestToWebRequest, because Vercel's IncomingMessage body stream does not
 * always work correctly with Node's Readable.toWeb() — the ReadableStream can
 * hang when consumed via request.text(). Buffering the body first avoids this.
 */
import { handler } from '../dist/server/entry.js';
import { webResponseToNodeResponse } from '@ripple-ts/adapter-node';

/**
 * Buffer the entire request body from an IncomingMessage.
 *
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<Buffer>}
 */
function bufferRequestBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', (chunk) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

export default async function (req, res) {
	const controller = new AbortController();
	req.on('close', () => controller.abort());

	try {
		// Derive protocol and host from Vercel's forwarded headers
		const proto = (req.headers['x-forwarded-proto'] || 'https').toString().split(',')[0].trim();
		const host = (req.headers['x-forwarded-host'] || req.headers.host || 'localhost').toString().split(',')[0].trim();
		const url = new URL(req.url ?? '/', `${proto}://${host}`);

		// Build headers
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (value == null) continue;
			if (Array.isArray(value)) {
				for (const v of value) headers.append(key, v);
			} else {
				headers.set(key, value);
			}
		}

		// Build request init — buffer body for non-GET/HEAD methods to avoid
		// Readable.toWeb() hanging in Vercel's serverless runtime.
		const method = req.method ?? 'GET';
		/** @type {RequestInit} */
		const init = { method, headers, signal: controller.signal };

		if (method !== 'GET' && method !== 'HEAD') {
			init.body = await bufferRequestBody(req);
		}

		const request = new Request(url, init);
		const response = await handler(request);
		webResponseToNodeResponse(response, res, method);
	} catch (err) {
		console.error('[ripple] Serverless handler error:', err);
		if (!res.headersSent) {
			res.statusCode = 500;
			res.end('Internal Server Error');
		}
	}
}
