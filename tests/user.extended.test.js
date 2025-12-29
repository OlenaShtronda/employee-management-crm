// tests/user.extended.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../app');
const db = require('../models');

const adminCredentials = {
  email: 'admin@example.com',
  password: 'adminpassword'
};

const usersData = [
  {
    email: 'employee1@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Middle',
    birthDate: '1990-01-01',
    phone: '+123456789',
    programmingLanguage: 'JavaScript',
    country: 'USA',
    mentorName: 'Mentor A',
    englishLevel: 'Intermediate',
    registrationDate: '2021-01-01'
  },
  {
    email: 'employee2@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    middleName: 'Middle',
    birthDate: '1992-02-02',
    phone: '+987654321',
    programmingLanguage: 'Python',
    country: 'UK',
    mentorName: 'Mentor B',
    englishLevel: 'Advanced',
    registrationDate: '2021-02-01'
  },
  {
    email: 'employee3@example.com',
    password: 'password123',
    firstName: 'Alice',
    lastName: 'Johnson',
    middleName: 'Middle',
    birthDate: '1995-03-03',
    phone: '+111222333',
    programmingLanguage: 'Java',
    country: 'Canada',
    mentorName: 'Mentor A',
    englishLevel: 'Beginner',
    registrationDate: '2021-03-01'
  },
  {
    email: 'employee4@example.com',
    password: 'password123',
    firstName: 'Bob',
    lastName: 'Brown',
    middleName: 'Middle',
    birthDate: '1988-04-04',
    phone: '+444555666',
    programmingLanguage: 'C#',
    country: 'Germany',
    mentorName: 'Mentor C',
    englishLevel: 'Intermediate',
    registrationDate: '2021-04-01'
  },
  {
    email: 'employee5@example.com',
    password: 'password123',
    firstName: 'Charlie',
    lastName: 'Davis',
    middleName: 'Middle',
    birthDate: '1991-05-05',
    phone: '+777888999',
    programmingLanguage: 'Ruby',
    country: 'France',
    mentorName: 'Mentor D',
    englishLevel: 'Advanced',
    registrationDate: '2021-05-01'
  },
  {
    email: 'employee6@example.com',
    password: 'password123',
    firstName: 'Diana',
    lastName: 'Evans',
    middleName: 'Middle',
    birthDate: '1993-06-06',
    phone: '+101112131',
    programmingLanguage: 'Go',
    country: 'Australia',
    mentorName: 'Mentor A',
    englishLevel: 'Beginner',
    registrationDate: '2021-06-01'
  },
  {
    email: 'employee7@example.com',
    password: 'password123',
    firstName: 'Edward',
    lastName: 'Foster',
    middleName: 'Middle',
    birthDate: '1989-07-07',
    phone: '+141516171',
    programmingLanguage: 'TypeScript',
    country: 'USA',
    mentorName: 'Mentor B',
    englishLevel: 'Intermediate',
    registrationDate: '2021-07-01'
  },
  {
    email: 'employee8@example.com',
    password: 'password123',
    firstName: 'Fiona',
    lastName: 'Green',
    middleName: 'Middle',
    birthDate: '1994-08-08',
    phone: '+181920212',
    programmingLanguage: 'PHP',
    country: 'Italy',
    mentorName: 'Mentor C',
    englishLevel: 'Advanced',
    registrationDate: '2021-08-01'
  },
  {
    email: 'employee9@example.com',
    password: 'password123',
    firstName: 'George',
    lastName: 'Harris',
    middleName: 'Middle',
    birthDate: '1996-09-09',
    phone: '+222324252',
    programmingLanguage: 'Kotlin',
    country: 'Spain',
    mentorName: 'Mentor D',
    englishLevel: 'Beginner',
    registrationDate: '2021-09-01'
  },
  {
    email: 'employee10@example.com',
    password: 'password123',
    firstName: 'Hannah',
    lastName: 'Irwin',
    middleName: 'Middle',
    birthDate: '1990-10-10',
    phone: '+262728293',
    programmingLanguage: 'Swift',
    country: 'Netherlands',
    mentorName: 'Mentor A',
    englishLevel: 'Intermediate',
    registrationDate: '2021-10-01'
  },
  {
    email: 'employee11@example.com',
    password: 'password123',
    firstName: 'Ian',
    lastName: 'Jackson',
    middleName: 'Middle',
    birthDate: '1992-11-11',
    phone: '+303132333',
    programmingLanguage: 'Scala',
    country: 'Sweden',
    mentorName: 'Mentor B',
    englishLevel: 'Advanced',
    registrationDate: '2021-11-01'
  },
  {
    email: 'employee12@example.com',
    password: 'password123',
    firstName: 'Julia',
    lastName: 'King',
    middleName: 'Middle',
    birthDate: '1993-12-12',
    phone: '+343536373',
    programmingLanguage: 'Rust',
    country: 'Norway',
    mentorName: 'Mentor C',
    englishLevel: 'Beginner',
    registrationDate: '2021-12-01'
  }
];

let adminToken;
let employeeToken;
let employeeId;

describe('Users API - Additional Tests', () => {
  before(async () => {
    await db.sequelize.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await db.sequelize.query('CREATE SCHEMA public;');
    await db.sequelize.sync({ force: true });

    await request(app)
      .post('/register')
      .send({
        ...adminCredentials,
        firstName: 'Admin',
        lastName: 'User',
        middleName: 'Middle',
        birthDate: '1980-01-01',
        phone: '+987654321',
        programmingLanguage: 'N/A',
        role: 'admin',
        secretWord: process.env.SECRET_WORD
      });

    const adminRes = await request(app)
      .post('/login')
      .send(adminCredentials);

    adminToken = adminRes.body.token;

    for (const userData of usersData) {
      await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...userData,
          role: 'employee'
        });
    }

    const employeeRes = await request(app)
      .post('/login')
      .send({
        email: usersData[0].email,
        password: usersData[0].password
      });

    employeeToken = employeeRes.body.token;

    const empUser = await db.User.findOne({ where: { email: usersData[0].email } });
    employeeId = empUser.id;
  });

  describe('GET /users - user access', () => {
    it('should return all users for admin', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array');
      expect(res.body.users.length).to.be.greaterThan(1);
    });

    it('should return all users for employee', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array');
      expect(res.body.users.length).to.be.greaterThan(1);
    });

    it('should not return users without token', async () => {
      const res = await request(app)
        .get('/users');

      console.log('Response body:', res.body);

      expect(res.status).to.equal(401);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Токен не предоставлен');
    });
  });

  describe('GET /users/me', () => {
    it('should return current logged-in user profile', async () => {
      const res = await request(app)
        .get(`/users/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.include({
        id: employeeId,
        email: usersData[0].email,
        role: 'employee',
      });
      expect(res.body).to.not.have.property('password');
    });

    it('should not return current logged-in user profile without token', async () => {
      const res = await request(app)
        .get(`/users/${employeeId}`);
      
      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(401);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Токен не предоставлен');
      expect(res.body).to.not.have.property('email');
      expect(res.body).to.not.have.property('id');   
    });
  });

  describe('PUT /users/:id - validation edge cases', () => {
    it('should reject invalid email format', async () => {
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

    it('should reject negative salary', async () => {
      const res = await request(app)
        .put(`/users/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ salary: -100 });

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('salary');
      expect(res.body.errors[0].msg).to.equal('Зарплата должна быть положительным числом');
    });

    it('should reject invalid role value', async () => {
      const res = await request(app)
        .put(`/users/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'superadmin' });

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors).to.be.an('array');
      expect(res.body.errors).to.have.lengthOf(1);
      expect(res.body.errors[0].param).to.equal('role');
      expect(res.body.errors[0].msg).to.equal('Роль должна быть employee или admin');
    });
  });

  describe('POST /users - validation & permission checks', () => {
    it('should reject employee trying to create a user', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          email: 'newemployee@test.com',
          password: 'newpass123',
          firstName: 'New',
          lastName: 'Employee',
          middleName: 'Test',
          birthDate: '1992-01-01',
          phone: '+1234567894',
          programmingLanguage: 'Go'
        });
      
      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(403);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('error');
      expect(res.body.error).to.equal('Доступ запрещен');
    });

    it('should reject creating a user with missing required fields', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'invalid@test.com' });

      console.log('Response body:', res.body);

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

  describe('GET /users - role-based data visibility', () => {
    it('should show salary field for admin role', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);

      const user = res.body.users[0];
      expect(user).to.have.property('salary');
    });

    it('should hide salary field for employee', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);

      const user = res.body.users[0];
      expect(user).not.to.have.property('salary');
    });
  });

  describe('GET /users - search parameters', () => {
    it('should return empty array if page exceeds total pages', async () => {
      const res = await request(app)
        .get('/users?page=100&limit=10')
        .set('Authorization', `Bearer ${employeeToken}`);
      
      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body.users).to.be.an('array').that.is.empty;
    });

    it('should return all users if limit exceeds total users', async () => {
      const res = await request(app)
        .get('/users?limit=100')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);

      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body.users).to.be.an('array');
      expect(res.body.users.length).to.equal(res.body.total);
    });

    it('should return empty array for non-existent firstName', async () => {
      const res = await request(app)
        .get('/users?firstName=NonExistent')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body.users).to.be.an('array').that.is.empty;
    });

    it('should return empty array for non-existent lastName', async () => {
      const res = await request(app)
        .get('/users?lastName=NonExistent')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body.users).to.be.an('array').that.is.empty;
    });

    it('should return validation error for non-integer page', async () => {
      const res = await request(app)
        .get('/users?page=abc')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      
      const pageError = res.body.errors.find(err => err.msg === 'Параметр "page" должен быть положительным целым числом');
      expect(pageError).to.exist;
      expect(pageError.param).to.equal('page');
    });

    it('should return validation error for non-integer limit', async () => {
      const res = await request(app)
        .get('/users?limit=abc')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');

      const limitError = res.body.errors.find(err => err.msg === 'Параметр "limit" должен быть положительным целым числом');
      expect(limitError).to.exist;
      expect(limitError.param).to.equal('limit');
    });

    it('should return validation error for invalid sortBy', async () => {
      const res = await request(app)
        .get('/users?sortBy=invalidField')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors[0]).to.have.property('msg');
    });

    it('should return validation error for invalid order', async () => {
      const res = await request(app)
        .get('/users?order=INVALID')
        .set('Authorization', `Bearer ${employeeToken}`);

      console.log('Response body:', res.body);

      expect(res.status).to.equal(400);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('errors');
      expect(res.body.errors[0]).to.have.property('msg');
    });

    it('should handle case-insensitive search for firstName', async () => {
      const res = await request(app)
        .get('/users?firstName=john')
        .set('Authorization', `Bearer ${employeeToken}`);
      
      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array').with.lengthOf(1);
      expect(res.body.users[0]).to.have.property('firstName', 'John');
      expect(res.body.users[0].firstName.toLowerCase()).to.equal('john');
    });

    it('should handle case-insensitive search for lastName', async () => {
      const res = await request(app)
        .get('/users?lastName=doe')
        .set('Authorization', `Bearer ${employeeToken}`);
      
      console.log('Response body:', res.body);
      
      expect(res.status).to.equal(200);
      expect(res.headers['content-type']).to.match(/json/);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array').with.lengthOf(1);
      expect(res.body.users[0]).to.have.property('lastName', 'Doe');
      expect(res.body.users[0].lastName.toLowerCase()).to.equal('doe');
    });

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
        it(`should sort users by ${field} in ${order} order`, async () => {
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
  });
});
