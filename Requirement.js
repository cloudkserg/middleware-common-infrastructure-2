/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Kirill Sergeev <cloudkserg1
 **/
/**
 * 
 * @param {String} name 
 * @param {String} version 
 * @param {Number?} maxWait 
 * @returns {{String, String, Number}}
 */
module.exports  = (name, version, maxWait = 10000) => {
  return {
    name,
    version,
    maxWait
  };
};
