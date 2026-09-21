const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3333;
const ROOT_DIR = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Excluded directories and files
const IGNORED_EXACT = new Set([
  '.git', '.ds_store', 'node_modules', 'viewer', '.gemini', 'gemini', '.agents', 'agents', 'aagents',
  '00-meta', 'meta', '00_meta', 'scratch', '.scratch',
  'package.json', 'package-lock.json', 'agents.md', 'gemini.md'
]);

function isIgnored(name) {
  const lower = name.toLowerCase();
  if (IGNORED_EXACT.has(lower) || lower.startsWith('.')) return true;
  if (lower === 'readme.md' || lower === 'readme' || lower.startsWith('readme.')) return true;
  return false;
}

function parseFrontmatter(filePath) {
  let fd = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(2048);
    const bytesRead = fs.readSync(fd, buf, 0, 2048, 0);
    fs.closeSync(fd);
    fd = null;

    const content = buf.toString('utf8', 0, bytesRead);
    if (!content.startsWith('---')) return { title: null, tags: [], category: null, sub_category: null, type: null };
    const endIdx = content.indexOf('---', 3);
    if (endIdx === -1) return { title: null, tags: [], category: null, sub_category: null, type: null };
    
    const header = content.substring(3, endIdx);
    const titleMatch = header.match(/title:\s*["']?([^"'\n\r]+)["']?/);
    const categoryMatch = header.match(/category:\s*["']?([^"'\n\r]+)["']?/);
    const subCatMatch = header.match(/sub_category:\s*["']?([^"'\n\r]+)["']?/);
    const typeMatch = header.match(/type:\s*["']?([^"'\n\r]+)["']?/);
    
    const tags = [];
    const tagsSection = header.match(/tags:\s*\n((?:\s*-\s*[^\n\r]+\n?)+)/);
    if (tagsSection && tagsSection[1]) {
      const lines = tagsSection[1].split('\n');
      for (const line of lines) {
        const tagMatch = line.match(/^\s*-\s*["']?([^"'\n\r]+)["']?/);
        if (tagMatch && tagMatch[1]) {
          tags.push(tagMatch[1].trim());
        }
      }
    }

    return {
      title: titleMatch ? titleMatch[1].trim() : null,
      category: categoryMatch ? categoryMatch[1].trim() : null,
      sub_category: subCatMatch ? subCatMatch[1].trim() : null,
      type: typeMatch ? typeMatch[1].trim() : null,
      tags
    };
  } catch (e) {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_) {}
    }
    return { title: null, tags: [], category: null, sub_category: null, type: null };
  }
}

/**
 * Recursively scans directory and builds a clean tree structure
 */
function buildTree(dirPath, relativePath = '') {
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return null;
  }

  // Sort: numbers first, folders first, alphabetical
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const children = [];

  for (const entry of entries) {
    if (isIgnored(entry.name)) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    const relItemPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subTree = buildTree(fullPath, relItemPath);
      if (subTree && subTree.length > 0) {
        children.push({
          type: 'directory',
          name: entry.name,
          path: relItemPath,
          children: subTree
        });
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      let stats;
      try {
        stats = fs.statSync(fullPath);
      } catch (e) {
        stats = { size: 0, mtime: new Date() };
      }

      const meta = ext === '.md' || ext === '.markdown' ? parseFrontmatter(fullPath) : null;

      children.push({
        type: 'file',
        name: entry.name,
        title: meta && meta.title ? meta.title : null,
        category: meta && meta.category ? meta.category : null,
        sub_category: meta && meta.sub_category ? meta.sub_category : null,
        tags: meta && meta.tags ? meta.tags : [],
        docType: meta && meta.type ? meta.type : null,
        extension: ext.replace('.', ''),
        path: relItemPath,
        size: stats.size,
        mtime: stats.mtime
      });
    }
  }

  return children;
}

// In-Memory Tree Cache with 3s TTL (Fast in-memory reads, auto-refreshes on updates)
let cachedTree = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 3000;

function getCachedTree(forceRefresh = false) {
  const now = Date.now();
  if (!cachedTree || forceRefresh || (now - lastCacheTime > CACHE_TTL_MS)) {
    cachedTree = buildTree(ROOT_DIR);
    lastCacheTime = now;
  }
  return cachedTree;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  // CORS headers for local dev convenience
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: Directory Tree
  if (pathname === '/api/tree') {
    try {
      const forceRefresh = urlObj.searchParams.has('refresh');
      const tree = getCachedTree(forceRefresh);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, tree, root: ROOT_DIR }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // API 2: File Content
  if (pathname === '/api/content') {
    const targetRelPath = urlObj.searchParams.get('path');
    if (!targetRelPath) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing path parameter' }));
      return;
    }

    const safePath = path.normalize(path.join(ROOT_DIR, targetRelPath));
    if (!safePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Access denied' }));
      return;
    }

    try {
      if (!fs.existsSync(safePath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found' }));
        return;
      }

      const content = fs.readFileSync(safePath, 'utf8');
      const stats = fs.statSync(safePath);
      const ext = path.extname(safePath).toLowerCase();

      const meta = ext === '.md' || ext === '.markdown' ? parseFrontmatter(safePath) : null;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        path: targetRelPath,
        name: path.basename(safePath),
        extension: ext.replace('.', ''),
        metadata: meta,
        content,
        size: stats.size,
        mtime: stats.mtime
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Static Assets
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback to index.html for SPA routing
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🚀 Knowledge Vault Viewer is running!`);
    console.log(`👉 Open: http://localhost:${port}\n`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${PORT} is in use, attempting port ${Number(PORT) + 1}...`);
    startServer(Number(PORT) + 1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

startServer(PORT);

