const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
let target;

if (args[0] === "--target") {
  target = args[1];
}

if (!fs.existsSync("build")) {
  fs.mkdirSync("build");
}

const isPreRelease = args.includes("--pre-release");

let command = isPreRelease
? "npx vsce package --out ./build patch --pre-release --no-dependencies" // --yarn"
: "npx vsce package --out ./build patch --no-dependencies"; // --yarn";

if (target) command += ` --target ${target}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${stderr}`);
    throw error;
  }
  console.log(stdout);

  const vsixFileMatch = stdout.match(/Packaged:\s+(.*\.vsix)/);
  if (!vsixFileMatch || !vsixFileMatch[1]) {
    console.error("Could not determine VSIX file name from vsce output");
    return;
  }
  const vsixFile = vsixFileMatch[1];
  const vsixPath = path.resolve(vsixFile);

  console.log(`VSIX package created: ${vsixPath}`);
});
