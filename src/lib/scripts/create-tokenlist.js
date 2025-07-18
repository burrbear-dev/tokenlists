#! /usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */
const chalk = require('chalk')
const path = require('path')
const fs = require('fs-extra')

let tokenlistName

async function init() {
  // Use environment variable or default to 'balancer'
  if (typeof tokenlistName === 'undefined') {
    tokenlistName = process.env.TOKENLIST_NAME || 'balancer'
  }

  await createTokenlist(tokenlistName)
}

async function createTokenlist(name) {
  const templateDir = path.resolve(__dirname, '../templates/tokenlist')
  const newAppDir = path.resolve('src/tokenlists/', name)
  const tokenlistName = path.basename(newAppDir)

  fs.ensureDirSync(newAppDir)

  console.log(`Creating a new tokenlist in ${chalk.green(newAppDir)}.`)
  console.log()

  try {
    fs.copySync(templateDir, newAppDir)
    console.log(`✅ New tokenlist '${tokenlistName}' created!`)
  } catch (error) {
    console.error('Failed to create new tokenlist', { cause: error })
  }
}

;(async () => {
  await init()
})()
