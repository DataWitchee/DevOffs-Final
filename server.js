
import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

dotenv.config();

const app = express();
// Safely handle missing key for local dev startup (will fail on request if missing)
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({ error: "Server Misconfiguration: Stripe Secret Key missing." });
  }

  const { userId, email, returnUrl, type, plan } = req.body;
  
  // SECURITY ENFORCEMENT: Fixed Pricing Logic
  // No client-side price manipulation allowed.
  let productName = 'Professional Certification Exam';
  let amount = 5000; // STRICT $50.00
  let description = 'One-time access. Non-refundable.';
  
  if (type === 'subscription') {
    productName = 'PSN Verified Membership';
    if (plan === 'yearly') {
        amount = 30000; // $300.00
        description = 'Yearly Verified Membership';
    } else {
        amount = 2900; // $29.00
        description = 'Monthly Verified Membership';
    }
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
              images: ['https://cdn-icons-png.flaticon.com/512/2921/2921222.png'], 
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?payment_canceled=true`,
      metadata: {
        userId,
        product: type,
        security_token: `SECURE_${Date.now()}_${userId}` // Traceability
      },
      customer_email: email,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error("Stripe Error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Start Server
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
