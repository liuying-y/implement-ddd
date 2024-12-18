const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const jsonBeautify = require('js-beautify');

const package = require('../package.json');
const workspaces = package.workspaces;
const base_path = path.resolve(__dirname, '../');

console.log('Allowed Workspaces: ', workspaces);
const argvs = process.argv.splice(2);
const scope = argvs[1] || 'packages';
console.log('args', argvs);

if (argvs.length === 0) {
  throw 'Did not input workspace name. See README.md.';
}

const fullname = argvs[0];
const path_seg = fullname.split('/')
let fullpath = scope + '/';

const [p, n] = path_seg;
if (!n) {
  fullpath = fullpath + p;
} else {
  // 如果包名为 xx1/xxx2 , 取 xxx2 作为路径
  fullpath = fullpath + n;
}

console.log('Package position: ', fullpath);

// Create Package
const cmd = `lerna create ${fullname} ${scope} --yes`;
child_process.execSync(cmd);

// 更多操作
const pkgData = require(path.resolve(base_path, fullpath, 'package.json'));
{
  // Default Scripts
  const scripts = require(path.resolve(base_path, '.template/scripts.json'));
  pkgData.scripts = Object.assign(pkgData.scripts, scripts);

  // Update description
  pkgData.description = '';

  pkgData.private = false;

  // clear default file
  if (pkgData.main) {
    const entry = 'lib/index.ts';
    child_process.execSync(`rm -f ${path.resolve(base_path, fullpath, pkgData.main)}`);
    child_process.execSync(`echo "export const d = 1;\n">${path.resolve(base_path, fullpath, entry)}`);
    pkgData.main = entry;

    child_process.execSync(`mv ${path.resolve(base_path, fullpath, `__tests__/${n}.test.js`)} ${path.resolve(base_path, fullpath, '__tests__/index.test.js')}`);
  }

  // 添加一些打包相关的信息
  // pkgData.cjs = 'cjs/index.js';
  // pkgData.cjsDir = 'cjs';
  // pkgData.module = 'module/index.js';
  // pkgData.moduleDir = 'module';
  // pkgData.umd = 'umd';
  // pkgData.umdDir = 'umd';
  // pkgData.types = 'types/index.d.ts';
  // pkgData.typesDir = 'types';

  // 清理 version
  pkgData.version = '0.0.0';
}
fs.writeFileSync(path.resolve(base_path, fullpath, 'package.json'), jsonBeautify(JSON.stringify(pkgData), { indent_size: 2 }));

/// tsconfig
child_process.execSync(`cp .template/tsconfig.json ${fullpath}/`);
child_process.execSync(`cp .template/.eslintrc.json ${fullpath}/`);
child_process.execSync(`cp .template/declare.d.ts ${fullpath}/`);
