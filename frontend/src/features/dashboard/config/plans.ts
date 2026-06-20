export interface LandingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  popular: boolean;
}

export const LANDING_PLANS: LandingPlan[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 connected bot', '10 bot users', 'Basic flow builder', 'Community support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Starter',
    price: '$10',
    period: 'per month',
    features: ['2 connected bots', '300 bot users', 'Broadcast campaigns', 'Integrations', 'Priority support'],
    cta: 'Go Starter',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$20',
    period: 'per month',
    features: ['4 connected bots', '1,500 bot users', 'AI Agent automated chats', 'Stripe payments', '24/7 support'],
    cta: 'Go Pro',
    popular: true,
  },
  {
    name: 'Business',
    price: '$99',
    period: 'per month',
    features: ['100 connected bots', '15,000 bot users', 'AI Agent unlimited usage', 'Stripe payments', 'Dedicated manager'],
    cta: 'Go Business',
    popular: false,
  },
];
