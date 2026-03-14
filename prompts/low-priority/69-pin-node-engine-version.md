# 69 — Pin Node.js Engine Version in package.json

## Goal

Fix the Vercel build warning about automatic Node.js version upgrades:

```
Warning: Detected "engines": { "node": ">=20.0.0" } in your `package.json` that
will automatically upgrade when a new major Node.js Version is released.
Learn More: https://vercel.link/node-version
```

This warning appears **twice** during each build and means the project could break unexpectedly when Vercel auto-upgrades to Node 22+.

## Context

- **Current:** `"engines": { "node": ">=20.0.0" }` in `package.json`
- **Risk:** When Node 22 or 24 becomes Vercel's default, the build could break due to breaking changes in Node.js APIs, different V8 behavior, or dependency incompatibilities
- **Best practice:** Pin to a specific major version range to control upgrades

## Task

### 1. Update the engines field

In `package.json`, change:
```json
"engines": {
  "node": ">=20.0.0"
}
```
To:
```json
"engines": {
  "node": "20.x || 22.x"
}
```

Or for maximum stability:
```json
"engines": {
  "node": "20.x"
}
```

### 2. Optionally set .node-version or .nvmrc

Create a `.node-version` file for Vercel to detect:
```
20
```

This gives Vercel an explicit version target.

## Acceptance Criteria

- [ ] Vercel build no longer shows the engines version warning
- [ ] Node.js version is explicitly controlled
- [ ] Build continues to succeed on the pinned version
