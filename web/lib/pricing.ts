import { UserRole } from '@/app/types';

export interface PricingSettings {
  public_markup: number;
  team_markup: number;
  management_markup: number;
  admin_markup: number;
}

export interface PriceResult {
  exVat: string;
  incVat: string;
}

/**
 * Calculate pricing based on user role and markup settings
 * Internal tool structure: Public > Team > Management > Admin
 */
export function calculatePrice(
  basePrice: string | number, 
  userRole: UserRole, 
  pricingSettings: PricingSettings
): PriceResult {
  const raw = typeof basePrice === 'string' ? parseFloat(basePrice) : basePrice;
  
  if (isNaN(raw) || raw < 0) {
    return { exVat: '0.00', incVat: '0.00' };
  }

  // Get markup percentage based on user role
  let markup = 0;
  switch (userRole) {
    case 'public':
      markup = pricingSettings.public_markup;
      break;
    case 'team':
      markup = pricingSettings.team_markup;
      break;
    case 'management':
      markup = pricingSettings.management_markup;
      break;
    case 'admin':
      markup = pricingSettings.admin_markup;
      break;
    default:
      markup = pricingSettings.public_markup; // Default to public tier
  }

  const markedUp = raw * (1 + (markup / 100));
  const withVat = markedUp * 1.15; // 15% VAT

  return {
    exVat: markedUp.toFixed(2),
    incVat: withVat.toFixed(2)
  };
}

/**
 * Format price for display with South African locale
 */
export function formatPrice(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Get markup percentage for a given user role
 */
export function getMarkupPercentage(userRole: UserRole, pricingSettings: PricingSettings): number {
  switch (userRole) {
    case 'public': return pricingSettings.public_markup;
    case 'team': return pricingSettings.team_markup;
    case 'management': return pricingSettings.management_markup;
    case 'admin': return pricingSettings.admin_markup;
    default: return pricingSettings.public_markup;
  }
}