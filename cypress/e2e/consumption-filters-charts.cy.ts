/// <reference types="cypress" />

import { mockConsumptionData, mockApiResponses } from '../fixtures/consumption-mock-data';

describe('Consumption Module - Filters and Charts', () => {
  beforeEach(() => {
    // Mock API endpoints
    cy.intercept('GET', '**/api/consumption/**', {
      statusCode: 200,
      body: mockConsumptionData.consumptionRecords
    }).as('getConsumptionData');

    cy.intercept('POST', '**/api/pos-sync/**', {
      statusCode: 200,
      body: mockConsumptionData.posSync.success
    }).as('posSyncSuccess');

    cy.intercept('GET', '**/api/consumption-alerts/**', {
      statusCode: 200,
      body: [
        mockConsumptionData.alerts.low,
        mockConsumptionData.alerts.abrupt,
        mockConsumptionData.alerts.restock
      ]
    }).as('getConsumptionAlerts');

    // Visit consumption page
    cy.visit('/consumo');
    cy.wait('@getConsumptionData');
  });

  describe('Consumption Filters', () => {
    it('should display all filter options', () => {
      cy.get('[data-testid="consumption-filters"]').should('be.visible');
      
      // Coffee variety filter
      cy.get('[data-testid="coffee-variety-select"]').should('be.visible');
      cy.get('[data-testid="coffee-variety-select"]').click();
      mockConsumptionData.filterOptions.coffeeVarieties.forEach(variety => {
        cy.contains(variety).should('be.visible');
      });
      cy.get('[data-testid="coffee-variety-select"]').click(); // Close dropdown

      // Format filter
      cy.get('[data-testid="format-select"]').should('be.visible');
      cy.get('[data-testid="format-select"]').click();
      mockConsumptionData.filterOptions.formats.forEach(format => {
        cy.contains(format).should('be.visible');
      });
      cy.get('[data-testid="format-select"]').click(); // Close dropdown

      // Date range filter
      cy.get('[data-testid="date-range-picker"]').should('be.visible');
    });

    it('should apply coffee variety filter correctly', () => {
      // Select a specific coffee variety
      cy.get('[data-testid="coffee-variety-select"]').click();
      cy.contains('Colombian Supreme').click();

      // Verify filter is applied
      cy.get('[data-testid="coffee-variety-select"]').should('contain', 'Colombian Supreme');
      
      // Check that charts update (mock API should be called with filter)
      cy.wait('@getConsumptionData');
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
    });

    it('should apply format filter correctly', () => {
      // Select a specific format
      cy.get('[data-testid="format-select"]').click();
      cy.contains('Espresso').click();

      // Verify filter is applied
      cy.get('[data-testid="format-select"]').should('contain', 'Espresso');
      
      // Check that data updates
      cy.wait('@getConsumptionData');
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
    });

    it('should apply date range filter correctly', () => {
      // Open date picker
      cy.get('[data-testid="date-range-picker"]').click();
      
      // Select date range (last 7 days)
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Select start date
      cy.get('[data-testid="date-picker-calendar"]').should('be.visible');
      cy.get(`[data-date="${lastWeek.toISOString().split('T')[0]}"]`).click();
      
      // Select end date
      cy.get(`[data-date="${today.toISOString().split('T')[0]}"]`).click();
      
      // Apply filter
      cy.get('[data-testid="apply-date-filter"]').click();
      
      // Verify filter is applied
      cy.wait('@getConsumptionData');
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
    });

    it('should clear all filters', () => {
      // Apply some filters first
      cy.get('[data-testid="coffee-variety-select"]').click();
      cy.contains('Colombian Supreme').click();
      
      cy.get('[data-testid="format-select"]').click();
      cy.contains('Espresso').click();

      // Clear all filters
      cy.get('[data-testid="clear-all-filters"]').click();

      // Verify filters are reset
      cy.get('[data-testid="coffee-variety-select"]').should('contain', 'Todas las variedades');
      cy.get('[data-testid="format-select"]').should('contain', 'Todos los formatos');
      
      // Verify data refreshes
      cy.wait('@getConsumptionData');
    });

    it('should show active filter count', () => {
      // Initially no active filters
      cy.get('[data-testid="active-filter-count"]').should('not.exist');

      // Apply one filter
      cy.get('[data-testid="coffee-variety-select"]').click();
      cy.contains('Colombian Supreme').click();
      
      cy.get('[data-testid="active-filter-count"]').should('contain', '1');

      // Apply second filter
      cy.get('[data-testid="format-select"]').click();
      cy.contains('Espresso').click();
      
      cy.get('[data-testid="active-filter-count"]').should('contain', '2');
    });
  });

  describe('Consumption Charts', () => {
    it('should display all chart components', () => {
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      
      // Monthly consumption chart
      cy.get('[data-testid="monthly-consumption-chart"]').should('be.visible');
      cy.get('[data-testid="monthly-consumption-chart"] .recharts-wrapper').should('exist');
      
      // Weekly consumption chart  
      cy.get('[data-testid="weekly-consumption-chart"]').should('be.visible');
      cy.get('[data-testid="weekly-consumption-chart"] .recharts-wrapper').should('exist');
      
      // Variety consumption chart
      cy.get('[data-testid="variety-consumption-chart"]').should('be.visible');
      cy.get('[data-testid="variety-consumption-chart"] .recharts-wrapper').should('exist');
    });

    it('should change chart time period', () => {
      // Select different time period
      cy.get('[data-testid="chart-period-select"]').click();
      cy.contains('Última semana').click();

      // Verify period is updated
      cy.get('[data-testid="chart-period-select"]').should('contain', 'Última semana');
      
      // Check that chart data updates
      cy.get('[data-testid="monthly-consumption-chart"]').should('be.visible');
    });

    it('should export chart as PNG', () => {
      // Test export functionality
      cy.get('[data-testid="export-monthly-chart"]').click();
      
      // Verify download is triggered (can't test actual file download in Cypress easily)
      cy.get('[data-testid="export-notification"]').should('contain', 'Gráfico exportado');
    });

    it('should display chart tooltips on hover', () => {
      // Hover over chart data points
      cy.get('[data-testid="monthly-consumption-chart"] .recharts-bar').first().trigger('mouseover');
      
      // Verify tooltip appears
      cy.get('.recharts-tooltip-wrapper').should('be.visible');
      cy.get('.recharts-tooltip-label').should('be.visible');
    });

    it('should toggle chart data series', () => {
      // Click legend to toggle data series
      cy.get('[data-testid="monthly-consumption-chart"] .recharts-legend-item').first().click();
      
      // Verify series is hidden/shown
      cy.get('[data-testid="monthly-consumption-chart"] .recharts-bar').should('have.length.greaterThan', 0);
    });

    it('should handle empty data gracefully', () => {
      // Mock empty data response
      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 200,
        body: []
      }).as('getEmptyConsumptionData');

      cy.reload();
      cy.wait('@getEmptyConsumptionData');

      // Verify empty state is shown
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      cy.get('[data-testid="empty-chart-state"]').should('contain', 'No hay datos');
    });
  });

  describe('Consumption Summary', () => {
    it('should display summary metrics', () => {
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
      
      // Weekly total
      cy.get('[data-testid="weekly-total"]').should('be.visible');
      cy.get('[data-testid="weekly-total"]').should('contain', '3,700');
      
      // Monthly total
      cy.get('[data-testid="monthly-total"]').should('be.visible');
      cy.get('[data-testid="monthly-total"]').should('contain', '14,800');
      
      // Top variety
      cy.get('[data-testid="top-variety"]').should('be.visible');
      cy.get('[data-testid="top-variety"]').should('contain', 'Colombian Supreme');
      
      // Efficiency
      cy.get('[data-testid="efficiency"]').should('be.visible');
      cy.get('[data-testid="efficiency"]').should('contain', '87.5%');
    });

    it('should show loading state', () => {
      // Mock slow API response
      cy.intercept('GET', '**/api/consumption/**', (req) => {
        req.reply((res) => {
          res.delay(2000);
          res.send({ statusCode: 200, body: mockConsumptionData.consumptionRecords });
        });
      }).as('getSlowConsumptionData');

      cy.reload();
      
      // Verify loading skeletons
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
      cy.get('[data-testid="summary-loading-skeleton"]').should('be.visible');
      
      cy.wait('@getSlowConsumptionData');
      
      // Verify data loads
      cy.get('[data-testid="summary-loading-skeleton"]').should('not.exist');
      cy.get('[data-testid="weekly-total"]').should('be.visible');
    });

    it('should update metrics when filters change', () => {
      // Apply filter
      cy.get('[data-testid="coffee-variety-select"]').click();
      cy.contains('Ethiopian Yirgacheffe').click();
      
      cy.wait('@getConsumptionData');
      
      // Verify metrics update
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
      cy.get('[data-testid="top-variety"]').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      cy.viewport('iphone-x');
      
      // Verify mobile layout
      cy.get('[data-testid="consumption-filters"]').should('be.visible');
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      
      // Charts should stack vertically
      cy.get('[data-testid="consumption-charts"] .grid').should('have.class', 'grid-cols-1');
    });

    it('should adapt to tablet viewport', () => {
      cy.viewport('ipad-2');
      
      // Verify tablet layout
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      
      // Should show partial grid
      cy.get('[data-testid="consumption-summary"] .grid').should('have.class', 'md:grid-cols-2');
    });

    it('should work well on large screens', () => {
      cy.viewport(1920, 1080);
      
      // Verify desktop layout
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      
      // Should show full grid
      cy.get('[data-testid="consumption-summary"] .grid').should('have.class', 'lg:grid-cols-4');
    });
  });

  describe('Performance', () => {
    it('should load page within acceptable time', () => {
      const startTime = Date.now();
      
      cy.visit('/consumo');
      cy.wait('@getConsumptionData');
      
      cy.get('[data-testid="consumption-charts"]').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // 3 second max load time
      });
    });

    it('should handle large datasets efficiently', () => {
      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConsumptionData.consumptionRecords[0],
        id: `large-${i}`,
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      cy.intercept('GET', '**/api/consumption/**', {
        statusCode: 200,
        body: largeDataset
      }).as('getLargeConsumptionData');

      cy.reload();
      cy.wait('@getLargeConsumptionData');

      // Verify page still loads and functions
      cy.get('[data-testid="consumption-charts"]').should('be.visible');
      cy.get('[data-testid="consumption-summary"]').should('be.visible');
    });
  });
});