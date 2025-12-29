// tests/auth.extended.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const db = require('../models');

describe('Auth API - Additional Register Tests', () => {
  before(async () => {
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });
  });

  describe('POST /register', () => {
    it('should not register with missing required fields', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'employee@example.com'
        });

      console.log('Response body:', res.body);

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
        const error = res.body.errors.find(err => err.param === expected.param && err.msg === expected.msg);
        expect(error, `Expected error for ${expected.param}`).to.exist;
        expect(error.location).to.equal('body');
      });

      const emailError = res.body.errors.find(err => err.param === 'email');
      expect(emailError).to.be.undefined;
    });

    it('should not register with invalid email: format', async () => {
      const invalidEmails = [
        'employeeexample.com',
        'employee@.com',
        'employee@com',
        'employee@com.',
      ];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post('/register')
          .send({
            email,
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            middleName: 'Test',
            birthDate: '1990-01-01',
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('email');
        expect(res.body.errors[0].msg).to.equal('Некорректный email');
      };
    });

    it('should not register with email longer than 80 characters', async () => {  
      const res = await request(app)
        .post('/register')
        .send({
          email: 'a'.repeat(79) + '@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Test',
          birthDate: '1990-01-01',
          phone: '+123456789',
          programmingLanguage: 'JavaScript'
        });

        console.log('Response body:', res.body);

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

    it('should not register with invalid password: length', async () => {
       const invalidPasswords = ['123', '123456789012345678901'];

      for(const password of invalidPasswords) {
        const res = await request(app)
          .post('/register')
          .send({
            email: 'employee@example.com',
            password: password,
            firstName: 'John',
            lastName: 'Doe',
            middleName: 'Test',
            birthDate: '1990-01-01',
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });
    
        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('password');
        expect(res.body.errors[0].msg).to.equal('Пароль должен быть от 6 до 20 символов');
      };
    });

    it('should not register with invalid firstName: length', async () => {
      const invalidFirstNames = ['J', 'J'.repeat(41)];

      for(const firstName of invalidFirstNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: 'employee@example.com',
            password: 'password123',
            firstName: firstName,
            lastName: 'Doe',
            middleName: 'Test',
            birthDate: '1990-01-01',
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });
    
        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('firstName');
        expect(res.body.errors[0].msg).to.equal('Имя должно быть от 2 до 40 символов');
      };
    });

    it('should not register with invalid lastName: length', async () => {
      const invalidLastNames = ['D', 'D'.repeat(41)];

      for (const lastName of invalidLastNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: 'employee@example.com',
            password: 'password123',
            firstName: 'John',
            lastName,
            middleName: 'Test',
            birthDate: '1990-01-01',
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('lastName');
        expect(res.body.errors[0].msg).to.equal('Фамилия должна быть от 2 до 40 символов');
      };
    });

    it('should not register with invalid middleName: length', async () => {
      const invalidMiddleNames = ['T', 'T'.repeat(41)];

      for (const middleName of invalidMiddleNames) {
        const res = await request(app)
          .post('/register')
          .send({
            email: 'employee@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            middleName,
            birthDate: '1990-01-01',
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('middleName');
        expect(res.body.errors[0].msg).to.equal('Отчество должно быть от 2 до 40 символов');
      };
    });

    it('should not register with invalid birthDate', async () => {
      const invalidBirthDates = ['not-a-date', '2025-13-01', '1990-02-30'];

      for (const birthDate of invalidBirthDates) {
        const res = await request(app)
          .post('/register')
          .send({
            email: 'employee@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe',
            middleName: 'Test',
            birthDate,
            phone: '+123456789',
            programmingLanguage: 'JavaScript'
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('birthDate');
        expect(res.body.errors[0].msg).to.equal('Некорректная дата рождения');
      };
    });

    it('should not register with invalid phone: length', async () => {
      const tooLongPhone = '1'.repeat(51);

      const res = await request(app)
        .post('/register')
        .send({
          email: 'employee@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Test',
          birthDate: '1990-01-01',
          phone: tooLongPhone,
          programmingLanguage: 'JavaScript'
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('phone');
      expect(res.body.errors[0].msg).to.equal('Телефон не должен быть длиннее 50 символов');
    });

    it('should not register with invalid programmingLanguage: length', async () => {
      const tooLongProgrammingLanguage = 'A'.repeat(101);

      const res = await request(app)
        .post('/register')
        .send({
          email: 'employee@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Test',
          birthDate: '1990-01-01',
          phone: '+123456789',
          programmingLanguage: tooLongProgrammingLanguage
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('programmingLanguage');
      expect(res.body.errors[0].msg).to.equal('Язык программирования не должен быть длиннее 100 символов');
    });

    it('should reject admin registration with wrong secret word', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword',
          firstName: 'Admin',
          lastName: 'User',
          middleName: 'Middle',
          birthDate: '1980-01-01',
          phone: '+123456789',
          programmingLanguage: 'N/A',
          role: 'admin',
          secretWord: 'WRONG_SECRET'
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');
    });

    it('should reject role escalation during registration', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'employee@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Test',
          birthDate: '1990-01-01',
          phone: '+123456789',
          programmingLanguage: 'JavaScript',
          role: 'admin'
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');   
    });
  });

  describe('POST /login', () => {
    it('should not login with missing required fields', async () => {
      const res = await request(app)
        .post('/login')
        .send({});

      console.log('Response body:', res.body);

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

    it('should not login with invalid email format', async () => {
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
            password: 'password123'
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors).to.have.lengthOf(1);
        expect(res.body.errors[0].param).to.equal('email');
        expect(res.body.errors[0].msg).to.equal('Некорректный email');
      }
    });

    it('should not login with empty password', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'employee@example.com',
          password: ''
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('password');
      expect(res.body.errors[0].msg).to.equal('Пароль обязателен');
    });
  });
});
