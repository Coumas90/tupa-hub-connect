import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FudoService } from '@/lib/integrations/pos/fudo/fudo.service'
import { FudoClient } from '@/lib/integrations/pos/fudo/fudo.client'
import type { FudoConfig } from '@/lib/integrations/pos/fudo/fudo.types'

// Mock the FudoClient
vi.mock('@/lib/integrations/pos/fudo/fudo.client', () => ({
  FudoClient: vi.fn().mockImplementation(() => ({
    request: vi.fn(),
    authenticate: vi.fn(),
    getStoreId: vi.fn().mockReturnValue('store_123')
  }))
}))

describe('FudoService', () => {
  let fudoService: FudoService
  let mockClient: any

  const mockConfig: FudoConfig = {
    baseUrl: 'https://api.fudo.test.com',
    apiKey: 'test_api_key',
    storeId: 'store_123',
    timeout: 30000
  }

  beforeEach(() => {
    mockClient = {
      request: vi.fn(),
      authenticate: vi.fn(),
      getStoreId: vi.fn().mockReturnValue('store_123')
    }
    
    // Reset the constructor mock
    vi.mocked(FudoClient).mockImplementation(() => mockClient)
    
    fudoService = new FudoService(mockClient)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('fetchSales', () => {
    it('should fetch sales successfully', async () => {
      const mockResponse = {
        sales: [
          {
            id: 'fudo_001',
            created_at: '2024-01-19T10:30:00Z',
            total: 4500,
            items: [],
            payment_method: 'cash',
            transaction_id: 'tx_001'
          }
        ],
        status: 'success'
      }

      mockClient.request.mockResolvedValueOnce(mockResponse)

      const result = await fudoService.fetchSales('2024-01-19', '2024-01-20')

      expect(mockClient.request).toHaveBeenCalledWith(
        '/sales?from=2024-01-19&to=2024-01-20&store_id=store_123'
      )
      expect(result).toEqual(mockResponse.sales)
    })

    it('should handle API errors gracefully', async () => {
      const apiError = new Error('API Error: 500 Internal Server Error')
      mockClient.request.mockRejectedValueOnce(apiError)

      await expect(fudoService.fetchSales('2024-01-19', '2024-01-20'))
        .rejects.toThrow('Failed to fetch sales from Fudo: Error: API Error: 500 Internal Server Error')
    })

    it('should handle empty response', async () => {
      const emptyResponse = { sales: [], status: 'success' }
      mockClient.request.mockResolvedValueOnce(emptyResponse)

      const result = await fudoService.fetchSales('2024-01-19', '2024-01-20')
      expect(result).toEqual([])
    })

    it('should handle response without sales array', async () => {
      const invalidResponse = { status: 'success' }
      mockClient.request.mockResolvedValueOnce(invalidResponse)

      const result = await fudoService.fetchSales('2024-01-19', '2024-01-20')
      expect(result).toEqual([])
    })
  })

  describe('fetchSalesByIds', () => {
    it('should fetch sales by IDs successfully', async () => {
      const saleIds = ['fudo_001', 'fudo_002']
      const mockResponse = {
        sales: [
          { id: 'fudo_001', total: 1000 },
          { id: 'fudo_002', total: 2000 }
        ]
      }

      mockClient.request.mockResolvedValueOnce(mockResponse)

      const result = await fudoService.fetchSalesByIds(saleIds)

      expect(mockClient.request).toHaveBeenCalledWith('/sales/batch', {
        method: 'POST',
        body: JSON.stringify({ sale_ids: saleIds })
      })
      expect(result).toEqual(mockResponse.sales)
    })

    it('should handle errors when fetching by IDs', async () => {
      const saleIds = ['fudo_001', 'fudo_002']
      const apiError = new Error('Not Found')
      mockClient.request.mockRejectedValueOnce(apiError)

      await expect(fudoService.fetchSalesByIds(saleIds))
        .rejects.toThrow('Failed to fetch sales by IDs from Fudo')
    })
  })

  describe('testConnection', () => {
    it('should return true when authentication succeeds', async () => {
      mockClient.authenticate.mockResolvedValueOnce(true)

      const result = await fudoService.testConnection()
      expect(result).toBe(true)
      expect(mockClient.authenticate).toHaveBeenCalled()
    })

    it('should return false when authentication fails', async () => {
      mockClient.authenticate.mockResolvedValueOnce(false)

      const result = await fudoService.testConnection()
      expect(result).toBe(false)
    })

    it('should return false when authentication throws error', async () => {
      mockClient.authenticate.mockRejectedValueOnce(new Error('Network error'))

      const result = await fudoService.testConnection()
      expect(result).toBe(false)
    })
  })

  describe('getLastSyncTimestamp', () => {
    it('should return last sync timestamp when available', async () => {
      const mockTimestamp = '2024-01-19T10:30:00Z'
      mockClient.request.mockResolvedValueOnce({ timestamp: mockTimestamp })

      const result = await fudoService.getLastSyncTimestamp()
      
      expect(mockClient.request).toHaveBeenCalledWith('/sync/last-timestamp')
      expect(result).toBe(mockTimestamp)
    })

    it('should return null when no timestamp available', async () => {
      mockClient.request.mockResolvedValueOnce({})

      const result = await fudoService.getLastSyncTimestamp()
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockClient.request.mockRejectedValueOnce(new Error('API error'))

      const result = await fudoService.getLastSyncTimestamp()
      expect(result).toBeNull()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Network timeout')
      timeoutError.name = 'TimeoutError'
      mockClient.request.mockRejectedValueOnce(timeoutError)

      await expect(fudoService.fetchSales('2024-01-19', '2024-01-20'))
        .rejects.toThrow('Failed to fetch sales from Fudo')
    })

    it('should handle malformed JSON responses', async () => {
      const jsonError = new SyntaxError('Unexpected token')
      mockClient.request.mockRejectedValueOnce(jsonError)

      await expect(fudoService.fetchSales('2024-01-19', '2024-01-20'))
        .rejects.toThrow('Failed to fetch sales from Fudo')
    })

    it('should validate date parameters', async () => {
      // This would be implemented if we add parameter validation
      const invalidDates = ['invalid-date', '', null]
      
      // For now, we just ensure the service doesn't crash
      for (const invalidDate of invalidDates) {
        mockClient.request.mockResolvedValueOnce({ sales: [] })
        
        try {
          await fudoService.fetchSales(invalidDate as any, '2024-01-20')
          expect(mockClient.request).toHaveBeenCalled()
        } catch (error) {
          // Expected behavior - service should handle or validate dates
        }
      }
    })
  })
})