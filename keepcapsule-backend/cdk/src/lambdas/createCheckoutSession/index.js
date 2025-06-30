const AWS = require("aws-sdk");
const stripeLib = require("stripe");

const dynamo = new AWS.DynamoDB.DocumentClient();
let stripe;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'OPTIONS,POST',
};

exports.handler = async (event) => {
  console.log("📣 Lambda started");
  console.log("📩 Event:", JSON.stringify(event));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: 'OK',
    };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { email, priceId } = body || {};

    if (!email || !priceId) {
      console.error("❌ Missing email or priceId", { email, priceId });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Missing email or priceId" }),
      };
    }

    if (!stripe) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) throw new Error("STRIPE_SECRET_KEY is undefined");
      stripe = stripeLib(secretKey);
    }

    // ✅ Create session using customer_email directly (no need to pre-create a customer here)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      metadata: {
        email,
      },
      success_url: `http://localhost:5173/set-password?sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/`,
    });

    // Store the user with a placeholder customer ID (will be filled after webhook)
    await dynamo.put({
      TableName: process.env.USERS_TABLE_NAME,
      Item: {
        email,
        customerId: 'pending',
        subscriptionId: 'pending',
        createdAt: new Date().toISOString(),
      },
    }).promise();

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("🔥 Checkout Lambda Error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Internal error", error: err.message }),
    };
  }
};
