const AWS = require('aws-sdk');
const { lookup } = require('mime-types');
const { getUserFromEvent } = require('./authUtils.js');

const s3 = new AWS.S3();
const dynamo = new AWS.DynamoDB.DocumentClient();

const BUCKET_NAME = process.env.FILE_BUCKET_NAME;
const TABLE = process.env.FILE_TABLE_NAME;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  };

  try {
    const user = getUserFromEvent(event);
    const email = user.email;

    const { base64Data, title, type, filename, mimeType } = JSON.parse(event.body || '{}');

    if (!title || !type || !base64Data || !filename || !mimeType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const key = `${email}/${Date.now()}-${filename}`;

    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    }).promise();

    await dynamo.put({
      TableName: TABLE,
      Item: {
        pk: email,
        sk: key,
        title,
        type,
        size: fileBuffer.length,
        createdAt: new Date().toISOString(),
      },
    }).promise();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Upload successful',
        file: {
          key,
          title,
          type,
          url: `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`,
        },
      }),
    };
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ message: 'Unauthorized or upload failed' }),
    };
  }
};
