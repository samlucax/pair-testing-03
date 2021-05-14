/// <reference types="cypress" />
// 

describe('HackerNews Search', () => {
  context('Happy Path', () => {
    const terms = {
      cypress: 'cypress.io',
      selenium: 'selenium'
    }

    beforeEach(() => {
      cy.intercept(
        '**/search?query=redux&page=0&hitsPerPage=100',
        {
          fixture: 'empty'
        }
      ).as('empty')

      cy.intercept(
        `**/search?query=${terms.cypress}&page=0&hitsPerPage=100`,
        {
          fixture: 'stories'
        }
      ).as('stories')

      cy.intercept(
        `**/search?query=${terms.cypress}&page=1&hitsPerPage=100`,
        {
          fixture: 'incomplete'
        }
      ).as('stories2')

      cy.intercept(
        `**/search?query=${terms.selenium}&page=0&hitsPerPage=100`,
        {
          fixture: 'incomplete'
        }
      ).as('incomplete')

      cy.visit('https://infinite-savannah-93746.herokuapp.com/')

      cy.wait('@empty')
    });

    it(`Searches by ${terms.cypress}`, () => {
      cy.search(terms.cypress)

      cy.wait('@stories')
      cy.fixture("stories").then((stories) => {
        cy.get('.table-row').should('have.length', stories.hits.length)
      })

    });

    it('Load more', () => {
      cy.search(terms.cypress)

      cy.wait('@stories')

      cy.get('button')
        .contains('More')
        .click()

      cy.wait('@stories2')

      cy.fixture('stories').then((stories) => {
        cy.fixture('incomplete').then((incomplete) => {
          cy.get('.table-row').should('have.length', stories.hits.length + incomplete.hits.length)
        })
      })

      
      
    });

    it(`Searchs by ${terms.selenium} and dismisses the first item`, () => {
      cy.search(terms.selenium)

      cy.wait('@incomplete')

      cy.fixture("incomplete").then((stories) => {
        cy.get('.table-row').as('tableRow').should('have.length', stories.hits.length)

        cy.get('.button-inline').contains('Dismiss').click()

        cy.get('@tableRow').should('have.length', stories.hits.length - 1)
      })
    });

    it('Correctly caches the results', () => {
      const faker = require('faker')
      const randomWord = faker.random.word()
      let count = 0

      cy.intercept(`**/search?query=${randomWord}**`, (req) => {
        count++
        req.reply({ fixture: 'empty' })
      }).as('random')

      cy.search(randomWord).then(() => {
        expect(count, `network calls to fetch ${randomWord}`).to.equal(1)
      })

      cy.wait('@random')

      cy.search(terms.selenium)
      cy.wait('@incomplete')

      cy.search(randomWord).then(() => {
        expect(count, `network calls to fetch ${randomWord}`).to.equal(1)
      })

    });
  });

  context('Failure Path', () => {
    it('Shows a fallback component on a server failure', () => {

      cy.intercept('**/search**', {
        statusCode: 500
      }).as('serverFailure')

      cy.visit('https://infinite-savannah-93746.herokuapp.com/')

      cy.wait('@serverFailure')

      cy.get('p')
        .contains('Something went wrong.')
        .should('be.visible')

    });
  });
});