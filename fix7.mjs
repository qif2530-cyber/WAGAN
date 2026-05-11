import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

// Use powerful regex to just erase those inner mode lines
content = content.replace(/\\n\\s*if \\(req\\.body\\.videoResolution === '1080p'\\) submitBody\\.mode = 'pro';/g, "");
content = content.replace(/\\n\\s*if \\(req\\.body\\.videoResolution === '720p'\\) submitBody\\.mode = 'std';/g, "");

// Use replace to append it after aspect ratio
content = content.replace(
  /if \\(req\\.body\\.aspectRatio\\) \\{(\\r?\\n\\s*)submitBody\\.aspect_ratio = req\\.body\\.aspectRatio;(\\r?\\n\\s*)\\}/,
  "if (req.body.aspectRatio) {$1submitBody.aspect_ratio = req.body.aspectRatio;$2}$2if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';$2if (req.body.videoResolution === '720p') submitBody.mode = 'std';"
);
fs.writeFileSync('server.ts', content);
