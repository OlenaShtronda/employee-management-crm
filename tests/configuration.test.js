// tests/configuration.test.js
const { expect } = require('chai');
const config = require('../config/appConfig');

describe('Configuration security', () => {
  it('should have JWT_SECRET configured', () => {
    expect(config.jwtSecret).to.exist;
    expect(config.jwtSecret).to.not.equal('');
  });

  it('should have SECRET_WORD configured', () => {
    expect(config.secretWord).to.exist;
    expect(config.secretWord).to.not.equal('');
  });
});