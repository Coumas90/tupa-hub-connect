/// <reference types="cypress" />

import { mockConsumptionData } from '../fixtures/consumption-mock-data';

describe('Consumption Module - Toast Error Validation', () => {
  beforeEach(() => {
    cy.visit('/consumo');
  });

  describe('Toast Component Validation', () => {
    it('should render toast container with proper structure', () => {
      // Toast container should exist
      cy.get('[data-testid="toast-container"]').should('exist');
      
      // Should have proper positioning classes
      cy.get('[data-testid="toast-container"]')
        .should('have.class', 'fixed')
        .should('have.class', 'top-0')
        .should('have.class', 'right-0');
    });

    it('should validate success toast structure', () => {
      // Mock successful sync
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Validate success toast structure
      cy.get('[data-testid="success-toast"]').within(() => {
        // Should have success icon
        cy.get('[data-testid="success-icon"]').should('be.visible');
        
        // Should have title
        cy.get('[data-testid="toast-title"]')
          .should('be.visible')
          .should('contain', 'Sincronización completada');
        
        // Should have description
        cy.get('[data-testid="toast-description"]')
          .should('be.visible')
          .should('contain', '15 registros procesados exitosamente');
        
        // Should have dismiss button
        cy.get('[data-testid="dismiss-button"]').should('be.visible');
        
        // Should have proper styling classes
        cy.root().should('have.class', 'bg-green-50');
        cy.root().should('have.class', 'border-green-200');
      });
    });

    it('should validate error toast structure', () => {
      // Mock sync failure
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Validate error toast structure
      cy.get('[data-testid="error-toast"]').within(() => {
        // Should have error icon
        cy.get('[data-testid="error-icon"]').should('be.visible');
        
        // Should have title
        cy.get('[data-testid="toast-title"]')
          .should('be.visible')
          .should('contain', 'Error de sincronización');
        
        // Should have description
        cy.get('[data-testid="toast-description"]')
          .should('be.visible')
          .should('contain', 'Connection timeout to POS system');
        
        // Should have retry button
        cy.get('[data-testid="retry-button"]')
          .should('be.visible')
          .should('contain', 'Reintentar');
        
        // Should have proper styling classes
        cy.root().should('have.class', 'bg-red-50');
        cy.root().should('have.class', 'border-red-200');
      });
    });

    it('should validate warning toast structure', () => {
      // Mock partial sync
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.partial
      }).as('posSyncPartial');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPartial');

      // Validate warning toast structure
      cy.get('[data-testid="warning-toast"]').within(() => {
        // Should have warning icon
        cy.get('[data-testid="warning-icon"]').should('be.visible');
        
        // Should have title
        cy.get('[data-testid="toast-title"]')
          .should('be.visible')
          .should('contain', 'Sincronización parcial');
        
        // Should have description with details
        cy.get('[data-testid="toast-description"]')
          .should('be.visible')
          .should('contain', '7 de 10 registros procesados');
        
        // Should have view details button
        cy.get('[data-testid="view-details-button"]')
          .should('be.visible')
          .should('contain', 'Ver detalles');
        
        // Should have proper styling classes
        cy.root().should('have.class', 'bg-yellow-50');
        cy.root().should('have.class', 'border-yellow-200');
      });
    });
  });

  describe('Toast Content Validation', () => {
    it('should validate success message content accuracy', () => {
      const successData = mockConsumptionData.posSync.success;
      
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: successData
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      cy.get('[data-testid="success-toast"]').within(() => {
        // Validate specific numbers from mock data
        cy.get('[data-testid="toast-description"]')
          .should('contain', `${successData.recordsProcessed} registros procesados`)
          .should('contain', `${successData.recordsSuccess} exitosos`);
          
        // Should not contain error information
        cy.get('[data-testid="toast-description"]')
          .should('not.contain', 'error')
          .should('not.contain', 'fallo');
      });
    });

    it('should validate error message content accuracy', () => {
      const errorData = mockConsumptionData.posSync.failure;
      
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: errorData
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      cy.get('[data-testid="error-toast"]').within(() => {
        // Validate error message from mock data
        cy.get('[data-testid="toast-description"]')
          .should('contain', errorData.errors[0]);
          
        // Should show log ID if available
        if (errorData.logId) {
          cy.get('[data-testid="log-id"]')
            .should('contain', errorData.logId);
        }
      });
    });

    it('should validate partial sync message content', () => {
      const partialData = mockConsumptionData.posSync.partial;
      
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: partialData
      }).as('posSyncPartial');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPartial');

      cy.get('[data-testid="warning-toast"]').within(() => {
        // Validate success/failure counts
        cy.get('[data-testid="toast-description"]')
          .should('contain', `${partialData.recordsSuccess} de ${partialData.recordsProcessed}`)
          .should('contain', `${partialData.recordsFailed} errores`);
      });
    });

    it('should validate paused sync message content', () => {
      const pausedData = mockConsumptionData.posSync.paused;
      
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 423,
        body: pausedData
      }).as('posSyncPaused');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncPaused');

      cy.get('[data-testid="warning-toast"]').within(() => {
        // Should indicate sync is paused
        cy.get('[data-testid="toast-description"]')
          .should('contain', 'pausada')
          .should('contain', 'fallos repetidos');
          
        // Should show next retry time if available
        if (pausedData.nextRetryAt) {
          cy.get('[data-testid="next-retry-time"]').should('be.visible');
        }
      });
    });
  });

  describe('Toast Behavior Validation', () => {
    it('should validate auto-dismiss timing for success toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Success toast should be visible initially
      cy.get('[data-testid="success-toast"]').should('be.visible');
      
      // Should auto-dismiss after 5 seconds
      cy.get('[data-testid="success-toast"]', { timeout: 6000 }).should('not.exist');
    });

    it('should validate persistent behavior for error toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Error toast should be visible
      cy.get('[data-testid="error-toast"]').should('be.visible');
      
      // Should NOT auto-dismiss (should still be visible after 6 seconds)
      cy.wait(6000);
      cy.get('[data-testid="error-toast"]').should('still.exist');
    });

    it('should validate manual dismiss functionality', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Toast should be visible
      cy.get('[data-testid="success-toast"]').should('be.visible');
      
      // Click dismiss button
      cy.get('[data-testid="dismiss-button"]').click();
      
      // Toast should disappear immediately
      cy.get('[data-testid="success-toast"]').should('not.exist');
    });

    it('should validate toast stacking behavior', () => {
      // Mock multiple rapid sync attempts
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      // Trigger multiple sync attempts quickly
      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');
      
      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');
      
      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Should stack multiple toasts vertically
      cy.get('[data-testid="error-toast"]').should('have.length', 3);
      
      // Each toast should have different positions
      cy.get('[data-testid="error-toast"]').each(($toast, index) => {
        cy.wrap($toast).should('have.css', 'transform');
      });
    });
  });

  describe('Toast Animation Validation', () => {
    it('should validate slide-in animation for new toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Toast should have slide-in animation class
      cy.get('[data-testid="success-toast"]')
        .should('have.class', 'animate-slide-in-right')
        .or('have.class', 'animate-fade-in');
    });

    it('should validate slide-out animation for dismissing toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Click dismiss
      cy.get('[data-testid="dismiss-button"]').click();
      
      // Should briefly show slide-out animation before disappearing
      cy.get('[data-testid="success-toast"]')
        .should('have.class', 'animate-slide-out-right')
        .or('have.class', 'animate-fade-out');
    });
  });

  describe('Toast Accessibility Validation', () => {
    it('should validate ARIA attributes for success toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      cy.get('[data-testid="success-toast"]')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'polite')
        .should('have.attr', 'aria-atomic', 'true');
        
      // Title should have proper heading level
      cy.get('[data-testid="toast-title"]')
        .should('have.attr', 'aria-level', '3');
    });

    it('should validate ARIA attributes for error toasts', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      cy.get('[data-testid="error-toast"]')
        .should('have.attr', 'role', 'alert')
        .should('have.attr', 'aria-live', 'assertive') // More urgent for errors
        .should('have.attr', 'aria-atomic', 'true');
        
      // Error icon should have proper label
      cy.get('[data-testid="error-icon"]')
        .should('have.attr', 'aria-label', 'Error');
    });

    it('should validate keyboard navigation for toast actions', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: mockConsumptionData.posSync.failure
      }).as('posSyncFailure');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncFailure');

      // Retry button should be focusable and accessible via keyboard
      cy.get('[data-testid="retry-button"]')
        .should('be.visible')
        .focus()
        .should('be.focused');
        
      // Should be activatable with Enter key
      cy.get('[data-testid="retry-button"]').type('{enter}');
      
      // Dismiss button should also be focusable
      cy.get('[data-testid="dismiss-button"]')
        .focus()
        .should('be.focused')
        .type('{enter}');
        
      cy.get('[data-testid="error-toast"]').should('not.exist');
    });

    it('should validate color contrast for toast elements', () => {
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 200,
        body: mockConsumptionData.posSync.success
      }).as('posSyncSuccess');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncSuccess');

      // Check that text has sufficient contrast against background
      cy.get('[data-testid="toast-title"]').should('be.visible');
      cy.get('[data-testid="toast-description"]').should('be.visible');
      
      // This is a basic visibility check - actual contrast testing would require specialized tools
      cy.get('[data-testid="success-toast"]').should('not.have.css', 'color', 'rgba(0, 0, 0, 0)');
    });
  });

  describe('Toast Content Sanitization Validation', () => {
    it('should sanitize HTML in error messages', () => {
      // Mock response with potentially dangerous HTML
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: {
          ...mockConsumptionData.posSync.failure,
          errors: ['<script>alert("xss")</script>Connection error']
        }
      }).as('posSyncXSSAttempt');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncXSSAttempt');

      // HTML should be escaped/sanitized, not executed
      cy.get('[data-testid="toast-description"]')
        .should('contain', '<script>')
        .should('not.contain.html', '<script>alert("xss")</script>');
        
      // Should not trigger any XSS
      cy.window().its('alert').should('not.exist');
    });

    it('should handle very long error messages gracefully', () => {
      const longError = 'A'.repeat(1000) + ' - Very long error message that should be truncated or handled properly';
      
      cy.intercept('POST', '**/api/pos-sync/**', {
        statusCode: 500,
        body: {
          ...mockConsumptionData.posSync.failure,
          errors: [longError]
        }
      }).as('posSyncLongError');

      cy.get('[data-testid="pos-sync-button"]').click();
      cy.wait('@posSyncLongError');

      // Toast should still be properly sized and not break layout
      cy.get('[data-testid="error-toast"]')
        .should('be.visible')
        .should('have.css', 'max-width');
        
      // Content should be truncated or scrollable
      cy.get('[data-testid="toast-description"]')
        .should('be.visible')
        .invoke('height')
        .should('be.lessThan', 200); // Reasonable height limit
    });
  });
});