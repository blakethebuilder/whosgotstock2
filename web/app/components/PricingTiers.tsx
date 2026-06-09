'use client';

import { useState } from 'react';
import { PricingSettings } from '@/lib/pricing';

interface PricingTiersProps {
  pricingSettings: PricingSettings;
  onUpdate: (settings: PricingSettings) => void;
}

export default function PricingTiers({ pricingSettings, onUpdate }: PricingTiersProps) {
  const [settings, setSettings] = useState<PricingSettings>(pricingSettings);

  const handleUpdate = () => {
    onUpdate(settings);
  };

  const handleChange = (role: keyof PricingSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [role]: value
    }));
  };

  const tiers = [
    {
      key: 'public_markup' as keyof PricingSettings,
      name: 'Guest',
      description: 'External guest accounts access',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-50',
      borderColor: 'border-amber-200 dark:border-amber-200'
    },
    {
      key: 'team_markup' as keyof PricingSettings,
      name: 'Team',
      description: 'Internal team members',
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-50',
      borderColor: 'border-orange-200 dark:border-orange-200'
    },
    {
      key: 'management_markup' as keyof PricingSettings,
      name: 'Reseller',
      description: 'Reseller access tier (pays platform fee)',
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-50',
      borderColor: 'border-purple-200 dark:border-purple-200'
    },
    {
      key: 'admin_markup' as keyof PricingSettings,
      name: 'Admin',
      description: 'Full administrative access',
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-50',
      borderColor: 'border-green-200 dark:border-green-200'
    }
  ];

  return (
    <div className="bg-white dark:bg-white rounded-2xl shadow-sm border border-gray-200 dark:border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-900 mb-2">
          Internal Access Levels
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-600">
          Configure markup percentages for different internal access levels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {tiers.map((tier) => (
          <div
            key={tier.key}
            className={`p-4 rounded-xl border-2 ${tier.borderColor} ${tier.bgColor} transition-all hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                <div>
                  <h4 className={`font-bold ${tier.textColor}`}>
                    {tier.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {tier.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {(tier.key === 'team_markup' || tier.key === 'public_markup') ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={settings[tier.key]}
                      onChange={(e) => handleChange(tier.key, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm font-bold text-center border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-600">%</span>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-gray-700 bg-gray-200/60 dark:bg-gray-150 px-2 py-1 rounded-md">Fixed 0%</span>
                )}
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {tier.key === 'public_markup' && 'Customizable markup for external guest tier access'}
              {tier.key === 'team_markup' && 'Standard internal team pricing'}
              {tier.key === 'management_markup' && 'Resellers pay a platform fee and get cost pricing (0% markup)'}
              {tier.key === 'admin_markup' && 'Cost pricing for administrators'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-200">
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Changes apply to all new searches and quotes
        </div>
        <button
          onClick={handleUpdate}
          className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          Update Pricing
        </button>
      </div>
    </div>
  );
}