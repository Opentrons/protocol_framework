import { TestFilePath, getTestFile } from '../support/testFiles'
import { verifyOldProtocolModal } from '../support/import'

describe('The Import Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('successfully loads', () => {
    const protocol = getTestFile(TestFilePath.DoItAllV8)
    cy.importProtocol(protocol.path)
    verifyOldProtocolModal()
  })
})
