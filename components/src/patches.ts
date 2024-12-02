import styled from 'styled-components'

export * from 'styled-components'

// @ts-expect-error
const defaultStyled: typeof styled = typeof styled === 'function' ? styled : styled.default

// eslint-disable-next-line import/no-default-export
export { defaultStyled as default }
