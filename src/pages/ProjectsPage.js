// src/pages/ProjectsPage.js
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProjectsPage extends BasePage {
  constructor(page) {
    super(page);
    this.projectsHeading = this.page.getByRole('heading', { name: 'Projects' });
    this.createProjectButton = this.page.getByRole('button', { name: 'Create Project' });
    this.projectNameField = page.getByRole('textbox', { name: 'Project Name *' });
    this.descriptionField = page.getByRole('textbox', { name: 'Description *' });
    this.wageField = page.getByRole('spinbutton', { name: 'Wage' });
    this.createButton = page.getByRole('button', { name: 'Create' });
    this.closeButton = page.getByRole('button', { name: 'Close' }).first();
    this.saveChangesButton = page.getByRole('button', { name: 'Save Changes' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.employeesTab = page.getByRole('button', { name: 'Employees' });
    this.logoutButton = this.page.getByRole('button', { name: 'Logout' });
    this.searchField = this.page.getByRole('textbox', { name: 'Search projects by name...' });
  }

  getProjectCardByName(name) {
    return this.page.locator(`//div[starts-with(., '${name}')]`);
  }

  async fillRequiredFields(project) {
    await this.projectNameField.fill(project.projectName);
    await this.descriptionField.fill(project.description);
    await this.wageField.fill(project.wage);
  }

  async fillProjectNameField(name) {
    await this.projectNameField.fill(name);
  }

  async fillWageField(name) {
    await this.wageField.fill(name);
  }

  async clickCreateButton() {
    await this.clickElement(this.createButton);
  }

  async clickEditProjectByName(name) {
    const projectCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await projectCard.getByRole('button').nth(1).click();
  }

  async clickDeleteProjectByName(name) {
    const projectCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await projectCard.getByRole('button').nth(2).click();
  }

  async assertWageFieldHasCorrectValue(name, wage) {
    const projectCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await expect(projectCard).getByText('Wage: $').toContain(wage);
  }

  async clickCreateProjectButton() {
    await this.clickElement(this.createProjectButton);
  }

  async clickCloseProjectCardButton() {
    await this.clickElement(this.closeButton);
  }

  async clickSaveChangesButton() {
    await this.clickElement(this.saveChangesButton);
  }

  async clickCancelButton() {
    await this.clickElement(this.cancelButton);
  }

  async clickViewProjectByName(name) {
    const projectCard = this.page.locator(`//div[starts-with(., '${name}')]`);
    await projectCard.getByRole('button').first().click();
  }

  async clickEmployeesTab() {
    await this.clickElement(this.employeesTab);
  }

  async assertCreatedProjectNameIsVisible(name) {
    const projectName = this.page.getByRole('heading', { name });
    await this.assertElementIsVisible(projectName);
  }

  async assertProjectsPageIsOpened() {
    await this.assertPageIsOpened({
      url: '/projects',
      element: this.projectsHeading,
    });
  }

  async assertProjectIsNotPresent(name) {
    await expect(this.getProjectCardByName(name)).toHaveCount(0);
  }

  async assertCreateButtonIsVisible() {
    await this.assertElementIsVisible(this.createButton);
  }

  async assertCloseProjectCardButtonIsVisible() {
    await this.assertElementIsVisible(this.closeButton);
  }

  async assertProjectNameIsVisible(name) {
    const projectHeading = this.page.getByRole('heading', { name });
    await this.assertElementIsVisible(projectHeading);
  }

  async assertSaveChangesButtonIsVisible() {
    await this.assertElementIsVisible(this.saveChangesButton);
  }

  async assertLogoutButtonIsVisible() {
    await this.assertElementIsVisible(this.logoutButton);
  }

  async assertCreateProjectButtonIsVisible() {
    await this.assertElementIsVisible(this.createProjectButton);
  }

  async assertSearchFieldIsVisible() {
    await this.assertElementIsVisible(this.createProjectButton);
  }
}