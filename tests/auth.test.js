// tests/auth.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const db = require('../models');

describe('Auth API', () => {
  before(async () => {
    // Drop and recreate schema to ensure clean state
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });
  });

  describe('POST /register', () => {
    it('should register a new employee', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'employee@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          middleName: 'Middle',
          birthDate: '1990-01-01',
          phone: '+123456789',
          programmingLanguage: 'JavaScript',
          secretWord: process.env.SECRET_WORD
        });

      console.log('Response body:', res.body);

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

    it('should not register an admin without secret word', async () => {
      const res = await request(app)
        .post('/register')
        .send({
          email: 'admin@example.com',
          password: 'adminpassword',
          firstName: 'Admin',
          lastName: 'User',
          middleName: 'Middle',
          birthDate: '1980-01-01',
          phone: '+987654321',
          programmingLanguage: 'N/A',
          role: 'admin'
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверное секретное слово для регистрации администратора');
      expect(res.body).to.not.have.property('userId');
      expect(res.body).to.not.have.property('message');
    });
  });

  describe('POST /login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'employee@example.com',
          password: 'password123',
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('token');
      expect(res.body.token).to.be.a('string');
      expect(res.body.token).to.have.length.greaterThan(10);

      const tokenParts = res.body.token.split('.');
      expect(tokenParts.length).to.equal(3);
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/login')
        .send({
          email: 'employee@example.com',
          password: 'wrongpassword'
        });

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Неверные учетные данные');
      expect(res.body).to.not.have.property('token');
    });
  });
});
