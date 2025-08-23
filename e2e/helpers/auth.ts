import { Page, BrowserContext } from '@playwright/test'

export async function setupAuth(page: Page, context: BrowserContext) {
  // Set mock auth cookie
  await context.addCookies([{
    name: 'sb-auth-token',
    value: 'mock-auth-token',
    domain: 'localhost',
    path: '/'
  }])

  // Mock user session
  await page.route('**/auth/v1/user**', async route => {
    await route.fulfill({
      status: 200,
      json: {
        id: 'mock-user-id',
        email: 'test@example.com',
        user_metadata: {
          name: 'Test User'
        },
        app_metadata: {
          provider: 'email',
          providers: ['email']
        },
        aud: 'authenticated',
        role: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    })
  })

  // Mock session
  await page.route('**/auth/v1/session**', async route => {
    await route.fulfill({
      status: 200,
      json: {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User'
          }
        }
      }
    })
  })
}

export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.locator('button[type="submit"]').click()
}

export async function logoutUser(page: Page) {
  await page.locator('button', { hasText: /logout|sign out/i }).click()
}
