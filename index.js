require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'Compel Payment Server Running',
    timestamp: new Date().toISOString()
  });
});

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount (minimum 50 pence = £0.50)
    if (!amount || amount < 50) {
      return res.status(400).json({ 
        error: 'Invalid amount. Minimum donation is £0.50' 
      });
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in pence
      currency: 'gbp',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        app: 'Compel',
        type: 'donation',
      },
    });

    // Return the client secret to Flutter app
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

    console.log(`✅ Payment Intent created: ${paymentIntent.id} for £${amount/100}`);
  } catch (error) {
    console.error('❌ Error creating payment intent:', error.message);
    res.status(500).json({ 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Compel Payment Server running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
});