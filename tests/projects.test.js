// tests/project.test.js
const request = require('supertest');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const app = require('../app');
const db = require('../models');

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

const projects = [];

describe('Project API', () => {
  before(async function () {
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

    // Create 6 projects
    this.timeout(30000);
    for (let i = 0; i < 6; i++) {
      const projectData = {
        name: faker.commerce.productName().slice(0, 100),
        description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000),
        wage: faker.number.int({ min: 10, max: 5000 }),
        active: true
      };

      const res = await request(app)
        .post('/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(projectData);

      projects.push(res.body.project); // save for further tests
    }

    testProjectId = projects[0].id;
  });
  /* ============================
     GET /projects
  ============================ */
  describe('GET /projects', () => {
    describe('Success cases', () => {
      it('Verify all projects are returned for admin', async () => {
        const res = await request(app)
          .get('/projects')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('projects');
        expect(res.body.projects).to.be.an('array');
        expect(res.body.projects.length).to.be.greaterThan(0);
        expect(res.body.projects.length).to.equal(res.body.total);
        expect(res.body.projects[0]).to.have.property('wage'); // Admin can see wage
      });

      it('Verify all projects are returned for employee without wage field', async () => {
        const res = await request(app)
          .get('/projects')
          .set('Authorization', `Bearer ${employeeToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('projects');
        expect(res.body.projects).to.be.an('array');
        expect(res.body.projects.length).to.be.greaterThan(0);
        expect(res.body.projects.length).to.equal(res.body.total);
        expect(res.body.projects[0]).to.not.have.property('wage'); // Employee cannot see wage
      });

      it('Verify projects are filtered by active status', async () => {
        const res = await request(app)
          .get('/projects?active=true')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('projects');
        expect(res.body.projects).to.be.an('array');
        if (res.body.projects.length > 0) {
          expect(res.body.projects.every(p => p.active === true)).to.be.true;
        }
      });

      it('Verify projects can be searched by name', async () => {
        const projectToSearch = projects[0];
        const searchName = projectToSearch.name;
  
        const res = await request(app)
          .get(`/projects?search=${encodeURIComponent(searchName)}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.projects).to.be.an('array').and.not.empty;
  
        res.body.projects.forEach(p => {
          expect(p.name.toLowerCase()).to.include(searchName.toLowerCase());
        });
      });

      it('Verify projects are paginated according to page and limit parameters', async () => {
        const res = await request(app)
          .get('/projects?page=1&limit=1')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.projects.length).to.equal(1);
        expect(res.body).to.have.property('totalPages');
      });

      it('Verify whitespace-only search query returns all projects', async () => {
        const res = await request(app)
          .get('/projects?search=   ')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        // Should not crash and return valid response
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('projects');
        expect(res.body.projects).to.be.an('array');
        expect(res.body.projects.length).to.be.greaterThan(0);
        expect(res.body.projects.length).to.equal(res.body.total);
        expect(res.body.projects[0]).to.have.property('wage');
      });

      it('Verify empty array is returned for non-existent project search', async () => {
        const res = await request(app)
          .get('/projects?search=nonexistentprojectname')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.projects).to.be.an('array').that.is.empty;
        expect(res.body.total).to.equal(0);
      });

      it('Verify empty array is returned when page exceeds total pages', async () => {
        const res = await request(app)
          .get('/projects?page=100&limit=10')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body.projects).to.be.an('array').that.is.empty;
      });

      it('Verify case-insensitive search works for project name', async () => {
        const searchValue = projects[0].name.toUpperCase();

        const res = await request(app)
          .get(`/projects?search=${encodeURIComponent(searchValue)}`)
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('projects');
        expect(res.body.projects).to.be.an('array').that.is.not.empty;

        res.body.projects.forEach(project => {
          expect(project.name.toLowerCase()).to.include(searchValue.toLowerCase());
        });
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify projects are not returned without token', async () => {
        const res = await request(app)
          .get('/projects');

        console.log('Response body:', res.body);

        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.equal('Токен не предоставлен');
      });

      it('Verify error is returned for malformed token', async () => {
        const res = await request(app)
          .get('/projects')
          .set('Authorization', 'Bearer invalid.token.here');

        console.log('Response body:', res.body);

        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.equal('Недействительный токен');
      });
    });

    describe('Validation errors', () => {
      it('Verify validation error is returned for invalid active value', async () => {
        const res = await request(app)
          .get('/projects?active=yes')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors.length).to.equal(1);

        const activeError = res.body.errors.find(err => err.msg === 'Active must be true or false');
        expect(activeError).to.exist;
        expect(activeError.param).to.equal('active');
      });

      it('Verify validation error is returned for limit greater than 100', async () => {
        const res = await request(app)
          .get('/projects?limit=1000')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        expect(res.body.errors.length).to.equal(1);

        const limitError = res.body.errors.find(err => err.msg === 'Limit must be between 1 and 100');
        expect(limitError).to.exist;
        expect(limitError.param).to.equal('limit');
      });

      it('Verify validation error is returned for negative or zero page number', async () => {
        const invalidPages = [-1, 0];

        for (const page of invalidPages) {
          const res = await request(app)
            .get(`/projects?page=${page}`)
            .set('Authorization', `Bearer ${adminToken}`);
            
          console.log('Response body:', res.body);
          
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const pageError = res.body.errors.find(err => err.msg === 'Page must be a positive integer');
          expect(pageError).to.exist;
          expect(pageError.param).to.equal('page');
        }
      });

      it('Verify validation error is returned for negative or zero limit number', async () => {
        const invalidLimits = [-1, 0];

        for (const limit of invalidLimits) {
          const res = await request(app)
            .get(`/projects?limit=${limit}`)
            .set('Authorization', `Bearer ${adminToken}`);
    
          console.log('Response body:', res.body);
    
          expect(res.status).to.equal(400);
          expect(res.headers['content-type']).to.match(/json/);
          expect(res.body).to.have.property('errors');
          
          const limitError = res.body.errors.find(err => err.msg === 'Limit must be between 1 and 100');
          expect(limitError).to.exist;
          expect(limitError.param).to.equal('limit');
        }
      });

      it('Verify validation error is returned for non-integer page', async () => {
        const res = await request(app)
          .get('/projects?page=abc')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);
          
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        
        const pageError = res.body.errors.find(err => err.msg === 'Page must be a positive integer');
        expect(pageError).to.exist;
        expect(pageError.param).to.equal('page');
      });

      it('Verify validation error is returned for non-integer limit', async () => {
        const res = await request(app)
          .get('/projects?limit=abc')
          .set('Authorization', `Bearer ${adminToken}`);

        console.log('Response body:', res.body);

        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        
        const limitError = res.body.errors.find(err => err.msg === 'Limit must be between 1 and 100');
        expect(limitError).to.exist;
        expect(limitError.param).to.equal('limit');
      });
    });
  });
  /* ============================
     GET /projects/:id
  ============================ */
  describe('GET /projects/:id', () => {
    describe('Success cases', () => {
      it('Verify admin can get a single project with wage visible', async () => {
        const res = await request(app)
          .get(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);
          
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('id');
        expect(res.body.id).to.equal(testProjectId);
        expect(res.body).to.have.property('wage'); // Admin can see wage
      });
  
      it('Verify employee can get a single project without wage visible', async () => {
        const res = await request(app)
          .get(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${employeeToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('id');
        expect(res.body.id).to.equal(testProjectId);
        expect(res.body).to.not.have.property('wage'); // Employee cannot see wage
      });
    });

    describe('Error cases', () => {
      it('Verify 404 is returned for non-existent project', async () => {
        const res = await request(app)
          .get('/projects/99999')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Project not found');
      });
  
      it('Verify 400 is returned for invalid project ID', async () => {
        const res = await request(app)
          .get('/projects/invalid')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const idError = res.body.errors.find(err => err.msg === 'Project ID must be a positive integer');
        expect(idError).to.exist;
        expect(idError.param).to.equal('id');
      });
    });
  });
  /* ============================
     POST /projects
  ============================ */   
  describe('POST /projects', () => {
    describe('Success cases', () => {
      it('Verify admin can create a project', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: randomProjectName,
            description: randomProjectDescription,
            wage: randomProjectWage,
            active: true
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(201);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Project created successfully');
        expect(res.body).to.have.property('project');
        expect(res.body.project).to.have.property('id');
        expect(res.body.project.name).to.equal(randomProjectName);
        testProjectId = res.body.project.id;
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify project creation fails without token', async () => {
        const res = await request(app)
          .post('/projects')
          .send({
            name: randomProjectName,
            description: randomProjectDescription
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });
  
      it('Verify project creation is denied for employee role', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            name: randomProjectName,
            description: randomProjectDescription
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Access denied');
      });
    });
    
    describe('Validation errors', () => {
      it('Verify project creation fails with invalid name and description data', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'A', // Too short
            description: 'Short' // Too short
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        
        const nameError = res.body.errors.find(err => err.msg === 'Project name must be between 2 and 100 characters');
        expect(nameError).to.exist;
        expect(nameError.param).to.equal('name');
  
        const descriptionError = res.body.errors.find(err => err.msg === 'Project description must be between 10 and 5000 characters');
        expect(descriptionError).to.exist;
        expect(descriptionError.param).to.equal('description');
      });
  
      it('Verify project creation fails for duplicate project name', async () => {
        const duplicateProject = projects[0];
  
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: duplicateProject.name,
            description: duplicateProject.description
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Project with this name already exists');
      });
  
      it('Verify project creation fails when name is missing', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: randomProjectDescription
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        
        const expectedErrors = [
          { msg: 'Project name is required', param: 'name' },
          { msg: 'Project name must be between 2 and 100 characters', param: 'name' }
        ];
  
        expectedErrors.forEach(expected => {
          const error = res.body.errors.find(err => err.param === expected.param && err.msg === expected.msg);
          expect(error, `Expected error for ${expected.param}`).to.exist;
          expect(error.location).to.equal('body');
        });
      });
  
      it('Verify project creation fails when description is missing', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: randomProjectName
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        
        const expectedErrors = [
          { msg: 'Project description is required', param: 'description' },
          { msg: 'Project description must be between 10 and 5000 characters', param: 'description' }
        ];
  
        expectedErrors.forEach(expected => {
          const error = res.body.errors.find(err => err.param === expected.param && err.msg === expected.msg);
          expect(error, `Expected error for ${expected.param}`).to.exist;
          expect(error.location).to.equal('body');
        });
      });
  
      it('Verify project creation fails when required fields are missing', async () => {
        const res = await request(app)
          .post('/projects')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({});
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
        
        const expectedErrors = [
          { msg: 'Project name is required', param: 'name' },
          { msg: 'Project name must be between 2 and 100 characters', param: 'name' },
          { msg: 'Project description is required', param: 'description' },
          { msg: 'Project description must be between 10 and 5000 characters', param: 'description' }
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
     PUT /projects/:id
  ============================ */  
  describe('PUT /projects/:id', () => {
    describe('Success cases', () => {
      it('Verify admin can update a project', async () => {
        const updatedData = {
          name: faker.commerce.productName().slice(0, 100),
          description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000),
          wage: faker.number.int({ min: 10, max: 5000 })
        };
  
        const res = await request(app)
          .put(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updatedData);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Project updated successfully');
        expect(res.body).to.have.property('project');
        expect(res.body.project.name).to.equal(updatedData.name);
        expect(res.body.project.description).to.equal(updatedData.description);
        expect(res.body.project.wage).to.equal(updatedData.wage);
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify project update fails without token', async () => {
        const res = await request(app)
          .put(`/projects/${testProjectId}`)
          .send({
            name: faker.commerce.productName().slice(0, 100),
            description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000)
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(401);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Токен не предоставлен');
      });
  
      it('Verify project update fails with malformed token', async () => {
        const res = await request(app)
          .put(`/projects/${testProjectId}`)
          .set('Authorization', 'Bearer invalid.token.here')
          .send({
            name: faker.commerce.productName().slice(0, 100),
            description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000)
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.equal('Недействительный токен');
      });
  
      it('Verify project update fails for employee', async () => {
        const res = await request(app)
          .put(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            name: faker.commerce.productName().slice(0, 100)
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Access denied');
      });
    });

    describe('Validation / Error cases', () => {
      it('Verify project update fails with invalid data', async () => {
        const res = await request(app)
          .put(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            description: 'Short' // Too short
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
        expect(res.body.errors).to.be.an('array');
  
        const descriptionError = res.body.errors.find(err => err.msg === 'Project description must be between 10 and 5000 characters');
        expect(descriptionError).to.exist;
        expect(descriptionError.param).to.equal('description');
      });
  
      it('Verify project update fails with invalid project ID', async () => {
        const res = await request(app)
          .put('/projects/invalid')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: faker.commerce.productName().slice(0, 100),
            description: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })).slice(0, 5000)
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const idError = res.body.errors.find(err => err.msg === 'Project ID must be a positive integer');
        expect(idError).to.exist;
        expect(idError.param).to.equal('id');
      });
  
      it('Verify project update fails for non-existing project ID', async () => {
        const res = await request(app)
          .put('/projects/999999')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ 
            name: faker.commerce.productName().slice(0, 100) 
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Project not found');
      });
    });
  });
  /* ============================
     POST /projects/:id/employees
  ============================ */  
  describe('POST /projects/:id/employees', () => {
    let employeeId;

    before(async () => {
      const userRes = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const employee = userRes.body.users.find(u => u.role === 'employee');
      if (!employee) {
        throw new Error('No employee found for project assignment tests');
      }
      employeeId = employee.id;
    });

    describe('Success cases', () => {
      it('Verify admin can assign employees to project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeIds: [employeeId]
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Employees assigned to project successfully');
      });
  
      it('Verify admin can remove all employees from project using empty array', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeIds: []
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'All employees removed from project');
      });

      it('Verify valid employee can be successfully added to a project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employee`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeId: employeeId
          });

        console.log('Response body:', res.body);

        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Employee added to project successfully');
      });
    });

    describe('Authentication / Authorization errors', () => {
      it('Verify employee cannot assign employees to project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${employeeToken}`)
          .send({
            employeeIds: [employeeId]
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Access denied');
      });
    });

    describe('Validation errors', () => {
      it('Verify assignment fails with invalid employee IDs', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeIds: [99999]
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Some employees not found');
      });
  
  
      it('Verify employeeId is validated when adding an employee to a project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employee`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeId: 'invalid'
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const employeeIdError = res.body.errors.find(err => err.msg === 'employeeId must be a positive integer');
        expect(employeeIdError).to.exist;
        expect(employeeIdError.param).to.equal('employeeId');
      });
  
      it('Verify negative employeeId is rejected when adding an employee to a project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employee`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeId: -5
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const employeeIdError = res.body.errors.find(err => err.msg === 'employeeId must be a positive integer');
        expect(employeeIdError).to.exist;
        expect(employeeIdError.param).to.equal('employeeId');
      });
  
      it('Verify zero employeeId is rejected when adding an employee to a project', async () => {
        const res = await request(app)
          .post(`/projects/${testProjectId}/employee`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            employeeId: 0
          });
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const employeeIdError = res.body.errors.find(err => err.msg === 'employeeId must be a positive integer');
        expect(employeeIdError).to.exist;
        expect(employeeIdError.param).to.equal('employeeId');
      });
    });
  });
  /* ============================
     GET /projects/:id/employees
  ============================ */
  describe('GET /projects/:id/employees', () => {
    describe('Success cases', () => {
      it('Verify employees assigned to a project are returned for admin', async () => {
        const res = await request(app)
          .get(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('employees');
        expect(res.body.employees).to.be.an('array');
      });

      it('Verify salary field is hidden for non-admin users', async () => {
        const res = await request(app)
          .get(`/projects/${testProjectId}/employees`)
          .set('Authorization', `Bearer ${employeeToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        if (res.body.employees.length > 0) {
          expect(res.body.employees[0]).to.not.have.property('salary');
        }
      });
    });

    describe('Error / Validation cases', () => {
      it('Verify 404 is returned when retrieving employees for a non-existent project', async () => {
        const res = await request(app)
          .get('/projects/99999/employees')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Project not found');
      });
  
  
      it('Verify project ID format is validated when retrieving employees', async () => {
        const res = await request(app)
          .get('/projects/invalid/employees')
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const idError = res.body.errors.find(err => err.msg === 'Project ID must be a positive integer');
        expect(idError).to.exist;
        expect(idError.param).to.equal('id');
      });
    });
  });
  /* ============================
     DELETE /projects/:id/employees/employeeId
  ============================ */
  describe('DELETE /projects/:id/employees/employeeId', () => {
    describe('Success cases', () => {
      it('Verify admin can remove an employee from a project', async () => {
        const res = await request(app)
          .delete(`/projects/${testProjectId}/employees/${employeeId}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Employee removed from project successfully');
      });
    });

    describe('Validation / Error cases', () => {
      it('Verify employee ID in path parameters is validated when deleting from a project', async () => {
        const res = await request(app)
          .delete(`/projects/${testProjectId}/employees/invalid`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(400);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('errors');
  
        const employeeIdError = res.body.errors.find(err => err.msg === 'Employee ID must be a positive integer');
        expect(employeeIdError).to.exist;
        expect(employeeIdError.param).to.equal('employeeId');
      });
    });
  });
  /* ============================
     DELETE /projects/:id
  ============================ */  
  describe('DELETE /projects/:id', () => {
    describe('Success cases', () => {
      it('Verify admin can delete a project', async () => {
        const res = await request(app)
          .delete(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(200);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('message', 'Project deleted successfully');
      });
    });

    describe('Error / Authorization cases', () => {
      it('Verify deleting a non-existent project returns 404', async () => {
        const res = await request(app)
          .delete(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${adminToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(404);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Project not found');
      });
  
      it('Verify employee cannot delete project', async () => { 
        const res = await request(app)
          .delete(`/projects/${testProjectId}`)
          .set('Authorization', `Bearer ${employeeToken}`);
  
        console.log('Response body:', res.body);
  
        expect(res.status).to.equal(403);
        expect(res.headers['content-type']).to.match(/json/);
        expect(res.body).to.have.property('error', 'Access denied');
      });
    });
  });
});
