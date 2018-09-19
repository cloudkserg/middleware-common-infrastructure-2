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
module.exports  = function Requirement (name, version, maxWait = 4000) {
  if (!version) 
    throw new Error('not set version');
  this.name = name;
  this.version = version;
  this.maxWait = maxWait;
};
