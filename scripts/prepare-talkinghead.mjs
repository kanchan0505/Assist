import { readFileSync, writeFileSync, cpSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "node_modules/@met4citizen/talkinghead/modules");
const targetDir = join(root, "public/talkinghead/modules");
const workletTarget = join(root, "public/talkinghead/playback-worklet.js");

const THREE =
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js/+esm";
const ADDONS = "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm";

const IMPORT_REPLACEMENTS = [
  ["import * as THREE from 'three';", `import * as THREE from '${THREE}';`],
  [
    "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
    `import { OrbitControls } from '${ADDONS}/controls/OrbitControls.js/+esm';`,
  ],
  [
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
    `import { GLTFLoader } from '${ADDONS}/loaders/GLTFLoader.js/+esm';`,
  ],
  [
    "import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';",
    `import { DRACOLoader } from '${ADDONS}/loaders/DRACOLoader.js/+esm';`,
  ],
  [
    "import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';",
    `import { FBXLoader } from '${ADDONS}/loaders/FBXLoader.js/+esm';`,
  ],
  [
    "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
    `import { RoomEnvironment } from '${ADDONS}/environments/RoomEnvironment.js/+esm';`,
  ],
  [
    "import Stats from 'three/addons/libs/stats.module.js';",
    `import Stats from '${ADDONS}/libs/stats.module.js/+esm';`,
  ],
];

function patchThreeImports(filePath) {
  let content = readFileSync(filePath, "utf8");
  for (const [from, to] of IMPORT_REPLACEMENTS) {
    content = content.replaceAll(from, to);
  }
  writeFileSync(filePath, content);
}

mkdirSync(join(root, "public/talkinghead"), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
cpSync(join(sourceDir, "playback-worklet.js"), workletTarget);

patchThreeImports(join(targetDir, "talkinghead.mjs"));
patchThreeImports(join(targetDir, "dynamicbones.mjs"));

console.log("TalkingHead public assets prepared with CDN Three.js imports.");
