// tests/notifications.smoke.test.js
const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');


describe('SMOKE: Notification API Tests', () => {
  let adminEmail;
  let adminPassword;
  let adminToken;
  let adminId;
  let employee;
  let employeeEmail;
  let employeePassword;
  let employeeId;
  let notificationId;
  
  // Faker values
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

    const res = await request(app)
      .post('/login')
      .send({
        email: adminEmail,
        password: adminPassword
      });

    adminToken = res.body.token;

    // Create employee
    employee = await db.User.create({
      firstName: randomFirstName,
      lastName: randomLastName,
      middleName: randomMiddleName,
      email: employeeEmail,
      phone: randomPhone,
      birthDate: randomBirthDate,
      programmingLanguage: 'JavaScript',
      country: 'USA',
      hireDate: new Date(),
      salary: 1000,
      role: 'employee',
      password: employeePassword
    });

    const empUser = await db.User.findOne({ where: { email: employeeEmail } });
    employeeId = empUser.id;

    // Create one notification
    const notification = await db.Notification.create({
      message: faker.lorem.sentence(),
      userId: adminId,
      relatedUserId: employeeId,
      type: 'general',
      eventDate: new Date(),
      isRead: false
    });

    notificationId = notification.id;
  });
  /* ============================
     GET /notifications
  ============================ */
  it('Verify admin can retrieve notifications', async () => {
    const res = await request(app)
      .get('/notifications')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('notifications');
    expect(res.body.notifications).to.be.an('array').that.is.not.empty;
  });
  /* =======================================
     PATCH /notifications/:id/mark-as-read
  ======================================== */
  it('Verify admin can mark notification as read', async () => {
    const res = await request(app)
      .patch(`/notifications/${notificationId}/mark-as-read`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Уведомление отмечено как прочитанное');
  });
});
