const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  console.log('📩 Incoming event:', JSON.stringify(event, null, 2));

  const { email, priceId } = JSON.parse(event.body || '{}');

  if (!email || !priceId) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing email or priceId' }),
    };
  }

  try {
    const customer = await stripe.customers.create({ email });

    // ⛔ Detect based on priceId pattern (one-time payments usually have 'one_time' price type)
    const priceDetails = await stripe.prices.retrieve(priceId);
    const mode = priceDetails.recurring ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customer.id,
      success_url: `http://localhost:5173/set-password?email=${encodeURIComponent(email)}&customerId=${customer.id}&sessionId={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173`,
    });

    // Store basic info regardless of plan
    const item = {
      email,
      customerId: customer.id,
      subscriptionId: 'pending',
      createdAt: new Date().toISOString(),
    };

    await dynamo.put({
      TableName: process.env.USERS_TABLE_NAME,
      Item: item,
    }).promise();

    console.log('✅ Saved to DynamoDB:', item);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('🔥 Checkout error:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal error' }),
    };
  }
};
