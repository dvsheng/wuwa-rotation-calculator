import type { RestApi } from 'aws-cdk-lib/aws-apigateway';
import type { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  Distribution as CloudfrontDistribution,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { RestApiOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import type { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

type DistributionProperties = {
  restApi: RestApi;
  bucket: Bucket;
  certificate: ICertificate;
  domainNames: Array<string>;
};

export class Distribution extends Construct {
  public readonly distribution: CloudfrontDistribution;

  constructor(scope: Construct, id: string, properties: DistributionProperties) {
    super(scope, id);

    const { restApi, bucket, certificate, domainNames } = properties;

    const s3BucketOrigin = S3BucketOrigin.withOriginAccessControl(bucket);

    const defaultBehavior = {
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      origin: new RestApiOrigin(restApi),
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    const staticAssetBehavior = {
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      origin: s3BucketOrigin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    };

    this.distribution = new CloudfrontDistribution(this, 'Distribution', {
      additionalBehaviors: {
        '/assets/*': staticAssetBehavior,
        '/favicon.ico': staticAssetBehavior,
        '/images/*': staticAssetBehavior,
        '/site.webmanifest': staticAssetBehavior,
      },
      certificate,
      defaultBehavior,
      domainNames,
      priceClass: PriceClass.PRICE_CLASS_100,
    });
  }
}
