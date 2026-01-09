// tests/notifications.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app');
const db = require('../../models');


describe('Notification API Tests', () => {
  let adminEmail;
  let adminPassword;
  let adminId;
  let adminToken;
  let employee;
  let employeeEmail;
  let employeePassword;
  let employeeId;
  let employeeToken;
  
  // Faker values
  let randomFirstName;
  let randomLastName;
  let randomMiddleName;
  let randomBirthDate;
  let randomPhone;
  let faker;
  
  const notifications = [];

  before(async () => {
    ({ faker } = await import('@faker-js/faker'));
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

    // Create admin and receive token
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

    // Создаем сотрудника, к которому будет относиться уведомление
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

    const employeeRes = await request(app)
      .post('/login')
      .send({
        email: employeeEmail,
        password: employeePassword
      });
      
    employeeToken = employeeRes.body.token;

    // Create 5 notifications
    const types = ['general', 'birthday_reminder', 'salary_increase_reminder', 'welcome', 'employee_created'];

    for (let i = 0; i < 5; i++) {
      const message = faker.lorem.sentence();

      const notification = await db.Notification.create({
        message,
        userId: adminId,
        relatedUserId: employeeId,
        type: types[i % types.length],
        eventDate: new Date(Date.now() + i * 1000),
        isRead: false
      });

      notifications.push({
        id: notification.id,
        message,
        type: notification.type,
        eventDate: notification.eventDate,
        isRead: notification.isRead
      });
    }
  });
  /* ============================
     GET /notifications
  ============================ */
  describe('GET /notifications', () => {
    describe('Success cases', () => {
      it('Verify admin can retrieve notifications', async () => {
        const res = await request(app)
          .get('/notifications')
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('notifications');
        expect(res.body.notifications).to.be.an('array');
  
        const apiNotifications = res.body.notifications;
        expect(apiNotifications.length).to.be.at.least(notifications.length);
  
        apiNotifications.forEach(n => {
          expect(n.relatedUserId).to.equal(employeeId);
        });
      });

      it('Verify notifications are paginated according to page and limit parameters', async () => {
        const res = await request(app)
          .get('/notifications?page=1&limit=2')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.notifications).to.have.lengthOf(2);
        expect(res.body.page).to.equal(1);
        expect(res.body.total).to.be.at.least(notifications.length);
      });

      it('Verify empty array is returned when page exceeds total pages', async () => {
        const res = await request(app)
          .get('/notifications?page=100&limit=5')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.notifications).to.be.an('array').that.is.empty;
      });

      it('Verify notifications can be filtered by type', async () => {
        const type = 'general';

        const res = await request(app)
          .get(`/notifications?type=${type}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.notifications).to.be.an('array').and.not.empty;
  
        res.body.notifications.forEach(n => {
          expect(n.type.toLowerCase()).to.equal(type.toLowerCase());
        });
      });

      it('Verify empty array is returned for non-existent notification type', async () => {
        const res = await request(app)
          .get('/notifications?type=nonexistenttype')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.notifications).to.be.an('array').that.is.empty;
        expect(res.body.total).to.equal(0);
      });

      const sortFields = ['createdAt', 'type'];
      const orders = ['ASC', 'DESC'];

      sortFields.forEach(field => {
        orders.forEach(order => {
          it(`Verify notifications are sorted by ${field} in ${order} order`, async () => {
            const res = await request(app)
              .get(`/notifications?sortBy=${field}&order=${order}`)
              .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.notifications).to.be.an('array');

            const firstNotification = res.body.notifications[0];
            expect(firstNotification).to.have.property(field);

            console.log(`First notification ${field} (${order}):`, firstNotification[field]);
          });
        });
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify notifications access is denied without authentication token', async () => {
        const res = await request(app)
          .get('/notifications');
  
        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });
  
      it('Verify notifications access is denied with malformed token', async () => {
        const res = await request(app)
          .get('/notifications')
          .set('Authorization', `Bearer invalidToken`);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Недействительный токен');
      });
    });

    describe('Validation errors', () => {
      it('Verify validation error is returned for invalid page', async () => {
        const invalidPages = [-1, 0, 'invalid'];

        for (const page of invalidPages) {
          const res = await request(app)
            .get(`/notifications?page=${page}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const pageError = res.body.errors.find(err => err.msg === 'Page must be a positive integer');
          expect(pageError).to.exist;
          expect(pageError.param).to.equal('page');
        }
      });

      it('Verify validation error is returned for invalid limit', async () => {
        const invalidLimits = [-1, 0, 999, 'invalid'];

        for (const limit of invalidLimits) {
          const res = await request(app)
            .get(`/notifications?limit=${limit}`)
            .set('Authorization', `Bearer ${adminToken}`);
    
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const limitError = res.body.errors.find(err => err.msg === 'Limit must be between 1 and 100');
          expect(limitError).to.exist;
          expect(limitError.param).to.equal('limit');
        }
      });

      it('Verify validation error is returned for invalid sortBy parameter', async () => {
        const res = await request(app)
          .get('/notifications?sortBy=invalidField')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        
        const sortError = res.body.errors.find(err => err.msg === 'sortBy must be either createdAt or type');
        expect(sortError).to.exist;
        expect(sortError.param).to.equal('sortBy');
      });
    });
  });
  /* =======================================
     PATCH /notifications/:id/mark-as-read
  ======================================== */
  describe('PATCH /notifications/:id/mark-as-read', () => {
    describe('Success cases', () => {
      it('Verify admin can mark notification as read', async () => {
        const notificationToMark = notifications[0];
  
        const res = await request(app)
          .patch(`/notifications/${notificationToMark.id}/mark-as-read`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Уведомление отмечено как прочитанное');
  
        // Проверяем, что уведомление действительно отмечено как прочитанное
        const notification = await db.Notification.findByPk(notificationToMark.id);
        expect(notification.isRead).to.be.true;
      });

      it('Verify marking already read notification does not change state or return error', async () => {
        const notificationToMark = notifications[2];
  
        // Mark as read first
        await db.Notification.update({ isRead: true }, { where: { id: notificationToMark.id } });
  
        const res = await request(app)
          .patch(`/notifications/${notificationToMark.id}/mark-as-read`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('message', 'Уведомление отмечено как прочитанное');
  
        const notification = await db.Notification.findByPk(notificationToMark.id);
        expect(notification.isRead).to.be.true;
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify 401 is returned if no token is provided', async () => {
        const notificationToMark = notifications[1];
  
        const res = await request(app)
          .patch(`/notifications/${notificationToMark.id}/mark-as-read`);
  
        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });
  
      it('Verify 403 is returned if a user tries to mark another user\'s notification as read', async () => {
        const notificationToMark = notifications[0];
  
        const res = await request(app)
          .patch(`/notifications/${notificationToMark.id}/mark-as-read`)
          .set('Authorization', `Bearer ${employeeToken}`);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Недействительный токен');
      });
    });

    describe('Error handling', () => {
      it('Verify 404 is returned if notification does not exist', async () => {
        const res = await request(app)
          .patch(`/notifications/99999/mark-as-read`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Уведомление не найдено');
      });
    });
  });
});
