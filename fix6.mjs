import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

let newContent = content.replace(
  "submitBody.image = req.body.referenceImage;\\n               if (req.body.referenceImageTail) submitBody.image_tail = req.body.referenceImageTail;\\n               if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n               if (req.body.videoResolution === '720p') submitBody.mode = 'std';",
  "submitBody.image = req.body.referenceImage;\\n               if (req.body.referenceImageTail) submitBody.image_tail = req.body.referenceImageTail;"
);

newContent = newContent.replace(
  "if (req.body.aspectRatio) {\\n               submitBody.aspect_ratio = req.body.aspectRatio;\\n           }",
  "if (req.body.aspectRatio) {\\n               submitBody.aspect_ratio = req.body.aspectRatio;\\n           }\\n           if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n           if (req.body.videoResolution === '720p') submitBody.mode = 'std';"
);
fs.writeFileSync('server.ts', newContent);
