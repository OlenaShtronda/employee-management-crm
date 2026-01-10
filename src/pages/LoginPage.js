// src/pages/LoginPage.js
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.emailField = this.page.getByRole('textbox', { name: 'Email' });
    this.passwordField = this.page.getByRole('textbox', { name: 'Password' });
    this.signInButton = this.page.getByRole('button', { name: 'Sign in' });
    this.createAccountLink = this.page.getByRole('link', { name: 'Create an account' });
    this.signInHeading = this.page.getByRole('heading', { name: 'Sign in to Employee Management' });
  }

  async fillLoginForm(email, password) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
  }

  async clickSignInButton() {
    await this.clickElement(this.signInButton);
  }

  async clickCreateAccountLink() {
    await this.clickElement(this.createAccountLink);
  }

  async assertLoginPageIsOpened() {
    await this.assertPageIsOpened({
      url: '/login',
      element: this.signInHeading,
    });
  }

  async assertEmailFieldIsFocused() {
    await this.assertFieldIsFocused(this.emailField);
  }

  async assertEmailFieldIsVisible() {
    await this.assertElementIsVisible(this.emailField);
  }

  async assertPasswordFieldIsVisible() {
    await this.assertElementIsVisible(this.passwordField);
  }

  async assertSignInButtonIsVisible() {
    await this.assertElementIsVisible(this.signInButton);
  }

  async assertCreateAccountLinkIsVisible() {
    await this.assertElementIsVisible(this.createAccountLink);
  }
}