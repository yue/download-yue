#!/usr/bin/env node

// Copyright 2017 Cheng Zhao. All rights reserved.
// Use of this source code is governed by the license that can be found in the
// LICENSE file.

const fs = require('fs')
const GitHub = require('github-releases')
const DecompressZip = require('decompress-zip')

function downloadYue(version, filename, target, token) {
  return new Promise((resolve, reject) => {
    const github = new GitHub({repo: 'yue/yue', token})
    github.getReleases({tag_name: version}, (error, releases) => {
      if (error)
        return reject(error)
      for (const asset of releases[0].assets) {
        if (asset.name != filename)
          continue
        github.downloadAsset(asset, (error, stream) => {
          if (error)
            return reject(error)
          // Unzip it.
          stream.pipe(fs.createWriteStream(filename)).on('finish', () => {
            const unzipper = new DecompressZip(filename)
            unzipper.on('extract', () => {
              fs.unlinkSync(filename)
              updateRepo(`Update docs for ${version}`)
              resolve()
            })
            unzipper.on('error', () => {
              fs.unlinkSync(filename)
              reject('error')
            })
            unzipper.extract({path: target})
          }).on('error', (error) => {
            reject(error)
          })
        })
        return
      }
      return reject(new Error(`${filename} not found in ${version} release`))
    })
  })
}

if (module === require.main) {
  if (process.argv.length != 5) {
    console.error('Usage: download-yue version filename target')
    process.exit(1)
  }
  const token = process.env.GITHUB_TOKEN
  downloadYue(process.argv[2], process.argv[3], process.argv[4], token)
}

module.exports = downloadYue
