import {
  EndpointType,
  LambdaRestApi,
  ResponseTransferMode,
} from 'aws-cdk-lib/aws-apigateway';
import type { Function } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

type ApiGatewayProperties = {
  function: Function;
};

export class ApiGateway extends Construct {
  readonly webappApi: LambdaRestApi;

  constructor(scope: Construct, id: string, properties: ApiGatewayProperties) {
    super(scope, id);

    this.webappApi = new LambdaRestApi(this, 'Api', {
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      handler: properties.function,
      integrationOptions: {
        responseTransferMode: ResponseTransferMode.STREAM,
      },
    });
  }
}
