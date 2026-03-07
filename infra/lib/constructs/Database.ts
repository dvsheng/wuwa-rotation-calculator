import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface DatabaseProperties {
  vpc: ec2.IVpc;
}

export class Database extends Construct {
  public readonly instance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, properties: DatabaseProperties) {
    super(scope, id);

    this.instance = new rds.DatabaseInstance(this, 'Instance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: properties.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      databaseName: 'wuwa_rotation_builder',
      iamAuthentication: true,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });
  }
}
