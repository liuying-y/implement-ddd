const path = require('path');

const pwd = process.env.PWD;
const pkg = require(path.resolve(pwd, 'package.json'));

module.exports = {
  // 包路径
  pwd: process.env.PWD,
  // 入口文件
  mainPath: path.resolve(pwd, pkg.main),
  // 包名
  bundleName: `dyy_${pkg.name.split('/').pop().split('-').pop()}`,
  // 输出
  outputPath: path.resolve(pwd, 'dist'),
  // 包
  pkg,
};