'use strict';

const path = require('path');

const { GetFunctionCommand } = require('@aws-sdk/client-lambda');
const { PutParameterCommand } = require('@aws-sdk/client-ssm');

async function putFunctionParameters() {
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
      serviceFunctionSlug,
      'name'
    );
    const serviceFunctionParameterArnPath = path.join(
      this.config.functionBasePath,
      serviceFunctionSlug,
      'arn'
    );

    await this.ssmClient.send(
      new PutParameterCommand({
        Name: serviceFunctionParameterNamePath,
        Value: deployedFunctionName,
        Type: 'String',
        Overwrite: true,
        Tier: this.config.tier,
      })
    );

    this.serverless.cli.log(
      `Parameterize: ${serviceFunctionParameterNamePath}: ${deployedFunctionName}`
    );

    await this.ssmClient.send(
      new PutParameterCommand({
        Name: serviceFunctionParameterArnPath,
        Value: deployedFunctionArn,
        Type: 'String',
        Overwrite: true,
        Tier: this.config.tier,
      })
    );

    this.serverless.cli.log(
      `Parameterize: ${serviceFunctionParameterArnPath}: ${deployedFunctionArn}`
    );
  }
}

module.exports = { putFunctionParameters };
