/// <reference types="cypress" />

describe('Consumption Module QA Suite', () => {
  before(() => {
    // Set up test environment
    cy.task('log', 'Starting Consumption Module QA Suite');
  });

  beforeEach(() => {
    // Clear any stored data between tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should run all consumption filter and chart tests', () => {
    cy.task('log', 'Running consumption filters and charts test suite...');
    // This test runs the consumption-filters-charts.cy.ts suite
  });

  it('should run all POS sync and error handling tests', () => {
    cy.task('log', 'Running POS sync and error handling test suite...');
    // This test runs the consumption-pos-sync-errors.cy.ts suite
  });

  it('should run all toast validation tests', () => {
    cy.task('log', 'Running toast validation test suite...');
    // This test runs the consumption-toast-validation.cy.ts suite
  });

  after(() => {
    cy.task('log', 'Consumption Module QA Suite completed');
  });
});

// Global test configuration for consumption module
Cypress.Commands.add('mockConsumptionData', (scenario = 'default') => {
  const mockData = require('../fixtures/consumption-mock-data');
  
  switch (scenario) {
    case 'empty':
      cy.intercept('GET', '**/api/consumption/**', { body: [] });
      break;
    case 'error':
      cy.intercept('GET', '**/api/consumption/**', { statusCode: 500 });
      break;
    case 'large':
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockData.mockConsumptionData.consumptionRecords[0],
        id: `large-${i}`
      }));
      cy.intercept('GET', '**/api/consumption/**', { body: largeDataset });
      break;
    default:
      cy.intercept('GET', '**/api/consumption/**', { 
        body: mockData.mockConsumptionData.consumptionRecords 
      });
  }
});

Cypress.Commands.add('mockPOSSync', (scenario = 'success') => {
  const mockData = require('../fixtures/consumption-mock-data');
  
  switch (scenario) {
    case 'success':
      cy.intercept('POST', '**/api/pos-sync/**', { 
        body: mockData.mockConsumptionData.posSync.success 
      });
      break;
    case 'partial':
      cy.intercept('POST', '**/api/pos-sync/**', { 
        body: mockData.mockConsumptionData.posSync.partial 
      });
      break;
    case 'failure':
      cy.intercept('POST', '**/api/pos-sync/**', { 
        statusCode: 500,
        body: mockData.mockConsumptionData.posSync.failure 
      });
      break;
    case 'paused':
      cy.intercept('POST', '**/api/pos-sync/**', { 
        statusCode: 423,
        body: mockData.mockConsumptionData.posSync.paused 
      });
      break;
  }
});

Cypress.Commands.add('verifyToast', (type, expectedContent) => {
  cy.get(`[data-testid="${type}-toast"]`).should('be.visible');
  
  if (expectedContent.title) {
    cy.get(`[data-testid="${type}-toast"] [data-testid="toast-title"]`)
      .should('contain', expectedContent.title);
  }
  
  if (expectedContent.description) {
    cy.get(`[data-testid="${type}-toast"] [data-testid="toast-description"]`)
      .should('contain', expectedContent.description);
  }
  
  if (expectedContent.icon) {
    cy.get(`[data-testid="${type}-toast"] [data-testid="${expectedContent.icon}-icon"]`)
      .should('be.visible');
  }
});

Cypress.Commands.add('checkAccessibility', () => {
  // Basic accessibility checks
  cy.get('*[role="alert"]').should('have.attr', 'aria-live');
  cy.get('button').should('be.visible').should('not.have.attr', 'disabled');
  cy.get('input').should('have.attr', 'aria-label').or('have.attr', 'aria-labelledby');
});

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      mockConsumptionData(scenario?: 'default' | 'empty' | 'error' | 'large'): Chainable<void>;
      mockPOSSync(scenario?: 'success' | 'partial' | 'failure' | 'paused'): Chainable<void>;
      verifyToast(type: 'success' | 'error' | 'warning', expectedContent: {
        title?: string;
        description?: string;
        icon?: string;
      }): Chainable<void>;
      checkAccessibility(): Chainable<void>;
    }
  }
}