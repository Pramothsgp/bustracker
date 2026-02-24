/**
 * Fix for Bun monorepo + Metro/Babel compatibility.
 *
 * Bun stores packages in node_modules/.bun/ with isolated node_modules per entry.
 * Metro's transform workers run under Node.js, whose require() can't resolve
 * transitive dependencies across these isolated stores. This patch adds a fallback
 * that searches the .bun store when standard resolution fails.
 */
const Module = require('module');
const path = require('path');
const fs = require('fs');

const monorepoRoot = path.resolve(__dirname, '..', '..');
const bunStore = path.join(monorepoRoot, 'node_modules', '.bun');
const bunStoreExists = fs.existsSync(bunStore);

// Parse bun store entry directory name into a package name
// e.g. "@babel+preset-react@7.28.5+hash" -> "@babel/preset-react"
// e.g. "babel-preset-expo@13.0.0+hash" -> "babel-preset-expo"
function parseBunEntryName(entry) {
  if (entry.startsWith('@')) {
    const secondAt = entry.indexOf('@', 1);
    if (secondAt === -1) return null;
    const scopeAndName = entry.substring(0, secondAt);
    const firstPlus = scopeAndName.indexOf('+');
    if (firstPlus === -1) return null;
    return scopeAndName.substring(0, firstPlus) + '/' + scopeAndName.substring(firstPlus + 1);
  } else {
    const atIdx = entry.indexOf('@');
    return atIdx > 0 ? entry.substring(0, atIdx) : null;
  }
}

// Lazy lookup: package name -> array of store node_modules paths containing it
let _lookup = null;
function getLookup() {
  if (_lookup) return _lookup;
  _lookup = new Map();
  if (!bunStoreExists) return _lookup;
  try {
    for (const entry of fs.readdirSync(bunStore)) {
      const name = parseBunEntryName(entry);
      if (!name) continue;
      const nodeModulesDir = path.join(bunStore, entry, 'node_modules');
      if (!_lookup.has(name)) _lookup.set(name, []);
      _lookup.get(name).push(nodeModulesDir);
    }
  } catch {}
  return _lookup;
}

/**
 * Resolve a bare module specifier to a path in the .bun store.
 * Used by both the Node.js require() patch and Metro's resolveRequest.
 * Returns the resolved filesystem path, or null if not found.
 */
function resolveFromBunStore(request) {
  if (
    !bunStoreExists ||
    request.startsWith('.') ||
    request.startsWith('/') ||
    request.startsWith('node:')
  ) {
    return null;
  }

  let pkgName, subpath;
  if (request.startsWith('@')) {
    const parts = request.split('/');
    if (parts.length < 2) return null;
    pkgName = parts[0] + '/' + parts[1];
    subpath = parts.length > 2 ? parts.slice(2).join('/') : '';
  } else {
    const parts = request.split('/');
    pkgName = parts[0];
    subpath = parts.length > 1 ? parts.slice(1).join('/') : '';
  }

  const lookup = getLookup();

  // Check the package's own store entry first
  const ownPaths = lookup.get(pkgName);
  if (ownPaths) {
    for (const dir of ownPaths) {
      const candidate = subpath
        ? path.join(dir, ...pkgName.split('/'), subpath)
        : path.join(dir, ...pkgName.split('/'));
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  // Fallback: search all store entries
  for (const [, paths] of lookup) {
    for (const dir of paths) {
      const candidate = subpath
        ? path.join(dir, ...pkgName.split('/'), subpath)
        : path.join(dir, ...pkgName.split('/'));
      if (fs.existsSync(candidate)) return candidate;
    }
  }

  return null;
}

const original = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return original.call(this, request, parent, isMain, options);
  } catch (err) {
    // Only intercept bare module specifiers
    if (
      request.startsWith('.') ||
      request.startsWith('/') ||
      request.startsWith('node:')
    ) {
      throw err;
    }

    // Parse package name and optional subpath
    let pkgName, subpath;
    if (request.startsWith('@')) {
      const parts = request.split('/');
      if (parts.length < 2) throw err;
      pkgName = parts[0] + '/' + parts[1];
      subpath = parts.length > 2 ? parts.slice(2).join('/') : '';
    } else {
      const parts = request.split('/');
      pkgName = parts[0];
      subpath = parts.length > 1 ? parts.slice(1).join('/') : '';
    }

    const lookup = getLookup();

    // First: check the package's own store entry (most common case)
    const ownPaths = lookup.get(pkgName);
    if (ownPaths) {
      for (const dir of ownPaths) {
        const candidate = subpath
          ? path.join(dir, ...pkgName.split('/'), subpath)
          : path.join(dir, ...pkgName.split('/'));
        try {
          return original.call(this, candidate, parent, isMain, options);
        } catch {}
      }
    }

    // Fallback: search ALL store entries (for packages nested as deps of other packages)
    for (const [, paths] of lookup) {
      for (const dir of paths) {
        const candidate = subpath
          ? path.join(dir, ...pkgName.split('/'), subpath)
          : path.join(dir, ...pkgName.split('/'));
        try {
          return original.call(this, candidate, parent, isMain, options);
        } catch {}
      }
    }

    throw err;
  }
};

module.exports = { resolveFromBunStore, getLookup, bunStore, bunStoreExists };
