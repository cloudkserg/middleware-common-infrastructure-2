/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const expect = require('chai').expect,
  config = require('../config'),
  Promise = require('bluebird'),
  AmqpService = require('../../AmqpService'),
  InfrastructureService = require('../../InfrastructureService'),
  InfrastructureInfo = require('../../InfrastructureInfo');


const getRabbit = () => {
  return new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
};

module.exports = (ctx) => {


  it('construct without parameters - errors', async () => {
    expect( function () { new InfrastructureService(); } ).to.throw();
  });

  it('construct without right parameters - errors', async () => {
    const info = new InfrastructureInfo({
      name: 'block',
      version: '2',
      requirements: {
        'balance': '3'
      }
    });
    expect( function () { new InfrastructureService(11, getRabbit()); } ).to.throw();
    expect( function () { new InfrastructureService(info, 4); } ).to.throw();
  });

  it('construct with right params', async () => {
    const info = new InfrastructureInfo({
      name: 'block',
      version: '1.0.0',
      requirements: {
        'balance': '1.0.0'
      }
    });
    let service = new InfrastructureService(info, getRabbit(), {checkIntervalTime: 20000});
    expect(service.checkIntervalTime).to.eq(20000);
    expect(service).to.instanceof(InfrastructureService);

    service = new InfrastructureService(info, getRabbit());
    expect(service.checkIntervalTime).to.eq(10000);
    expect(service).to.instanceof(InfrastructureService);
  });


  it('start infrastructure - get request about your version and send my version', async () => {
    const info = new InfrastructureInfo({
      name: 'block',
      version: '1.0.0',
      requirements: {}
    });
    const service = new InfrastructureService(info, getRabbit());
    await service.start();


    await ctx.amqp.channel.assertQueue('test_infrastructure', {autoDelete: true, durable: false, noAck: true});
    await ctx.amqp.channel.bindQueue('test_infrastructure', config.rabbit.exchange, 
      `${config.rabbit.serviceName}.block.checked`);

    await Promise.all([
      new Promise(res =>
        ctx.amqp.channel.consume('test_infrastructure', async msg => {
          if (!msg)
            return;
          const content = JSON.parse(msg.content);
          expect(content.version).to.equal('1.0.0');
          await ctx.amqp.channel.deleteQueue('test_infrastructure');
          res();
        })
      ),
      (async () => {
        await ctx.amqp.channel.publish(config.rabbit.exchange, 
          `${config.rabbit.serviceName}.block.checking`, new Buffer(JSON.stringify({v: 1})));
      })()
    ]);


    await service.close();
  });


  it('start infrastructure with one service - get request about one requirement and send right respond to it', async () => {
    const info = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const service = new InfrastructureService(info, getRabbit());
    await service.start();

    let resultError = false;
    service.on(InfrastructureService.REQUIREMENT_ERROR, () => {
      resultError = true;
    });


    await ctx.amqp.channel.assertQueue('test_infra_block', 
      {autoDelete: true, durable: false, noAck: true});
    await ctx.amqp.channel.bindQueue('test_infra_block', config.rabbit.exchange, 
      `${config.rabbit.serviceName}.block.checking`);

    let resultSuccess = false;
    await Promise.all([
      new Promise(res =>
        ctx.amqp.channel.consume('test_infra_block', async msg => {
          if (!msg)
            return;
          const content = JSON.parse(msg.content);
          expect(content.version).to.equal('1.0.1');

          await ctx.amqp.channel.publish(config.rabbit.exchange, 
            `${config.rabbit.serviceName}.block.checked`,
            new Buffer(JSON.stringify({ version: '1.0.1' }))
          );
          res();
        })
      ),
      (async () => {
        resultSuccess = await service.checkRequirements();
      })()
    ]);
    await ctx.amqp.channel.deleteQueue('test_infra_block');

    expect(resultSuccess).to.eq(true);
    expect(resultError).to.eq(false);
    await service.close();
  });


  it('start infrastructure with two service - get request about one requirement and send right respond to it', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '1.0.1',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(InfrastructureService.REQUIREMENT_ERROR, () => {
      balanceError = true;
    });

    let blockError = false;
    serviceBlock.on(InfrastructureService.REQUIREMENT_ERROR, () => {
      blockError = true;
    });

    let checkedResult = await serviceBlock.checkRequirements();
    expect(checkedResult).to.eq(true);


    checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(true);

    expect(balanceError).to.eq(false);
    expect(blockError).to.eq(false);

    await serviceBalance.close();
    await serviceBlock.close();
  });


  it('start infrastructure with two service - check only major version - success', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '1.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(InfrastructureService.REQUIREMENT_ERROR, () => {
      balanceError = true;
    });

    let blockError = false;
    serviceBlock.on(InfrastructureService.REQUIREMENT_ERROR, () => {
      blockError = true;
    });

    let checkedResult = await serviceBlock.checkRequirements();
    expect(checkedResult).to.eq(true);


    checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(true);

    expect(balanceError).to.eq(false);
    expect(blockError).to.eq(false);

    await serviceBalance.close();
    await serviceBlock.close();
  });



  it('start infrastructure with two requirement services - first not right, second right - error', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1',
        'rest': '1.1.0'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoRest = new InfrastructureInfo({
      name: 'rest',
      version: '2.0.1',
      requirements: {
      }
    });
    const serviceRest = new InfrastructureService(infoRest, getRabbit());
    await serviceRest.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '1.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
      expect(requirement.name).to.eq('rest');
      expect(version).to.eq('2.0.1');
      balanceError = true;
    });

    let checkedResult = await serviceRest.checkRequirements();
    expect(checkedResult).to.eq(true);
    checkedResult = await serviceBlock.checkRequirements();
    expect(checkedResult).to.eq(true);
    checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(false);

    expect(balanceError).to.eq(true);

    await serviceRest.close();
    await serviceBalance.close();
    await serviceBlock.close();
  });

  it('start infrastructure with two service - two not right - error', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1',
        'rest': '1.0.1',
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoRest = new InfrastructureInfo({
      name: 'rest',
      version: '2.2.0',
      requirements: {}
    });
    const serviceRest = new InfrastructureService(infoRest, getRabbit());
    await serviceRest.start();


    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '2.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
      expect(requirement.name).to.oneOf(['rest', 'block']);
      expect(version).to.oneOf(['2.1.2', '2.2.0']);
      balanceError = true;
    });

    const checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(false);

    expect(balanceError).to.eq(true);

    await serviceRest.close();
    await serviceBalance.close();
    await serviceBlock.close();
  });

  it('start infrastructure without requirements service - all right', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    let balanceError = false;
    serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
      balanceError = true;
    });

    const checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(true);

    expect(balanceError).to.eq(false);

    await serviceBalance.close();
  });


  it('start infrastructure with one requirement service and two other version services - one with right version - success', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoBlock2 = new InfrastructureInfo({
      name: 'block',
      version: '1.0.1',
      requirements: {
      }
    });
    const serviceBlock2 = new InfrastructureService(infoBlock2, getRabbit());
    await serviceBlock2.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '2.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
      balanceError = true;
    });

    const checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(true);

    expect(balanceError).to.eq(false);

    await serviceBalance.close();
    await serviceBlock.close();
    await serviceBlock2.close();
  });


  it('start infrastructure with one requirement service - not right - error', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit());
    await serviceBalance.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '2.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();


    let balanceError = false;
    serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
      expect(requirement.name).to.eq('block');
      expect(version).to.eq('2.1.2');
      balanceError = true;
    });

    let checkedResult = await serviceBlock.checkRequirements();
    expect(checkedResult).to.eq(true);
    checkedResult = await serviceBalance.checkRequirements();
    expect(checkedResult).to.eq(false);

    expect(balanceError).to.eq(true);

    await serviceBalance.close();
    await serviceBlock.close();
  });

  it ('checkPeriodically - one service not right - get error', async () => {
    const infoBalance = new InfrastructureInfo({
      name: 'balance',
      version: '1.0.1',
      requirements: {
        'block': '1.0.1'
      }
    });
    const serviceBalance = new InfrastructureService(infoBalance, getRabbit(), 2000);
    await serviceBalance.start();

    const infoBlock = new InfrastructureInfo({
      name: 'block',
      version: '2.1.2',
      requirements: {
      }
    });
    const serviceBlock = new InfrastructureService(infoBlock, getRabbit());
    await serviceBlock.start();

    await Promise.all([
      new Promise(res => {
        serviceBalance.on(serviceBalance.REQUIREMENT_ERROR, (requirement, version) => {
          expect(requirement.name).to.eq('block');
          expect(version).to.eq('2.1.2');
          res();
        });
      }),
      (async () => {
        serviceBalance.periodicallyCheck();
      })()
    ]);

    await serviceBalance.close();
    await serviceBlock.close();
  });

};
