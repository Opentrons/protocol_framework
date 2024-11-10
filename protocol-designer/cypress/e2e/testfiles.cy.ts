import { TestFilePath, getTestFile } from '../support/testFiles'

describe('Validate Test Files', () => {
  it('should load and validate all test files', () => {
    ;(Object.keys(TestFilePath) as Array<keyof typeof TestFilePath>).forEach(
      key => {
        const testFile = getTestFile(TestFilePath[key])
        expect(testFile).to.have.property('path')
        expect(testFile).to.have.property('protocolContent')
        cy.log(`Loaded and validated: ${testFile.path}`)
      }
    )
  })
})
