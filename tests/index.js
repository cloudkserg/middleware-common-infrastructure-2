/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11gmail.com>
 */
require('dotenv/config');
process.env.LOG_LEVEL = 'error';

const config = require('./config'),
  blockTests = require('./blocks'),
  amqp = require('amqplib'),
  ctx = {};

describe('core/commonInfrastructure', function () {

  before (async () => {
    ctx.amqp = {};
    ctx.amqp.instance = await amqp.connect(config.rabbit.url);
    ctx.amqp.channel = await ctx.amqp.instance.createChannel();
    await ctx.amqp.channel.assertExchange(config.rabbit.exchange, 'internal', {durable: false});
  });

  after (async () => {
    await ctx.amqp.instance.close();
  });


  describe('block', () => blockTests(ctx));
});
