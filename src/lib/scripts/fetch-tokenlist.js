#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const commander = require('commander')
const chalk = require('chalk')
const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const CONFIG = {
  SOURCE_URL:
    'https://raw.githubusercontent.com/burrbear-dev/default-lists/main/src/tokens/mainnet/defaultTokenList.json',
  TARGET_TOKEN_FILE: 'src/tokenlists/balancer/tokens/berachain.ts',
  ASSETS_DIR: 'src/assets/images/tokens',
  LOG_FILE: `fetch-tokenlist-${new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)}.log`,
}

// Statistics tracking
const stats = {
  totalTokens: 0,
  successfulDownloads: 0,
  failedDownloads: 0,
  skippedDownloads: 0,
  errors: [],
}

/**
 * Execute curl command and return result
 */
function curlGet(url, options = {}) {
  try {
    const curlOptions = [
      '-s', // silent mode
      '-L', // follow redirects
      '--max-time',
      '30', // 30 second timeout
      '--retry',
      '3', // retry 3 times
      '--retry-delay',
      '2', // wait 2 seconds between retries
    ]

    if (options.output) {
      curlOptions.push('-o', options.output)
    }

    // Build command with proper escaping
    const command = `curl ${curlOptions.join(' ')} "${url}"`
    const result = execSync(command, { encoding: 'utf8', shell: true })

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      command: `curl ${options.output ? '-o ' + options.output : ''} "${url}"`,
    }
  }
}

/**
 * Extract filename from URL
 */
function extractFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    return path.basename(pathname)
  } catch (error) {
    console.error(chalk.red(`Failed to parse URL: ${url}`))
    return null
  }
}

/**
 * Validate Ethereum address format
 */
function isValidEthereumAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Log message with timestamp
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString()
  const logMessage = `[${timestamp}] ${message}`

  switch (type) {
    case 'error':
      console.error(chalk.red(logMessage))
      stats.errors.push(logMessage)
      break
    case 'success':
      console.log(chalk.green(logMessage))
      break
    case 'warning':
      console.log(chalk.yellow(logMessage))
      break
    default:
      console.log(chalk.blue(logMessage))
  }

  // Append to log file
  fs.appendFileSync(CONFIG.LOG_FILE, logMessage + '\n')
}

/**
 * Download and parse the source token list using curl
 */
async function fetchTokenList() {
  log('Fetching token list from source using curl...')

  try {
    const result = curlGet(CONFIG.SOURCE_URL)

    if (!result.success) {
      throw new Error(`Failed to fetch token list: ${result.error}`)
    }

    const tokenList = JSON.parse(result.data)

    if (!tokenList.tokens || !Array.isArray(tokenList.tokens)) {
      throw new Error(
        'Invalid token list format: missing or invalid tokens array'
      )
    }

    stats.totalTokens = tokenList.tokens.length
    log(`Successfully fetched ${stats.totalTokens} tokens using curl`)

    return tokenList.tokens
  } catch (error) {
    log(`Failed to fetch token list: ${error.message}`, 'error')
    throw error
  }
}

/**
 * Process tokens and extract addresses
 */
function processTokens(tokens) {
  log('Processing tokens...')

  const tokenAddresses = []
  const validTokens = []

  for (const token of tokens) {
    if (!token.address) {
      log(`Token missing address: ${token.symbol || 'unknown'}`, 'warning')
      continue
    }

    if (!isValidEthereumAddress(token.address)) {
      log(`Invalid address format: ${token.address}`, 'warning')
      continue
    }

    tokenAddresses.push(token.address)
    validTokens.push(token)
  }

  // Remove duplicates
  const uniqueAddresses = [...new Set(tokenAddresses)]
  log(`Found ${uniqueAddresses.length} unique valid addresses`)

  return { tokenAddresses: uniqueAddresses, validTokens }
}

/**
 * Update the berachain token list file
 */
async function updateTokenList(tokenAddresses) {
  log('Updating berachain token list...')

  try {
    const targetFile = path.resolve(CONFIG.TARGET_TOKEN_FILE)

    // Read existing content
    let existingContent = ''
    let existingAddresses = []

    if (fs.existsSync(targetFile)) {
      existingContent = fs.readFileSync(targetFile, 'utf8')

      // Extract existing addresses from array format
      const existingMatch = existingContent.match(/export default \[(.*)\]/s)

      if (existingMatch) {
        existingAddresses = existingMatch[1]
          .split(',')
          .map((addr) => addr.trim().replace(/['"]/g, ''))
          .filter((addr) => addr && addr.length > 0)
      }
    }

    // Merge addresses using Set to ensure uniqueness
    const allAddresses = [...new Set([...existingAddresses, ...tokenAddresses])]

    // Create new content
    const newContent = `export default [\n${allAddresses
      .map((addr) => `  '${addr}'`)
      .join(',\n')}\n]`

    // Backup original file BEFORE any changes
    if (fs.existsSync(targetFile)) {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      const backupFile = `${targetFile}.backup-${timestamp}`
      fs.copyFileSync(targetFile, backupFile)
      log(`Backup created: ${path.basename(backupFile)}`)
    }

    // Write new content
    fs.writeFileSync(targetFile, newContent)

    log(
      `Successfully updated token list with ${allAddresses.length} addresses (${existingAddresses.length} existing + ${tokenAddresses.length} new)`
    )
  } catch (error) {
    log(`Failed to update token list: ${error.message}`, 'error')
    throw error
  }
}

/**
 * Download logo assets using curl with better path handling
 */
async function downloadAssets(tokens) {
  log('Starting asset downloads using curl...')

  // Ensure assets directory exists
  fs.ensureDirSync(path.resolve(CONFIG.ASSETS_DIR))

  for (const token of tokens) {
    if (!token.logoURI) {
      log(`Token ${token.symbol || token.address} missing logoURI`, 'warning')
      continue
    }

    // Extract file extension from original URL
    const originalFilename = extractFilenameFromUrl(token.logoURI)
    if (!originalFilename) {
      log(`Could not extract filename from URL: ${token.logoURI}`, 'warning')
      continue
    }

    // Get file extension from original filename
    const fileExtension = path.extname(originalFilename)

    // Use token address as filename with original extension
    const filename = `${token.address}${fileExtension}`
    const targetPath = path.resolve(CONFIG.ASSETS_DIR, filename)

    // Skip if file already exists
    if (fs.existsSync(targetPath)) {
      log(`Skipping existing file: ${filename}`)
      stats.skippedDownloads++
      continue
    }

    try {
      // Use curl with proper path escaping
      const curlCommand = `curl -s -L --max-time 30 --retry 3 --retry-delay 2 -o "${targetPath}" "${token.logoURI}"`
      execSync(curlCommand, { shell: true })

      log(`Downloaded: ${originalFilename} -> ${filename}`)
      stats.successfulDownloads++
    } catch (error) {
      log(`Failed to download ${filename}: ${error.message}`, 'error')
      stats.failedDownloads++
    }
  }
}

/**
 * Print summary report
 */
function printSummary() {
  console.log('\n' + '='.repeat(50))
  console.log(chalk.cyan('FETCH TOKENLIST SUMMARY'))
  console.log('='.repeat(50))
  console.log(`Total tokens processed: ${stats.totalTokens}`)
  console.log(`Successful downloads: ${chalk.green(stats.successfulDownloads)}`)
  console.log(`Failed downloads: ${chalk.red(stats.failedDownloads)}`)
  console.log(`Skipped downloads: ${chalk.yellow(stats.skippedDownloads)}`)
  console.log(`Token list updated successfully!`)

  if (stats.errors.length > 0) {
    console.log(`\n${chalk.red('Errors:')}`)
    stats.errors.forEach((error) => console.log(`  ${error}`))
  }

  console.log(`\nLog file: ${CONFIG.LOG_FILE}`)
  console.log('='.repeat(50))
}

/**
 * Main workflow function
 */
async function integrateTokenList() {
  log('Starting token list integration workflow...')

  try {
    // Clear log file
    fs.writeFileSync(CONFIG.LOG_FILE, '')

    // Step 1: Fetch token list using curl
    const tokens = await fetchTokenList()

    // Step 2: Process tokens
    const { tokenAddresses, validTokens } = processTokens(tokens)

    // Step 3: Update token list file
    await updateTokenList(tokenAddresses)

    // Step 4: Download logo assets
    await downloadAssets(validTokens)

    // Step 5: Print summary
    printSummary()

    log('Token list integration completed successfully!', 'success')
  } catch (error) {
    log(`Workflow failed: ${error.message}`, 'error')
    process.exit(1)
  }
}

/**
 * CLI setup
 */
async function init() {
  const program = new commander.Command()
    .version('1.0.0')
    .name('npm run tokenlist:fetch')
    .description(
      'Fetch and integrate tokens from default-lists repository using curl'
    )
    .option('-f, --force', 'Force download even if files exist')
    .option('-v, --verbose', 'Enable verbose logging')
    .parse(process.argv)

  const options = program.opts()

  if (options.force) {
    log('Force mode enabled - will overwrite existing files')
  }

  if (options.verbose) {
    log('Verbose mode enabled')
  }

  await integrateTokenList()
}

// Run the script
;(async () => {
  await init()
})()
