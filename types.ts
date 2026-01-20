
export enum MaterialType {
  CEMENT = 'Cement',
  STEEL = 'Steel',
  BRICKS = 'Bricks',
  SAND = 'Sand',
  CRUSH = 'Crush (Bajri)',
  PAINT = 'Paint',
  TILES = 'Tiles'
}

export type AvailabilityStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export interface MaterialPrice {
  type: MaterialType;
  unit: string;
  price: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
  availability: AvailabilityStatus;
  change24h: number; // Percentage change
}

export interface EstimationResult {
  totalCost: number;
  materialBreakdown: {
    material: MaterialType;
    quantity: number;
    cost: number;
  }[];
  laborCost: number;
  durationMonths: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ConstructionInputs {
  area: number; // in square feet
  unitType: 'Marla' | 'Kanal' | 'SqFt';
  floors: 'Ground Only' | 'Ground + 1' | 'Ground + 2';
  quality: 'Economy' | 'Standard' | 'Premium';
  city: string;
  laborRate: number;
  rooms: number;
  bathrooms: number;
  kitchens: number;
  hasGarage: boolean;
  hasDrawing: boolean;
  hasDining: boolean;
  steelGrade: 'Grade 40' | 'Grade 60';
  floorFinish: 'Tiles' | 'Marble' | 'Concrete' | 'Granite' | 'Wooden';
  foundationType: 'Shallow/Strip' | 'Raft' | 'Piles';
  beamReinforcement: 'Standard' | 'Heavy';
}
