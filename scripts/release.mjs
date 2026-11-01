#!/usr/bin/env node
// Releases the two libraries at one version: `npm run release -- 0.2.0`. Sets the version of
// every published workspace and the exact version the other workspaces depend on them at, in
// their package.json files and the lockfile, then commits and tags v<version>. Pushing the tag
// with `git push --follow-tags` runs .github/workflows/publish.yml, which publishes to npm.
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

function fail(message) {
  console.error(message)
  process.exit(1)
}

const version = process.argv[2]
// x.y.z, or a prerelease such as 0.2.0-beta.1, which the workflow publishes under `next`.
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  fail('Usage: npm run release -- <version>, such as 0.2.0 or 0.2.0-beta.1')
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
if (git('status', '--porcelain')) {
  fail('Commit or stash your changes first: the release commit holds only the new versions.')
}
if (git('tag', '--list', `v${version}`)) fail(`The tag v${version} already exists.`)

const workspaces = readdirSync('packages', { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const dir = `packages/${entry.name}`
    const path = `${dir}/package.json`
    return { dir, path, pkg: JSON.parse(readFileSync(path, 'utf8')) }
  })
// The published workspaces share the version; the private documentation site keeps its own.
const libraries = workspaces.filter(({ pkg }) => !pkg.private)
for (const { pkg } of libraries) {
  if (pkg.version === version) fail(`${pkg.name} is already at ${version}.`)
}

// A workspace's entry in the lockfile repeats its version and dependencies, so both change.
// Editing them in place, rather than with `npm install`, leaves the rest of the lockfile as is.
const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
const missing = workspaces.find(({ dir }) => !lock.packages[dir])
if (missing) fail(`package-lock.json has no entry for ${missing.dir}: run npm install first.`)

const names = libraries.map(({ pkg }) => pkg.name)
for (const { dir, path, pkg } of workspaces) {
  for (const target of [pkg, lock.packages[dir]]) {
    if (!pkg.private) target.version = version
    for (const deps of [target.dependencies, target.devDependencies, target.peerDependencies]) {
      for (const name of names) if (deps?.[name]) deps[name] = version
    }
  }
  writeFileSync(path, `${JSON.stringify(pkg, null, 2)}\n`)
}
writeFileSync('package-lock.json', `${JSON.stringify(lock, null, 2)}\n`)

git('add', 'package-lock.json', ...workspaces.map(({ path }) => path))
git('commit', '--quiet', '--message', `Release ${version}`)
// Annotated, since `git push --follow-tags` leaves lightweight tags behind.
git('tag', '--annotate', `v${version}`, '--message', `v${version}`)

console.log(`Committed and tagged v${version} on ${git('branch', '--show-current')}.`)
console.log('To publish it, push the commit and the tag: git push --follow-tags')
