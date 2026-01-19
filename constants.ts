
import { MaterialType, MaterialPrice, AvailabilityStatus } from './types';

export const PAK_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Gujranwala', 'Sialkot'
];

export const UNIT_CONVERSIONS = {
  Marla: 225, 
  Kanal: 4500, 
  SqFt: 1
};

// Simulated localized market data
export const CITY_MARKET_DATA: Record<string, MaterialPrice[]> = {
  'Karachi': [
    { type: MaterialType.CEMENT, unit: 'Bag', price: 1190, lastUpdated: 'Just now', trend: 'down', availability: 'In Stock', change24h: -1.2 },
    { type: MaterialType.STEEL, unit: 'Ton', price: 258000, lastUpdated: '2 mins ago', trend: 'down', availability: 'In Stock', change24h: -0.5 },
    { type: MaterialType.BRICKS, unit: '1000 Units', price: 17500, lastUpdated: '1 hour ago', trend: 'stable', availability: 'In Stock', change24h: 0 },
    { type: MaterialType.SAND, unit: 'Trolley', price: 8500, lastUpdated: '5 mins ago', trend: 'up', availability: 'Low Stock', change24h: 2.1 },
  ],
  'Lahore': [
    { type: MaterialType.CEMENT, unit: 'Bag', price: 1250, lastUpdated: 'Just now', trend: 'up', availability: 'In Stock', change24h: 0.8 },
    { type: MaterialType.STEEL, unit: 'Ton', price: 265000, lastUpdated: '1 min ago', trend: 'stable', availability: 'In Stock', change24h: 0.1 },
    { type: MaterialType.BRICKS, unit: '1000 Units', price: 18500, lastUpdated: '2 hours ago', trend: 'up', availability: 'In Stock', change24h: 1.5 },
    { type: MaterialType.SAND, unit: 'Trolley', price: 9800, lastUpdated: '10 mins ago', trend: 'up', availability: 'In Stock', change24h: 0.4 },
  ],
  'Islamabad': [
    { type: MaterialType.CEMENT, unit: 'Bag', price: 1280, lastUpdated: 'Just now', trend: 'up', availability: 'Low Stock', change24h: 1.4 },
    { type: MaterialType.STEEL, unit: 'Ton', price: 272000, lastUpdated: '4 mins ago', trend: 'up', availability: 'In Stock', change24h: 0.9 },
    { type: MaterialType.BRICKS, unit: '1000 Units', price: 19800, lastUpdated: '1 hour ago', trend: 'stable', availability: 'Out of Stock', change24h: 0 },
    { type: MaterialType.SAND, unit: 'Trolley', price: 11000, lastUpdated: '15 mins ago', trend: 'up', availability: 'In Stock', change24h: 3.2 },
  ],
};

// Fallback for other cities
export const DEFAULT_MARKET_PRICES: MaterialPrice[] = [
  { type: MaterialType.CEMENT, unit: 'Bag', price: 1250, lastUpdated: '2023-10-25', trend: 'up', availability: 'In Stock', change24h: 0.5 },
  { type: MaterialType.STEEL, unit: 'Ton', price: 265000, lastUpdated: '2023-10-25', trend: 'down', availability: 'In Stock', change24h: -0.2 },
  { type: MaterialType.BRICKS, unit: '1000 Units', price: 18500, lastUpdated: '2023-10-25', trend: 'stable', availability: 'In Stock', change24h: 0 },
  { type: MaterialType.SAND, unit: 'Trolley', price: 9500, lastUpdated: '2023-10-25', trend: 'up', availability: 'In Stock', change24h: 1.1 },
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
