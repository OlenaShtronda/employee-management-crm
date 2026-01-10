// src/pages/EmployeeFormPage.js
import { BasePage } from './BasePage';

export class EmployeeFormPage extends BasePage {
  constructor(page) {
    super(page);
    this.firstNameField = page.getByRole('textbox', { name: 'First Name *' });
    this.lastNameField = page.getByRole('textbox', { name: 'Last Name *' });
    this.middleNameField = page.getByRole('textbox', { name: 'Middle Name *' });
    this.emailField = page.getByRole('textbox', { name: 'Email *' });
    this.passwordField = page.getByRole('textbox', { name: 'Password *' });
    this.phoneField = page.getByRole('textbox', { name: 'Phone *' });
    this.birthDateField = page.getByRole('textbox', { name: 'Birth Date *' });
    this.programmingLanguageField = page.getByRole('textbox', { name: 'Programming Language *' });
    this.countryField = page.getByRole('textbox', { name: 'Country *' });
    this.bankCardField = page.getByRole('textbox', { name: 'Bank Card *' });
    this.roleField = page.getByLabel('Role *');
    this.workingHoursField = page.getByRole('spinbutton', { name: 'Working Hours/Week' });
    this.createEmployeeButton = page.getByRole('button', { name: 'Create Employee' });
    this.linkedInField = page.getByRole('textbox', { name: 'LinkedIn Link' });
    this.gitHubField = page.getByRole('textbox', { name: 'GitHub Link' });
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
    this.createNewEmployeeHeading = page.getByRole('heading', { name: 'Create New Employee' });
  }

    async fillRequiredFields(employee) {
      await this.firstNameField.fill(employee.firstName);
      await this.lastNameField.fill(employee.lastName);
      await this.middleNameField.fill(employee.middleName);
      await this.emailField.fill(employee.email);
      await this.passwordField.fill(employee.password);
      await this.phoneField.fill(employee.phone);
      await this.birthDateField.fill(employee.birthDate);
      await this.programmingLanguageField.fill(employee.programmingLanguage);
      await this.countryField.fill(employee.country);
      await this.bankCardField.fill(employee.bankCard);
      await this.roleField.selectOption(employee.role);
      await this.workingHoursField.fill(employee.workingHours);
      await this.linkedInField.fill(employee.linkedIn);
      await this.gitHubField.fill(employee.gutHub);
    }

    async clickCreateEmployeeButton() {
      await this.clickElement(this.createEmployeeButton);
    }

    async clickSaveChangesButton() {
      await this.clickElement(this.saveChangesButton);
    }

    async fillWorkingHoursField(hours) {
      await this.workingHoursField.fill(hours);
    }

    async assertEmployeeFormPageIsOpened() {
      await this.assertPageIsOpened({
        url: '/employees/new',
        element: this.createNewEmployeeHeading,
      });
    }

    async assertCreateEmployeeButtonIsVisible() {
      await this.assertElementIsVisible(this.createEmployeeButton);
    }

    async assertSaveChangesButtonIsVisible() {
      await this.assertElementIsVisible(this.saveChangesButton);
    }
}
