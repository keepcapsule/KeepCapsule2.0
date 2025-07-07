const AWS = require('aws-sdk');
const { getUserFromEvent } = require('./authUtils');

const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILE_BUCKET_NAME;
const TABLE = process.env.FILE_TABLE_NAME;
const META_TABLE = process.env.META_TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  };

  try {
    const user = getUserFromEvent(event);
    const email = user.email;

    const { key } = JSON.parse(event.body || '{}');
    if (!key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing key' }),
      };
    }

    // 1. Check object storage class
    const head = await s3.headObject({ Bucket: BUCKET_NAME, Key: key }).promise();
    const storageClass = head.StorageClass || 'STANDARD';
    const isGlacier = ['GLACIER', 'DEEP_ARCHIVE', 'GLACIER_IR'].includes(storageClass);

    if (isGlacier) {
      const restoreHeader = head.Restore || '';
      const isRestoring = restoreHeader.includes('ongoing-request="true"');
      const isRestored = restoreHeader.includes('ongoing-request="false"');

      if (!restoreHeader || isRestoring) {
        await s3.restoreObject({
          Bucket: BUCKET_NAME,
          Key: key,
          RestoreRequest: {
            Days: 1,
            GlacierJobParameters: { Tier: 'Standard' },
          },
        }).promise();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ glacierNotice: true }),
        };
      }

      if (!isRestored) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ glacierNotice: true }),
        };
      }
    }

    // 2. Generate signed URL
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 60 * 5,
    });

    // 3. Get file size
    const { Item } = await dynamo.get({
      TableName: TABLE,
      Key: { pk: email, sk: key },
    }).promise();

    if (!Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: 'File metadata not found in database' }),
      };
    }

    const sizeBytes = Item.size || 0;
    const sizeMB = Math.max(1, Math.round(sizeBytes / 1024 / 1024));

    // 4. Track retrieval usage
    await dynamo.update({
      TableName: META_TABLE,
      Key: { pk: email },
      UpdateExpression: 'ADD retrievalsUsedMB :s',
      ExpressionAttributeValues: {
        ':s': sizeMB,
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: signedUrl }),
    };
  } catch (err) {
    console.error('❌ Download error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Failed to process download' }),
    };
  }
};
