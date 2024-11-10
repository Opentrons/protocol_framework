// #/overview

export enum Content {
  OldProtocolMessage = 'Your protocol was made in an older version of Protocol Designer',
  ConfirmButton = 'Confirm',
  CancelButton = 'Cancel',
}

export enum Locators {
  ModalShellArea = '[aria-label="ModalShell_ModalArea"]',
}

export const verifyOldProtocolModal = (): void => {
  cy.get(Locators.ModalShellArea)
    .should('exist')
    .should('be.visible')
    .within(() => {
      cy.contains(Content.OldProtocolMessage).should('exist').and('be.visible')
      cy.contains(Content.ConfirmButton).should('be.visible')
      cy.contains(Content.CancelButton).should('be.visible')
      cy.contains(Content.ConfirmButton).click()
    })
}
