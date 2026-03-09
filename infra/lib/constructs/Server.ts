import path from 'node:path';

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import type * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface ServerProperties {
  database: rds.DatabaseInstance;
}

export class Server extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, properties: ServerProperties) {
    super(scope, id);

    const { database } = properties;

    this.function = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../.output/server')),
      memorySize: 512,
      // Match API Gateway timeout
      timeout: cdk.Duration.seconds(29),
      environment: {
        DATABASE_HOST: database.dbInstanceEndpointAddress,
        DATABASE_PORT: database.dbInstanceEndpointPort,
        DATABASE_NAME: 'wuwa_rotation_builder',
        // CDK generates RDS credentials with 'postgres' as the master username
        DATABASE_USERNAME: 'postgres',
        DATABASE_SECRET_ARN: database.secret?.secretArn ?? '',
      },
    });

    // Grant Lambda permission to read DB credentials from Secrets Manager
    database.secret?.grantRead(this.function);
  }
}
