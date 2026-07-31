export interface LandingPlan {
  id: string;
  name: string;
  subtitle: string;
  priceMonthly: number;
  priceAnnual: number;
  contactsLimit: string;
  badge?: string;
  popular: boolean;
  features: string[];
  cta: string;
}

export const LAUNCHLY_PLANS: LandingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    subtitle: 'Automate, save time, stay connected',
    priceMonthly: 0,
    priceAnnual: 0,
    contactsLimit: '10',
    popular: false,
    cta: 'Continue with Free',
    features: [
      '1 Telegram Channel/Bot',
      'Basic automations (up to 4 active)',
      '1 user account',
      'Basic unified Inbox',
      'Self-serve Support',
      'Launchly branding',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    subtitle: 'Keep fans and community engaged',
    priceMonthly: 10,
    priceAnnual: 8,
    contactsLimit: '300',
    popular: false,
    cta: 'Get started',
    features: [
      '2 Telegram Channels/Bots',
      'Unlimited custom automations',
      '2 user accounts',
      'Basic Inbox + tags & reminders',
      'Email Support',
      'No Launchly branding',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'The "not a side hustle anymore" plan',
    priceMonthly: 20,
    priceAnnual: 16,
    contactsLimit: '1,500',
    badge: '+AI',
    popular: true,
    cta: 'Get started',
    features: [
      '4 Telegram Channels/Bots',
      'Advanced automations & AI convos',
      '3 user accounts',
      'Custom Inbox labels & rules',
      'AI Chat Assistant',
      'Email & Priority Support',
      'No Launchly branding',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    subtitle: 'Big boss energy, more advanced tools',
    priceMonthly: 99,
    priceAnnual: 79,
    contactsLimit: '15,000',
    badge: '+AI',
    popular: false,
    cta: 'Get started',
    features: [
      'Unlimited Channels/Bots (up to 100)',
      'Advanced automations & AI convos',
      'Unlimited users (up to 10)',
      'Shared team Inbox & assignments',
      'AI Chat Assistant',
      'Priority 24/7 Support',
      'Dedicated Success Manager',
      'No Launchly branding',
    ],
  },
];
