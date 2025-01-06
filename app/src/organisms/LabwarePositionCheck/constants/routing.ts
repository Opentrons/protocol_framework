export const NAV_STEPS = {
  BEFORE_BEGINNING: 'BEFORE_BEGINNING',
  ATTACH_PROBE: 'ATTACH_PROBE',
  CHECK_POSITIONS: 'CHECK_POSITIONS',
  DETACH_PROBE: 'DETACH_PROBE',
  RESULTS_SUMMARY: 'RESULTS_SUMMARY',
} as const

export const NAV_MOTION = {
  IN_MOTION: 'IN_MOTION',
}

// For errors, door open CTAs, etc.
export const NAV_ALERTS = {}

// TOME: TODO: Can we separate the flex steps from the OT-2 steps? Yeah definitely, since there's no tip rack checking in Flex.
export const NAV_STEPS_FLEX: Array<keyof typeof NAV_STEPS> = []

export const NAV_STEPS_OT2: Array<keyof typeof NAV_STEPS> = []
