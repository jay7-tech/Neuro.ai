import { NextResponse } from 'next/server';
import { buildOpenApiDocument } from '@/server/http/openapi';

export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
