const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');

describe('SMOKE: Users API Tests', function () {
  let adminEmail;
  let adminPassword;
  let adminToken;
  let adminId;
  let employeeEmail;
  let employeePassword;
  let employeeToken;
  let employeeId;

  // Faker values
  let randomFirstName;
  let randomLastName;
  let randomMiddleName;
  let randomBirthDate;
  let randomPhone;

  before(async function () {
    this.timeout(30000);

    // Recreate schema for clean state
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });

    // Emails and passwords
    adminEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    adminPassword = faker.internet.password({ length: 12 });
    employeeEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    employeePassword = faker.internet.password({ length: 12 });

    // Common faker data for names, birthdate, phone
    randomFirstName = faker.person.firstName({ length: { min: 2, max: 40 } });
    randomLastName = faker.person.lastName({ length: { min: 2, max: 40 } });
    randomMiddleName = faker.person.middleName({ length: { min: 2, max: 40 } });
    randomBirthDate = faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0];
    randomPhone = faker.phone.number('+##########');

    // Create admin
    await request(app)
      .post('/register')
      .send({
        email: adminEmail,
        password: adminPassword,
        firstName: randomFirstName,
        lastName: randomLastName,
        middleName: randomMiddleName,
        birthDate: randomBirthDate,
        phone: randomPhone,
        programmingLanguage: 'N/A',
        role: 'admin',
        secretWord: process.env.SECRET_WORD
      });

    const adminUser = await db.User.findOne({ where: { email: adminEmail } });
    adminId = adminUser.id;
    
    const adminRes = await request(app)
      .post('/login')
      .send({
        email: adminEmail,
        password: adminPassword
      });

    adminToken = adminRes.body.token;

    // Create employee
    await request(app)
      .post('/register')
      .send({
        email: employeeEmail,
        password: employeePassword,
        firstName: randomFirstName,
        lastName: randomLastName,
        middleName: randomMiddleName,
        birthDate: randomBirthDate,
        phone: randomPhone,
        programmingLanguage: 'JavaScript',
        country: 'USA',
        englishLevel: 'Intermediate',
        registrationDate: '2021-01-01'
      });

    const employeeRes = await request(app)
      .post('/login')
      .send({
        email: employeeEmail,
        password: employeePassword
      });
      
    employeeToken = employeeRes.body.token;

    const empUser = await db.User.findOne({ where: { email: employeeEmail } });
    employeeId = empUser.id;
  });
  /* ============================
     GET /users
  ============================ */
  it('Verify all users are returned for admin', async () => {
    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users');
    expect(res.body.users).to.be.an('array').that.is.not.empty;
  });
  /* ============================
     GET /profile
  ============================ */
  it('Verify employee can get own profile', async () => {
    const res = await request(app)
      .get('/profile')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('email', employeeEmail);
    expect(res.body).to.have.property('role', 'employee');
  });
  /* ============================
     POST /users
  ============================ */
  it('Verify admin can create an employee', async () => {
    const newEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    const res = await request(app)
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        email: newEmail,
        password: faker.internet.password({ length: 12 }),
        firstName: randomFirstName,
        lastName: randomLastName,
        middleName: randomMiddleName,
        birthDate: randomBirthDate,
        phone: randomPhone,
        programmingLanguage: 'JavaScript'
      });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('user');
    expect(res.body.user).to.have.property('email', newEmail);
    expect(res.body).to.have.property('message', 'Сотрудник успешно создан');
  });
  /* ============================
     GET /users/:id
  ============================ */
  it('Verify admin can get user by ID', async () => {
    const res = await request(app)
      .get(`/users/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('id', employeeId);
  });
  /* ============================
     DELETE /users/:id
  ============================ */
  it('Verify admin can delete employee', async () => {
    const res = await request(app)
      .delete(`/users/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Сотрудник успешно удален');
  });
});
