// tests/projects.smoke.test.js
const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app');
const db = require('../../models');

describe('SMOKE: Project API Tests', () => {
  let adminEmail;
  let adminPassword;
  let adminToken;
  let employeeEmail;
  let employeePassword;
  let employeeToken;
  let employeeId;
  let testProjectId;

  // Faker values
  let randomFirstName;
  let randomLastName;
  let randomMiddleName;
  let randomBirthDate;
  let randomPhone;
  let randomProjectName;
  let randomProjectDescription;
  let randomProjectWage;
  let faker;

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

    // Common faker data
    randomFirstName = faker.person.firstName({ length: { min: 2, max: 40 } });
    randomLastName = faker.person.lastName({ length: { min: 2, max: 40 } });
    randomMiddleName = faker.person.middleName({ length: { min: 2, max: 40 } });
    randomBirthDate = faker.date.birthdate({ min: 1950, max: 1985, mode: 'year' }).toISOString().split('T')[0];
    randomPhone = faker.phone.number('+##########');
    randomProjectName = faker.commerce.productName().slice(0, 100);
    randomProjectDescription = faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000);
    randomProjectWage = faker.number.int({ min: 10, max: 5000 });

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

    // Login admin
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

    // Login employee
    const employeeRes = await request(app)
      .post('/login')
      .send({
        email: employeeEmail,
        password: employeePassword
      });
      
    employeeToken = employeeRes.body.token;

    const empUser = await db.User.findOne({ where: { email: employeeEmail } });
    employeeId = empUser.id;

    // Create one project
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: randomProjectName,
        description: randomProjectDescription,
        wage: randomProjectWage,
        active: true
      });

    testProjectId = res.body.project.id;
  });
  /* ============================
     GET /projects
  ============================ */
  it('Verify admin can retrieve projects', async () => {
    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.projects).to.be.an('array').that.is.not.empty;
    expect(res.body.projects[0]).to.have.property('wage');
  });

  it('Verify employee can retrieve projects without wage', async () => {
    const res = await request(app)
      .get('/projects')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).to.equal(200);
    expect(res.body.projects).to.be.an('array').that.is.not.empty;
    expect(res.body.projects[0]).to.not.have.property('wage');
  });
  /* ============================
     GET /projects/:id
  ============================ */
  it('Verify admin can get a single project with wage', async () => {
    const res = await request(app)
      .get(`/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('id', testProjectId);
    expect(res.body).to.have.property('wage');
  });

  it('Verify employee can get a single project without wage', async () => {
    const res = await request(app)
      .get(`/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('id', testProjectId);
    expect(res.body).to.not.have.property('wage');
  });
  /* ============================
     POST /projects/:id/employees
  ============================ */
  it('Verify admin can assign and remove employees from project', async () => {
    // Assign employee
    const assignRes = await request(app)
      .post(`/projects/${testProjectId}/employees`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeIds: [employeeId] });

    expect(assignRes.status).to.equal(200);
    expect(assignRes.body).to.have.property('message', 'Employees assigned to project successfully');

    // Remove employee
    const removeRes = await request(app)
      .post(`/projects/${testProjectId}/employees`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ employeeIds: [] });

    expect(removeRes.status).to.equal(200);
    expect(removeRes.body).to.have.property('message', 'All employees removed from project');
  });
  /* ============================
     DELETE /projects/:id
  ============================ */
  it('Verify admin can delete a project', async () => {
    const res = await request(app)
      .delete(`/projects/${testProjectId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('message', 'Project deleted successfully');
  });
});
