import { expect, test, type Browser, type Page } from '@playwright/test';

const PASSWORD = 'neuro-demo-2026';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

async function asUser(browser: Browser, email: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, email);
  return { ctx, page };
}

test('patient sees their day and checks in their mood', async ({ page }) => {
  await login(page, 'john@demo.neuro.ai');
  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('John');
  await expect(page.getByText('My medicine today')).toBeVisible();
  await expect(page.getByText('My day')).toBeVisible();

  await page.getByRole('radio', { name: 'Good' }).click();
  await expect(page.getByText('Thank you for sharing').first()).toBeVisible();
});

test('roles are confined to their own area', async ({ page }) => {
  await login(page, 'john@demo.neuro.ai');
  await expect(page).toHaveURL(/\/patient$/);
  await page.goto('/caregiver');
  await expect(page).toHaveURL(/\/patient$/);
});

test('unauthenticated users are sent to login', async ({ page }) => {
  await page.goto('/doctor/notes');
  await expect(page).toHaveURL(/\/login\?next=%2Fdoctor%2Fnotes/);
});

test('a patient message reaches the caregiver in real time', async ({ browser }) => {
  const caregiver = await asUser(browser, 'jane@demo.neuro.ai');
  await expect(caregiver.page).toHaveURL(/\/caregiver$/);
  await caregiver.page.getByRole('link', { name: 'Care plan' }).first().click();
  await caregiver.page.getByRole('tab', { name: 'Chat' }).click();
  await expect(caregiver.page.getByText('Live')).toBeVisible();

  const patient = await asUser(browser, 'john@demo.neuro.ai');
  const text = `Hello from e2e ${Date.now()}`;
  await patient.page.getByLabel('Message').fill(text);
  await patient.page.getByRole('button', { name: 'Send' }).click();

  // No reload: the SSE event invalidates the caregiver's chat query.
  await expect(caregiver.page.getByText(text)).toBeVisible({ timeout: 10_000 });
  await caregiver.ctx.close();
  await patient.ctx.close();
});

test('clinician sees risk flags and writes a note the caregiver can read', async ({ browser }) => {
  const doctor = await asUser(browser, 'emily@demo.neuro.ai');
  await expect(doctor.page).toHaveURL(/\/doctor$/);
  await expect(doctor.page.getByText('Needs attention')).toBeVisible();

  await doctor.page.getByRole('link', { name: 'Clinical notes' }).first().click();
  const note = `E2E note ${Date.now()}: continue current regimen.`;
  await doctor.page.getByLabel('Note', { exact: true }).fill(note);
  await doctor.page.getByRole('button', { name: 'Save note' }).click();
  await expect(doctor.page.getByText(note)).toBeVisible();

  const caregiver = await asUser(browser, 'jane@demo.neuro.ai');
  await caregiver.page.getByRole('link', { name: 'Care plan' }).first().click();
  await caregiver.page.getByRole('tab', { name: "Doctor's notes" }).click();
  await expect(caregiver.page.getByText(note)).toBeVisible();
  await doctor.ctx.close();
  await caregiver.ctx.close();
});
