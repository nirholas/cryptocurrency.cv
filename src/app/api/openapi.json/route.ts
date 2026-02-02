import { NextResponse } from 'next/server';
import { generateOpenAPISpec } from '@/lib/openapi/generator';

export const runtime = 'edge';

export async function GET() {
  const spec = generateOpenAPISpec();
  
  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
