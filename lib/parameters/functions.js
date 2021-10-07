'use strict';

const path = require('path');
const retry = require('retry');

const { GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { PutParameterCommand } = require('@aws-sdk/client-ssm');
const { sleep } = require('./util')

async function putFunctionParameters() {

  const ssmClient = this.ssmClient;
  const config = this.config;

  for (const serviceFunctionSlug of this.serverless.service.getAllFunctions()) {
    const serviceFunction = this.serverless.service.getFunction(serviceFunctionSlug);
    const serviceFunctionName = serviceFunction.name;

    const deployedFunction = await this.lambdaClient.send(
      new GetFunctionCommand({ FunctionName: serviceFunctionName })
    );

    const deployedFunctionArn =
      deployedFunction.Configuration && deployedFunction.Configuration.FunctionArn;
    const deployedFunctionName =
      deployedFunction.Configuration && deployedFunction.Configuration.FunctionName;

    const serviceFunctionParameterNamePath = path.join(
      this.config.functionBasePath,
      this.serverless.service.serviceObject.name,
      serviceFunctionSlug,
      'name'
    );
    const serviceFunctionParameterArnPath = path.join(
      this.config.functionBasePath,
      this.serverless.service.serviceObject.name,
      serviceFunctionSlug,
      'arn'
    );

    var operation = retry.operation({ retries: 3 });

    operation.attempt(async function (currentAttempt) {
      await ssmClient.send(
        new PutParameterCommand({
          Name: serviceFunctionParameterNamePath,
          Value: deployedFunctionName,
          Type: 'String',
          Overwrite: true,
          Tier: config.tier,
        })
      );
    });

    this.serverless.cli.log(
      `Parameterize: ${serviceFunctionParameterNamePath}: ${deployedFunctionName}`
    );

    await sleep(250);

    operation.attempt(async function (currentAttempt) {
      await ssmClient.send(
        new PutParameterCommand({
          Name: serviceFunctionParameterArnPath,
          Value: deployedFunctionArn,
          Type: 'String',
          Overwrite: true,
          Tier: config.tier,
        })
      );
    });

    this.serverless.cli.log(
      `Parameterize: ${serviceFunctionParameterArnPath}: ${deployedFunctionArn}`
    );

    await sleep(250);

  }
}

module.exports = { putFunctionParameters };
