import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class AssetBucket extends Construct {
  readonly assetsBucket: Bucket;
  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.assetsBucket = new Bucket(this, 'Bucket');
  }
}
