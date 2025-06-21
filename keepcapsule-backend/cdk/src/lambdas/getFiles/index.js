const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.FILE_TABLE_NAME;
const S3_BUCKET = process.env.UPLOAD_BUCKET;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
  };

  const email = event.queryStringParameters?.email;
  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing email query parameter' }),
    };
  }

  try {
    const result = await dynamo.query({
      TableName: TABLE,
      KeyConditionExpression: 'pk = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
    }).promise();

    const files = (result.Items || []).map((item) => ({
      key: item.sk,
      title: item.title,
      type: item.type,
      size: item.size,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${encodeURIComponent(item.sk)}`,
      createdAt: item.createdAt,
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
    console.error('❌ Error retrieving files from DynamoDB:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to retrieve files', details: err.message }),
    };
  }
};