/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const expect = require('chai').expect,
  Requirement = require('../../Requirement'),
  InfrastructureInfo = require('../../InfrastructureInfo');

module.exports = () => {

  it('construct without parameters - errors', async () => {
    expect( function () { new InfrastructureInfo(); } ).to.throw();
  });

  it('construct without right parameters - errors', async () => {
    expect( function () { new InfrastructureInfo({
      name: 11,
      version: 12,
      badKey: 4
    }); } ).to.throw();
  });

  it('construct with requirements without object - errors', async () => {
    expect( function () { new InfrastructureInfo({
      name: 11,
      version: 12,
      requirements: 's234234234'
    }); } ).to.throw();
  });



  it('construct with right parameters with empty requirements', async () => {
    const info = new InfrastructureInfo({
      name: 'blockProcessor',
      version: '1.0.0',
      requirements: {}
    });
    expect(info.name).equal('blockProcessor');
    expect(info.version).equal('1.0.0');
    expect(info.requirements.length).equal(0);
  });

  it('construct with right parameters with one requirement', async () => {
    const info = new InfrastructureInfo({
      name: 'blockProcessor',
      version: '1.0.0',
      requirements: {
        'balanceProcessor': '1.0.0'
      }
    });
    expect(info.name).equal('blockProcessor');
    expect(info.version).equal('1.0.0');
    expect(info.requirements.length).equal(1);
    expect(info.requirements[0]).instanceOf(Requirement);
    expect(info.requirements[0].name).eq('balanceProcessor');
    expect(info.requirements[0].version).eq('1.0.0');
  });

  it('construct with right parameters with two requirements', async () => {
    const info = new InfrastructureInfo({
      name: 'blockProcessor',
      version: '1.0.0',
      requirements: {
        'balanceProcessor': '1.0.0',
        'rest': '2.0.0'
      }
    });
    expect(info.name).equal('blockProcessor');
    expect(info.version).equal('1.0.0');
    expect(info.requirements.length).equal(2);

    expect(info.requirements[0]).instanceOf(Requirement);
    expect(info.requirements[0].name).eq('balanceProcessor');
    expect(info.requirements[0].version).eq('1.0.0');

    expect(info.requirements[0]).instanceOf(Requirement);
    expect(info.requirements[0].name).eq('rest');
    expect(info.requirements[0].version).eq('2.0.0');
  });

};
