const { lstat } = require("fs")

describe('tests', () => {
    beforeEach(() => {
      cy.viewport('iphone-x', 'landscape')
      cy.visitMobile('http://localhost:3000')
      cy.get('#loader-start > a').click()
    })

    context('test popup', () => {
        beforeEach(() => {
          cy.get('#label1').click()
        })
        

        // cant get touch scroll to work... ;(
        // it('check popup after scroll', () => {

        //   cy.get('#popup1').shadow().find('.modal-dialog').swipe([400,250], [400,150])
        //   cy.get('#popup1 > p').first().swipe([400,250], [400,150])
        //   cy.get('#popup1 > p').last().isScrolledTo()
        // })

        it('check popup content', () => {
            cy.get('#popup1 > h2').first().should('have.text', 'Meaning - WHY?')
        })
    
        it('check popup close', () => {
            cy.get('#popup1').shadow().find('.close').click()
            cy.get('#popup1').should('not.have.a.property', 'open')
        })

        it('check popup before scroll', () => {
            cy.viewport('iphone-x', 'landscape')
            cy.get('#popup1 > p').last().isNotInViewport()

        })
    })
})
  