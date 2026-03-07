/**
 * Bastion to synchronize local database instance with RDS instance
 */
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface BastionProperties {
  vpc: ec2.IVpc;
}

export class Bastion extends Construct {
  public readonly host: ec2.BastionHostLinux;

  constructor(scope: Construct, id: string, properties: BastionProperties) {
    super(scope, id);

    // BastionHostLinux uses SSM by default — no SSH key or open ports needed
    this.host = new ec2.BastionHostLinux(this, 'Host', {
      vpc: properties.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    });
  }
}
