// tests/e2e/my_profile.js
import { test } from '../../fixtures/pages';
import { faker } from '@faker-js/faker';

test.describe('My Profile Tests', () => {
  test.beforeEach(async ({ loginPage, employeesPage }) => {
    await loginPage.open();
    await loginPage.fillLoginForm('admin1@example.com', 'adminpassword');
    await loginPage.clickSignInButton();
    await employeesPage.assertEmployeesPageIsOpened();
  });

  test('Verify admin profile displays full name and role', async ({ employeesPage, myProfilePage }) => {
    await employeesPage.clickMyProfileTab();
    await myProfilePage.assertMyProfilePageIsOpened();
    await myProfilePage.assertUserNameIsVisible('Default Admin');
    await myProfilePage.assertAdminTextIsVisible();
  });

  test('Verify birth date changes are discarded after canceling profile edit', async ({ employeesPage, myProfilePage }) => {
    await employeesPage.clickMyProfileTab();
    await myProfilePage.assertMyProfilePageIsOpened();
    await myProfilePage.assertEditProfileButtonIsVisible();

    const originalBirthDate = await myProfilePage.getBirthDateText();

    await myProfilePage.clickEditProfileButton();

    const newBirthDate = faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0];

    await myProfilePage.fillBirthDateField(newBirthDate);
    await myProfilePage.clickCancelButton();
    
    await myProfilePage.assertBirthDateValue(originalBirthDate);
  });
});
