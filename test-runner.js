const fs = require('fs');
const cp = require('child_process');
cp.exec("npx -y tsx /test-video3.ts", (err, stdout, stderr) => {
  fs.writeFileSync("/test-video3.out", stdout + stderr);
});
