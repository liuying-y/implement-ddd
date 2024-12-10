const fs = require('fs');
const path = require('path');
const { pick } = require('lodash');

const { pwd, mainPath, bundleName, outputPath, pkg } = require('../utils/packageInfo');
const globalPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../lerna.json'), { encoding: 'utf-8' }));

// console.log(globalPkg)

const newPkgInfo = pick(
  pkg,
  [
    'name',
    'description',
    'author',
    'license',
    'keywords',
    'repository',
    'bugs',
    'homepage',
    'dependencies',
    'peerDependencies',
  ],
);


newPkgInfo.version = globalPkg.version;
// cjs
newPkgInfo.cjs = 'cjs/index.js';
// main
newPkgInfo.main = 'cjs/index.js';
// module
newPkgInfo.module = 'module/index.js';
// types
newPkgInfo.types = 'types/index.d.ts';
// umd
newPkgInfo.umd = `umd/index.js`;
// newPkgInfo.umd = `umd/${bundleName}.js`;
// umd-min
newPkgInfo.umdMin = `umd/index.min.js`;
// newPkgInfo.umdMin = `umd/${bundleName}.min.js`;

fs.writeFileSync(path.resolve(outputPath, 'package.json'), JSON.stringify(newPkgInfo));
