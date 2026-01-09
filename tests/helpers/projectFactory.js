// tests/helpers/projectFactory.js
import { faker } from '@faker-js/faker';
faker.seed(Date.now());

export function createProjectData() {
  return {
    projectName: faker.commerce.productName().slice(0, 100),
    description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000),
    wage: '5000'
  };
}