import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import type { Construct } from 'constructs';

import { ApiGateway } from './constructs/ApiGateway';
import { AssetBucket } from './constructs/AssetBucket';
import { AssetDeployment } from './constructs/AssetDeployment';
import { Database } from './constructs/Database';
import { Distribution } from './constructs/Distribution';
import { Server } from './constructs/Server';

export class WuwaRotationBuilderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, properties?: cdk.StackProps) {
    super(scope, id, properties);

    const appDomainName =
      (this.node.tryGetContext('domainName') as string | undefined) ?? 'iriscalcs.moe';
    const wwwDomainName = `www.${appDomainName}`;
    const appUrl =
      (this.node.tryGetContext('appUrl') as string | undefined) ??
      `https://${appDomainName}/`;

    // Minimal VPC — RDS requires one, but Lambda runs outside it.
    // Public subnets only: no NAT gateways, no interface endpoints, no cost.
    const vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: 'Public', subnetType: ec2.SubnetType.PUBLIC }],
    });

    if (this.region !== 'us-east-1') {
      throw new Error(
        'CloudFront viewer certificates must be created in us-east-1. Deploy this stack in us-east-1 or split the certificate into a dedicated us-east-1 stack.',
      );
    }

    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: appDomainName,
    });
    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: appDomainName,
      subjectAlternativeNames: [wwwDomainName],
      validation: acm.CertificateValidation.fromDns(hostedZone),
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
      certificate,
      restApi: restApi.webappApi,
      bucket: bucket.assetsBucket,
      domainNames: [appDomainName, wwwDomainName],
    });

    const distributionAliasTarget = route53.RecordTarget.fromAlias(
      new route53Targets.CloudFrontTarget(distribution.distribution),
    );

    new route53.ARecord(this, 'AppDomainARecord', {
      recordName: appDomainName,
      target: distributionAliasTarget,
      zone: hostedZone,
    });
    new route53.AaaaRecord(this, 'AppDomainAaaaRecord', {
      recordName: appDomainName,
      target: distributionAliasTarget,
      zone: hostedZone,
    });
    new route53.ARecord(this, 'WwwDomainARecord', {
      recordName: wwwDomainName,
      target: distributionAliasTarget,
      zone: hostedZone,
    });
    new route53.AaaaRecord(this, 'WwwDomainAaaaRecord', {
      recordName: wwwDomainName,
      target: distributionAliasTarget,
      zone: hostedZone,
    });

    const googleClientSecretName = this.node.tryGetContext(
      'googleClientSecretName',
    ) as string;
    const betterAuthSecretName = this.node.tryGetContext(
      'betterAuthSecretName',
    ) as string;
    const discordCapabilityIssueWebhookSecretName = this.node.tryGetContext(
      'discordCapabilityIssueWebhookSecretName',
    ) as string;

    server.function.addEnvironment('BETTER_AUTH_URL', appUrl);
    server.function.addEnvironment(
      'GOOGLE_CLIENT_ID',
      this.node.tryGetContext('googleClientId') as string,
    );
    server.function.addEnvironment(
      'GOOGLE_CLIENT_SECRET',
      cdk.SecretValue.secretsManager(googleClientSecretName).unsafeUnwrap(),
    );
    server.function.addEnvironment(
      'BETTER_AUTH_SECRET',
      cdk.SecretValue.secretsManager(betterAuthSecretName).unsafeUnwrap(),
    );
    server.function.addEnvironment(
      'DISCORD_CAPABILITY_ISSUE_WEBHOOK_URL',
      cdk.SecretValue.secretsManager(
        discordCapabilityIssueWebhookSecretName,
      ).unsafeUnwrap(),
    );
    new AssetDeployment(this, 'Deployment', {
      bucket: bucket.assetsBucket,
      distribution: distribution.distribution,
    });

    new cdk.CfnOutput(this, 'AppUrl', {
      value: appUrl,
    });
    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'HostedZoneNameServers', {
      value: cdk.Fn.join(', ', hostedZone.hostedZoneNameServers ?? []),
    });
  }
}
