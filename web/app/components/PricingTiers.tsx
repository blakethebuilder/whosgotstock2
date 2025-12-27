'use client';

import { TierFeatures } from '../types';

const tiers: TierFeatures[] = [
  {
    name: 'Free',
    price: 'R0',
    searches: '25 searches/month',
    markup: '15% markup',
    features: [
      '25 searches per month',
      'Basic product information',
      'Watermarked quotes',
      'Community support'
    ],
    cta: 'Get Started'
  },
  {
    name: 'Professional',
    price: 'R399',
    searches: 'Unlimited searches',
    markup: '5% handling fee',
    features: [
      'Unlimited searches',
      'Professional quotes',
      'Supplier contact information',
      'Email support',
      'Analytics dashboard'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'R1599',
    searches: 'Unlimited searches',
    markup: 'No markup',
    features: [
      'Everything in Professional',
      'Multi-user accounts (10 users)',
      'White label solution',
      'Custom branding',
      'Priority support',
      'Full customization'
    ],
    cta: 'Contact Sales'
  }
];

interface PricingTiersProps {
  onSelectTier?: (tier: string) => void;
  currentTier?: string;
}

export default function PricingTiers({ onSelectTier, currentTier = 'free' }: PricingTiersProps) {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Get better pricing and more features as you grow your IT business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {tiers.map((tier, index) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl p-8 border-2 transition-all hover:shadow-xl ${
              tier.popular
                ? 'border-blue-500 bg-blue-50/50 scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${currentTier === tier.name.toLowerCase() ? 'ring-2 ring-green-500' : ''}`}
          >
            {tier.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
              <div className="mb-2">
                <span className="text-3xl font-black text-gray-900">{tier.price}</span>
                {tier.price !== 'R0' && <span className="text-gray-500">/month</span>}
              </div>
              <p className="text-sm text-gray-600">{tier.searches}</p>
              <p className="text-sm font-semibold text-blue-600">{tier.markup}</p>
            </div>

            <ul className="space-y-3 mb-8">
              {tier.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectTier?.(tier.name.toLowerCase())}
              disabled={currentTier === tier.name.toLowerCase()}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                currentTier === tier.name.toLowerCase()
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : tier.popular
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'
              }`}
            >
              {currentTier === tier.name.toLowerCase() ? 'Current Plan' : tier.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-600 text-sm">
          All plans include 14-day free trial • No setup fees • Cancel anytime
        </p>
      </div>
    </div>
  );
}