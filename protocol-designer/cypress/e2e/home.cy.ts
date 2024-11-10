describe('The Home Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('successfully loads', () => {
    // JTM20241109
    // Normally we want to read our test and understand the validations,
    // but I forsee wanting to be able to call these functions from multiple
    // places so we will abstract it
    cy.verifyFullHeader()
    cy.verifyHomePage()
  })
})
