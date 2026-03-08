import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import type { Construct } from 'constructs';

import { ApiGateway } from './constructs/ApiGateway';
import { AssetBucket } from './constructs/AssetBucket';
import { AssetDeployment } from './constructs/AssetDeployment';
import { Bastion } from './constructs/Bastion';
import { Cognito } from './constructs/Cognito';
import { Database } from './constructs/Database';
import { Distribution } from './constructs/Distribution';
import { Server } from './constructs/Server';

export class WuwaRotationBuilderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, properties?: cdk.StackProps) {
    super(scope, id, properties);

    // natGateways: 0 — RDS is private; Lambda and RDS use isolated subnets.
    // Bastion is in the public subnet for SSM-based port forwarding.
    const vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 2, natGateways: 0 });

    // Lambda needs to reach Secrets Manager without internet access
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });
    // Lambda JWT verification needs Cognito User Pools JWKS/API access without internet access
    vpc.addInterfaceEndpoint('CognitoIdpEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.COGNITO_IDP,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    const database = new Database(this, 'Database', { vpc });
    const bastion = new Bastion(this, 'Bastion', { vpc });
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
      vpc,
      database: database.instance,
      cognito: {
        userPoolId: cognito.userPool.userPoolId,
        userPoolClientId: cognito.userPoolClient.userPoolClientId,
      },
    });

    // Allow Lambda and bastion to connect to RDS
    database.instance.connections.allowFrom(server.function, ec2.Port.tcp(5432));
    database.instance.connections.allowFrom(bastion.host, ec2.Port.tcp(5432));

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
