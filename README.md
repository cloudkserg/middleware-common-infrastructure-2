# middleware-common-infrastructure [![Build Status](https://travis-ci.org/ChronoBank/middleware-common-infrastructure.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-common-infrastructure)

# Infrastructure classes for middleware services


## AmqpService

service for bind on amqp (rabbitmq) and publish messages.

### How to work

Create and bind
```
const rabbit = new AmqpService('amqp://localhost:5672', 'internal', 'infrastructure');
await rabbit.start();
await rabbit.addBind('blockProcessor', 'BLOCK_PROCESSOR');
rabbit.on('BLOCK_PROCESSOR', data => {
    console.log(data);
});
await rabbit.delBind('blockProcessor');
await rabbit.close();
```

Create and publish
```
const rabbit = new AmqpService('amqp://localhost:5672', 'internal', 'infrastructure');
await rabbit.start();
await rabbit.publishMsg('blockProcessor', {msg: 'test msg'});
await rabbit.close();
```




## InfrastructureInfo

Service for parsing parameters for InfrastructureService from package.json

### How to work
```
const info = new InfrastructureInfo(require('./package.json'));
```



## InfrastructureService

service for start infrastructure 

```
This service checked all requirements of middleware through checkInterval by rabbitmq
    If at least for one middleware name not found required major version
        service emit EVENT=InfrastuctureService.REQUIREMENT_ERROR
        with data = {requirement: object of Requirement, version: last returned version}

Also this service send own version when get request from another middleware by rabbitmq
```

### How to work

```
const rabbit = new AmqpService('amqp://localhost:5672', 'internal', 'infrastructure');
const info = new InfrastructureInfo(require('./package.json'));
const infrastructure = new InfrastructureService(info, rabbit, {checkInterval: 10000});
infrastructure.on(infrastructure.REQUIREMENT_ERROR, ({requirement, version}) => {
    log.error(`Not found requirement with name ${requirement.name} version=${requirement.version}.` +
        ` Last version of this middleware=${version}`);
    process.exit(1);
})
await infrastucture.start();
```

License
----
 [GNU AGPLv3](LICENSE)


Copyright
----
LaborX PTY
