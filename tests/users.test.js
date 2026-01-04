// tests/users.test.js
const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');

describe('Users API Tests', function() {
  let adminEmail;
  let adminPassword;
  let adminToken;
  let adminId;
  let employeeEmail;
  let employee2Email;
  let employeePassword;
  let employeeToken;
  let employeeId;
  let employee2Id;

  // Faker values
  let randomFirstName;
  let randomLastName;
  let randomMiddleName;
  let randomBirthDate;
  let randomPhone;

  const employees = [];

  before(async function() {
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
    
    // Login admin
    const adminRes = await request(app)
      .post('/login')
      .send({
        email: adminEmail,
        password: adminPassword
      });

    adminToken = adminRes.body.token;


    // Create 25 employees
    this.timeout(30000);
    for (let i = 0; i < 25; i++) {
      const firstName = faker.person.firstName({ length: { min: 2, max: 40 } });
      const lastName = faker.person.lastName({ length: { min: 2, max: 40 } });
      const middleName = faker.person.middleName({ length: { min: 2, max: 40 } });
      const email = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
      const password = faker.internet.password({ length: 12 });
      const birthDate = faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0];
      const phone = faker.phone.number('+##########');
      const programmingLanguages = ['JavaScript','Python','Java','C++','Ruby'];
      const countries = ['USA','UK','Canada','Germany','Ukraine'];
      const mentors = ['Mentor A','Mentor B','Mentor C','Mentor D', 'Mentor E'];
      const englishLevels = ['Elementary', 'Beginner','Intermediate', 'Upper-Intermediate', 'Advanced'];

      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password,
          firstName,
          lastName,
          middleName,
          birthDate,
          phone,
          programmingLanguage: programmingLanguages[i % programmingLanguages.length],
          country: countries[i % countries.length],
          mentorName: mentors[i % mentors.length],
          englishLevel: englishLevels[i % englishLevels.length],
          registrationDate: faker.date.past({ years: 5 }).toISOString().split('T')[0],
          role: 'employee'
        });

      employees.push({ ...res.body.user, password }); // save created employees for tests
    }

    const employeeRes = await request(app)
      .post('/login')
      .send({
        email: employees[0].email,
        password: employees[0].password
      });

    employeeToken = employeeRes.body.token;

    const empUser = await db.User.findOne({ where: { email: employees[0].email } });
    employeeId = empUser.id;

    const emp2User = await db.User.findOne({ where: { email: employees[10].email } });
    employee2Id = emp2User.id;
    employee2Email = emp2User.email;
  });
  /* ============================
     GET /users
  ============================ */
  describe('GET /users', () => {
    describe('Authentication & access control', () => {
      it('Verify all users are returned for admin', async () => {
        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('users');
        expect(res.body.users).to.be.an('array');
        expect(res.body.users.length).to.be.greaterThan(1);
      });

      it('Verify all users are returned for employee', async () => {
        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('users');
        expect(res.body.users).to.be.an('array');
        expect(res.body.users.length).to.be.greaterThan(1);
      });

      it('Verify users are not returned without token', async () => {
        const res = await request(app)
          .get('/users');

        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });

      it('Verify specific error is returned for expired token', async () => {
        // Create an expired token
        const expiredToken = jwt.sign(
          { userId: adminId, role: 'admin' },
          config.jwtSecret,
          { expiresIn: '-1h' } // Already expired
        );

        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(res.status).to.equal(401);
        expect(res.body.error).to.include('истек');
      });
      
      it('Verify error is returned for malformed token', async () => {
        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer invalid.token.here`);

        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Недействительный токен');
      });
    });

    describe('Role-based data visibility', () => {
      it('Verify salary field is visible for admin role', async () => {
        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);

        const user = res.body.users[0];
        expect(user).to.have.property('salary');
      });

      it('Verify salary field is hidden for employee role', async () => {
        const res = await request(app)
          .get('/users')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);

        const user = res.body.users[0];
        expect(user).not.to.have.property('salary');
      });
    });

    describe('Pagination', () => {
      it('Verify paginated list of users is returned', async () => {
        const res = await request(app)
          .get('/users?page=1&limit=2')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.users).to.be.an('array').that.has.lengthOf(2);
        expect(res.body).to.have.property('total');
        expect(res.body).to.have.property('page', 1);
        expect(res.body).to.have.property('totalPages');
      });

      it('Verify empty array is returned when page exceeds total pages', async () => {
        const res = await request(app)
          .get('/users?page=100&limit=10')
          .set('Authorization', `Bearer ${employeeToken}`);
        
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.users).to.be.an('array').that.is.empty;
      });

      it('Verify all users are returned when limit exceeds total users', async () => {
        const res = await request(app)
          .get('/users?limit=100')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.users).to.be.an('array');
        expect(res.body.users.length).to.equal(res.body.total);
      });
    });

    describe('Pagination validation', () => {
      it('Verify validation error is returned for non-integer page', async () => {
        const res = await request(app)
          .get('/users?page=abc')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        
        const pageError = res.body.errors.find(err => err.msg === 'Параметр "page" должен быть положительным целым числом');
        expect(pageError).to.exist;
        expect(pageError.param).to.equal('page');
      });

      it('Verify validation error is returned for non-integer limit', async () => {
        const res = await request(app)
          .get('/users?limit=abc')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');

        const limitError = res.body.errors.find(err => err.msg === 'Параметр "limit" должен быть положительным целым числом');
        expect(limitError).to.exist;
        expect(limitError.param).to.equal('limit');
      });

      it('Verify validation error is returned for negative or zero page number', async () => {
        const invalidPages = [-5, 0];

        for (const page of invalidPages) {
          const res = await request(app)
            .get(`/users?page=${page}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const pageError = res.body.errors.find(err => err.msg === 'Параметр "page" должен быть положительным целым числом');
          expect(pageError).to.exist;
          expect(pageError.param).to.equal('page');
        }
      });

      it('Verify validation error is returned for negative or zero limit number', async () => {
        const invalidLimits = [-5, 0];

        for (const limit of invalidLimits) {
          const res = await request(app)
            .get(`/users?limit=${limit}`)
            .set('Authorization', `Bearer ${adminToken}`);
    
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const limitError = res.body.errors.find(err => err.msg === 'Параметр "limit" должен быть положительным целым числом');
          expect(limitError).to.exist;
          expect(limitError.param).to.equal('limit');
        }
      });
    });

    describe('Search & filtering', () => {
      it('Verify users can be searched by first name', async () => {
        const employee = employees[3];
        const employeeFirstName = employee.firstName;

        const res = await request(app)
          .get(`/users?firstName=${employeeFirstName}`)
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.users).to.be.an('array');
        expect(res.body.users[0]).to.have.property('firstName', employeeFirstName);
      });

      it('Verify users can be searched by last name', async () => {
        const employee = employees[4];
        const employeeLastName = employee.lastName;

        const res = await request(app)
          .get(`/users?lastName=${employeeLastName}`)
          .set('Authorization', `Bearer ${employeeToken}`);
        
        expect(res.status).to.equal(200);
        expect(res.body.users).to.be.an('array');
        expect(res.body.users[0]).to.have.property('lastName', employeeLastName);
      });

      it('Verify case-insensitive search works for firstName', async () => {
        const employee = employees[1];
        const firstNameLower = employee.firstName.toLowerCase();

        const res = await request(app)
          .get(`/users?firstName=${firstNameLower}`)
          .set('Authorization', `Bearer ${employeeToken}`);
        
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('users');
        expect(res.body.users).to.be.an('array').with.lengthOf(1);
        expect(res.body.users[0]).to.have.property('firstName', employee.firstName);
        expect(res.body.users[0].firstName.toLowerCase()).to.equal(firstNameLower);
      });

      it('Verify case-insensitive search works for lastNamee', async () => {
        const employee = employees[2];
        const lastNameLower = employee.lastName.toLowerCase();

        const res = await request(app)
          .get(`/users?lastName=${lastNameLower}`)
          .set('Authorization', `Bearer ${employeeToken}`);
        
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('users');
        expect(res.body.users).to.be.an('array').with.lengthOf(1);
        expect(res.body.users[0]).to.have.property('lastName', employee.lastName);
        expect(res.body.users[0].lastName.toLowerCase()).to.equal(lastNameLower);
      });

      it('Verify empty array is returned for non-existent firstName', async () => {
        const res = await request(app)
          .get('/users?firstName=NonExistent')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.users).to.be.an('array').that.is.empty;
      });

      it('Verify empty array is returned for non-existent lastName', async () => {
        const res = await request(app)
          .get('/users?lastName=NonExistent')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.users).to.be.an('array').that.is.empty;
      });
      
      it('Verify users can be filtered by multiple criteria', async () => {
        const employee = employees[5];
        const firstNameCriteria = employee.firstName;
        const mentorNameCriteria = employee.mentorName;

        const res = await request(app)
          .get(`/users?firstName=${firstNameCriteria}&mentorName=${mentorNameCriteria}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.body.users[0]).to.have.property('firstName', firstNameCriteria);
        expect(res.body.users[0]).to.have.property('mentorName', mentorNameCriteria);
      });
    });

    describe('Sorting', () => {
      const sortFields = [
        'registrationDate',
        'programmingLanguage',
        'country',
        'mentorName',
        'englishLevel',
        'position'
      ];

      const orders = ['ASC', 'DESC'];

      sortFields.forEach(field => {
        orders.forEach(order => {
          it(`Verify users are sorted by ${field} in ${order} order`, async () => {
            const res = await request(app)
              .get(`/users?sortBy=${field}&order=${order}`)
              .set('Authorization', `Bearer ${employeeToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.users).to.be.an('array');

            const firstUser = res.body.users[0];
            expect(firstUser).to.have.property(field);

            console.log(`First user's ${field} (${order}):`, firstUser[field]);
          });
        });
      });

      it('Verify validation error is returned for invalid sortBy parameter', async () => {
        const res = await request(app)
          .get('/users?sortBy=invalidField')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors[0]).to.have.property('msg');
      });

      it('Verify validation error is returned for invalid order parameter', async () => {
        const res = await request(app)
          .get('/users?order=INVALID')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors[0]).to.have.property('msg');
      });
    });

    describe('Query validation (combined)', () => {
      it('Verify validation errors are returned for multiple invalid query parameters', async () => {
        const res = await request(app)
          .get('/users?page=-1&limit=0&sortBy=invalidField')
          .set('Authorization', `Bearer ${employeeToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        
        const pageError = res.body.errors.find(err => err.msg === 'Параметр "page" должен быть положительным целым числом');
        expect(pageError).to.exist;
        expect(pageError.param).to.equal('page');

        const limitError = res.body.errors.find(err => err.msg === 'Параметр "limit" должен быть положительным целым числом');
        expect(limitError).to.exist;
        expect(limitError.param).to.equal('limit');
      });
    });
  });
  /* ============================
     GET /profile
  ============================ */
  describe('GET /profile', function() {
    it('Verify current logged-in user profile is returned', async function() {
      const res = await request(app)
        .get('/profile')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.include({
        id: employeeId,
        email: employees[0].email,
        role: 'employee',
      });
      
      expect(res.body).to.not.have.property('password');
    });

    it('Verify current logged-in user profile is not returned without token', async function() {
      const res = await request(app)
        .get('/profile');
      
      expect(res.status).to.equal(401);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error', 'Токен не предоставлен');
      expect(res.body).to.not.have.property('email');
      expect(res.body).to.not.have.property('id');   
    });
  });
  /* ============================
     GET /users/:id
  ============================ */
  describe('GET /users/:id', () => {
    describe('Successful response', () => {
      it('Verify successful response returns correct user data', async () => {
        const res = await request(app)
          .get(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('id', employeeId);
      });

      it('Verify 404 is returned for non-existing user ID', async () => {
        const res = await request(app)
          .get('/users/999999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'User not found');
      });
    });

    describe('Authorization', () => {
      it('Verify 401 is returned if no token is provided', async () => {
        const res = await request(app).get(`/users/${employeeId}`);

        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });

      it('Verify 401 is returned if token is invalid', async () => {
        const res = await request(app)
          .get(`/users/${employeeId}`)
          .set('Authorization', 'Bearer invalidtoken');

        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Недействительный токен');
      });
    });

    describe('ID validation', () => {
      it('Verify validation error is returned for invalid user ID in get endpoint', async () => {
        const res = await request(app)
          .get('/users/xyz')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors[0]).to.have.property('msg', 'User ID must be a positive integer');
        expect(res.body.errors[0].param).to.equal('id');
      });

      it('Verify validation error is returned for negative user ID', async () => {
        const res = await request(app)
          .get('/users/-1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors[0]).to.have.property('msg', 'User ID must be a positive integer');
        expect(res.body.errors[0].param).to.equal('id');
      });
    });
  });
  /* ============================
     POST /users
  ============================ */
  describe('POST /users', () => {
    describe('Successful creation', () => {
      it('Verify employee is created with default role when role is not provided', async () => {
        const newEmail = faker.internet.email().toLowerCase();

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
            programmingLanguage: 'Go'
          });

        expect(res.status).to.equal(201);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Сотрудник успешно создан');
        expect(res.body.user).to.have.property('role', 'employee');
        
        const user = await db.User.findOne({ where: { email: newEmail } });
        expect(user.role).to.equal('employee');
      });
    });

    describe('Permissions', () => {
      it('Verify employee is not allowed to create a user', async () => {
        const res = await request(app)
          .post('/users')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'Go'
          });
        
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Доступ запрещен');
      });
    });

    describe('Validation', () => {
      it('Verify duplicate email with different case is rejected during employee creation', async () => {
        const existingEmployee = employees[5];
        const duplicateEmailDifferentCase = existingEmployee.email.toUpperCase();

        const res = await request(app)
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: duplicateEmailDifferentCase,
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'Go'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Пользователь с таким email уже существует');
      });

      it('Verify user creation is rejected when required fields are missing', async () => {
        const res = await request(app)
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase() });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(5);
        
        const expectedErrors = [
          { msg: 'Пароль должен быть от 6 до 20 символов', param: 'password' },
          { msg: 'Имя должно быть от 2 до 40 символов', param: 'firstName' },
          { msg: 'Имя обязательно', param: 'firstName' },
          { msg: 'Фамилия должна быть от 2 до 40 символов', param: 'lastName' },
          { msg: 'Фамилия обязательна', param: 'lastName' }
        ];

        expectedErrors.forEach(expected => {
          const error = res.body.errors.find(err => err.param === expected.param && err.msg === expected.msg);
          expect(error, `Expected error for ${expected.param}`).to.exist;
          expect(error.location).to.equal('body');
        });
      });
    });
  });
  /* ============================
     PUT /users/:id
  ============================ */
  describe('PUT /users/:id', () => {
    describe('Field validation', () => {  
      it('Verify invalid email format is rejected', async () => {
        const invalidEmails = [
          'employeeexample.com',
          'employee@.com',
          'employee@com',
          'employee@com.'
        ];
  
        for (const email of invalidEmails) {
          const res = await request(app)
            .put(`/users/${employeeId}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ email });
  
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          expect(res.body.errors).to.be.an('array');
          expect(res.body.errors).to.have.lengthOf(1);
          expect(res.body.errors[0].param).to.equal('email');
          expect(res.body.errors[0].msg).to.equal('Некорректный email');
        }
      });
  
      it('Verify negative salary value is rejected', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ salary: -100 });
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('salary');
        expect(res.body.errors[0].msg).to.equal('Зарплата должна быть положительным числом');
      });
  
      it('Verify invalid role value is rejected', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'superadmin' });
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('role');
        expect(res.body.errors[0].msg).to.equal('Роль должна быть employee или admin');
      });

      it('Verify empty firstName value is rejected', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: ''
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(2);

        const lengthError = res.body.errors.find(err => err.msg === 'Имя должно быть от 2 до 40 символов');
        const formatError = res.body.errors.find(err => err.msg === 'Имя не может быть пустым');

        expect(lengthError).to.exist;
        expect(lengthError.param).to.equal('firstName');
        expect(formatError).to.exist;
        expect(formatError.param).to.equal('firstName');
      });
    });

    describe('Data normalization', () => {
      it('Verify single vacationDate is converted to array', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vacationDates: '2024-12-25'
          });

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.user.vacationDates).to.be.an('array');
        expect(res.body.user.vacationDates).to.have.lengthOf(1);
      });
  
      it('Verify array of vacationDates is handled correctly', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            vacationDates: ['2024-12-25', '2024-12-26']
          });

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.user.vacationDates).to.be.an('array');
        expect(res.body.user.vacationDates).to.have.lengthOf(2);
      });
  
      it('Verify email is automatically converted to lowercase', async () => {
        const newEmail = faker.internet.email().toUpperCase();
  
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: newEmail
          });

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.user.email).to.equal(newEmail.toLowerCase());
      });
    });

    describe('ID & existence checks', () => {
      it('Verify validation error is returned for invalid user ID in update endpoint', async () => {
        const res = await request(app)
          .put('/users/abc')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: 'Updated'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors[0]).to.have.property('msg', 'User ID must be a positive integer');
        expect(res.body.errors[0].param).to.equal('id');
      });
  
      it('Verify 404 error is returned when updating non-existent user', async () => {
        const res = await request(app)
          .put('/users/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            firstName: randomFirstName
          });
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'User not found');
      });
    });

    describe('Role-based update permissions', () => {
      it('Verify employee can update their own profile fields', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            firstName: randomFirstName,
            phone: randomPhone,
            linkedinLink: 'https://linkedin.com/in/johndoe',
            githubLink: 'https://github.com/johndoe'
          });
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Data updated successfully');
        expect(res.body.user.firstName).to.equal(randomFirstName);
        expect(res.body.user.phone).to.equal(randomPhone);
        expect(res.body.user.linkedinLink).to.equal('https://linkedin.com/in/johndoe');
        expect(res.body.user.githubLink).to.equal('https://github.com/johndoe');
      });
  
      it('Verify employee is not allowed to update admin-only fields', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            salary: 50000,
            role: 'admin'
          });
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Только администратор может обновлять поле salary');
      });
  
      it('Verify admin can update all fields including salary and role', async () => {
        const res = await request(app)
          .put(`/users/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            salary: 60000,
            position: 'Senior Developer',
            workingHoursPerWeek: 40
          });
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Data updated successfully');
        expect(res.body.user.salary).to.equal(60000);
        expect(res.body.user.position).to.equal('Senior Developer');
        expect(res.body.user.workingHoursPerWeek).to.equal(40);
      });
    });

    describe('Password update', () => {
      it('Verify password is hashed when admin updates user password', async () => {
        const newPassword = faker.internet.password({ length: 12 });
        
        const updateRes = await request(app)
          .put(`/users/${employee2Id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            password: newPassword
          });
  
        expect(updateRes.status).to.equal(200);
  
        // Verify password is hashed, not stored in plain text
        const user = await db.User.scope('withPassword').findByPk(employee2Id);
        expect(user.password).to.not.equal(newPassword);
        
        // Verify the hashed password works for login
        const isValid = await bcrypt.compare(newPassword, user.password);
        expect(isValid).to.be.true;
  
        // Verify user can login with new password
        const loginRes = await request(app)
          .post('/login')
          .send({
            email: employee2Email,
            password: newPassword
          });
  
        expect(loginRes.status).to.equal(200);
        expect(loginRes.body).to.have.property('token');
      });
    });
  });
  /* ============================
     DELETE /users/:id
  ============================ */
  describe('DELETE /users/:id', () => {
    describe('Business rules', () => {
      it('Verify admin is prevented from deleting themselves', async () => {
        const res = await request(app)
          .delete(`/users/${adminId}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Нельзя удалить самого себя');
      });
  
      it('Verify admin can delete other employees', async () => {
        const res = await request(app)
          .delete(`/users/${employee2Id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message');
        expect(res.body.message).to.equal('Сотрудник успешно удален');
      });
    });

    describe('ID validation', () => {
      it('Verify validation error is returned for invalid user ID in delete endpoint', async () => {
        const res = await request(app)
          .delete('/users/invalid')
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors[0]).to.have.property('msg', 'User ID must be a positive integer');
        expect(res.body.errors[0].param).to.equal('id');
      });
  
      it('Verify validation error is returned for zero user ID', async () => {
        const res = await request(app)
          .delete('/users/0')
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors[0]).to.have.property('msg', 'User ID must be a positive integer');
        expect(res.body.errors[0].param).to.equal('id');
      });
    });
  });
});
