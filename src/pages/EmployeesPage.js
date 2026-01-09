// src/pages/EmployeesPage.js
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class EmployeesPage extends BasePage {
  constructor(page) {
    super(page);
    this.employeesHeading = this.page.getByRole('heading', { name: 'Employees' });
    this.logoutButton = this.page.getByRole('button', { name: 'Logout' });
    this.addEmployeeButton = this.page.getByRole('button', { name: 'Add Employee' });
    this.salaryAttribute = this.page.getByRole('heading', { name: 'Salary' });
    this.backToEmployeesButton = this.page.getByRole('button', { name: 'Back to Employees' });
    this.editEmployeeButton = this.page.getByRole('button', { name: 'Edit' });
    this.workingHoursLabel = this.page.getByRole('heading', { name: 'Working Hours/Week' });
    this.projectsTab = this.page.getByRole('button', { name: 'Projects' });
    this.saveChangesButton = this.page.getByRole('button', { name: 'Save Changes' });
    this.searchField = this.page.getByRole('textbox', { name: 'Search by name...' });
    this.sortingCombobox = this.page.getByRole('combobox');
    this.projectsHeading = this.page.getByRole('heading', { name: 'Projects' });
    this.myProfileTab = this.page.getByRole('button', { name: 'My Profile' });
  }

  getEmployeeCardByName(name) {
    return this.page.locator(`//div[starts-with(., '${name}')]`);
  }

  async clickLogOutButton() {
    await this.clickElement(this.logoutButton);
  }

  async clickAddEmployeeButton() {
    await this.clickElement(this.addEmployeeButton);
  }

  async clickBackToEmployeesButton() {
    await this.clickElement(this.backToEmployeesButton);
  }

  async clickEditEmployeeButton() {
    await this.clickElement(this.editEmployeeButton);
  }

  async clickViewEmployeeByName(name) {
    const employeeCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await employeeCard.getByRole('button').first().click();
  }

  async clickDeleteEmployeeByName(name) {
    const employeeCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await employeeCard.getByRole('button').nth(1).click();
  }

  async clickProjectsTab() {
    await this.clickElement(this.projectsTab);
  }

  async clickMyProfileTab() {
    await this.clickElement(this.myProfileTab);
  }

  async clickSaveChangesButton() {
    await this.clickElement(this.saveChangesButton);
  }

  async selectCheckboxToAssignEmployee(name) {
    const checkbox = this.page.locator(`//label[contains(text(), '${name}')]/preceding-sibling::input`);
    await this.clickElement(checkbox);
  }

  async assertEmployeesPageIsOpened() {
    await this.assertPageIsOpened({
      url: 'http://localhost:5173/employees',
      element: this.employeesHeading,
    });
  }

  async assertLogoutButtonIsVisible() {
    await this.assertElementIsVisible(this.logoutButton);
  }

  async assertAddEmployeeButtonIsVisible() {
    await this.assertElementIsVisible(this.addEmployeeButton);
  }

  async assertSearchFieldIsVisible() {
    await this.assertElementIsVisible(this.searchField);
  }

  async assertSortingComboboxIsVisible() {
    await this.assertElementIsVisible(this.sortingCombobox);
  }

  async assertSalaryAttributeIsVisible() {
    await this.assertElementIsVisible(this.salaryAttribute);
  }

  async assertWorkingHoursFieldHasCorrectValue(value) {
    await this.assertFieldValue(this.workingHoursLabel, value);
  }

  async assertCreatedEmployeeNameIsVisible(name) {
    const employeeName = this.page.getByRole('heading', { name });
    await this.assertElementIsVisible(employeeName);
  }

  async assertEmployeeIsPresent(name) {
    await expect(this.getEmployeeCardByName(name)).toHaveCount(1);
  }

  async assertEmployeeIsNotPresent(name) {
    await expect(this.getEmployeeCardByName(name)).toHaveCount(0);
  }

  async assertProjectsHeadingIsVisible() {
    await this.assertElementIsVisible(this.projectsHeading);
  }

  async assertAssignedProjectIsPresent(name) {
    const projectName = this.page.locator(`//h3[contains(text(), '${name}')]`);
    await expect(projectName).toHaveCount(1);
  }

  async assertProjectsHeadingIsNotVisible() {
    await this.assertElementIsNotVisible(this.projectsHeading);
  }

  async assertAssignedProjectIsNotPresent(name) {
    const projectName = this.page.locator(`//h3[contains(text(), '${name}')]`);
    await expect(projectName).toHaveCount(0);
  }
}