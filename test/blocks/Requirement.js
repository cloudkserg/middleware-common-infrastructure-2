/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const expect = require('chai').expect,
  Requirement = require('../../Requirement');

module.exports = () => {

  it('construct without parameters - errors', async () => {
    expect( function () { new Requirement(); } ).to.throw();
  });

  it('construct without right parameters - errors', async () => {
    expect( function () { new Requirement('block'); } ).to.throw();
  });

  it('construct with right parameters with empty maxWait', async () => {
    const info = new Requirement('block', '1.0.0');
    expect(info.name).equal('block');
    expect(info.version).equal('1.0.0');
    expect(info.maxWait).equal(10000);
  });


  it('construct with right parameters with set maxWait', async () => {
    const info = new Requirement('block', '1.0.0', 5000);
    expect(info.name).equal('block');
    expect(info.version).equal('1.0.0');
    expect(info.maxWait).equal(5000);
  });

};
