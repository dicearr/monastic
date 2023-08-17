import {readFileSync} from 'fs';

const pkg = JSON.parse (readFileSync ('./package.json'));

export default {
  input: 'index.js',
  external: Object.keys (pkg.dependencies),
  output: {
    format: 'umd',
    file: 'index.cjs',
    name: 'monastic',
    interop: 'esModule',
    globals: {
      'sanctuary-type-classes': 'sanctuaryTypeClasses',
    },
  },
};
