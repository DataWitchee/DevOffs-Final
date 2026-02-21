import Stripe from 'stripe';

// Required by Next.js / Vercel to allow raw body for Stripe signature parsing
export const config = {
    api: {
        bodyParser: false,
    },
};

// Helper to buffer the raw request body
async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !endpointSecret) {
        return res.status(500).json({ error: "Server misconfiguration. Missing Stripe secrets." });
    }

    const stripe = new Stripe(stripeSecretKey);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        const buf = await buffer(req);
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Server-side fulfillment logic here
        const userId = session.metadata.userId;
        const productType = session.metadata.productType; // 'exam' or 'subscription'

        console.log(`[Serverless Webhook] Payment Successful! User: ${userId}, Product: ${productType}`);
        // NOTE: Requires Firebase Admin SDK to update the firestore DB securely here.
    }

    res.status(200).json({ received: true });
}
