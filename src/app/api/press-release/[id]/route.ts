import { type NextRequest, NextResponse } from 'next/server';
import { pressReleaseStore } from '@/lib/press-release';
import { logger } from '@/lib/logger';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth check (admin only) — placeholder
  // TODO: Implement real admin auth (e.g. check session/token)
  const adminHeader = req.headers.get('x-admin-key');
  if (adminHeader !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { status, reviewNote } = await req.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const submission = pressReleaseStore.find((s) => s.id === id);
    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    submission.status = status;
    submission.reviewNote = reviewNote;
    submission.updatedAt = new Date().toISOString();

    logger.info('[Press Release] Status updated', {
      id: submission.id,
      status,
      title: submission.title,
    });

    // TODO: Notify submitter via email
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
