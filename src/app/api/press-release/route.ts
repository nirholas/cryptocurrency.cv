import { type NextRequest, NextResponse } from 'next/server';
import {
  type PressReleaseSubmission,
  validatePressRelease,
  sanitizeInput,
  pressReleaseStore,
} from '@/lib/press-release';
import { logger } from '@/lib/logger';
import crypto from 'node:crypto';

const RATE_LIMIT = 3;
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24h

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Sanitize all string inputs
    for (const key of Object.keys(data)) {
      if (typeof data[key] === 'string') {
        data[key] = sanitizeInput(data[key]);
      }
    }

    // Validate
    const errors = validatePressRelease(data);
    if (errors.length) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Rate limit: max 3 submissions per email per day
    const now = Date.now();
    const recent = pressReleaseStore.filter(
      (s) =>
        s.contactEmail === data.contactEmail &&
        now - new Date(s.createdAt).getTime() < RATE_LIMIT_WINDOW,
    );
    if (recent.length >= RATE_LIMIT) {
      return NextResponse.json(
        { error: 'Rate limit exceeded (3 submissions per email per day).' },
        { status: 429 },
      );
    }

    // Store submission
    const submission: PressReleaseSubmission = {
      ...data,
      id: crypto.randomUUID(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    pressReleaseStore.push(submission);

    logger.info('[Press Release] New submission', {
      id: submission.id,
      title: submission.title,
      projectName: submission.projectName,
      tier: submission.tier,
    });

    // TODO: Send confirmation email, notify admin
    return NextResponse.json({ id: submission.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  const approved = pressReleaseStore.filter((s) => s.status === 'approved');
  return NextResponse.json({ pressReleases: approved });
}
