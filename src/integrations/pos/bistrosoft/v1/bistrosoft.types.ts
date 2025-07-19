export interface BistrosoftSale { 
  id: string; 
  total: number;
  date: string;
  items: BistrosoftItem[];
}

export interface BistrosoftItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}