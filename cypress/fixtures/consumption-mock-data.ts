// Consumption Module Mock Data for Testing
export const mockConsumptionData = {
  // Mock consumption records for charts
  consumptionRecords: [
    {
      id: '1',
      client_id: 'test-client-1',
      location_id: 'loc-1',
      date: '2024-01-15',
      total_amount: 450.75,
      total_items: 85,
      average_order_value: 5.3,
      top_categories: ['Espresso', 'Americano', 'Latte'],
      payment_methods: { cash: 200.50, card: 250.25 },
      metadata: {
        pos_provider: 'fudo',
        sync_timestamp: '2024-01-15T10:00:00Z',
        sales_count: 42,
        peak_hour: 14,
        customer_count: 35
      },
      created_at: '2024-01-15T09:30:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      client_id: 'test-client-1',
      location_id: 'loc-1',
      date: '2024-01-16',
      total_amount: 520.25,
      total_items: 98,
      average_order_value: 5.31,
      top_categories: ['Cappuccino', 'Espresso', 'Cold Brew'],
      payment_methods: { cash: 180.75, card: 300.50, mobile: 39.00 },
      metadata: {
        pos_provider: 'fudo',
        sync_timestamp: '2024-01-16T10:00:00Z',
        sales_count: 48,
        peak_hour: 15,
        customer_count: 42
      },
      created_at: '2024-01-16T09:30:00Z',
      updated_at: '2024-01-16T10:00:00Z'
    },
    {
      id: '3',
      client_id: 'test-client-1',
      location_id: 'loc-1',
      date: '2024-01-17',
      total_amount: 380.90,
      total_items: 72,
      average_order_value: 5.29,
      top_categories: ['Americano', 'Latte', 'Espresso'],
      payment_methods: { cash: 150.40, card: 230.50 },
      metadata: {
        pos_provider: 'fudo',
        sync_timestamp: '2024-01-17T10:00:00Z',
        sales_count: 38,
        peak_hour: 13,
        customer_count: 29
      },
      created_at: '2024-01-17T09:30:00Z',
      updated_at: '2024-01-17T10:00:00Z'
    }
  ],

  // Mock POS sync responses
  posSync: {
    success: {
      success: true,
      recordsProcessed: 15,
      recordsSuccess: 15,
      recordsFailed: 0,
      errors: [],
      logId: 'sync-log-123',
      timestamp: '2024-01-18T10:00:00Z'
    },
    partial: {
      success: false,
      recordsProcessed: 10,
      recordsSuccess: 7,
      recordsFailed: 3,
      errors: [
        'Record item-001: Invalid price format',
        'Record item-002: Missing category',
        'Record item-003: Duplicate transaction ID'
      ],
      logId: 'sync-log-124',
      timestamp: '2024-01-18T10:15:00Z'
    },
    failure: {
      success: false,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      errors: ['Connection timeout to POS system'],
      logId: 'sync-log-125',
      timestamp: '2024-01-18T10:30:00Z'
    },
    paused: {
      success: false,
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsFailed: 0,
      errors: ['Sync paused due to repeated failures'],
      isPaused: true,
      nextRetryAt: new Date('2024-01-18T11:00:00Z'),
      logId: 'sync-log-126',
      timestamp: '2024-01-18T10:45:00Z'
    }
  },

  // Mock consumption alerts
  alerts: {
    low: {
      id: 'alert-1',
      type: 'low_consumption',
      severity: 'medium',
      title: 'Consumo Bajo Detectado',
      message: 'El consumo ha disminuido 25% respecto al promedio semanal',
      category: 'Espresso',
      current_value: 45,
      expected_value: 60,
      percentage_change: -25,
      recommendations: [
        'Revisar disponibilidad de producto',
        'Verificar calidad del café',
        'Analizar feedback de clientes'
      ],
      metadata: {
        detection_method: 'statistical_analysis',
        confidence: 0.85,
        days_analyzed: 7
      },
      created_at: '2024-01-18T08:00:00Z'
    },
    abrupt: {
      id: 'alert-2',
      type: 'abrupt_change',
      severity: 'high',
      title: 'Cambio Abrupto en Consumo',
      message: 'Cambio repentino detectado en ventas de Americano (+40%)',
      category: 'Americano',
      current_value: 84,
      expected_value: 60,
      percentage_change: 40,
      recommendations: [
        'Verificar promociones activas',
        'Asegurar stock suficiente',
        'Monitorear tendencia'
      ],
      metadata: {
        detection_method: 'anomaly_detection',
        confidence: 0.92,
        threshold_exceeded: 2.1
      },
      created_at: '2024-01-18T09:15:00Z'
    },
    restock: {
      id: 'alert-3',
      type: 'restock_needed',
      severity: 'critical',
      title: 'Reposición Urgente Requerida',
      message: 'Stock crítico detectado para Latte Mix',
      category: 'Latte',
      current_value: 5,
      expected_value: 50,
      percentage_change: -90,
      recommendations: [
        'Contactar proveedor inmediatamente',
        'Revisar stock de emergencia',
        'Considerar producto sustituto temporal'
      ],
      metadata: {
        detection_method: 'stock_monitoring',
        confidence: 1.0,
        days_until_stockout: 1
      },
      created_at: '2024-01-18T09:30:00Z'
    }
  },

  // Mock filter options
  filterOptions: {
    coffeeVarieties: [
      'Todas las variedades',
      'Colombian Supreme',
      'Brazilian Santos',
      'Ethiopian Yirgacheffe',
      'Guatemala Antigua',
      'Huila Premium'
    ],
    formats: [
      'Todos los formatos',
      'Espresso',
      'Americano',
      'Cappuccino',
      'Latte',
      'Cold Brew'
    ],
    dateRanges: {
      'ultimo-dia': { from: new Date('2024-01-17'), to: new Date('2024-01-18') },
      'ultima-semana': { from: new Date('2024-01-11'), to: new Date('2024-01-18') },
      'ultimo-mes': { from: new Date('2023-12-18'), to: new Date('2024-01-18') },
      'ultimo-trimestre': { from: new Date('2023-10-18'), to: new Date('2024-01-18') }
    }
  },

  // Mock chart data
  chartData: {
    monthly: [
      { month: 'Ene', espresso: 120, americano: 95, latte: 80, cappuccino: 70 },
      { month: 'Feb', espresso: 135, americano: 110, latte: 85, cappuccino: 75 },
      { month: 'Mar', espresso: 140, americano: 105, latte: 90, cappuccino: 80 },
      { month: 'Abr', espresso: 125, americano: 115, latte: 95, cappuccino: 85 }
    ],
    weekly: [
      { day: 'Lun', consumption: 450 },
      { day: 'Mar', consumption: 520 },
      { day: 'Mié', consumption: 380 },
      { day: 'Jue', consumption: 640 },
      { day: 'Vie', consumption: 710 },
      { day: 'Sáb', consumption: 580 },
      { day: 'Dom', consumption: 420 }
    ],
    variety: [
      { variedad: 'Colombian Supreme', enero: 3.2, febrero: 3.5, marzo: 3.1, abril: 3.8 },
      { variedad: 'Brazilian Santos', enero: 2.9, febrero: 3.2, marzo: 2.8, abril: 3.4 },
      { variedad: 'Ethiopian Yirgacheffe', enero: 2.1, febrero: 2.4, marzo: 2.2, abril: 2.6 },
      { variedad: 'Guatemala Antigua', enero: 1.8, febrero: 2.1, marzo: 1.9, abril: 2.3 },
      { variedad: 'Huila Premium', enero: 2.8, febrero: 3.1, marzo: 2.9, abril: 3.6 }
    ]
  },

  // Mock summary data
  summaryData: {
    weeklyTotal: 3700,
    monthlyTotal: 14800,
    weeklyChange: 12.5,
    monthlyChange: 8.3,
    topVariety: 'Colombian Supreme',
    topFormat: 'Espresso',
    efficiency: 87.5,
    isLoading: false
  },

  // Mock error scenarios
  errors: {
    networkError: {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión con el servidor',
      details: 'No se pudo establecer conexión con la API de consumo'
    },
    validationError: {
      code: 'VALIDATION_ERROR', 
      message: 'Datos de filtro inválidos',
      details: 'El rango de fechas seleccionado no es válido'
    },
    syncError: {
      code: 'SYNC_ERROR',
      message: 'Error en sincronización POS',
      details: 'La sincronización con el sistema POS falló después de 3 intentos'
    },
    authError: {
      code: 'AUTH_ERROR',
      message: 'No autorizado',
      details: 'No tienes permisos para acceder a los datos de consumo'
    }
  }
};

// Helper functions for mock responses
export const mockApiResponses = {
  // Simulate network delay
  delay: (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate mock consumption data for date range
  generateConsumptionForDateRange: (startDate: Date, endDate: Date, clientId: string = 'test-client-1') => {
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const baseAmount = 400 + Math.random() * 300; // 400-700 range
      const baseItems = Math.floor(baseAmount / 5.5); // Average item price ~5.5
      
      data.push({
        id: `mock-${currentDate.getTime()}`,
        client_id: clientId,
        location_id: 'loc-1',
        date: currentDate.toISOString().split('T')[0],
        total_amount: Math.round(baseAmount * 100) / 100,
        total_items: baseItems,
        average_order_value: Math.round((baseAmount / baseItems) * 100) / 100,
        top_categories: ['Espresso', 'Americano', 'Latte'].slice(0, Math.floor(Math.random() * 3) + 1),
        payment_methods: {
          cash: Math.round(baseAmount * 0.4 * 100) / 100,
          card: Math.round(baseAmount * 0.6 * 100) / 100
        },
        metadata: {
          pos_provider: 'fudo',
          sync_timestamp: new Date().toISOString(),
          sales_count: Math.floor(baseItems / 2),
          peak_hour: Math.floor(Math.random() * 8) + 12, // 12-19 hours
          customer_count: Math.floor(baseItems * 0.8)
        },
        created_at: currentDate.toISOString(),
        updated_at: currentDate.toISOString()
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  },

  // Simulate API error
  simulateError: (errorType: keyof typeof mockConsumptionData.errors) => {
    const error = mockConsumptionData.errors[errorType];
    throw new Error(`${error.code}: ${error.message} - ${error.details}`);
  }
};