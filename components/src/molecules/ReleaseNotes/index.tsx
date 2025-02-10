import Markdown from 'react-markdown'
import styled from 'styled-components'
import { LegacyStyledText } from '../../atoms'
import { Box } from '../../primitives'
import { COLORS } from '../../helix-design-system'
import { SPACING } from '../../ui-style-constants'

export interface ReleaseNotesProps {
  isOEMMode: boolean
  source?: string | null
}

const DEFAULT_RELEASE_NOTES = 'We recommend upgrading to the latest version.'

export function ReleaseNotes(props: ReleaseNotesProps): JSX.Element {
  const { source, isOEMMode } = props

  return (
    <div css={ReleaseNotesStyled}>
      {source != null && !isOEMMode ? (
        <Markdown
          components={{
            div: undefined,
            ul: UnnumberedListText,
            h2: HeaderText,
            li: ListItemText,
            p: ParagraphText,
            a: ExternalLink,
            hr: HorizontalRule,
          }}
        >
          {source}
        </Markdown>
      ) : (
        <p>{DEFAULT_RELEASE_NOTES}</p>
      )}
    </div>
  )
}

function ExternalLink(props: JSX.IntrinsicAttributes): JSX.Element {
  return <a {...props} target="_blank" rel="noopener noreferrer" />
}

function ParagraphText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="p" />
}

function HeaderText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="h3" />
}

function ListItemText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="li" />
}

function UnnumberedListText(props: JSX.IntrinsicAttributes): JSX.Element {
  return <LegacyStyledText {...props} as="ul" />
}

function HorizontalRule(): JSX.Element {
  return (
    <Box
      borderBottom={`1px solid ${COLORS.grey30}`}
      marginY={SPACING.spacing16}
      data-testid="divider"
    />
  )
}

const ReleaseNotesStyled = styled.div`
  .release_notes {
    width: 100%;
    max-height: 100%;
    padding: 0 0.5rem;

    & > h1 {
      font-size: var(--fs-header); /* from legacy --font-header-dark */
      font-weight: var(--fw-semibold); /* from legacy --font-header-dark */
      color: var(--c-font-dark); /* from legacy --font-header-dark */
      margin-bottom: 1rem;
    }

    & > h2 {
      font-size: var(--fs-header); /* from legacy --font-header-dark */
      color: var(--c-font-dark); /* from legacy --font-header-dark */
      font-weight: var(--fw-regular);
      margin-top: 1rem;
      margin-bottom: 0.75rem;
    }

    & > h3 {
      font-size: var(--fs-body-2); /* from legacy --font-body-2-dark */
      color: var(--c-font-dark); /* from legacy --font-body-2-dark */
      font-weight: var(--fw-semibold);
      margin-top: 0.75rem;
      margin-bottom: 0.5rem;
    }

    & ul,
    & ol {
      margin-left: 1.25rem;
      margin-bottom: 0.25rem;
      font-size: var(--fs-body-2);
      color: var(--c-font-dark); /* from legacy --font-body-2-dark */
    }

    & li {
      margin: 0.25rem 0;
      font-size: var(--fs-body-2);
      color: var(--c-font-dark); /* from legacy --font-body-2-dark */
    }

    & code {
      font-family: monospace;
      color: var(--c-font-dark);
    }

    & pre {
      margin: 0.5rem 0;
      padding: 0.5rem 0.75rem;
      background-color: var(--c-font-dark);

      & code {
        color: var(--c-font-light);
      }
    }

    & p {
      font-size: var(--fs-body-2); /* from legacy --font-body-2-dark */
      font-weight: var(--fw-regular); /* from legacy --font-body-2-dark */
      color: var(--c-font-dark); /* from legacy --font-body-2-dark */
      margin-bottom: 1rem;
    }
  }
`
