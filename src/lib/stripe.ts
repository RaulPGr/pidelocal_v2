import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-27.acacia', // Use latest or pinned version
    typescript: true,
});

export const STRIPE_CONFIG = {
    CURRENCY: 'eur',
    PLANS: {
        starter: {
            priceId: process.env.STRIPE_PRICE_STARTER, // 'price_...'
            name: 'Starter',
        },
        medium: {
            priceId: process.env.STRIPE_PRICE_MEDIUM,
            name: 'Medium',
        },
        premium: {
            priceId: process.env.STRIPE_PRICE_PREMIUM,
            name: 'Premium',
        }
    }
};
