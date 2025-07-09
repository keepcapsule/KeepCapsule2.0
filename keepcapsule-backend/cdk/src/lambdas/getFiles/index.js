const AWS = require('aws-sdk');
const { getUserFromEvent } = require('./authUtils.js');

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TABLE = process.env.FILE_TABLE_NAME;
const S3_BUCKET = process.env.UPLOAD_BUCKET;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };

  try {
    const user = getUserFromEvent(event);
    const email = user.email;

    const result = await dynamo.query({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }).promise();

    const files = await Promise.all((result.Items || []).map(async (item) => {
      let restoreStatus = null;

      try {
        const head = await s3.headObject({ Bucket: S3_BUCKET, Key: item.sk }).promise();
        const storageClass = head.StorageClass || 'STANDARD';
        const restoreHeader = head.Restore || '';

        if (['GLACIER', 'DEEP_ARCHIVE', 'GLACIER_IR'].includes(storageClass)) {
          if (restoreHeader.includes('ongoing-request="true"')) {
            restoreStatus = 'restoring';
          } else if (restoreHeader.includes('ongoing-request="false"')) {
            restoreStatus = 'restored';
          } else {
            restoreStatus = 'archived';
          }
        }
      } catch (err) {
        console.error('HeadObject failed:', item.sk, err.message);
      }

      return {
        key: item.sk,
        title: item.title,
        type: item.type,
        size: item.size,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${encodeURIComponent(item.sk)}`,
        createdAt: item.createdAt,
        restoreStatus
      };
    }));

    const storageUsedMB = files.reduce((acc, f) => acc + (f.size || 0), 0) / (1024 * 1024);
    const retrievalsUsedMB = storageUsedMB * 0.25;
    const meta = {
      storageUsedMB: parseFloat(storageUsedMB.toFixed(2)),
      storageLimitMB: 5120,
      retrievalsUsedMB: parseFloat(retrievalsUsedMB.toFixed(2)),
      retrievalLimitMB: 5120,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ files, meta }),
    };
  } catch (err) {
    console.error('❌ GetFiles error:', err.message);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Unauthorized or failed to retrieve files' }),
    };
  }
};
