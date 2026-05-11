import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf8');

const s1 = "submitBody.image = req.body.referenceImage;\\n               if (req.body.referenceImageTail) submitBody.image_tail = req.body.referenceImageTail;\\n               if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n               if (req.body.videoResolution === '720p') submitBody.mode = 'std';";
if (content.indexOf(s1) !== -1) {
    console.log("Matched s1!");
    content = content.replace(s1, "submitBody.image = req.body.referenceImage;\\n               if (req.body.referenceImageTail) submitBody.image_tail = req.body.referenceImageTail;");
} else {
    console.log("s1 not matched.");
}

const s2 = "if (req.body.aspectRatio) {\\n               submitBody.aspect_ratio = req.body.aspectRatio;\\n           }";
if (content.indexOf(s2) !== -1) {
    console.log("Matched s2!");
    content = content.replace(s2, "if (req.body.aspectRatio) {\\n               submitBody.aspect_ratio = req.body.aspectRatio;\\n           }\\n           if (req.body.videoResolution === '1080p') submitBody.mode = 'pro';\\n           if (req.body.videoResolution === '720p') submitBody.mode = 'std';");
} else {
    console.log("s2 not matched.");
}

fs.writeFileSync('server.ts', content);
