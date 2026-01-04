// tests/authentication.smoke.test.js
const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');

describe('SMOKE: Authentication API Tests', () => {
  let adminEmail;
  let adminPassword;

  before(async () => {
    // Drop and recreate schema to ensure clean state
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });

    adminEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    adminPassword = faker.internet.password({ length: 12 });
  });

  it('Verify application is accessible', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.be.oneOf([200, 404]); // app is up
  });

  it('Verify user can register successfully', async () => {
    const res = await request(app)
      .post('/register')
      .send({
        email: adminEmail,
        password: adminPassword,
        firstName: faker.person.firstName({ length: { min: 2, max: 40 } }),
        lastName: faker.person.lastName({ length: { min: 2, max: 40 } }),
        middleName: faker.person.middleName({ length: { min: 2, max: 40 } }),
        birthDate: faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0],
        phone: faker.phone.number('+##########'),
        programmingLanguage: 'N/A',
        role: 'admin',
        secretWord: process.env.SECRET_WORD
      });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('message', 'Пользователь успешно зарегистрирован');
    expect(res.body).to.have.property('userId');
  });

  it('Verify employee can log in and receive token', async () => {
    const res = await request(app)
      .post('/login')
      .send({
        email: adminEmail,
        password: adminPassword
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('token');
  });
});
