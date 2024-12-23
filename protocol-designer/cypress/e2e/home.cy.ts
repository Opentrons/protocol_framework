describe('The Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.closeAnnouncementModal()
  })

  it('successfully loads', () => {
    cy.verifyFullHeader()
    cy.verifyHomePage()
  })
})
