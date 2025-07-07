const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();
const { getUserFromEvent } = require('./authUtils.js');

const BUCKET = process.env.FILE_BUCKET_NAME;
const TABLE = process.env.FILE_TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  try {
    const user = getUserFromEvent(event);
    const email = user.email;
    const { key } = JSON.parse(event.body || '{}');

    if (!key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing file key' }),
      };
    }

    await s3.deleteObject({ Bucket: BUCKET, Key: key }).promise();

    await dynamo.delete({
      TableName: TABLE,
      Key: {
        pk: email,
        sk: key,
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'File deleted successfully' }),
    };
  } catch (error) {
    console.error('❌ Delete error:', error.message);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Unauthorized or delete failed' }),
    };
  }
};
