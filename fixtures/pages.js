// fixtures/pages.js
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import { RegistrationPage } from '../src/pages/RegistrationPage';
import { EmployeesPage } from '../src/pages/EmployeesPage';
import { EmployeeFormPage } from '../src/pages/EmployeeFormPage';
import { ProjectsPage } from '../src/pages/ProjectsPage';
import { MyProfilePage } from '../src/pages/MyProfilePage';

export const test = base.extend({

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registrationPage: async ({ page }, use) => {
    await use(new RegistrationPage(page));
  },

  employeesPage: async ({ page }, use) => {
    await use(new EmployeesPage(page));
  },

  employeeFormPage: async ({ page }, use) => {
    await use(new EmployeeFormPage(page));
  },
  
  projectsPage: async ({ page }, use) => {
    await use(new ProjectsPage(page));
  },
  
  myProfilePage: async ({ page }, use) => {
    await use(new MyProfilePage(page));
  },

});

export { expect };
