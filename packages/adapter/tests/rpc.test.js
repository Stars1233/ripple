import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { patch_global_fetch } from '../src/rpc.js';

describe('patch_global_fetch', () => {
	/** @type {ReturnType<typeof patch_global_fetch> | null} */
	let fetch_handle = null;
	const network_fetch = vi.fn(async () => new Response('network'));
	/** @type {{ origin: string } | undefined} */
	let store;

	beforeEach(() => {
		network_fetch.mockClear();
		vi.stubGlobal('fetch', network_fetch);
		store = { origin: 'http://localhost:3000' };
		fetch_handle = patch_global_fetch({
			run: (_store, fn) => fn(),
			getStore: () => store,
		});
	});

	afterEach(() => {
		fetch_handle?.restore();
		fetch_handle = null;
		vi.unstubAllGlobals();
	});

	it('applies init to a same-origin Request routed to the handler', async () => {
		/** @type {{ method: string, body: string, header: string | null } | null} */
		let received = null;
		fetch_handle.set_handler(async (request) => {
			received = {
				method: request.method,
				body: await request.text(),
				header: request.headers.get('x-test'),
			};
			return new Response('ok');
		});

		const response = await fetch(new Request('http://localhost:3000/api/items'), {
			method: 'POST',
			body: 'payload',
			headers: { 'x-test': '1' },
		});

		expect(await response.text()).toBe('ok');
		expect(received).toEqual({ method: 'POST', body: 'payload', header: '1' });
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it('inherits the body, headers and signal when init is omitted', async () => {
		const controller = new AbortController();
		const input = new Request('http://localhost:3000/api/items', {
			method: 'POST',
			body: 'payload',
			headers: { 'x-test': 'original' },
			signal: controller.signal,
		});
		const handler = vi.fn(async (request) => {
			expect(request).not.toBe(input);
			expect(request.method).toBe('POST');
			expect(request.headers.get('x-test')).toBe('original');
			request.headers.set('x-test', 'handler');
			return new Response(await request.text());
		});
		fetch_handle.set_handler(handler);

		expect(await (await fetch(input)).text()).toBe('payload');
		expect(input.headers.get('x-test')).toBe('original');
		expect(input.bodyUsed).toBe(true);
		expect(handler).toHaveBeenCalledTimes(1);
		controller.abort();
		expect(handler.mock.calls[0][0].signal.aborted).toBe(true);
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it('replaces the body, headers and signal supplied by the original Request', async () => {
		const original_controller = new AbortController();
		const replacement_controller = new AbortController();
		const input = new Request('http://localhost:3000/api/items', {
			method: 'POST',
			body: 'original',
			headers: { 'x-original': '1' },
			signal: original_controller.signal,
		});
		const handler = vi.fn(async (request) => {
			expect(request.method).toBe('PUT');
			expect(request.headers.get('x-original')).toBeNull();
			expect(request.headers.get('x-test')).toBe('replacement');
			return new Response(await request.text());
		});
		fetch_handle.set_handler(handler);

		const response = await fetch(input, {
			method: 'PUT',
			body: 'replacement',
			headers: { 'x-test': 'replacement' },
			signal: replacement_controller.signal,
		});

		expect(await response.text()).toBe('replacement');
		expect(await input.text()).toBe('original');
		const request = handler.mock.calls[0][0];
		original_controller.abort();
		expect(request.signal.aborted).toBe(false);
		replacement_controller.abort();
		expect(request.signal.aborted).toBe(true);
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it.each(['//[invalid', '//'])(
		'rejects malformed relative URL %s without throwing synchronously',
		async (input) => {
			const handler = vi.fn(async () => new Response('handler'));
			fetch_handle.set_handler(handler);

			await expect(fetch(input)).rejects.toThrow(TypeError);
			expect(handler).not.toHaveBeenCalled();
			expect(network_fetch).not.toHaveBeenCalled();
		},
	);

	it('returns the internal handler promise directly for relative URLs', async () => {
		const response = Promise.resolve(new Response('handler'));
		const handler = vi.fn(() => response);
		fetch_handle.set_handler(handler);

		const result = fetch('/api/items');

		expect(result).toBe(response);
		expect(handler.mock.calls[0][0].url).toBe('http://localhost:3000/api/items');
		expect(await (await result).text()).toBe('handler');
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it('rejects invalid Request init without falling back to network fetch', async () => {
		const handler = vi.fn(async () => new Response('handler'));
		fetch_handle.set_handler(handler);

		await expect(
			fetch(new Request('http://localhost:3000/api/items'), { method: 'GET', body: 'payload' }),
		).rejects.toThrow(TypeError);
		expect(handler).not.toHaveBeenCalled();
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it('rejects a consumed Request without falling back to network fetch', async () => {
		const input = new Request('http://localhost:3000/api/items', {
			method: 'POST',
			body: 'payload',
		});
		await input.text();
		const handler = vi.fn(async () => new Response('handler'));
		fetch_handle.set_handler(handler);

		await expect(fetch(input)).rejects.toThrow(TypeError);
		expect(handler).not.toHaveBeenCalled();
		expect(network_fetch).not.toHaveBeenCalled();
	});

	it.each(['synchronous', 'asynchronous'])(
		'rejects a %s handler error without retrying over the network',
		async (kind) => {
			const error = new Error('handler failed');
			const handler = vi.fn(() => {
				if (kind === 'synchronous') throw error;
				return Promise.reject(error);
			});
			fetch_handle.set_handler(handler);

			await expect(fetch(new Request('http://localhost:3000/api/items'))).rejects.toBe(error);
			expect(handler).toHaveBeenCalledTimes(1);
			expect(network_fetch).not.toHaveBeenCalled();
		},
	);

	it.each(['cross-origin', 'no context', 'no handler'])(
		'preserves input and init for network fetch with %s',
		async (kind) => {
			const handler = vi.fn(async () => new Response('handler'));
			if (kind !== 'no handler') fetch_handle.set_handler(handler);
			if (kind === 'no context') store = undefined;
			const origin = kind === 'cross-origin' ? 'http://example.com' : 'http://localhost:3000';
			const input = new Request(`${origin}/api/items`, { method: 'POST', body: 'original' });
			const init = { headers: { 'x-test': '1' } };

			const result = fetch(input, init);
			expect(result).toBe(network_fetch.mock.results[0].value);
			expect(await (await result).text()).toBe('network');
			expect(network_fetch).toHaveBeenCalledExactlyOnceWith(input, init);
			expect(input.bodyUsed).toBe(false);
			expect(handler).not.toHaveBeenCalled();
		},
	);
});
