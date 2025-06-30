const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
  };

  // 🔁 Handle preflight (CORS)
  if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: 'OK',
    };
  }

  console.log("🔔 Stripe webhook Lambda triggered...");
  console.log("📦 Raw event metadata:", {
    isBase64Encoded: event.isBase64Encoded,
    headers: event.headers,
  });

  const sig = event.headers["stripe-signature"];
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  if (!sig) {
    console.error("❌ Missing stripe-signature header");
    return {
      statusCode: 400,
      headers,
      body: "Missing stripe-signature",
    };
  }

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    console.log("✅ Verified Stripe event:", stripeEvent.type);
  } catch (err) {
    console.error("❌ Signature verification failed:", err.message);
    return {
      statusCode: 400,
      headers,
      body: "Webhook signature verification failed",
    };
  }

  // ✅ Process checkout.session.completed
  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const email = session.customer_email || session.metadata?.email;
    const customerId = session.customer;
    const subscriptionId = session.subscription ?? 'one-time';

    console.log("📨 Session data:", { email, customerId, subscriptionId });

    if (!email) {
      console.error("❌ No email in session object");
      return {
        statusCode: 400,
        headers,
        body: "Missing email",
      };
    }

    try {
      await dynamo.update({
        TableName: process.env.USERS_TABLE_NAME,
        Key: { email },
        UpdateExpression: "set isPaid = :paid, subscriptionId = :sub, customerId = :cust",
        ExpressionAttributeValues: {
          ":paid": true,
          ":sub": subscriptionId,
          ":cust": customerId,
        },
      }).promise();

      console.log("✅ DynamoDB user updated for", email);
      return {
        statusCode: 200,
        headers,
        body: "Success",
      };
    } catch (err) {
      console.error("🔥 DynamoDB update error:", err.message);
      return {
        statusCode: 500,
        headers,
        body: "DynamoDB update failed",
      };
    }
  }

  console.log("ℹ️ Ignored event type:", stripeEvent.type);
  return {
    statusCode: 200,
    headers,
    body: "Event ignored",
  };
};
