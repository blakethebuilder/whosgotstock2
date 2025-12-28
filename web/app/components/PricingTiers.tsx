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
      name: 'Public',
      description: 'External users and general access',
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-50',
      borderColor: 'border-red-200 dark:border-red-200'
    },
    {
      key: 'team_markup' as keyof PricingSettings,
      name: 'Team',
      description: 'Internal team members',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-50',
      borderColor: 'border-blue-200 dark:border-blue-200'
    },
    {
      key: 'management_markup' as keyof PricingSettings,
      name: 'Management',
      description: 'Management level access',
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={settings[tier.key]}
                  onChange={(e) => handleChange(tier.key, parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-sm font-bold text-center border border-gray-300 dark:border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-white text-gray-900 dark:text-gray-900"
                />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-600">%</span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {tier.key === 'public_markup' && 'Highest markup for external users'}
              {tier.key === 'team_markup' && 'Standard internal team pricing'}
              {tier.key === 'management_markup' && 'Reduced markup for management'}
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
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          Update Pricing
        </button>
      </div>
    </div>
  );
}