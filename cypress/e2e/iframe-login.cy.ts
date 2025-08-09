/// <reference types="cypress" />

describe('Login dentro de iframe autorizado', () => {
  it('renderiza la página de login dentro del iframe', () => {
    cy.visit('/iframe-auth-test.html');
    cy.get('#app-frame').then(($iframe) => {
      const $body = $iframe.contents().find('body');
      cy.wrap($body).contains('login', { matchCase: false });
    });
  });
});
