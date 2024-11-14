/**
 * @description Several processes we care about execute with a lot of unique sub args determined at
 * runtime. These processes are aggregated using a regex pattern.
 */
const AGGREGATED_PROCESSES = [
  {
    pattern: /^\/opt\/opentrons-app\/opentrons --type=renderer/,
    key: 'app-renderer-processes',
  },
  {
    pattern: /^\/opt\/opentrons-app\/opentrons --type=zygote/,
    key: 'app-zygote-processes',
  },
  {
    pattern: /^python3 -m uvicorn/,
    key: 'robot-server-uvicorn-processes',
  },
  {
    pattern: /^\/opt\/opentrons-app\/opentrons --type=utility/,
    key: 'app-utility-processes',
  },
]

/**
 * @description Generally don't include any variation of external processes in analysis.
 */
const BLACKLISTED_PROCESSES = [/^nmcli/, /^\/usr\/bin\/python3/]

/**
 * @description For Pearson's, it's generally recommended to use a sample size of at least n=30.
 */
const MINIMUM_VALID_SAMPLE_SIZE = 30

const P_VALUE_SIGNIFICANCE_THRESHOLD = 0.05

module.exports = {
  AGGREGATED_PROCESSES,
  BLACKLISTED_PROCESSES,
  MINIMUM_VALID_SAMPLE_SIZE,
  P_VALUE_SIGNIFICANCE_THRESHOLD,
}
