import { test, expect } from '@playwright/test'

test('SHOW OUR BRAND NAME OR YOULL BE FIRED', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle(/Joicè/)
})
