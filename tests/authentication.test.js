// tests/authentication.test.js
const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');

describe('Authentication API Tests', () => {
  let adminEmail;
  let adminPassword;
  let employeeEmail;
  let employeePassword;
  let hackerEmail;

  // Faker values to reuse in tests
  let randomFirstName;
  let randomLastName;
  let randomMiddleName;
  let randomBirthDate;
  let randomPhone;

  before(async () => {
    // Drop and recreate schema to ensure clean state
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });

    // Emails and passwords
    adminEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    adminPassword = faker.internet.password({ length: 12 });
    employeeEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();
    employeePassword = faker.internet.password({ length: 12 });
    hackerEmail = faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase();

    // Common faker data for names, birthdate, phone
    randomFirstName = faker.person.firstName({ length: { min: 2, max: 40 } });
    randomLastName = faker.person.lastName({ length: { min: 2, max: 40 } });
    randomMiddleName = faker.person.middleName({ length: { min: 2, max: 40 } });
    randomBirthDate = faker.date
      .birthdate({ min: 1950, max: 1985, mode: 'year' })
      .toISOString()
      .split('T')[0];
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
        programmingLanguage: 'Python'
      });
  });

  /* =========================
     REGISTRATION
  ========================== */

  describe('POST /register', () => {
    it('Verify registering a new employee', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'JavaScript',
          secretWord: process.env.SECRET_WORD
        });

      expect(res.status).to.equal(201);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('message');
      expect(res.body.message).to.equal('Пользователь успешно зарегистрирован');
      expect(res.body).to.have.property('userId');
      expect(res.body.userId).to.be.a('number');
      expect(res.body.userId).to.be.greaterThan(0);
      expect(res.body).to.not.have.property('password');
      expect(res.body).to.not.have.property('secretWord');
    });

    it('Verify admin registration fails without secret word', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'N/A',
          role: 'admin'
        });

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');
      expect(res.body).to.not.have.property('userId');
      expect(res.body).to.not.have.property('message');
    });

    it('Verify registration fails with missing required fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email().toLowerCase()
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(10);

      const expectedErrors = [
        { msg: 'Пароль должен быть от 6 до 20 символов', param: 'password' },
        { msg: 'Имя должно быть от 2 до 40 символов', param: 'firstName' },
        { msg: 'Имя обязательно', param: 'firstName' },
        { msg: 'Фамилия должна быть от 2 до 40 символов', param: 'lastName' },
        { msg: 'Фамилия обязательна', param: 'lastName' },
        { msg: 'Отчество должно быть от 2 до 40 символов', param: 'middleName' },
        { msg: 'Отчество обязательно', param: 'middleName' },
        { msg: 'Некорректная дата рождения', param: 'birthDate' },
        { msg: 'Телефон обязателен', param: 'phone' },
        { msg: 'Язык программирования обязателен', param: 'programmingLanguage' }
      ];

      expectedErrors.forEach(expected => {
        const error = res.body.errors.find(
          err => err.param === expected.param && err.msg === expected.msg
        );
        expect(error, `Expected error for ${expected.param}`).to.exist;
        expect(error.location).to.equal('body');
      });

      const emailError = res.body.errors.find(err => err.param === 'email');
      expect(emailError).to.be.undefined;
    });

    it('Verify registration fails with invalid email format', async () => {
      const invalidEmails = [
        'employeeexample.com',
        'employee@.com',
        'employee@com',
        'employee@com.'
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/register')
          .send({
            email,
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('email');
        expect(res.body.errors[0].msg).to.equal('Некорректный email');
      }
    });

    it('Verify registration fails with email longer than 80 characters', async () => {  
      const longEmail = 'a'.repeat(79) + '@example.com';
      
      const res = await request(app)
        .post('/register')
        .send({
          email: longEmail,
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'JavaScript'
        });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(2);

        const formatError = res.body.errors.find(err => err.msg === 'Некорректный email');
        const lengthError = res.body.errors.find(err => err.msg === 'Email должен быть от 5 до 80 символов');

        expect(formatError).to.exist;
        expect(formatError.param).to.equal('email');
        expect(lengthError).to.exist;
        expect(lengthError.param).to.equal('email');
    });

    it('Verify registration fails with invalid password length', async () => {
       const invalidPasswords = ['123', '123456789012345678901'];

      for(const password of invalidPasswords) {
        const res = await request(app)
          .post('/register')
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password,
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });
    
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('password');
        expect(res.body.errors[0].msg).to.equal('Пароль должен быть от 6 до 20 символов');
      };
    });

    it('Verify registration fails with invalid firstName length', async () => {
      const invalidFirstNames = ['J', 'J'.repeat(41)];

      for(const firstName of invalidFirstNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password: faker.internet.password({ length: 12 }),
            firstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });
    
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('firstName');
        expect(res.body.errors[0].msg).to.equal('Имя должно быть от 2 до 40 символов');
      };
    });

    it('sVerify registration fails with invalid lastName length', async () => {
      const invalidLastNames = ['D', 'D'.repeat(41)];

      for (const lastName of invalidLastNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName,
            middleName: randomMiddleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('lastName');
        expect(res.body.errors[0].msg).to.equal('Фамилия должна быть от 2 до 40 символов');
      };
    });

    it('Verify registration fails with invalid middleName length', async () => {
      const invalidMiddleNames = ['T', 'T'.repeat(41)];

      for (const middleName of invalidMiddleNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName,
            birthDate: randomBirthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('middleName');
        expect(res.body.errors[0].msg).to.equal('Отчество должно быть от 2 до 40 символов');
      };
    });

    it('Verify registration fails with invalid birthDate', async () => {
      const invalidBirthDates = ['not-a-date', '2025-13-01', '1990-02-30'];

      for (const birthDate of invalidBirthDates) {
        const res = await request(app)
          .post('/register')
          .send({
            email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
            password: faker.internet.password({ length: 12 }),
            firstName: randomFirstName,
            lastName: randomLastName,
            middleName: randomMiddleName,
            birthDate,
            phone: randomPhone,
            programmingLanguage: 'JavaScript'
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('birthDate');
        expect(res.body.errors[0].msg).to.equal('Некорректная дата рождения');
      };
    });

    it('Verify registration fails with invalid phone length', async () => {
      const tooLongPhone = '1'.repeat(51);

      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: tooLongPhone,
          programmingLanguage: 'JavaScript'
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('phone');
      expect(res.body.errors[0].msg).to.equal('Телефон не должен быть длиннее 50 символов');
    });

    it('Verify registration fails with invalid programmingLanguage length', async () => {
      const tooLongProgrammingLanguage = 'A'.repeat(101);

      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: tooLongProgrammingLanguage
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('programmingLanguage');
      expect(res.body.errors[0].msg).to.equal('Язык программирования не должен быть длиннее 100 символов');
    });

    it('Verify admin registration fails with wrong secret word', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'N/A',
          role: 'admin',
          secretWord: 'WRONG_SECRET'
        });

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');
    });

    it('Verify registration fails on role escalation attempt', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'JavaScript',
          role: 'admin'
        });

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');
    });

    it('Verify registration ignores salary injection attempt', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: hackerEmail,
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'Ruby',
          salary: 999999, // Attempting to inject salary
          role: 'employee'
        });

      expect(res.status).to.equal(201);

      // Verify the user was created without the injected salary
      const user = await db.User.findOne({ where: { email: hackerEmail } });
      expect(user.salary).to.not.equal(999999);
      expect(user.salary).to.equal(400); // Default value from model
    });

    it('Verify registration rejects duplicate email with different case', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: employeeEmail.toUpperCase(),
          password: faker.internet.password({ length: 12 }),
          firstName: randomFirstName,
          lastName: randomLastName,
          middleName: randomMiddleName,
          birthDate: randomBirthDate,
          phone: randomPhone,
          programmingLanguage: 'Ruby'
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Пользователь с таким email уже существует');
    });
  });
  /* =========================
     LOGIN
  ========================== */
  describe('POST /login', () => {
    it('Verify login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: employeeEmail,
          password: employeePassword,
        });

      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
      expect(res.body.token).to.have.length.greaterThan(10);

      const tokenParts = res.body.token.split('.');
      expect(tokenParts.length).to.equal(3);
    });

    it('Verify login fails with invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: 'wrongpassword'
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверные учетные данные');
      expect(res.body).to.not.have.property('token');
    });

    it('Verify login fails with missing required fields', async () => {
      const res = await request(app)
        .post('/login')
        .send({});

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(2);

      const emailError = res.body.errors.find(err => err.param === 'email');
      expect(emailError).to.exist;
      expect(emailError.msg).to.equal('Некорректный email');
      expect(emailError.location).to.equal('body');

      const passwordError = res.body.errors.find(err => err.param === 'password');
      expect(passwordError).to.exist;
      expect(passwordError.msg).to.equal('Пароль обязателен');
      expect(passwordError.location).to.equal('body');
    });

    it('Verify login fails with invalid email format', async () => {
      const invalidEmails = [
        'employeeexample.com',
        'employee@.com',
        'employee@com',
        'employee@com.'
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/login')
          .send({
            email,
            password: faker.internet.password({ length: 12 })
          });

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('email');
        expect(res.body.errors[0].msg).to.equal('Некорректный email');
      }
    });

    it('Verify login fails with empty password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: faker.internet.email({ length: { min: 5, max: 80 } }).toLowerCase(),
          password: ''
        });

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('password');
      expect(res.body.errors[0].msg).to.equal('Пароль обязателен');
    });

    it('Verify login succeeds with email in different case', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: adminEmail.toUpperCase(),
          password: adminPassword
        });

      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.not.be.empty;
    });
  });
});
