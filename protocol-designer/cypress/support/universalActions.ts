export enum UniversalActions {
  Snapshot = 'Take a visual testing snapshot',
  // Other examples of things that could be universal actions:
  // Clear the cache
}

export const universalActionHandlers = {
  [UniversalActions.Snapshot]: {
    handler: (): void => {
      // Placeholder for future implementation of visual testing snapshot
    },
    paramType: undefined,
  },
} as const
