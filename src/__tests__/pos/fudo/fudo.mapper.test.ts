import { describe, it, expect } from 'vitest'
import { FudoMapper } from '@/lib/integrations/pos/fudo/fudo.mapper'
import type { FudoRawSale } from '@/lib/integrations/pos/fudo/fudo.types'
import fudoSampleData from '../../mock/fudo.sample.json'

describe('FudoMapper', () => {
  describe('mapToTupa', () => {
    it('should transform Fudo sales data to TUPÁ format correctly', () => {
      const fudoSales = fudoSampleData.sales as FudoRawSale[]
      const result = FudoMapper.mapToTupa(fudoSales)

      expect(result).toHaveLength(3)
      
      // Test first sale with complete data
      const firstSale = result[0]
      expect(firstSale).toEqual({
        id: 'fudo_001',
        timestamp: '2024-01-19T10:30:00Z',
        amount: 4500,
        items: [
          {
            name: 'Espresso Doble',
            quantity: 1,
            price: 2500,
            category: 'cafe',
            modifiers: [
              {
                name: 'Extra Shot',
                price: 500
              }
            ]
          },
          {
            name: 'Croissant de Jamón y Queso',
            quantity: 1,
            price: 2000,
            category: 'panaderia'
          }
        ],
        customer: {
          id: 'cust_001',
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+54911234567'
        },
        payment_method: 'credit_card',
        pos_transaction_id: 'fudo_tx_001',
        metadata: {
          table_number: '12',
          waiter_id: 'waiter_005',
          pos_provider: 'fudo'
        }
      })
    })

    it('should handle sales without customer data', () => {
      const fudoSales = fudoSampleData.sales as FudoRawSale[]
      const result = FudoMapper.mapToTupa(fudoSales)
      
      const saleWithoutCustomer = result[1] // Second sale has no customer
      expect(saleWithoutCustomer.customer).toBeUndefined()
      expect(saleWithoutCustomer.id).toBe('fudo_002')
    })

    it('should normalize payment methods correctly', () => {
      const testPaymentMethods = [
        { fudo: 'cash', expected: 'cash' },
        { fudo: 'credit_card', expected: 'credit_card' },
        { fudo: 'debit_card', expected: 'debit_card' },
        { fudo: 'transfer', expected: 'bank_transfer' },
        { fudo: 'qr', expected: 'digital_wallet' },
        { fudo: 'mercadopago', expected: 'digital_wallet' },
        { fudo: 'unknown_method', expected: 'other' }
      ]

      testPaymentMethods.forEach(({ fudo, expected }) => {
        const mockSale: FudoRawSale = {
          id: 'test_001',
          created_at: '2024-01-19T10:00:00Z',
          total: 1000,
          items: [],
          payment_method: fudo,
          transaction_id: 'test_tx_001'
        }

        const result = FudoMapper.mapToTupa([mockSale])
        expect(result[0].payment_method).toBe(expected)
      })
    })

    it('should handle items without category', () => {
      const mockSale: FudoRawSale = {
        id: 'test_002',
        created_at: '2024-01-19T10:00:00Z',
        total: 1500,
        items: [
          {
            id: 'item_001',
            name: 'Test Item',
            quantity: 1,
            price: 1500
            // No category provided
          }
        ],
        payment_method: 'cash',
        transaction_id: 'test_tx_002'
      }

      const result = FudoMapper.mapToTupa([mockSale])
      expect(result[0].items[0].category).toBe('uncategorized')
    })

    it('should preserve all required TUPÁ fields', () => {
      const fudoSales = fudoSampleData.sales as FudoRawSale[]
      const result = FudoMapper.mapToTupa(fudoSales)

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
        expect(sale.metadata?.pos_provider).toBe('fudo')

        // Items validation
        sale.items.forEach(item => {
          expect(item.name).toBeDefined()
          expect(item.quantity).toBeDefined()
          expect(item.price).toBeDefined()
          expect(item.category).toBeDefined()
        })
      })
    })
  })

  describe('validateFudoData', () => {
    it('should validate correct Fudo data structure', () => {
      const validData = fudoSampleData.sales
      const result = FudoMapper.validateFudoData(validData)
      
      expect(result).toBe(true)
    })

    it('should reject invalid data structures', () => {
      const invalidCases = [
        null,
        undefined,
        'not an array',
        [],
        [{ id: 'missing_fields' }],
        [{ 
          id: 'valid_id',
          created_at: 'valid_date',
          // missing total
          items: []
        }],
        [{ 
          id: 'valid_id',
          created_at: 'valid_date',
          total: 'not_a_number', // invalid type
          items: []
        }]
      ]

      invalidCases.forEach(invalidData => {
        const result = FudoMapper.validateFudoData(invalidData)
        expect(result).toBe(false)
      })
    })

    it('should validate items array is present', () => {
      const dataWithoutItems = [{
        id: 'test_001',
        created_at: '2024-01-19T10:00:00Z',
        total: 1000
        // missing items array
      }]

      const result = FudoMapper.validateFudoData(dataWithoutItems)
      expect(result).toBe(false)
    })
  })
})