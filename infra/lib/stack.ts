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
    const cognito = new Cognito(this, 'Cognito', {
      googleClientId: this.node.tryGetContext('googleClientId') as string,
      googleClientSecretName: this.node.tryGetContext(
        'googleClientSecretName',
      ) as string,
      domainPrefix: this.node.tryGetContext('cognitoDomainPrefix') as string,
      callbackUrls: this.node.tryGetContext('cognitoCallbackUrls') as Array<string>,
      logoutUrls: this.node.tryGetContext('cognitoLogoutUrls') as Array<string>,
    });
    const server = new Server(this, 'Server', {
      database: database.instance,
      cognito: {
        userPoolId: cognito.userPool.userPoolId,
        userPoolClientId: cognito.userPoolClient.userPoolClientId,
      },
    });

    // Lambda runs outside the VPC — allow inbound from internet so Lambda can reach RDS
    database.instance.connections.allowFromAnyIpv4(ec2.Port.tcp(5432));

    const restApi = new ApiGateway(this, 'ApiGateway', { function: server.function });
    const bucket = new AssetBucket(this, 'Bucket');
    const distribution = new Distribution(this, 'Distribution', {
      restApi: restApi.webappApi,
      bucket: bucket.assetsBucket,
    });
    new AssetDeployment(this, 'Deployment', {
      bucket: bucket.assetsBucket,
      distribution: distribution.distribution,
    });
  }
}
