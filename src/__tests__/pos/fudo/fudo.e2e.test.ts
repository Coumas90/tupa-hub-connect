import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { syncClientPOS } from '@/lib/integrations/pos/sync.core'
import { FudoMapper } from '@/lib/integrations/pos/fudo/fudo.mapper'
import { loadMockData } from '@/lib/integrations/mock/mock.loader'
import { storeParsedSales } from '@/lib/integrations/storage/sales.storage'
import { syncSalesToOdoo } from '@/lib/integrations/odoo/odoo.sync'
import { integrationLogger } from '@/lib/integrations/logger'
import fudoSampleData from '../../mock/fudo.sample.json'

// Mock dependencies
vi.mock('@/lib/integrations/config/client.config', () => ({
  getClientConfig: vi.fn()
}))

vi.mock('@/lib/integrations/mock/mock.loader', () => ({
  loadMockData: vi.fn()
}))

vi.mock('@/lib/integrations/storage/sales.storage', () => ({
  storeParsedSales: vi.fn()
}))

vi.mock('@/lib/integrations/odoo/odoo.sync', () => ({
  syncSalesToOdoo: vi.fn()
}))

vi.mock('@/lib/integrations/logger', () => ({
  integrationLogger: {
    getCircuitState: vi.fn(),
    log: vi.fn()
  },
  logSuccess: vi.fn(),
  logError: vi.fn(),
  logInfo: vi.fn()
}))

vi.mock('@/lib/integrations/retryQueue', () => ({
  retryQueue: {
    enqueueRetry: vi.fn()
  }
}))

describe('Fudo End-to-End Integration', () => {
  const mockClientId = 'client_001'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(integrationLogger.getCircuitState).mockReturnValue(null)
    vi.mocked(loadMockData).mockResolvedValue(fudoSampleData)
    vi.mocked(storeParsedSales).mockResolvedValue(undefined)
    vi.mocked(syncSalesToOdoo).mockResolvedValue({
      success: true,
      synced_count: 3,
      failed_count: 0
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Full Sync Cycle - Simulation Mode', () => {
    it('should complete full sync cycle successfully', async () => {
      // Mock client configuration
      const mockClientConfig = {
        id: mockClientId,
        name: 'Test Café',
        pos_type: 'fudo',
        simulation_mode: true,
        sync_frequency: 30,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      // Execute the sync
      const result = await syncClientPOS(mockClientId)

      // Verify the complete flow
      expect(getClientConfig).toHaveBeenCalledWith(mockClientId)
      expect(loadMockData).toHaveBeenCalledWith('fudo.sample.json')
      expect(storeParsedSales).toHaveBeenCalledWith(
        mockClientId,
        expect.arrayContaining([
          expect.objectContaining({
            id: 'fudo_001',
            timestamp: '2024-01-19T10:30:00Z',
            amount: 4500,
            payment_method: 'credit_card'
          })
        ])
      )
      expect(syncSalesToOdoo).toHaveBeenCalledWith(
        mockClientId,
        expect.any(Array)
      )

      // Verify result
      expect(result.success).toBe(true)
      expect(result.recordsProcessed).toBe(3)
      expect(result.message).toContain('Simulation sync completed for fudo')
    })

    it('should handle mapper transformation correctly', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      await syncClientPOS(mockClientId)

      // Verify that storeParsedSales was called with properly transformed data
      const storedSalesCall = vi.mocked(storeParsedSales).mock.calls[0]
      const transformedSales = storedSalesCall[1]

      expect(transformedSales).toHaveLength(3)
      
      // Verify first sale transformation
      const firstSale = transformedSales[0]
      expect(firstSale).toEqual({
        id: 'fudo_001',
        timestamp: '2024-01-19T10:30:00Z',
        amount: 4500,
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Espresso Doble',
            quantity: 1,
            price: 2500,
            category: 'cafe'
          })
        ]),
        customer: expect.objectContaining({
          id: 'cust_001',
          name: 'Juan Pérez'
        }),
        payment_method: 'credit_card',
        pos_transaction_id: 'fudo_tx_001',
        metadata: expect.objectContaining({
          pos_provider: 'fudo'
        })
      })
    })

    it('should handle circuit breaker activation', async () => {
      // Mock circuit breaker as active
      vi.mocked(integrationLogger.getCircuitState).mockReturnValue({
        client_id: mockClientId,
        consecutive_failures: 3,
        is_paused: true,
        pause_reason: 'Too many failures'
      })

      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('circuit breaker is open')
      
      // Verify that no actual sync operations were performed
      expect(loadMockData).not.toHaveBeenCalled()
      expect(storeParsedSales).not.toHaveBeenCalled()
      expect(syncSalesToOdoo).not.toHaveBeenCalled()
    })

    it('should handle client configuration not found', async () => {
      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(null)

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Client configuration not found')
    })

    it('should handle unsupported POS type', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'unsupported_pos',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('POS adapter not found for type: unsupported_pos')
    })

    it('should handle Odoo sync failures', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      // Mock Odoo sync failure
      vi.mocked(syncSalesToOdoo).mockResolvedValue({
        success: false,
        synced_count: 0,
        failed_count: 3,
        errors: ['Odoo connection failed']
      })

      const result = await syncClientPOS(mockClientId)

      // Sync should still be considered successful even if Odoo fails
      expect(result.success).toBe(true)
      expect(result.recordsProcessed).toBe(3)
    })

    it('should handle mock data loading failures', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      // Mock loadMockData failure
      vi.mocked(loadMockData).mockRejectedValue(new Error('Mock data file not found'))

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(false)
      expect(result.message).toContain('Mock data file not found')
    })
  })

  describe('Production Mode', () => {
    it('should enqueue sync task in production mode', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: false,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      // Mock enqueueSyncTask
      const { enqueueSyncTask } = await import('@/lib/integrations/queue/sync.queue')
      vi.mocked(enqueueSyncTask).mockResolvedValue('task_123')

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(true)
      expect(result.message).toContain('Sync task queued')
      expect(enqueueSyncTask).toHaveBeenCalledWith(mockClientId, 'sales.sync')
      
      // In production mode, no immediate processing should occur
      expect(loadMockData).not.toHaveBeenCalled()
      expect(storeParsedSales).not.toHaveBeenCalled()
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should maintain data integrity through full pipeline', async () => {
      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      await syncClientPOS(mockClientId)

      const transformedData = vi.mocked(storeParsedSales).mock.calls[0][1]

      // Verify all required TUPÁ fields are present
      transformedData.forEach(sale => {
        expect(sale.id).toBeDefined()
        expect(sale.timestamp).toBeDefined()
        expect(sale.amount).toBeTypeOf('number')
        expect(sale.items).toBeInstanceOf(Array)
        expect(sale.payment_method).toBeDefined()
        expect(sale.pos_transaction_id).toBeDefined()
        expect(sale.metadata?.pos_provider).toBe('fudo')
      })

      // Verify data consistency
      expect(transformedData[0].amount).toBe(4500) // From original Fudo data
      expect(transformedData[1].amount).toBe(3200)
      expect(transformedData[2].amount).toBe(5800)
    })

    it('should handle edge cases in data transformation', async () => {
      const edgeCaseData = {
        sales: [
          {
            id: 'edge_001',
            created_at: '2024-01-19T10:00:00Z',
            total: 0, // Zero amount
            items: [], // Empty items
            payment_method: 'unknown_method',
            transaction_id: 'edge_tx_001'
          }
        ]
      }

      vi.mocked(loadMockData).mockResolvedValue(edgeCaseData)

      const mockClientConfig = {
        id: mockClientId,
        pos_type: 'fudo',
        simulation_mode: true,
        active: true
      }

      const { getClientConfig } = await import('@/lib/integrations/config/client.config')
      vi.mocked(getClientConfig).mockResolvedValue(mockClientConfig)

      const result = await syncClientPOS(mockClientId)

      expect(result.success).toBe(true)
      
      const transformedData = vi.mocked(storeParsedSales).mock.calls[0][1]
      expect(transformedData[0].amount).toBe(0)
      expect(transformedData[0].items).toEqual([])
      expect(transformedData[0].payment_method).toBe('other') // Normalized
    })
  })
})