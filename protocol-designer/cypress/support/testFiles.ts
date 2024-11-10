import fs from 'fs'
import path from 'path'
import type {
  ProtocolFileV3,
  ProtocolFileV4,
  ProtocolFileV5,
  ProtocolFileV6,
  ProtocolFileV7,
  ProtocolFileV8,
} from '@opentrons/shared-data'

import { isEnumValue } from './utils'

const loadFileContent = (filePath: string): any => {
  try {
    const fileExtension = path.extname(filePath)
    if (fileExtension === '.json') {
      const rawContent = fs.readFileSync(filePath, 'utf8')
      try {
        return JSON.parse(rawContent)
      } catch (parseError) {
        return rawContent
      }
    } else {
      return fs.readFileSync(filePath, 'utf8')
    }
  } catch (error) {
    return `Error loading file: ${error.message}`
  }
}

// ////////////////////////////////////////////
// This is the data section where we map all the protocol files
// We map to have IDE autocompletion of all the protocol files we have available to test with
// ////////////////////////////////////////////

export enum TestFilePath {
  // Define the path relative to the protocol-designer directory
  // PD root project fixtures
  DoItAllV3MigratedToV6 = 'fixtures/protocol/6/doItAllV3MigratedToV6.json',
  Mix_6_0_0 = 'fixtures/protocol/6/mix_6_0_0.json',
  PreFlexGrandfatheredProtocolV6 = 'fixtures/protocol/6/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV4MigratedToV6 = 'fixtures/protocol/6/doItAllV4MigratedToV6.json',
  Example_1_1_0V6 = 'fixtures/protocol/6/example_1_1_0MigratedFromV1_0_0.json',
  DoItAllV3MigratedToV7 = 'fixtures/protocol/7/doItAllV3MigratedToV7.json',
  Mix_7_0_0 = 'fixtures/protocol/7/mix_7_0_0.json',
  DoItAllV7 = 'fixtures/protocol/7/doItAllV7.json',
  DoItAllV4MigratedToV7 = 'fixtures/protocol/7/doItAllV4MigratedToV7.json',
  Example_1_1_0V7 = 'fixtures/protocol/7/example_1_1_0MigratedFromV1_0_0.json',
  MinimalProtocolOldTransfer = 'fixtures/protocol/1/minimalProtocolOldTransfer.json',
  Example_1_1_0 = 'fixtures/protocol/1/example_1_1_0.json',
  PreFlexGrandfatheredProtocolV1 = 'fixtures/protocol/1/preFlexGrandfatheredProtocol.json',
  DoItAllV1 = 'fixtures/protocol/1/doItAll.json',
  PreFlexGrandfatheredProtocolV4 = 'fixtures/protocol/4/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV3V4 = 'fixtures/protocol/4/doItAllV3.json',
  DoItAllV4V4 = 'fixtures/protocol/4/doItAllV4.json',
  NinetySixChannelFullAndColumn = 'fixtures/protocol/8/ninetySixChannelFullAndColumn.json',
  NewAdvancedSettingsAndMultiTemp = 'fixtures/protocol/8/newAdvancedSettingsAndMultiTemp.json',
  Example_1_1_0V8 = 'fixtures/protocol/8/example_1_1_0MigratedToV8.json',
  DoItAllV4MigratedToV8 = 'fixtures/protocol/8/doItAllV4MigratedToV8.json',
  DoItAllV8 = 'fixtures/protocol/8/doItAllV8.json',
  DoItAllV3MigratedToV8 = 'fixtures/protocol/8/doItAllV3MigratedToV8.json',
  Mix_8_0_0 = 'fixtures/protocol/8/mix_8_0_0.json',
  DoItAllV7MigratedToV8 = 'fixtures/protocol/8/doItAllV7MigratedToV8.json',
  MixSettingsV5 = 'fixtures/protocol/5/mixSettings.json',
  DoItAllV5 = 'fixtures/protocol/5/doItAllV5.json',
  BatchEditV5 = 'fixtures/protocol/5/batchEdit.json',
  MultipleLiquidsV5 = 'fixtures/protocol/5/multipleLiquids.json',
  PreFlexGrandfatheredProtocolV5 = 'fixtures/protocol/5/preFlexGrandfatheredProtocolMigratedFromV1_0_0.json',
  DoItAllV3V5 = 'fixtures/protocol/5/doItAllV3.json',
  TransferSettingsV5 = 'fixtures/protocol/5/transferSettings.json',
  Mix_5_0_X = 'fixtures/protocol/5/mix_5_0_x.json',
  Example_1_1_0V5 = 'fixtures/protocol/5/example_1_1_0MigratedFromV1_0_0.json',
  // cypress fixtures
  GarbageTextFile = 'cypress/fixtures/garbage.txt',
  Generic96TipRack200ul = 'cypress/fixtures/generic_96_tiprack_200ul.json',
  InvalidLabware = 'cypress/fixtures/invalid_labware.json',
  InvalidTipRack = 'cypress/fixtures/invalid_tip_rack.json',
  InvalidTipRackTxt = 'cypress/fixtures/invalid_tip_rack.txt',
  InvalidJson = 'cypress/fixtures/invalid_json.json',
}

export type TestProtocol =
  | ProtocolFileV3
  | ProtocolFileV4
  | ProtocolFileV5
  | ProtocolFileV6
  | ProtocolFileV7
  | ProtocolFileV8

export type TestFileOther = string

export interface TestFile {
  path: string
  protocolContent: TestProtocol | TestFileOther
}

export const getTestFile = (id: TestFilePath): TestFile => {
  if (!isEnumValue([TestFilePath], [id])) {
    throw new Error(`Invalid file path: ${id as string}`)
  }

  const filePath = id.valueOf()
  const content = loadFileContent(filePath)
  const fileExtension = path.extname(id)

  let typedContent: TestProtocol | TestFileOther

  if (fileExtension === '.json') {
    if (typeof content === 'object') {
      // TODO: logic here to cast to the correct protocol version
      typedContent = content
    } else {
      typedContent = content as string
    }
  } else if (fileExtension === '.txt') {
    typedContent = content as string
  } else {
    typedContent = content
  }

  return {
    path: filePath,
    protocolContent: typedContent,
  }
}
