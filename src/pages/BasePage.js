// src/pages/BasePage.js
import { expect } from '@playwright/test';

export class BasePage {
  constructor(page) {
    this.page = page;
  }

  async open(path = 'http://localhost:5173/login') {
    await this.page.goto(path);
  }

  async clickElement(locator) {
    await locator.click();
  }

  async getText(locator) {
    return (await locator.textContent())?.trim();
  }
  
  async assertElementIsVisible(locator) {
    await expect(locator).toBeVisible();
  }
  
  async assertElementIsNotVisible(locator) {
    await expect(locator).not.toBeVisible();
  }

  async assertFieldIsFocused(locator) {
    await expect(locator).toBeFocused();
  }

  async assertPageIsOpened({ url, element }) {
    if (url) {
      await expect(this.page).toHaveURL(url);
    }

    if (element) {
      await this.assertElementIsVisible(element);
    }
  }

  async assertFieldValue(locator, value) {
    await expect(locator.locator('..').locator('p')).toHaveText(value);
  }
}