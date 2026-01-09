// src/pages/MyProfilePage.js
import { BasePage } from './BasePage';
import { expect } from '@playwright/test';

export class MyProfilePage extends BasePage {
  constructor(page) {
    super(page);
    this.myProfileHeading = this.page.getByRole('heading', { name: 'My Profile' });
    this.userNameHeading = (name) => this.page.getByRole('heading', { name });
    this.adminText = this.page.getByText('Administrator');
    this.editProfileButton = this.page.getByRole('button', { name: 'Edit Profile' });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    this.birthDateValue = this.page.locator('//h3[text()="Birth Date"]/following-sibling::p');
    this.birthDateField = this.page.getByRole('textbox', { name: 'Birth Date' });
  }

  async clickEditProfileButton() {
    await this.clickElement(this.editProfileButton);
  }

  async clickCancelButton() {
    await this.clickElement(this.cancelButton);
  }

  async getBirthDateText() {
    return await this.getText(this.birthDateValue);
  }

  async fillBirthDateField(value) {
    await this.birthDateField.fill(value);
  }

  async assertMyProfilePageIsOpened() {
    await this.assertPageIsOpened({
      url: 'http://localhost:5173/profile',
      element: this.myProfileHeading,
    });
  }

  async assertUserNameIsVisible(name) {
    const userName = this.userNameHeading(name);
    await this.assertElementIsVisible(userName);
  }

  async assertAdminTextIsVisible() {
    await this.assertElementIsVisible(this.adminText);
  }

  async assertEditProfileButtonIsVisible() {
    await this.assertElementIsVisible(this.editProfileButton);
  }

  async assertBirthDateValue(expected) {
    await this.assertFieldValue(this.birthDateValue, expected);
  }
}