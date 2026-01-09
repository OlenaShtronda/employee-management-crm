// tests/e2e/employee_crud.spec.js
import { test, expect } from '../../fixtures/pages';
import { createEmployeeData } from '../helpers/employeeFactory';

test.describe('Employee Creation Workflow', () => {
  test.beforeEach(async ({ loginPage, employeesPage }) => {
    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test('Verify "Employees" page basic UI elements are visible @smoke', async ({ employeesPage }) => {
    await employeesPage.assertLogoutButtonIsVisible();
    await employeesPage.assertAddEmployeeButtonIsVisible();
    await employeesPage.assertSearchFieldIsVisible();
    await employeesPage.assertSortingComboboxIsVisible();
  });

  test('Verify admin can create an employee with valid data @smoke', async ({ page, employeesPage, employeeFormPage }) => {
    const employee = createEmployeeData();

    await employeesPage.clickAddEmployeeButton();
    await employeeFormPage.assertEmployeeFormPageIsOpened();
    await employeeFormPage.fillRequiredFields(employee);
    await employeeFormPage.clickCreateEmployeeButton();
    await employeesPage.assertEmployeesPageIsOpened();

    const fullName = `${employee.firstName} ${employee.lastName}`;

    await employeesPage.assertCreatedEmployeeNameIsVisible(fullName);

    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await employeesPage.clickDeleteEmployeeByName(fullName);
    await employeesPage.assertEmployeeIsNotPresent(fullName);
  });

  test('Verify employee is not created with empty required fields', async ({ employeesPage, employeeFormPage }) => {
    await employeesPage.clickAddEmployeeButton();
    await employeeFormPage.assertEmployeeFormPageIsOpened();
    await employeeFormPage.clickCreateEmployeeButton();
    await employeeFormPage.assertCreateEmployeeButtonIsVisible();
  });
});

test.describe('Employee Management Workflow', () => {
  let employee;

  test.beforeEach(async ({ loginPage, employeesPage, employeeFormPage }) => {
    employee = createEmployeeData();

    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickAddEmployeeButton();
    await employeeFormPage.assertEmployeeFormPageIsOpened();
    await employeeFormPage.fillRequiredFields(employee);
    await employeeFormPage.clickCreateEmployeeButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test('Verify admin can open and view employee card with admin-only fields visible', async ({ employeesPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;

    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.assertSalaryAttributeIsVisible();
    await employeesPage.clickBackToEmployeesButton();
  });

  test('Verify admin can update employee working hours', async ({ employeesPage, employeeFormPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const newWorkingHoursValue = '50';

    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.clickEditEmployeeButton();
    await employeeFormPage.fillWorkingHoursField(newWorkingHoursValue);
    await employeeFormPage.clickSaveChangesButton();
    await employeesPage.clickBackToEmployeesButton();
    await employeesPage.assertEmployeesPageIsOpened();
    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.assertWorkingHoursFieldHasCorrectValue(newWorkingHoursValue);
    await employeesPage.clickBackToEmployeesButton();
  });

  test('Verify employee working hours are not updated with invalid value', async ({ employeesPage, employeeFormPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    const invalidWorkingHours = '200';

    await employeesPage.clickViewEmployeeByName(fullName);
    await employeesPage.clickEditEmployeeButton();
    await employeeFormPage.fillWorkingHoursField(invalidWorkingHours);
    await employeeFormPage.clickSaveChangesButton();
    await employeeFormPage.assertSaveChangesButtonIsVisible();
    await employeesPage.clickBackToEmployeesButton();
  });

  test.afterEach(async ({ page, employeesPage }) => {
    const fullName = `${employee.firstName} ${employee.lastName}`;
    
    page.once('dialog', async (dialog) => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    await employeesPage.clickDeleteEmployeeByName(fullName);
    await employeesPage.assertEmployeeIsNotPresent(fullName);
  });
});
