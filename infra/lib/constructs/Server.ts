import path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface ServerProperties {
  vpc: ec2.IVpc;
  database: rds.DatabaseInstance;
  cognito: {
    userPoolId: string;
    userPoolClientId: string;
  };
}

export class Server extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, properties: ServerProperties) {
    super(scope, id);

    const { vpc, database, cognito } = properties;

    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../.output/server')),
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      environment: {
        DATABASE_HOST: database.dbInstanceEndpointAddress,
        DATABASE_PORT: database.dbInstanceEndpointPort,
        DATABASE_NAME: 'wuwa_rotation_builder',
        // CDK generates RDS credentials with 'postgres' as the master username
        DATABASE_USERNAME: 'postgres',
        DATABASE_SECRET_ARN: database.secret?.secretArn ?? '',
        COGNITO_USER_POOL_ID: cognito.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: cognito.userPoolClientId,
      },
    });

    // Grant Lambda permission to read DB credentials from Secrets Manager
    database.secret?.grantRead(this.function);
  }
}
