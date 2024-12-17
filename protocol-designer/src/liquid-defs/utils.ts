import { getAllLiquidClassDefs } from '@opentrons/shared-data'

const liquidClassDefs = getAllLiquidClassDefs()
export const getLiquidClassDisplayName = (
  liquidClass: string | null
): string | null => {
  if (liquidClass == null) {
    return null
  }
  return liquidClassDefs[liquidClass]?.displayName ?? null
}
