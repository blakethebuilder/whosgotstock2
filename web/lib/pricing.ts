import { UserRole } from '@/app/types';

export interface PricingSettings {
  free_markup: number;
  professional_markup: number;
  enterprise_markup: number;
  staff_markup: number;
  partner_markup: number;
}

export interface PriceResult {
  exVat: string;
  incVat: string;
}

/**
 * Calculate pricing based on user role and markup settings
 * Centralizes pricing logic to avoid duplication across components
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
    case 'free':
      markup = pricingSettings.free_markup;
      break;
    case 'professional':
      markup = pricingSettings.professional_markup;
      break;
    case 'enterprise':
      markup = pricingSettings.enterprise_markup;
      break;
    case 'staff':
      markup = pricingSettings.staff_markup;
      break;
    case 'partner':
      markup = pricingSettings.partner_markup;
      break;
    default:
      markup = pricingSettings.free_markup; // Default to free tier
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
    case 'free': return pricingSettings.free_markup;
    case 'professional': return pricingSettings.professional_markup;
    case 'enterprise': return pricingSettings.enterprise_markup;
    case 'staff': return pricingSettings.staff_markup;
    case 'partner': return pricingSettings.partner_markup;
    default: return pricingSettings.free_markup;
  }
}