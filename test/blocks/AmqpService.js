/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const expect = require('chai').expect,
  EventEmitter = require('events'),
  AmqpService = require('../../AmqpService'),
  Promise = require('bluebird'),
  config = require('../config');

module.exports = (ctx) => {

  afterEach(async () => {
    if (ctx.amqp.queue)
      await ctx.amqp.channel.deleteQueue(ctx.amqp.queue.queue);
    await Promise.delay(1000);
  });


  it('construct without parameters - errors', async () => {
    expect( function () { new AmqpService(); } ).to.throw();
  });


  it('construct with right parameters', async () => {
    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    expect(server.url).to.equal(config.rabbit.url);
    expect(server.exchange).to.equal(config.rabbit.exchange);
    expect(server.serviceName).to.equal(config.rabbit.serviceName);
    expect(server).instanceOf(EventEmitter);
    expect(server).instanceOf(AmqpService);
  });


  it('start() and close() - check that up', async () => {
    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    await server.start();

    expect(server.amqpInstance.connection.stream._readableState.ended).to.equal(false);
    expect(server.channel.connection.stream._readableState.ended).to.equal(false);

    await server.close();
  });

  
  it('addBind(routing) - check that bind on this and not another routing', async () => {
    const routing = `${config.rabbit.serviceName}.routing`;

    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    await server.start();
    await server.addBind('routing', 'message');

    await Promise.all([
      (async () =>{
        await ctx.amqp.channel.publish(config.rabbit.exchange, 'test', new Buffer(JSON.stringify({
          tx:125
        })));
        await ctx.amqp.channel.publish(config.rabbit.exchange, routing, new Buffer(JSON.stringify({
          tx:124
        })));
      })(),
      new Promise(res => server.on('message', (msg, routing) => {
        expect(routing).to.equal(routing);
        expect(msg).to.deep.equal({tx: 124});
        res();
      }))
    ]);
    await server.close();
  });

  it('delBind(routing) - connect to one, disconnect and connect to another - get only another', async () => {
    const routing =  `${config.rabbit.serviceName}.routing`;
    const secondRouting =  `${config.rabbit.serviceName}.test`;

    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    await server.start();
    await server.addBind('test', 'messageOne');
    await server.delBind('test');
    await server.addBind('routing', 'messageTwo');
    await Promise.delay(1000);
    await Promise.all([
      (async () =>{
        await ctx.amqp.channel.publish(config.rabbit.exchange, secondRouting, new Buffer(JSON.stringify({
          tx:123
        })));
        await ctx.amqp.channel.publish(config.rabbit.exchange, routing, new Buffer(JSON.stringify({
          tx:124
        })));
      })(),
      new Promise(res => server.on('messageTwo', (msg, routing) => {
        expect(routing).to.equal(routing);
        expect(msg).to.deep.equal({tx: 124});
        res();
      }))
    ]);
    await server.close();
  });


  it('addBind - connect to one and and connect to another - get two', async () => {
    const routing =  `${config.rabbit.serviceName}.routing`;
    const secondRouting =  `${config.rabbit.serviceName}.test`;

    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    await server.start();
    await server.addBind('test', 'messageOne');
    await server.addBind('routing', 'messageTwo');
    await Promise.delay(1000);
    await Promise.all([
      (async () =>{
        await ctx.amqp.channel.publish(config.rabbit.exchange, secondRouting, new Buffer(JSON.stringify({
          tx:123
        })));
        await ctx.amqp.channel.publish(config.rabbit.exchange, routing, new Buffer(JSON.stringify({
          tx:124
        })));
      })(),
      new Promise(res => server.on('messageOne', (msg, routing) => {
        expect(routing).to.equal(secondRouting);
        expect(msg).to.deep.equal({tx: 123});
        res();
      })),
      new Promise(res => server.on('messageTwo', (msg, routing) => {
        expect(routing).to.equal(routing);
        expect(msg).to.deep.equal({tx: 124});
        res();
      }))
    ]);
    await server.close();
  });



  it('publishMsg - send two msgs to two separate routings and read it', async () => {
    const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
    await server.start();
    await Promise.delay(1000);

    await ctx.amqp.channel.assertQueue('test_amqp', {autoDelete: true, durable: false, noAck: true});
    await ctx.amqp.channel.bindQueue('test_amqp', config.rabbit.exchange, 
      `${config.rabbit.serviceName}.test`);

    await ctx.amqp.channel.assertQueue('test_amqp2', {autoDelete: true, durable: false, noAck: true});
    await ctx.amqp.channel.bindQueue('test_amqp2', config.rabbit.exchange, 
      `${config.rabbit.serviceName}.test2`);
    
    await Promise.all([
      new Promise(res =>
        ctx.amqp.channel.consume('test_amqp', async msg => {
          if (!msg)
            return;
          const content = JSON.parse(msg.content);
          expect(content.tx).to.equal(123);
          await ctx.amqp.channel.deleteQueue('test_amqp');
          res();
        })
      ),
      new Promise(res =>
        ctx.amqp.channel.consume('test_amqp2', async msg => {
          if (!msg)
            return;
          const content = JSON.parse(msg.content);
          expect(content.tx).to.equal(124);
          await ctx.amqp.channel.deleteQueue('test_amqp2');
          res();
        })
      ),
      (async () =>{
        await server.publishMsg('test', {tx: 123});
        await server.publishMsg('test2', {tx: 124});
      })(),
    ]);
    await server.close();
  });

  /*it('start() and close abnormal() - and generate error', async () => {
        //generate error
        const server = new AmqpService(config.rabbit.url, config.rabbit.exchange, config.rabbit.serviceName);
        await server.start();
        expect(server.amqpInstance.connection.stream._readableState.ended).to.equal(false);
        expect(server.channel.connection.stream._readableState.ended).to.equal(false);
        await server.channel.close();
        await server.close();
  });*/

};
