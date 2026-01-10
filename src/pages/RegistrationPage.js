// src/pages/RegistrationPage.js
import { BasePage } from './BasePage';

export class RegistrationPage extends BasePage {
  constructor(page) {
    super(page);
    this.signInLink = this.page.getByRole('link', { name: 'Sign in' });
    this.createYourAccountHeading = this.page.getByRole('heading', { name: 'Create your account' });
  }

  async clickSignInLink() {
    await this.clickElement(this.signInLink);
  }

  async assertRegistrationPageIsOpened() {
    await this.assertPageIsOpened({
      url: '/register',
      element: this.createYourAccountHeading,
    });
  }
}