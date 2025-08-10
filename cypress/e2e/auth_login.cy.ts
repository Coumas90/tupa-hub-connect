describe('Auth → Login smoke', () => {
  it('login and land on dashboard', () => {
    cy.visit('/login');

    const email = Cypress.env('E2E_EMAIL');
    const pass = Cypress.env('E2E_PASSWORD');

    cy.get('[data-testid="email"], input[type="email"]').first().clear().type(email);
    cy.get('[data-testid="password"], input[type="password"]').first().clear().type(pass);
    cy.get('[data-testid="login-submit"], button[type="submit"]').first().click();

    cy.url().should('include', '/dashboard');
    cy.contains(email).should('exist');
  });
});
