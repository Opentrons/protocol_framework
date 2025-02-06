import Markdown from 'react-markdown'
import releaseNotes from '../../../release-notes.md'
import { Box, COLORS, SPACING, LegacyStyledText } from '@opentrons/components'
import styles from './styles.module.css'

export function ReleaseNotes(): JSX.Element {
  return (
    <div className={styles.release_notes}>
      <Markdown
        components={{
          h2: HeaderText,
          ul: UnnumberedListText,
          li: ListItemText,
          p: ParagraphText,
          a: ExternalLink,
          hr: HorizontalRule,
        }}
      >
        {(releaseNotes as unknown) as string}
      </Markdown>
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
      borderBottom={`1px solid ${String(COLORS.grey30)}`}
      marginY={SPACING.spacing16}
      data-testid="divider"
    />
  )
}
