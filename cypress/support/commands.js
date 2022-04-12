// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add("isScrolledTo", { prevSubject: true }, (element) => {
    cy.get(element).should(($el) => {
        const bottom = Cypress.$(cy.state("window")).height();
        const rect = $el[0].getBoundingClientRect();

        expect(rect.top).not.to.be.greaterThan(bottom, `Expected element not to be below the visible scrolled area`);
        expect(rect.top).to.be.greaterThan(0 - rect.height, `Expected element not to be above the visible scrolled area`)
    });
});

Cypress.Commands.add('topIsWithinViewport', { prevSubject: true }, subject => {
    const windowInnerWidth = Cypress.config(`viewportWidth`);
  
    const bounding = subject[0].getBoundingClientRect();
  
    const rightBoundOfWindow = windowInnerWidth;
  
    expect(bounding.top).to.be.at.least(0);
    expect(bounding.left).to.be.at.least(0);
    expect(bounding.right).to.be.lessThan(rightBoundOfWindow);
  
    return subject;
  })
  
  Cypress.Commands.add('isWithinViewport', { prevSubject: true }, subject => {
    const windowInnerWidth = Cypress.config(`viewportWidth`);
    const windowInnerHeight = Cypress.config(`viewportHeight`);
  
    const bounding = subject[0].getBoundingClientRect();
  
    const rightBoundOfWindow = windowInnerWidth;
    const bottomBoundOfWindow = windowInnerHeight;
  
    expect(bounding.top).to.be.at.least(0);
    expect(bounding.left).to.be.at.least(0);
    expect(bounding.right).to.be.lessThan(rightBoundOfWindow);
    expect(bounding.bottom).to.be.lessThan(bottomBoundOfWindow);
  
    return subject;
  })

  Cypress.Commands.add("isNotInViewport", { prevSubject: true }, (element) => {
    const message = `Did not expect to find ${element[0].outerHTML} in viewport`;
  
    cy.get(element).should(($el) => {
      const bottom = Cypress.$(cy.state("window")).height();
      const rect = $el[0].getBoundingClientRect();
  
      expect(rect.top).to.be.greaterThan(bottom, message);
      expect(rect.bottom).to.be.greaterThan(bottom, message);
      expect(rect.top).to.be.greaterThan(bottom, message);
      expect(rect.bottom).to.be.greaterThan(bottom, message);
    });
  });