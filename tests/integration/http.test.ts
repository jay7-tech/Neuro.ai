import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { setupTestDatabase } from './setup';
import { POST as registerRoute } from '@/app/api/v1/auth/register/route';
import { POST as loginRoute } from '@/app/api/v1/auth/login/route';
import { GET as meRoute } from '@/app/api/v1/auth/me/route';
import { GET as patientRoute } from '@/app/api/v1/patients/[patientId]/route';
import { POST as moodRoute } from '@/app/api/v1/patients/[patientId]/mood/route';
import { GET as healthRoute } from '@/app/api/health/route';
import { buildOpenApiDocument } from '@/server/http/openapi';

setupTestDatabase();

const ctx = (params: Record<string, string> = {}) => ({ params: Promise.resolve(params) });
const req = (path: string, init: { method?: string; body?: unknown; cookie?: string; origin?: string } = {}) =>
  new NextRequest(`http://localhost:9002${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(init.cookie ? { cookie: init.cookie } : {}),
      ...(init.origin ? { origin: init.origin } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });

async function signUp(role: 'patient' | 'caregiver', email: string) {
  const res = await registerRoute(req('/api/v1/auth/register', { method: 'POST', body: { name: 'Test', email, password: 'correct-horse-1', role } }), ctx());
  expect(res.status).toBe(201);
  const cookie = res.headers.get('set-cookie')!.split(';')[0];
  return cookie;
}

describe('HTTP layer', () => {
  it('requires a session and returns a uniform error envelope', async () => {
    const res = await meRoute(req('/api/v1/auth/me'), ctx());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(body.error.requestId).toBe(res.headers.get('x-request-id'));
  });

  it('sets an httpOnly SameSite session cookie on register and accepts it afterwards', async () => {
    const res = await registerRoute(
      req('/api/v1/auth/register', { method: 'POST', body: { name: 'Pat', email: 'pat@example.com', password: 'correct-horse-1', role: 'patient' } }),
      ctx(),
    );
    const setCookie = res.headers.get('set-cookie')!;
    expect(setCookie).toMatch(/neuro_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);

    const me = await meRoute(req('/api/v1/auth/me', { cookie: setCookie.split(';')[0] }), ctx());
    expect(me.status).toBe(200);
    const { data } = await me.json();
    expect(data.user.email).toBe('pat@example.com');
    expect(data.patients).toHaveLength(1);
  });

  it('validates bodies with field-level details', async () => {
    const res = await loginRoute(req('/api/v1/auth/login', { method: 'POST', body: { email: 'nope' } }), ctx());
    expect(res.status).toBe(422);
    const { error } = await res.json();
    expect(error.details.map((d: { path: string }) => d.path)).toEqual(expect.arrayContaining(['email', 'password']));
  });

  it('rejects cross-origin mutations (CSRF)', async () => {
    const cookie = await signUp('patient', 'csrf@example.com');
    const me = await (await meRoute(req('/api/v1/auth/me', { cookie }), ctx())).json();
    const patientId = me.data.patients[0].id;
    const res = await moodRoute(req(`/api/v1/patients/${patientId}/mood`, { method: 'POST', cookie, origin: 'https://evil.example', body: { score: 4 } }), ctx({ patientId }));
    expect(res.status).toBe(403);
    const ok = await moodRoute(req(`/api/v1/patients/${patientId}/mood`, { method: 'POST', cookie, origin: 'http://localhost:9002', body: { score: 4 } }), ctx({ patientId }));
    expect(ok.status).toBe(201);
  });

  it("returns 404 for another team's patient and 422 for malformed ids", async () => {
    const a = await signUp('patient', 'a@example.com');
    const b = await signUp('patient', 'b@example.com');
    const aPatient = (await (await meRoute(req('/api/v1/auth/me', { cookie: a }), ctx())).json()).data.patients[0].id;
    expect((await patientRoute(req(`/api/v1/patients/${aPatient}`, { cookie: b }), ctx({ patientId: aPatient }))).status).toBe(404);
    expect((await patientRoute(req('/api/v1/patients/not-a-uuid', { cookie: b }), ctx({ patientId: 'not-a-uuid' }))).status).toBe(422);
  });

  it('rate-limits credential endpoints', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 15 }, () =>
        loginRoute(
          new NextRequest('http://localhost:9002/api/v1/auth/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
            body: JSON.stringify({ email: 'x@example.com', password: 'whatever' }),
          }),
          ctx(),
        ),
      ),
    );
    const limited = attempts.filter((r) => r.status === 429);
    expect(limited.length).toBeGreaterThan(0);
    expect(limited[0].headers.get('retry-after')).toBeTruthy();
  });

  it('reports health', async () => {
    const res = await healthRoute();
    expect(res.status).toBe(200);
    expect((await res.json()).checks.database.status).toBe('ok');
  });

  it('generates a valid OpenAPI document', () => {
    const doc = buildOpenApiDocument();
    expect(doc.openapi).toBe('3.1.0');
    expect(Object.keys(doc.paths ?? {}).length).toBeGreaterThan(30);
  });
});
