import { expect, test } from '@playwright/test';

test.describe('public surfaces', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /lumina/i }).first()).toBeVisible();
    await expect(page).toHaveTitle(/lumina/i);
  });

  test('catalog lists courses', async ({ page }) => {
    await page.goto('/courses');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('course detail is reachable from the catalog', async ({ page }) => {
    await page.goto('/courses');
    const courseLink = page.locator('a[href^="/courses/"]').first();
    await expect(courseLink).toBeVisible();
    await courseLink.click();
    await expect(page).toHaveURL(/\/courses\/[^/]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('certificate verification page renders', async ({ page }) => {
    await page.goto('/verify');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('textbox').first()).toBeVisible();
  });
});

test.describe('auth guards', () => {
  test('login page renders a form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('dashboard redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('learn page redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/learn/design-systems-foundations');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('authenticated dashboards', () => {
  test('organization admin lands on the admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@lumina.test');
    await page.getByLabel(/password/i).fill('Passw0rd!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('student lands on the student dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('student@lumina.test');
    await page.getByLabel(/password/i).fill('Passw0rd!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('teaching access and platform ownership', () => {
  test('registration offers a student or instructor account', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('radio', { name: /learn student account/i })).toBeChecked();
    await page.getByText('Teach', { exact: true }).click();
    await expect(page.getByRole('radio', { name: /teach instructor request/i })).toBeChecked();
    await expect(page.getByLabel(/what would you like to teach/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /request teaching access/i })).toBeVisible();
  });

  test('student can open the instructor request page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('student@lumina.test');
    await page.getByLabel(/password/i).fill('Passw0rd!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/student$/);
    await page.goto('/student/become-instructor');
    await expect(page.getByRole('heading', { level: 1, name: /teach on lumina/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /request instructor access/i })).toBeVisible();
  });

  test('super admin gets platform insights and access management', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('super@lumina.test');
    await page.getByLabel(/password/i).fill('Passw0rd!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/platform');
    await expect(page.getByRole('heading', { level: 1, name: /platform control/i })).toBeVisible();
    await expect(page.getByText(/access management/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /permission model/i })).toBeVisible();
  });

  test('organization admin cannot open the platform owner page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@lumina.test');
    await page.getByLabel(/password/i).fill('Passw0rd!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/platform');
    await expect(page).toHaveURL(/\/admin$/);
  });
});
