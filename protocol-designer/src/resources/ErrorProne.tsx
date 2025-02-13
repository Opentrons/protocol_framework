// a component that throws an error to test error boundaries
export function ErrorProne(): JSX.Element {
  throw new Error('Intentional Error for Testing')
}
