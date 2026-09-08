/**
 * Live audit, run only when LIVE_ORIGIN is set. Left out of the default run so
 * the suite stays offline and deterministic.
 */
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { audit } from '../src/audit';
import { renderText } from '../src/report';

const origin = process.env.LIVE_ORIGIN;

describe.skipIf(!origin)('live origin', () => {
  it('audits', async () => {
    const report = await audit(origin!, { probeLimit: Number(process.env.LIVE_PROBE ?? 14), timeoutMs: 20000 });
    process.stdout.write(renderText(report, { verbose: true }));
    if (process.env.LIVE_OUT) writeFileSync(process.env.LIVE_OUT, JSON.stringify(report, null, 2));
  }, 300000);
});
