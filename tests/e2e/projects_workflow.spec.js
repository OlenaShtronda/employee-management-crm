// tests/e2e/projects_workflow.spec.js
import { test, expect } from '../../fixtures/pages';
import { createProjectData } from '../helpers/projectFactory';
import { createEmployeeData } from '../helpers/employeeFactory';
import { faker } from '@faker-js/faker';

test.describe('Project Creation Workflow', () => {
  test.beforeEach(async ({ loginPage, employeesPage, projectsPage }) => {
    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickProjectsTab();
    await projectsPage.assertProjectsPageIsOpened();
  });

  test('Verify "Projects" page basic UI elements are visible @smoke', async ({ projectsPage }) => {
    await projectsPage.assertLogoutButtonIsVisible();
    await projectsPage.assertCreateProjectButtonIsVisible();
    await projectsPage.assertSearchFieldIsVisible();
  });

  test('Verify admin can create a project with valid data @smoke', async ({ page, projectsPage }) => {
    const project = createProjectData();

    await projectsPage.clickCreateProjectButton();
    await projectsPage.fillRequiredFields(project);
    await projectsPage.clickCreateButton();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.assertCreatedProjectNameIsVisible(project.projectName);

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await projectsPage.clickDeleteProjectByName(project.projectName);
    await projectsPage.assertProjectIsNotPresent(project.projectName);
  });

  test('Verify project is not created with empty required fields', async ({ projectsPage }) => {
    await projectsPage.clickCreateProjectButton();
    await projectsPage.clickCreateButton();
    await projectsPage.assertCreateButtonIsVisible();
  });
});

test.describe('Project Management Workflow', () => {
  let project;
  let currentProjectName;

  test.beforeEach(async ({ loginPage, employeesPage, projectsPage }) => {
    project = createProjectData();
    currentProjectName = project.projectName;

    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickProjectsTab();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.clickCreateProjectButton();
    await projectsPage.fillRequiredFields(project);
    await projectsPage.clickCreateButton();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.assertCreatedProjectNameIsVisible(project.projectName);
  });

  test('Verify admin can open and view project card', async ({ projectsPage }) => {
    await projectsPage.clickViewProjectByName(project.projectName);
    await projectsPage.assertCreatedProjectNameIsVisible(project.projectName);
    await projectsPage.assertCloseProjectCardButtonIsVisible();
    await projectsPage.clickCloseProjectCardButton();
  });

  test('Verify project wage is not updated with invalid value', async ({ projectsPage }) => {
    const invalidWage = '-100';

    await projectsPage.clickEditProjectByName(project.projectName);
    await projectsPage.fillWageField(invalidWage);
    await projectsPage.clickSaveChangesButton();
    await projectsPage.assertSaveChangesButtonIsVisible();
    await projectsPage.clickCancelButton();
  });

  test('Verify admin can update project name with valid data', async ({ projectsPage }) => {
    const newProjectName = faker.commerce.productName().slice(0, 100);

    await projectsPage.clickEditProjectByName(currentProjectName);
    await projectsPage.fillProjectNameField(newProjectName);
    await projectsPage.clickSaveChangesButton();

    currentProjectName = newProjectName;

    await projectsPage.assertProjectNameIsVisible(currentProjectName);
  });

  test.afterEach(async ({ page, projectsPage }) => {
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await projectsPage.clickDeleteProjectByName(currentProjectName);
    await projectsPage.assertProjectIsNotPresent(currentProjectName);
  });
});

test.describe('Project Assignment Workflow', () => {
  let employee;
  let project;

  test.beforeEach(async ({ loginPage, employeesPage, employeeFormPage, projectsPage }) => {
    employee = createEmployeeData();
    project = createProjectData();

    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickAddEmployeeButton();
    await employeeFormPage.assertEmployeeFormPageIsOpened();
    await employeeFormPage.fillRequiredFields(employee);
    await employeeFormPage.clickCreateEmployeeButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickProjectsTab();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.clickCreateProjectButton();
    await projectsPage.fillRequiredFields(project);
    await projectsPage.clickCreateButton();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.assertCreatedProjectNameIsVisible(project.projectName);
  });

  test('Verify admin can assign a project to an employee', async ({ employeesPage, projectsPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;

    await projectsPage.clickEmployeesTab();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.clickEditEmployeeButton();
    await employeesPage.selectCheckboxToAssignEmployee(project.projectName);
    await employeesPage.clickSaveChangesButton();
    await employeesPage.assertProjectsHeadingIsVisible();
    await employeesPage.assertAssignedProjectIsPresent(project.projectName);
    await employeesPage.clickBackToEmployeesButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test('Verify admin can remove an employee from a project', async ({ employeesPage, projectsPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;

    await projectsPage.clickEmployeesTab();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.clickEditEmployeeButton();
    await employeesPage.selectCheckboxToAssignEmployee(project.projectName);
    await employeesPage.clickSaveChangesButton();
    await employeesPage.assertProjectsHeadingIsVisible();
    await employeesPage.assertAssignedProjectIsPresent(project.projectName);
    await employeesPage.clickEditEmployeeButton();
    await employeesPage.selectCheckboxToAssignEmployee(project.projectName);
    await employeesPage.clickSaveChangesButton();
    await employeesPage.assertProjectsHeadingIsNotVisible();
    await employeesPage.assertAssignedProjectIsNotPresent(project.projectName);
    await employeesPage.clickBackToEmployeesButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test.afterEach(async ({ page, projectsPage, employeesPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await employeesPage.clickDeleteEmployeeByName(fullName);
    await employeesPage.assertEmployeeIsNotPresent(fullName);

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await employeesPage.clickProjectsTab();
    await projectsPage.assertProjectsPageIsOpened();
    await projectsPage.clickDeleteProjectByName(project.projectName);
    await employeesPage.clickProjectsTab();
    await projectsPage.assertProjectIsNotPresent(project.projectName);
  });
});