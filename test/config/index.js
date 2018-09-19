/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
module.exports = {
  rabbit: {
    exchange: process.env.RABBIT_EXCHANGE || 'internal',
    url: process.env.RABBIT_URI || 'amqp://localhost:5672',
    serviceName: process.env.RABBIT_SERVICE_NAME || 'infrastructure'
  }
};
