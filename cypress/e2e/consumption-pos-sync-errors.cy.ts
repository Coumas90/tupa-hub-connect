/// <reference types="cypress" />

import { mockConsumptionData, mockApiResponses } from '../fixtures/consumption-mock-data';

describe('Consumption Module - POS Sync and Error Handling', () => {
  beforeEach(() => {
    // Mock successful API endpoints by default
    cy.intercept('GET', '**/api/consumption/**', {
      statusCode: 200,
      body: mockConsumptionData.consumptionRecords
    }).as('getConsumptionData');

    cy.visit('/consumo');
  });

  describe('POS Sync Success Scenarios', () => {
    it('should handle successful POS sync', () => {
      // Mock successful sync response
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      // Trigger sync (assuming there's a sync button)
      cy.get('[data-testid="pos-sync-button"]').click();
      
      cy.wait('@posSyncSuccess');

      // Verify success toast
      cy.get('[data-testid="toast-container"]').should('be.visible');
      cy.get('[data-testid="success-toast"]').should('contain', 'Sincronización completada');
      cy.get('[data-testid="success-toast"]').should('contain', '15 registros procesados');
      
      // Verify success icon
      cy.get('[data-testid="success-toast"] [data-testid="success-icon"]').should('be.visible');
      
      // Toast should auto-dismiss after a few seconds
      cy.get('[data-testid="success-toast"]', { timeout: 6000 }).should('not.exist');
    });

    it('should show sync progress during operation', () => {
      // Mock delayed sync response
      cy.intercept('POST', '**/api/pos-sync/**', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send({ statusCode: 200, body: mockConsumptionData.posSync.success });
        });
      }).as('posSlowSync');

      cy.get('[data-testid="pos-sync-button"]').click();
      
      // Verify loading state
      cy.get('[data-testid="sync-loading"]').should('be.visible');
      cy.get('[data-testid="sync-loading"]').should('contain', 'Sincronizando');
      cy.get('[data-testid="sync-spinner"]').should('be.visible');
      
      // Button should be disabled during sync
      cy.get('[data-testid="pos-sync-button"]').should('be.disabled');
      
      cy.wait('@posSlowSync');
      
      // Loading should disappear
      cy.get('[data-testid="sync-loading"]').should('not.exist');
      cy.get('[data-testid="pos-sync-button"]').should('not.be.disabled');
    });

    it('should refresh data after successful sync', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      // Mock updated data after sync
      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 200,
        body: [...mockConsumptionData.consumptionRecords, {
          ...mockConsumptionData.consumptionRecords[0],
          id: 'new-sync-record',
          date: new Date().toISOString().split('T')[0]
        }]
      }).as('getUpdatedConsumptionData');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');
      
      // Should automatically refresh consumption data
      cy.wait('@getUpdatedConsumptionData');
      
      // Verify charts update
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
    });
  });

  describe('POS Sync Partial Success Scenarios', () => {
    it('should handle partial sync with warnings', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.partial
      }).as('posSyncPartial');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPartial');

      // Verify warning toast
      cy.get('[data-testid="warning-toast"]').should('be.visible');
      cy.get('[data-testid="warning-toast"]').should('contain', 'Sincronización parcial');
      cy.get('[data-testid="warning-toast"]').should('contain', '7 de 10 registros procesados');
      cy.get('[data-testid="warning-toast"]').should('contain', '3 errores');
      
      // Verify warning icon
      cy.get('[data-testid="warning-toast"] [data-testid="warning-icon"]').should('be.visible');
      
      // Should show details button
      cy.get('[data-testid="warning-toast"] [data-testid="view-details-button"]').should('be.visible');
    });

    it('should show error details modal', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.partial
      }).as('posSyncPartial');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPartial');

      // Click details button
      cy.get('[data-testid="view-details-button"]').click();
      
      // Verify modal opens
      cy.get('[data-testid="sync-details-modal"]').should('be.visible');
      cy.get('[data-testid="sync-details-modal"]').should('contain', 'Detalles de Sincronización');
      
      // Verify error list
      cy.get('[data-testid="error-list"]').should('be.visible');
      cy.get('[data-testid="error-item"]').should('have.length', 3);
      cy.get('[data-testid="error-item"]').first().should('contain', 'Invalid price format');
      
      // Close modal
      cy.get('[data-testid="close-modal-button"]').click();
      cy.get('[data-testid="sync-details-modal"]').should('not.exist');
    });
  });

  describe('POS Sync Failure Scenarios', () => {
    it('should handle complete sync failure', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Verify error toast
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Error de sincronización');
      cy.get('[data-testid="error-toast"]').should('contain', 'Connection timeout');
      
      // Verify error icon
      cy.get('[data-testid="error-toast"] [data-testid="error-icon"]').should('be.visible');
      
      // Should show retry button
      cy.get('[data-testid="error-toast"] [data-testid="retry-button"]').should('be.visible');
    });

    it('should handle network timeout', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 408,
        body: { error: 'Request timeout' }
      }).as('posSyncTimeout');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncTimeout');

      // Verify timeout error toast
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Tiempo de espera agotado');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle sync paused scenario', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 423,
        body: mockConsumptionData.posSync.paused
      }).as('posSyncPaused');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPaused');

      // Verify paused toast
      cy.get('[data-testid="warning-toast"]').should('be.visible');
      cy.get('[data-testid="warning-toast"]').should('contain', 'Sincronización pausada');
      cy.get('[data-testid="warning-toast"]').should('contain', 'Reintento programado');
      
      // Sync button should be disabled
      cy.get('[data-testid="pos-sync-button"]').should('be.disabled');
      cy.get('[data-testid="pos-sync-button"]').should('contain', 'Pausado');
    });

    it('should allow manual retry after failure', () => {
      // First request fails
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Then mock success for retry
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncRetrySuccess');

      // Click retry
      cy.get('[data-testid="retry-button"]').click();
      cy.wait('@posSyncRetrySuccess');

      // Verify success toast after retry
      cy.get('[data-testid="success-toast"]').should('be.visible');
      cy.get('[data-testid="success-toast"]').should('contain', 'Sincronización completada');
    });
  });

  describe('Data Loading Error Scenarios', () => {
    it('should handle consumption data loading failure', () => {
      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 500,
        body: mockConsumptionData.errors.networkError
      }).as('getConsumptionDataError');

      cy.reload();
      cy.wait('@getConsumptionDataError');

      // Verify error toast
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Error al cargar datos');
      
      // Verify error state in charts
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      cy.get('[data-testid="chart-error-state"]').should('contain', 'Error al cargar gráficos');
      
      // Should show retry button
      cy.get('[data-testid="chart-retry-button"]').should('be.visible');
    });

    it('should handle authentication error', () => {
      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 401,
        body: mockConsumptionData.errors.authError
      }).as('getConsumptionAuthError');

      cy.reload();
      cy.wait('@getConsumptionAuthError');

      // Verify auth error toast
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'No autorizado');
      
      // Should redirect to login or show login prompt
      cy.get('[data-testid="auth-error-action"]').should('be.visible');
    });

    it('should handle validation errors in filters', () => {
      // Mock validation error for invalid date range
      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 400,
        body: mockConsumptionData.errors.validationError
      }).as('getConsumptionValidationError');

      // Try to apply invalid date range
      cy.get('[data-testid="date-range-picker"]').click();
      
      // Select invalid range (end before start)
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      
      cy.get(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`).click(); // End date first
      cy.get(`[data-date="${today.toISOString().split('T')[0]}"]`).click(); // Start date after
      
      cy.get('[data-testid="apply-date-filter"]').click();
      cy.wait('@getConsumptionValidationError');

      // Verify validation error toast
      cy.get('[data-testid="error-toast"]').should('be.visible');
      cy.get('[data-testid="error-toast"]').should('contain', 'Rango de fechas inválido');
    });
  });

  describe('Toast Notification Behavior', () => {
    it('should stack multiple toasts correctly', () => {
      // Trigger multiple errors/successes rapidly
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      // Trigger multiple sync attempts
      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');
      
      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Should show multiple error toasts stacked
      cy.get('[data-testid="error-toast"]').should('have.length.greaterThan', 1);
    });

    it('should dismiss toasts manually', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Toast should be visible
      cy.get('[data-testid="success-toast"]').should('be.visible');
      
      // Click dismiss button
      cy.get('[data-testid="success-toast"] [data-testid="dismiss-button"]').click();
      
      // Toast should disappear
      cy.get('[data-testid="success-toast"]').should('not.exist');
    });

    it('should show persistent error toasts for critical errors', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Error toast should be visible and persistent
      cy.get('[data-testid="error-toast"]').should('be.visible');
      
      // Should not auto-dismiss after normal timeout
      cy.wait(6000);
      cy.get('[data-testid="error-toast"]').should('still.exist');
    });

    it('should show progress toasts for long operations', () => {
      cy.intercept('POST', '**/api/pos-sync/**', (req) => {
        req.reply((res) => {
          res.delay(3000);
          res.send({ statusCode: 200, body: mockConsumptionData.posSync.success });
        });
      }).as('posLongSync');

      cy.get('[data-testid="pos-sync-button"]').click();
      
      // Should show progress toast during operation
      cy.get('[data-testid="progress-toast"]').should('be.visible');
      cy.get('[data-testid="progress-toast"]').should('contain', 'Sincronizando datos');
      cy.get('[data-testid="progress-spinner"]').should('be.visible');
      
      cy.wait('@posLongSync');
      
      // Progress toast should be replaced by success toast
      cy.get('[data-testid="progress-toast"]').should('not.exist');
      cy.get('[data-testid="success-toast"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should announce toast messages to screen readers', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Toast should have proper ARIA attributes
      cy.get('[data-testid="success-toast"]')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'polite');
    });

    it('should be keyboard accessible', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Focus should move to retry button in error toast
      cy.get('[data-testid="retry-button"]').should('be.focused');
      
      // Should be able to activate with keyboard
      cy.get('[data-testid="retry-button"]').type('{enter}');
    });
  });
});