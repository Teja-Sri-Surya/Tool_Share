export interface Tool {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  pricing_type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  price_per_hour?: number;
  dailyRate: number;
  price_per_week?: number;
  price_per_month?: number;
  isAvailable: boolean;
  owner: string;
  owner_id?: number;
  replacement_value?: number;
  aiHint: string;
}

export type Rental = {
  id: string;
  toolId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'returned';
};

export const tools: Tool[] = [
  // All initial tool data removed - tools will now be loaded from Django backend
];

export const rentals: Rental[] = [
  // All initial rental data removed - rentals will now be loaded from Django backend
];

export const getToolById = (id: string) => tools.find(tool => tool.id === id);
