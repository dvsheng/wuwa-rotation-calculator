import path from 'node:path';

import type { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import type { Bucket } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

type AssetDeploymentProperties = {
  bucket: Bucket;
  distribution: Distribution;
};

export class AssetDeployment extends Construct {
  constructor(scope: Construct, id: string, properties: AssetDeploymentProperties) {
    super(scope, id);

    const { bucket, distribution } = properties;

    const sourcePath = path.join(__dirname, '../../../.output/public');

    new BucketDeployment(this, 'Deployment', {
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
      sources: [Source.asset(sourcePath)],
    });
  }
}
