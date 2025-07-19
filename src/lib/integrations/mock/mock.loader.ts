// Mock data samples para diferentes POS
const mockData: Record<string, any> = {
  'fudo.sample.json': {
    sales: [
      {
        id: 'fudo_001',
        created_at: '2024-01-19T10:30:00Z',
        total: 4500,
        items: [
          {
            name: 'Espresso Doble',
            quantity: 1,
            price: 2500,
            category: 'cafe'
          },
          {
            name: 'Croissant',
            quantity: 1,
            price: 2000,
            category: 'panaderia'
          }
        ],
        customer: {
          id: 'cust_001',
          name: 'Juan Pérez',
          email: 'juan@email.com'
        },
        payment_method: 'credit_card',
        transaction_id: 'fudo_tx_001'
      },
      {
        id: 'fudo_002',
        created_at: '2024-01-19T11:15:00Z',
        total: 3200,
        items: [
          {
            name: 'Latte',
            quantity: 2,
            price: 1600,
            category: 'cafe'
          }
        ],
        payment_method: 'cash',
        transaction_id: 'fudo_tx_002'
      }
    ]
  },
  'simphony.sample.json': {
    transactions: [
      {
        check_id: 'sim_001',
        business_date: '2024-01-19T12:00:00Z',
        total_amount: 5200,
        menu_items: [
          {
            menu_item_name: 'Cappuccino',
            quantity: 1,
            price: 2800,
            menu_group: 'beverages'
          },
          {
            menu_item_name: 'Sandwich',
            quantity: 1,
            price: 2400,
            menu_group: 'food'
          }
        ],
        tender_type: 'debit_card'
      }
    ]
  }
};

export function loadMockData(filename: string): any {
  const data = mockData[filename];
  if (!data) {
    throw new Error(`Mock data file not found: ${filename}`);
  }
  
  // Simular delay de carga
  return new Promise(resolve => {
    setTimeout(() => resolve(data), 200);
  });
}