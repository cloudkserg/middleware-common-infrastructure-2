/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg11@gmail.com>
*/
const _ = require('lodash'),
  Requirement = require('./Requirement');
/**
 * 
 * @param {{String, String, {String => String}}} config 
 */
module.exports = function InfrastructureInfo ({name, version, requirements}) {
  if (!version)
    throw new Error('not set version');
  if (!(requirements instanceof Object))
    throw new Error('not set requirements');
  this.name = name;
  this.version = version;
  this.requirements =_.chain(requirements)
    .toPairs()
    .map(pair => new Requirement(pair[0], pair[1]))
    .value();
};
