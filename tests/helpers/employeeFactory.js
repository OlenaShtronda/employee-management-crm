// tests/helpers/employeeFactory.js
import { faker } from '@faker-js/faker';
faker.seed(Date.now());

export function createEmployeeData() {
  return {
    firstName: faker.person.firstName({ length: { min: 2, max: 40 } }),
    lastName: faker.person.lastName({ length: { min: 2, max: 40 } }),
    middleName: faker.person.middleName({ length: { min: 2, max: 40 } }),
    email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
    password: faker.internet.password({ length: 12 }),
    phone: faker.phone.number('+##########'),
    birthDate: faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0],
    programmingLanguage: 'JavaScript',
    country: 'Ukraine',
    bankCard: '1234-5678-9012-3456',
    role: 'Employee',
    workingHours: '40',
    gutHub: 'https://github.com/username',
    linkedIn: 'https://linkedin.com/in/username'
  };
}
