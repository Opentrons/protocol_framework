// A script to analyze memory usage data for the ODD and select ODD processes using Pearson's correlation coefficient.
// Processes with a negative correlation are filtered out. Select processes are aggregated and others are blacklisted
// from analysis.
// NOTE: While averages are reported in "buckets", Pearson's does not compare buckets when calculating a correlation.
'use strict'

const assert = require('assert')

const { analyzeMemoryTrendsAcrossVersions } = require('./analyzeMemoryTrends')

const NUM_ANALYZED_PREV_VERSIONS = 2
const USAGE =
  '\nUsage:\n  node ./scripts/resource-monitor/perform-memory-analysis <mixpanel_service_uname> <mixpanel_service_pwd> <mixpanel_project_id>'

async function main() {
  try {
    const [uname, pwd, projectId] = process.argv
      .filter(a => !a.startsWith('-'))
      .slice(2)
      .map(s => s.trim())

    assert(uname && pwd && projectId, USAGE)

    const memoryAnalysis = await analyzeMemoryTrendsAcrossVersions({
      previousVersionCount: NUM_ANALYZED_PREV_VERSIONS,
      uname,
      pwd,
      projectId,
    })

    console.log(
      '\nODD Available Memory and Processes with Increasing Memory Trend by Version (Rolling 1 Month Analysis Window):'
    )
    Object.entries(memoryAnalysis).forEach(([version, analysis]) => {
      console.log(`\n${version}:`, JSON.stringify(analysis, null, 2))
    })
  } catch (error) {
    console.error('Error during analysis:', error)
  }
}

if (require.main === module) {
  main()
}
