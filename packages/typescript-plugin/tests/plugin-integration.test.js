import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup_fixture_workspaces, create_fixture_workspace } from './workspace-fixtures.js';
import * as ts from 'typescript';
import { getRippleLanguagePlugin, TSRXVirtualCode, _reset_for_test } from '../src/language.js';
import { fileURLToPath } from 'url';

const repo_root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
/** @type {string[]} */
const created_real_compiler_workspaces = [];

/**
 * @param {string} source
 * @returns {import('typescript').IScriptSnapshot}
 */
function create_snapshot(source) {
	return ts.ScriptSnapshot.fromString(source);
}

/**
 * @returns {ReturnType<typeof getRippleLanguagePlugin>}
 */
function create_plugin() {
	return getRippleLanguagePlugin();
}

/**
 * @param {ReturnType<typeof getRippleLanguagePlugin>} plugin
 * @param {string} file_name
 * @param {string} source
 * @returns {TSRXVirtualCode}
 */
function create_virtual_code(plugin, file_name, source) {
	const create_virtual_code_fn = plugin.createVirtualCode;
	if (typeof create_virtual_code_fn !== 'function') {
		throw new Error('Language plugin does not expose createVirtualCode');
	}

	/** @type {import('@volar/language-core').CodegenContext<string>} */
	const ctx = { getAssociatedScript: () => undefined };

	return /** @type {TSRXVirtualCode} */ (
		create_virtual_code_fn(file_name, 'ripple', create_snapshot(source), ctx)
	);
}

/**
 * @returns {string}
 */
function create_real_react_workspace() {
	const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'ts-plugin-real-react-'));
	created_real_compiler_workspaces.push(workspace);
	fs.mkdirSync(path.join(workspace, 'src'), { recursive: true });
	fs.mkdirSync(path.join(workspace, 'node_modules', '@tsrx', 'react', 'src'), { recursive: true });
	fs.writeFileSync(
		path.join(workspace, 'package.json'),
		JSON.stringify(
			{
				name: '@tsrx/fixture-real-react-project',
				private: true,
				devDependencies: {
					'@tsrx/react': 'workspace:*',
				},
			},
			null,
			2,
		) + '\n',
	);
	fs.writeFileSync(
		path.join(workspace, 'node_modules', '@tsrx', 'react', 'src', 'index.js'),
		`module.exports = require(${JSON.stringify(
			path.join(repo_root, 'packages', 'tsrx-react', 'src', 'index.js'),
		)});\n`,
	);

	return workspace;
}

function cleanup_real_compiler_workspaces() {
	while (created_real_compiler_workspaces.length > 0) {
		const workspace = created_real_compiler_workspaces.pop();
		if (!workspace) {
			continue;
		}
		fs.rmSync(workspace, { recursive: true, force: true });
	}
}

describe('typescript-plugin language plugin integration', () => {
	beforeEach(() => {
		_reset_for_test();
	});

	afterEach(() => {
		cleanup_fixture_workspaces();
		cleanup_real_compiler_workspaces();
	});

	it('recognizes only .tsrx through the language plugin', () => {
		const plugin = create_plugin();

		expect(plugin.getLanguageId('/tmp/App.tsrx')).toBe('ripple');
		expect(plugin.getLanguageId('/tmp/App.ripple')).toBeUndefined();
		expect(plugin.getLanguageId('/tmp/App.rsrx')).toBeUndefined();
		expect(plugin.getLanguageId('/tmp/App.ts')).toBeUndefined();
	});

	it('creates virtual code with the ripple compiler in a ripple project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, '<div>Hello Ripple</div>');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:ripple');
		expect(virtual_code.generatedCode).toContain(file_name);
	});

	it('creates virtual code with the react compiler in a react project when both compilers exist', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('both-react');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(
			plugin,
			file_name,
			'export default function App() { return <div>Hello TSRX</div>; }',
		);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:react');
	});

	it('creates virtual code with the react compiler in a react-only project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('react-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, 'export default <div>Hello</div>;');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:react');
	});

	it('creates virtual code with the ripple compiler in a ripple-only project', () => {
		const plugin = create_plugin();
		const workspace = create_fixture_workspace('ripple-only');
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const virtual_code = create_virtual_code(plugin, file_name, '<div>Hello</div>');

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.generatedCode).toContain('compiler:ripple');
	});

	it('returns undefined for non-tsrx files before compiler resolution', () => {
		const plugin = create_plugin();
		const create_virtual_code_fn = /** @type {any} */ (plugin.createVirtualCode);
		if (typeof create_virtual_code_fn !== 'function') {
			throw new Error('Language plugin does not expose createVirtualCode');
		}

		expect(
			create_virtual_code_fn(
				path.join(create_fixture_workspace('both'), 'src', 'App.ripple'),
				'ripple',
				create_snapshot('<div>Hello</div>'),
			),
		).toBeUndefined();
	});

	it('preserves class-related react return mappings through the plugin virtual-code path', () => {
		const plugin = create_plugin();
		const workspace = create_real_react_workspace();
		const file_name = path.join(workspace, 'src', 'App.tsrx');
		const source = `class Foo {
	bar(x) {
		if (x) return true
		return false
	}

	get ready() {
		if (cond) return true
		return false
	}

	field = (x) => {
		if (x) return true
		return false
	};
}`;
		const virtual_code = create_virtual_code(plugin, file_name, source);

		expect(virtual_code).toBeInstanceOf(TSRXVirtualCode);
		expect(virtual_code.fatalErrors).toEqual([]);
		expect(virtual_code.usageErrors).toEqual([]);

		for (const snippet of ['return true', 'return false']) {
			const offsets = [];
			let search_from = 0;
			while (true) {
				const offset = source.indexOf(snippet, search_from);
				if (offset === -1) break;
				offsets.push(offset);
				search_from = offset + snippet.length;
			}

			for (const offset of offsets) {
				const mapping = virtual_code.findMappingBySourceRange(offset, offset + 'return'.length);
				expect(mapping, `missing mapping for ${snippet} at ${offset}`).toBeTruthy();
				expect(mapping?.generatedLengths[0]).toBeGreaterThan(0);
			}
		}
	});
});
