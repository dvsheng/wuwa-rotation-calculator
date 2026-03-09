import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

import { ApiGateway } from './constructs/ApiGateway';
import { AssetBucket } from './constructs/AssetBucket';
import { AssetDeployment } from './constructs/AssetDeployment';
import { Cognito } from './constructs/Cognito';
import { Database } from './constructs/Database';
import { Distribution } from './constructs/Distribution';
import { Server } from './constructs/Server';

export class WuwaRotationBuilderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, properties?: cdk.StackProps) {
    super(scope, id, properties);

    // Minimal VPC — RDS requires one, but Lambda runs outside it.
    // Public subnets only: no NAT gateways, no interface endpoints, no cost.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC }],
    });

    const database = new Database(this, 'Database', { vpc });

    // Lambda runs outside the VPC — allow inbound from internet so Lambda can reach RDS
    database.instance.connections.allowFromAnyIpv4(ec2.Port.tcp(5432));

    // Build Distribution first so its domain name can be wired into Cognito's allowed URLs.
    const bucket = new AssetBucket(this, 'Bucket');
    // Server/API are needed by Distribution — build them before Cognito too.
    // Cognito IDs are passed to Server as env vars; Server has no deploy-time dep on Cognito.
    const server = new Server(this, 'Server', { database: database.instance });
    const restApi = new ApiGateway(this, 'ApiGateway', { function: server.function });
    const distribution = new Distribution(this, 'Distribution', {
      restApi: restApi.webappApi,
      bucket: bucket.assetsBucket,
    });

    const distributionUrl = `https://${distribution.distribution.distributionDomainName}`;
    const localUrl = 'http://localhost:3000';

    const cognito = new Cognito(this, 'Cognito', {
      googleClientId: this.node.tryGetContext('googleClientId') as string,
      googleClientSecretName: this.node.tryGetContext(
        'googleClientSecretName',
      ) as string,
      domainPrefix: this.node.tryGetContext('cognitoDomainPrefix') as string,
      callbackUrls: [localUrl, distributionUrl],
      logoutUrls: [localUrl, distributionUrl],
    });

    // Add Cognito env vars after both Server and Cognito are constructed
    server.function.addEnvironment('COGNITO_USER_POOL_ID', cognito.userPool.userPoolId);
    server.function.addEnvironment(
      'COGNITO_USER_POOL_CLIENT_ID',
      cognito.userPoolClient.userPoolClientId,
    );

    new AssetDeployment(this, 'Deployment', {
      bucket: bucket.assetsBucket,
      distribution: distribution.distribution,
    });
  }
}
