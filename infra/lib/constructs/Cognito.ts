import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface CognitoProperties {
  /** Google OAuth client ID (public — safe to store in cdk.json context) */
  googleClientId: string;
  /** Name of the AWS Secrets Manager secret holding the Google OAuth client secret */
  googleClientSecretName: string;
  /** Globally-unique prefix for the Cognito hosted UI domain */
  domainPrefix: string;
  /** Allowed OAuth callback URLs (must include your app's origin + '/') */
  callbackUrls: Array<string>;
  /** Allowed OAuth logout URLs */
  logoutUrls: Array<string>;
}

export class Cognito extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, properties: CognitoProperties) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Google IDP — requires an Authorized Redirect URI of
    // https://{domainPrefix}.auth.{region}.amazoncognito.com/oauth2/idpresponse
    // to be registered in the Google Cloud Console OAuth app.
    const googleProvider = new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool: this.userPool,
      clientId: properties.googleClientId,
      clientSecretValue: cdk.SecretValue.secretsManager(
        properties.googleClientSecretName,
      ),
      scopes: ['email', 'openid', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
      },
    });

    const domain = this.userPool.addDomain('Domain', {
      cognitoDomain: { domainPrefix: properties.domainPrefix },
    });

    this.userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: this.userPool,
      generateSecret: false,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: properties.callbackUrls,
        logoutUrls: properties.logoutUrls,
      },
    });

    // Ensure the identity provider is created before the app client
    this.userPoolClient.node.addDependency(googleProvider);

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description:
        'Cognito User Pool ID — set as VITE_COGNITO_USER_POOL_ID and COGNITO_USER_POOL_ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description:
        'Cognito User Pool Client ID — set as VITE_COGNITO_USER_POOL_CLIENT_ID and COGNITO_USER_POOL_CLIENT_ID',
    });

    new cdk.CfnOutput(this, 'HostedUiDomain', {
      value: domain.baseUrl(),
      description:
        'Cognito Hosted UI base URL (https://...) — strip https:// and set as VITE_COGNITO_DOMAIN',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: cdk.Stack.of(this).region,
      description: 'AWS region — set as VITE_COGNITO_REGION',
    });
  }
}
