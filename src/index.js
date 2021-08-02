'use strict';

const Promise = require('bluebird');
const { putFunctionParameters } = require('../lib/parameters/functions');
const { SSMClient } = require('@aws-sdk/client-ssm');
const { LambdaClient } = require('@aws-sdk/client-lambda');

// TODO: Implement LUT
// TODO: Break out updates

class ServerlessPluginSSMParameterize {
  get config() {
    const config = Object.assign(
      {
        functionBasePath: '/parameterize',
        functionPublish: true,
        tier: 'Standard',
        lutPublish: true,
        lutBasePath: '/parameterize/lut',
      },
      (this.serverless.service.custom && this.serverless.service.custom.ssmParameterize) || {}
    );
    return config;
  }

  get awsConfig() {
    const awsConfig = Object.assign(
      {
        profile: null,
        region: null,
      },
      {
        profile: this.options['aws-profile'],
        region: this.serverless.service.provider.region,
      }
    );
    return awsConfig;
  }

  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = serverless.getProvider('aws');

    // this.serviceName = serverless.service.serviceObject.name;

    this.lambdaClient = new LambdaClient(this.awsConfig);
    this.ssmClient = new SSMClient(this.awsConfig);

    const publish = () => {
      // console.log(arguments, this.options, 'wut');
      return Promise.bind(this).then(putFunctionParameters);
    };

    this.hooks = {
      // 'after:deploy:finalize': () => {
      //   // console.log(this.serverless.service.provider.compiledCloudFormationTemplate.Resources);

      //   const serviceName = this.serverless.service.serviceObject.name;
      //   const serviceFunctions = this.serverless.service.getAllFunctions();

      //   serviceFunctions.forEach((serviceFunction) => {
      //     const thisFunction = this.serverless.service.getFunction(serviceFunction);
      //     // console.log(serviceFunction, thisFunction);
      //   });
      // },
      'after:deploy:finalize': publish,
    };
  }
}

module.exports = ServerlessPluginSSMParameterize;
