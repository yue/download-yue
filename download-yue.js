#!/usr/bin/env node

// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the license that can be found in the
// LICENSE file.

const fs = require('fs')
const https = require('https')

const extract = require('./extract-zip')

function downloadLink(link, callback) {
  https.get(link, (res) => {
    if (res.statusCode == 302)
      return downloadLink(res.headers.location, callback)
    if (res.statusCode != 200)
      return callback(new Error(`There is no build for your Node.js version (error ${res.statusCode}).`))
    callback(null, res)
  }).on('error', (error) => {
    callback(error)
  })
}

function downloadYue(project, version, filename, target, token) {
  return new Promise((resolve, reject) => {
    let link
    if (filename == 'Source code (zip)')
      link = `https://github.com/yue/${project}/archive/refs/tags/${version}.zip`
    else
      link = `https://github.com/yue/${project}/releases/download/${version}/${filename}`
    downloadLink(link, (error, stream) => {
      if (error)
        return reject(error)
      // Unzip it.
      stream.pipe(fs.createWriteStream(filename)).on('finish', () => {
        extract(filename, {dir: target}, (error) => {
          fs.unlinkSync(filename)
          if (error)
            reject(error)
          else
            resolve()
        })
      }).on('error', (error) => {
        reject(error)
      })
    })
  })
}

if (module === require.main) {
  if (process.argv.length != 6) {
    console.error('Usage: download-yue project tag filename target')
    process.exit(1)
  }
  const token = process.env.GITHUB_TOKEN
  downloadYue(process.argv[2], process.argv[3], process.argv[4], process.argv[5], token)
  .catch((error) => {
    console.error('Downloading failed:', error.message)
    process.exit(2)
  })
}

module.exports = downloadYue
