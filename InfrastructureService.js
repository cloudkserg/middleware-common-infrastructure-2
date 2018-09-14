/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 */
const Promise = require('bluebird'),
  EventEmitter = require('events');

const checkingKey = name => `${name}.checking`;
const checkedKey = name => `${name}.checked`;
const majorVersion = version => version.split('.')[0];
const verifyVersion = (version, compareVersion) => majorVersion(version) === majorVersion(compareVersion);

const CHECKED_MSG = 'checked';
const CHECKING_MSG = 'checking';

/**
 * Service for checking requirements own dependencies
 * and for send own version for required services
 * 
 * 
 * wait for msg with type=rabbitName.serviceName.checking  
 * and send msg with type=rabbitName.serviceName.checked with content={version: myVersion}
 * 
 * periodically for checkInterval checked own dependencies
 * for all dependencies:
 *     send msg with type=rabbitName.serviceName.checking
 *     wait msg with type=rabbitName.serviceName.checked
 *       and check that field version from msg content 
 *            in major version equals to major version of version requirement
 * 
 * @class InfrastructureService
 * @extends {EventEmitter}
 */
class InfrastructureService extends EventEmitter
{
  
  /**
   * Creates an instance of InfrastructureService.
   * @param {{name: String, version: String, requirements: function(new: ./Requirement[])}} info 
   * @param {function(new: ./AmqpService)} amqpService
   * @param {{checkInterval: String}} options
   * 
   * @memberOf InfrastructureService
   */
  constructor ({name, version, requirements}, amqpService, {checkInterval = 10000}) {
    super();
    this.name = name;
    this.version = version;
    this.requirements = requirements;
    this.rabbit = amqpService;
    this.checkInterval = checkInterval;
    this.REQUIREMENT_ERROR = 'requirement_error';
  }


  async _checkRequirements () {
    await Promise.map(this.requirements, this._checkRequirement.bind(this))
      .catch(e => { throw e; });
    return true;
  }

  async _sendMyVersion () {
    await this.rabbit.publishMsg(checkedKey(this.name), {
      version: this.version
    });
  }

  _requirementError (requirement, version) {
    this.emit(this.REQUIREMENT_ERROR, {
      requirement, version
    });
  }

  async _checkRequirement (requirement) {
    this.rabbit.addBind(checkedKey(requirement.name), CHECKED_MSG);

    let lastVersion;

    await Promise.all([
      new Promise(res => this.rabbit.on(CHECKED_MSG, ({version}) => {
        lastVersion = version;
        if (verifyVersion(version, requirement.version))
          res();
      })),
      (async () => {
        await this.rabbit.publishMsg(checkingKey(requirement.name));
      })(),
    ])
      .timeout(requirement.maxWait)
      .catch(Promise.TimeoutError, this._requirementError.bind(this, requirement, lastVersion));

    this.rabbit.delBind(checkedKey(requirement.name));
  }


  /**
   * function start rabbitmq server
   * 
   * @memberOf InfrastructureService
   */
  async start () {
    await this.rabbit.start();
    await this.rabbit.addBind(checkingKey(this.name), CHECKING_MSG);
    
    this.rabbit.on(CHECKING_MSG, async () =>  {
      await this._sendMyVersion();
    });
    
    setInterval(async () => {
      this._checkRequirements();
    }, this.checkInterval);
  }
}
module.exports = InfrastructureService;
