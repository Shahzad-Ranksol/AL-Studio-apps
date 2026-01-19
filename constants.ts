
import { MaterialType, MaterialPrice } from './types';

export const PAK_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'
];

export const UNIT_CONVERSIONS = {
  Marla: 225, // Standard Marla in Punjab/Sindh (can vary slightly)
  Kanal: 4500, // 20 Marlas
  SqFt: 1
};

export const CURRENT_MARKET_PRICES: MaterialPrice[] = [
  { type: MaterialType.CEMENT, unit: 'Bag (50kg)', price: 1250, lastUpdated: '2023-10-25', trend: 'up' },
  { type: MaterialType.STEEL, unit: 'Ton (Grade 60)', price: 265000, lastUpdated: '2023-10-25', trend: 'down' },
  { type: MaterialType.BRICKS, unit: '1000 Units (A-Class)', price: 18500, lastUpdated: '2023-10-25', trend: 'stable' },
  { type: MaterialType.SAND, unit: 'Trolley', price: 9500, lastUpdated: '2023-10-25', trend: 'up' },
  { type: MaterialType.CRUSH, unit: 'Trolley', price: 14000, lastUpdated: '2023-10-25', trend: 'stable' },
];

export const PRICE_HISTORY_DATA = [
  { month: 'Jan', cement: 1050, steel: 220000 },
  { month: 'Feb', cement: 1080, steel: 235000 },
  { month: 'Mar', cement: 1100, steel: 250000 },
  { month: 'Apr', cement: 1150, steel: 280000 },
  { month: 'May', cement: 1200, steel: 275000 },
  { month: 'Jun', cement: 1220, steel: 270000 },
  { month: 'Jul', cement: 1240, steel: 265000 },
];
