import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { rollup } from 'rollup';
import ripple from '../index.js';

const id = path.resolve('src/App.tsrx');
const source = `export function App(props) @{
	<div><span>{props.value}</span></div>
}`;

describe('@ripple-ts/rollup-plugin compiler options', () => {
	it.each(['client', 'server'])('builds %s output with Rollup', async (mode) => {
		const bundle = await rollup({
			input: id,
			external: /^ripple\//,
			plugins: [
				{
					name: 'fixture',
					resolveId: (entry) => (entry === id ? id : null),
					load: (entry) => (entry === id ? source : null),
				},
				ripple({ compilerOptions: { mode } }),
			],
		});
		try {
			const { output } = await bundle.generate({ format: 'es', sourcemap: true });
			expect(output[0].imports).toEqual([`ripple/internal/${mode}`]);
			expect(output[0].exports).toContain('App');
			expect(output[0].map.sourcesContent).toEqual([source]);
		} finally {
			await bundle.close();
		}
	});

	it('keeps the compiler defaults when options are omitted', async () => {
		const result = await ripple().transform(source, id);
		expect(result.code).toContain("from 'ripple/internal/client'");
		expect(result.code).toContain('_$_.hydrate_child(');
		expect(result.code).not.toContain('import.meta.hot');
	});

	it.each([false, true])('respects hmr: %s', async (hmr) => {
		const result = await ripple({ compilerOptions: { hmr } }).transform(source, id);
		expect(result.code.includes('import.meta.hot.accept(')).toBe(hmr);
	});

	it.each([false, true])('respects server dev: %s', async (dev) => {
		const result = await ripple({ compilerOptions: { mode: 'server', dev } }).transform(source, id);
		expect(result.code).toContain("from 'ripple/internal/server'");
		expect(result.code.includes('_$_.push_element(')).toBe(dev);
	});

	it.each([false, true])('respects hydration: %s', async (hydration) => {
		const result = await ripple({ compilerOptions: { hydration } }).transform(source, id);
		expect(result.code.includes('_$_.hydrate_child(')).toBe(hydration);
	});

	it('preserves extracted CSS and source maps when compiling for the server', async () => {
		const styled_source = `export function App() @{
			<>
				<div>Hello</div>
				<style>div { color: red; }</style>
			</>
		}`;
		const plugin = ripple({ compilerOptions: { mode: 'server' } });
		const result = await plugin.transform(styled_source, id);
		const css_id = id.replace(/\.tsrx$/, '.css');

		expect(result.code).toContain("from 'ripple/internal/server'");
		expect(result.code).toContain(`import ${JSON.stringify(css_id)};`);
		expect(plugin.load(css_id)).toContain('color: red;');
		expect(result.map.sourcesContent).toEqual([styled_source]);
	});
});
