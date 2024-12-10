const fs = require('fs');
const path = require('path');
const { pick } = require('lodash');

const { pwd, mainPath, bundleName, outputPath, pkg } = require('../utils/packageInfo');

if (fs.existsSync(path.resolve(pwd, 'locale'))) {
  fs.cpSync(path.resolve(pwd, 'locale'), path.resolve(outputPath, 'locale'), { recursive: true });
}


