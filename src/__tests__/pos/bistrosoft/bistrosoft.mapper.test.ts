import { describe, it, expect } from 'vitest'
import { BistrosoftMapper } from '@/lib/integrations/pos/bistrosoft/bistrosoft.mapper'
import type { BistrosoftRawSale } from '@/lib/integrations/pos/bistrosoft/bistrosoft.types'
import bistrosoftSampleData from '../../mock/bistrosoft.sample.json'

describe('BistrosoftMapper', () => {
  describe('mapToTupa', () => {
    it('should transform Bistrosoft sales data to TUPÁ format correctly', () => {
      const bistrosoftSales = bistrosoftSampleData.data.ventas as BistrosoftRawSale[]
      const result = BistrosoftMapper.mapToTupa(bistrosoftSales)

      expect(result).toHaveLength(2)
      
      // Test first sale with complete data including discounts
      const firstSale = result[0]
      expect(firstSale).toEqual({
        id: 'bistro_001',
        timestamp: '2024-01-19T14:30:00Z',
        amount: 6000, // 6200 - 200 discount
        items: [
          {
            name: 'Café Americano',
            quantity: 2,
            price: 2200,
            category: 'bebidas_calientes',
            sku: 'PROD_001',
            notes: 'Sin azúcar'
          },
          {
            name: 'Medialuna',
            quantity: 2,
            price: 1100,
            category: 'panaderia',
            sku: 'PROD_002'
          }
        ],
        customer: {
          id: 'cli_001',
          name: 'Carlos Rodriguez',
          email: 'carlos.rodriguez@email.com',
          phone: '+54911987654',
          document: '12345678'
        },
        payment_method: 'credit_card',
        pos_transaction_id: 'bistro_ticket_001',
        metadata: {
          mesa: 15,
          mozo: 'Empleado_003',
          descuentos: 200,
          pos_provider: 'bistrosoft'
        }
      })
    })

    it('should handle sales without customer data', () => {
      const bistrosoftSales = bistrosoftSampleData.data.ventas as BistrosoftRawSale[]
      const result = BistrosoftMapper.mapToTupa(bistrosoftSales)
      
      const saleWithoutCustomer = result[1] // Second sale has no customer
      expect(saleWithoutCustomer.customer).toBeUndefined()
      expect(saleWithoutCustomer.id).toBe('bistro_002')
      expect(saleWithoutCustomer.amount).toBe(4800)
    })

    it('should normalize payment methods correctly', () => {
      const testPaymentMethods = [
        { bistrosoft: 'efectivo', expected: 'cash' },
        { bistrosoft: 'tarjeta_credito', expected: 'credit_card' },
        { bistrosoft: 'tarjeta_debito', expected: 'debit_card' },
        { bistrosoft: 'transferencia', expected: 'bank_transfer' },
        { bistrosoft: 'mercadopago', expected: 'digital_wallet' },
        { bistrosoft: 'billetera_digital', expected: 'digital_wallet' },
        { bistrosoft: 'cheque', expected: 'check' },
        { bistrosoft: 'otro_metodo', expected: 'other' }
      ]

      testPaymentMethods.forEach(({ bistrosoft, expected }) => {
        const mockSale: BistrosoftRawSale = {
          venta_id: 'test_001',
          fecha_hora: '2024-01-19T10:00:00Z',
          total_venta: 1000,
          productos: [],
          forma_pago: bistrosoft,
          numero_ticket: 'test_ticket_001'
        }

        const result = BistrosoftMapper.mapToTupa([mockSale])
        expect(result[0].payment_method).toBe(expected)
      })
    })

    it('should handle discount calculation correctly', () => {
      const saleWithDiscount: BistrosoftRawSale = {
        venta_id: 'discount_test',
        fecha_hora: '2024-01-19T10:00:00Z',
        total_venta: 1000,
        descuentos: 100,
        productos: [
          {
            codigo: 'PROD_001',
            nombre: 'Test Product',
            cantidad: 1,
            precio_unitario: 1000,
            categoria: 'test'
          }
        ],
        forma_pago: 'efectivo',
        numero_ticket: 'discount_ticket'
      }

      const result = BistrosoftMapper.mapToTupa([saleWithDiscount])
      expect(result[0].amount).toBe(900) // 1000 - 100 discount
      expect(result[0].metadata?.descuentos).toBe(100)
    })

    it('should handle products without category', () => {
      const mockSale: BistrosoftRawSale = {
        venta_id: 'test_002',
        fecha_hora: '2024-01-19T10:00:00Z',
        total_venta: 1500,
        productos: [
          {
            codigo: 'PROD_001',
            nombre: 'Test Product',
            cantidad: 1,
            precio_unitario: 1500
            // No category provided
          }
        ],
        forma_pago: 'efectivo',
        numero_ticket: 'test_ticket_002'
      }

      const result = BistrosoftMapper.mapToTupa([mockSale])
      expect(result[0].items[0].category).toBe('sin_categoria')
    })

    it('should preserve all required TUPÁ fields', () => {
      const bistrosoftSales = bistrosoftSampleData.data.ventas as BistrosoftRawSale[]
      const result = BistrosoftMapper.mapToTupa(bistrosoftSales)

      result.forEach(sale => {
        // Required fields
        expect(sale.id).toBeDefined()
        expect(sale.timestamp).toBeDefined()
        expect(sale.amount).toBeDefined()
        expect(sale.items).toBeDefined()
        expect(sale.payment_method).toBeDefined()
        expect(sale.pos_transaction_id).toBeDefined()
        
        // Metadata should always be present
        expect(sale.metadata).toBeDefined()
        expect(sale.metadata?.pos_provider).toBe('bistrosoft')

        // Items validation
        sale.items.forEach(item => {
          expect(item.name).toBeDefined()
          expect(item.quantity).toBeDefined()
          expect(item.price).toBeDefined()
          expect(item.category).toBeDefined()
          expect(item.sku).toBeDefined() // Bistrosoft includes product codes
        })
      })
    })
  })

  describe('validateBistrosoftData', () => {
    it('should validate correct Bistrosoft data structure', () => {
      const validData = bistrosoftSampleData.data.ventas
      const result = BistrosoftMapper.validateBistrosoftData(validData)
      
      expect(result).toBe(true)
    })

    it('should reject invalid data structures', () => {
      const invalidCases = [
        null,
        undefined,
        'not an array',
        [],
        [{ venta_id: 'missing_fields' }],
        [{ 
          venta_id: 'valid_id',
          fecha_hora: 'valid_date',
          // missing total_venta
          productos: []
        }],
        [{ 
          venta_id: 'valid_id',
          fecha_hora: 'valid_date',
          total_venta: 'not_a_number', // invalid type
          productos: []
        }]
      ]

      invalidCases.forEach(invalidData => {
        const result = BistrosoftMapper.validateBistrosoftData(invalidData)
        expect(result).toBe(false)
      })
    })

    it('should validate productos array is present', () => {
      const dataWithoutProducts = [{
        venta_id: 'test_001',
        fecha_hora: '2024-01-19T10:00:00Z',
        total_venta: 1000,
        forma_pago: 'efectivo',
        numero_ticket: 'test_001'
        // missing productos array
      }]

      const result = BistrosoftMapper.validateBistrosoftData(dataWithoutProducts)
      expect(result).toBe(false)
    })
  })
})