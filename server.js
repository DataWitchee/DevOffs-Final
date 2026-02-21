import dotenv from 'dotenv';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';

// Internal Services
import { questionMutatorService } from './services/QuestionMutatorService.ts';
import { geminiService } from './services/GeminiService.ts';
import { debugRouter } from './routes/debug.ts';

dotenv.config();

const app = express();

console.log("=========================================");
console.log("SERVER STARTING FOR EMERGENCY DEMO...");
console.log("ENV CHECK - Gemini Key:", (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY) ? "LOADED" : "MISSING");
console.log("=========================================");

// -------------------------------------------------------------
// 1. Essential Setup (CRITICAL: ALLOW ALL ORIGINS FOR DEMO)
// -------------------------------------------------------------
app.use(cors({ origin: '*' }));

// Initialize Stripe if key exists
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Stripe Webhook (Must be RAW body, defined before express.json())
app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret || !stripe) return res.status(400).send(`Webhook Error: Secret missing.`);

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    if (event.type === 'checkout.session.completed') {
      console.log(`[Webhook] Payment successful for User ID: ${event.data.object.metadata?.userId}`);
    }
    res.send();
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

// JSON parser for all standard routes
app.use(express.json());


// -------------------------------------------------------------
// 2. Debugging Routes (The "Heartbeat")
// -------------------------------------------------------------
app.get('/', (req, res) => {
  res.send("DevOffs Backend is Live!");
});

app.get('/api/test', (req, res) => {
  res.json({
    status: "ok",
    time: new Date(),
    geminiKeyPresent: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
  });
});


// -------------------------------------------------------------
// 3. The Question Generation Routes
// -------------------------------------------------------------

// Local Fallback Constant
const FALLBACK_QUESTION = {
  title: "reverse-linked-list",
  mutatedDescription: "**Emergency Fallback Activated.**\n\nGiven the head of a singly linked list, reverse the list, and return the reversed list. Ensure your solution handles Edge Cases.",
  originalQuestion: {
    content: "Given the head of a singly linked list, reverse the list, and return the reversed list."
  }
};

// Pure Gemini Generation Endpoint (The Controller)
app.post('/api/question/random', async (req, res) => {
  try {
    const { difficulty, topic } = req.body;

    // Uses the new bulletproof GeminiService
    const questionData = await geminiService.generateQuestion(difficulty, topic);
    res.status(200).json(questionData);

  } catch (error) {
    console.error('Critical Error fetching gemini question:', error);
    // Silent fail-safe
    res.status(200).json(FALLBACK_QUESTION);
  }
});

// Support GET for backwards compatibility with the previous demo version
app.get('/api/question/random', async (req, res) => {
  try {
    const { difficulty, topic } = req.query;
    const questionData = await geminiService.generateQuestion(difficulty, topic);
    res.status(200).json(questionData);
  } catch (error) {
    console.error('Critical Error fetching gemini question:', error);
    res.status(200).json(FALLBACK_QUESTION);
  }
});

// Mutation Endpoint
app.get('/api/questions/mutate', async (req, res) => {
  try {
    const { problemId, theme } = req.query;
    const targetId = problemId || 'p1_two_sum';
    const mutatedQuestion = await questionMutatorService.mutateProblem(targetId, theme);
    return res.status(200).json(mutatedQuestion);
  } catch (error) {
    console.error("Mutation Route Error:", error);
    // Silent fail-safe
    return res.status(200).json(FALLBACK_QUESTION);
  }
});


// -------------------------------------------------------------
// 4. Remaining Essential Routes (Stripe / Auth / Debug)
// -------------------------------------------------------------
app.use('/api/debug', debugRouter);

app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: "Stripe missing." });

  const { userId, email, returnUrl, type } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Verified Membership' },
          unit_amount: 2900, // $29
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${returnUrl}?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?payment_canceled=true`,
      metadata: { userId, product: type },
      customer_email: email,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// -------------------------------------------------------------
// 5. Start Server Command
// -------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
