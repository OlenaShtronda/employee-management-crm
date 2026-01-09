// tests/e2e/login_logout.spec.js
import { test } from '../../fixtures/pages';

test.describe('Login and Logout Tests', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.assertLoginPageIsOpened();
  });

  test('Verify login page UI elements are visible @smoke', async ({ loginPage }) => {
    await loginPage.assertEmailFieldIsVisible();
    await loginPage.assertPasswordFieldIsVisible();
    await loginPage.assertSignInButtonIsVisible();
    await loginPage.assertCreateAccountLinkIsVisible();
  });

  test('Verify user can navigate between login and registration pages @smoke', async ({ loginPage, registrationPage }) => {
    await loginPage.clickCreateAccountLink();
    await registrationPage.assertRegistrationPageIsOpened();
    await registrationPage.clickSignInLink();
    await loginPage.assertLoginPageIsOpened();
  });

  test('Verify admin can log in vith valid credentials @smoke', async ({ loginPage, employeesPage }) => {
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test('Verify admin can log out @smoke', async ({ loginPage, employeesPage }) => {
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertLogoutButtonIsVisible();
    await employeesPage.clickLogOutButton();
    await loginPage.assertLoginPageIsOpened();
  });

  test('Verify login is rejected with empty required fields', async ({ loginPage, employeesPage }) => {
    await loginPage.clickSignInButton();
    await loginPage.assertLoginPageIsOpened();
    await loginPage.assertEmailFieldIsFocused();
  })

  test('Verify login is rejected with invalid password', async ({ loginPage, employeesPage }) => {
    await loginPage.fillLoginForm('admin1@example.com', 'invalidpassword');
    await loginPage.clickSignInButton();
    await loginPage.assertLoginPageIsOpened();
  })

  const invalidEmails = ['@example.com', 'admin@', 'adminexample.com', 'admin@.com'];

  for (const email of invalidEmails) {
    test(`Verify login is rejected for invalid email: "${email}"`, async ({ loginPage, employeesPage }) => {
      await loginPage.fillLoginForm(email, 'adminpassword');
      await loginPage.clickSignInButton();
      await loginPage.assertLoginPageIsOpened();
    });
  }
});
