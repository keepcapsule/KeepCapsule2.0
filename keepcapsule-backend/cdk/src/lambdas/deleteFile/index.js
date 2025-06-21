const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();

const BUCKET = process.env.FILE_BUCKET_NAME;
const TABLE = process.env.FILE_TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  try {
    const { email, key } = JSON.parse(event.body || '{}');

    if (!email || !key) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing email or file key' }),
      };
    }

    // Delete from S3
    await s3.deleteObject({
      Bucket: BUCKET,
      Key: key,
    }).promise();

    // Delete from DynamoDB
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
    console.error('❌ Delete failed:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error deleting file', details: error.message }),
    };
  }
};