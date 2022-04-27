const { lstat } = require("fs")

describe('tests', () => {
    beforeEach(() => {
      cy.visitMobile('http://localhost:3000')
      cy.get('#loader-start').click()
    })

    it('scroll to first paragraph', () => {
        cy.viewport('iphone-x', 'landscape')
        cy.get('blockquote').first().isNotInViewport()
        cy.get('#main').swipe('bottom', 'top')
        cy.get('blockquote').first().isWithinViewport()
    })

    it('scroll to last paragraph', () => {
        cy.viewport('iphone-x', 'landscape')
        cy.get('#main > p').each(
            ()=>{swipe('bottom', 'top')}
        )
        cy.get('#footer').isWithinViewport()
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
  