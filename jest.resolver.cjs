const path = require('path');
const fs = require('fs');

function resolveViaExports(request) {
  const name = request.startsWith('@')
    ? request.split('/').slice(0, 2).join('/')
    : request.split('/')[0];

  const pkgFile = path.join(
    process.cwd(),
    'node_modules',
    name,
    'package.json',
  );
  if (!fs.existsSync(pkgFile)) return null;

  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  if (!pkg.exports) return null;

  const subpath = request === name ? '.' : '.' + request.slice(name.length);
  const entry = pkg.exports[subpath];
  if (!entry) return null;

  const target =
    typeof entry === 'string'
      ? entry
      : entry.require || entry.default || entry.import;

  return target ? path.join(process.cwd(), 'node_modules', name, target) : null;
}

module.exports = (request, options) => {
  // Skip relative/absolute paths
  if (request.startsWith('.') || request.startsWith('/')) {
    return options.defaultResolver(request, options);
  }

  // Try default resolver first
  try {
    return options.defaultResolver(request, options);
  } catch (e) {
    // Default failed — try resolving via exports map
    const resolved = resolveViaExports(request);
    if (resolved) return resolved;
    throw e;
  }
};
