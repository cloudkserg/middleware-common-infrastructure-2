/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
 */
const infoTests = require('./InfrastructureInfo');

module.exports = (ctx) => {
  describe('InfrastructureInfo', () => infoTests(ctx));
};
