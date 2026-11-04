import { createRequire } from 'node:module';
import { realpathSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// deepmerge <= 4.3.1 lets an own "__proto__" key (any JSON.parse output) replace
// the prototype of the merged result (GHSA-gcqx-w48m-w2h4, no upstream fix).
// swagger-ui-react -> swagger-client pulls it in, so package.json overrides it with vendor/deepmerge.

interface DeepMerge {
  (target: object, source: object): Record<string, unknown>;
  all(objects: object[]): Record<string, unknown>;
}

const require = createRequire(import.meta.url);
const fromSwaggerClient = createRequire(
  createRequire(require.resolve('swagger-ui-react')).resolve('swagger-client'),
);
const resolved = fromSwaggerClient.resolve('deepmerge');
const deepmerge = fromSwaggerClient(resolved) as DeepMerge;

describe('deepmerge (vendored, GHSA-gcqx-w48m-w2h4)', () => {
  it('swagger-client resolves the vendored copy', () => {
    expect(realpathSync(resolved)).toMatch(/vendor[\\/]deepmerge[\\/]index\.js$/);
  });

  it('does not let a parsed __proto__ key in the target poison the result', () => {
    const target = JSON.parse('{"__proto__": {"polluted": "target"}, "keep": 1}');
    const out = deepmerge(target, {});
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out.polluted).toBeUndefined();
    expect(out.keep).toBe(1);
  });

  it('does not let a parsed __proto__ key in the source poison the result', () => {
    const target = Object.assign(Object.create(null), { a: 1 });
    const out = deepmerge(target, JSON.parse('{"__proto__": {"polluted": "source"}}'));
    expect(Object.getPrototypeOf(out)).toBe(Object.prototype);
    expect(out.polluted).toBeUndefined();
    expect(out.a).toBe(1);
  });

  it('leaves the global Object prototype untouched', () => {
    deepmerge({}, JSON.parse('{"__proto__": {"globalPolluted": true}}'));
    expect(({} as Record<string, unknown>).globalPolluted).toBeUndefined();
  });

  it('keeps normal deep merge behaviour', () => {
    expect(deepmerge({ a: { b: 1 }, l: [1] }, { a: { c: 2 }, l: [2] })).toEqual({
      a: { b: 1, c: 2 },
      l: [1, 2],
    });
    expect(deepmerge.all([{ a: 1 }, { b: 2 }, { a: 3 }])).toEqual({ a: 3, b: 2 });
  });
});
