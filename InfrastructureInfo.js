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
module.exports = ({name, version, requirements}) => {
  return {
    name,
    version,
    requirements: _.chain(requirements)
      .toPairs()
      .map(pair => new Requirement(pair[0], pair[1]))
      .value()
  };
};
