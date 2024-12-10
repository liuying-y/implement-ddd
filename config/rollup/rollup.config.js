import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import json from 'rollup-plugin-json';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import postcssImport from 'postcss-import';
import simplevars from 'postcss-simple-vars';
import nested from 'postcss-nested';
import cssnext from 'postcss-cssnext';
import cssnano from 'cssnano';
import dts from 'rollup-plugin-dts';
// import { startCase } from 'lodash'

// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const { pwd, mainPath, bundleName, outputPath, pkg } = require('../utils/packageInfo');

function configure(pkg, env, target) {
  const isProd = env === 'production';
  const isUmd = target === 'umd';
  const isModule = target === 'module';
  const isCommonJs = target === 'cjs';
  const isType = target === 'type';
  const input = mainPath;
  const deps = []
    .concat(pkg.dependencies ? Object.keys(pkg.dependencies) : [])
    .concat(pkg.peerDependencies ? Object.keys(pkg.peerDependencies) : []);

  // Stop Rollup from warning about circular dependencies.
  const onwarn = warning => {
    if (warning.code !== 'CIRCULAR_DEPENDENCY') {
      console.warn(`(!) ${warning.message}`); // eslint-disable-line no-console
    }
  };

  const plugins = [
    // Allow Rollup to resolve modules from `node_modules`, since it only
    // resolves local modules by default.
    resolve({
      browser: true,
    }),

    typescript({
      abortOnError: false,
      tsconfig: `${pwd}/tsconfig.json`,
      // COMPAT: Without this flag sometimes the declarations are not updated.
      // clean: isProd ? true : false,
      clean: true,
    }),

    // Allow Rollup to resolve CommonJS modules, since it only resolves ES2015
    // modules by default.
    commonjs({
      include: pkg.files,
      // HACK: Sometimes the CommonJS plugin can't identify named exports, so
      // we have to manually specify named exports here for them to work.
      // https://github.com/rollup/rollup-plugin-commonjs#custom-named-exports
      namedExports: {
        'react/jsx-runtime': ['jsx', 'jsxs', 'Fragment'],
        'react/jsx-dev-runtime': ['jsxDEV', 'Fragment'],
        'react-dom': ['findDOMNode', 'createPortal'],
        'react-dom/server': ['renderToStaticMarkup'],
      },
    }),

    // less
    postcss({
      extract: false,
      minimize: true,
      inject: true,
      // process: processLess,
      autoModules: true,
      extensions: ['.less'],
      options: {
        lessOptions: {
          javascriptEnabled: true,
        },
      },
      plugins: [
        postcssImport(),
        simplevars(),
        nested(),
        cssnext({ warnForDuplicates: false, }),
        cssnano(),
      ],
    }),

    // Convert JSON imports to ES6 modules.
    json(),

    // Replace `process.env.NODE_ENV` with its value, which enables some modules
    // like React and Slate to use their production variant.
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),

    // Register Node.js builtins for browserify compatibility.
    builtins(),

    // Use Babel to transpile the result, limiting it to the source code.
    babel({
      runtimeHelpers: true,
      include: pkg.files.map((s) => `${pwd}/${s}`),
      extensions: ['.js', '.ts', '.tsx'],
      presets: [
        '@babel/preset-typescript',
        [
          '@babel/preset-env',
          isUmd
            ? { modules: false }
            : {
              exclude: [
                '@babel/plugin-transform-regenerator',
                '@babel/transform-async-to-generator',
              ],
              modules: false,
              targets: {
                esmodules: isModule,
              },
            },
        ],
        '@babel/preset-react',
      ],
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          isUmd
            ? {}
            : {
              regenerator: false,
              useESModules: isModule,
            },
        ],
        '@babel/plugin-proposal-class-properties',
      ],
    }),

    // Register Node.js globals for browserify compatibility.
    globals(),

    // Only minify the output in production, since it is very slow. And only
    // for UMD builds, since modules will be bundled by the consumer.
    isUmd && isProd && terser(),
  ].filter(Boolean);

  if (isType) {
    return {
      input,
      plugins: [dts.dts()],
      output: {
        format: 'esm',
        dir: `${outputPath}/types/`,
      },
    };
  }

  if (isUmd) {
    return {
      plugins,
      input,
      onwarn,
      output: {
        format: 'umd',
        file: `${outputPath}/umd/${isProd ? `index.min.js` : `index.js`}`,
        // file: `${outputPath}/umd/${isProd ? `${bundleName}.min.js` : `${bundleName}.js`}`,
        exports: 'named',
        name: bundleName,
        globals: bundleName,
      },
      external: Object.keys(pkg.umdGlobals || {}),
    };
  }

  if (isCommonJs) {
    return {
      plugins,
      input,
      onwarn,
      output: [
        {
          dir: `${outputPath}/cjs`,
          // file: `${outputPath}/cjs/${pkg.cjs}`,
          format: 'cjs',
          exports: 'named',
          sourcemap: true,
        },
      ],
      // We need to explicitly state which modules are external, meaning that
      // they are present at runtime. In the case of non-UMD configs, this means
      // all non-Slate packages.
      external: id => {
        return !!deps.find(dep => dep === id || id.startsWith(`${dep}/`));
      },
    };
  }

  if (isModule) {
    return {
      plugins,
      input,
      onwarn,
      output: [
        {
          dir: `${outputPath}/module`,
          // file: `${outputPath}/module/${pkg.module}`,
          format: 'es',
          sourcemap: true,
        },
      ],
      // We need to explicitly state which modules are external, meaning that
      // they are present at runtime. In the case of non-UMD configs, this means
      // all non-Slate packages.
      external: id => {
        return !!deps.find(dep => dep === id || id.startsWith(`${dep}/`));
      },
    };
  }
}

/**
 * Return a Rollup configuration for a `pkg`.
 */

function factory(pkg, options = {}) {
  // const isProd = process.env.NODE_ENV === 'production'
  return [
    configure(pkg, 'development', 'cjs', options),
    // configure(pkg, 'production', 'cjs', options),
    configure(pkg, 'production', 'module', options), // 无less
    // configure(pkg, 'development', 'umd', options), // 依赖报错
    // configure(pkg, 'production', 'umd', options),
    configure(pkg, 'development', 'type', options),
  ].filter(Boolean);
}

/**
 * Config.
 */

export default [
  ...factory(pkg),
];