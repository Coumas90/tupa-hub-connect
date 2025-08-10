describe('Landing render', () => {
  it('loads the home page without blank screen', () => {
    cy.visit('/');
    // Ajusta el selector al contenido real de la landing
    cy.contains(/(home|landing|bienvenido|tupá)/i).should('exist');
  });
});
