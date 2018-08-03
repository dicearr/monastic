import pkg from './package.json';

export default {
  input: 'index.mjs',
  external: Object.keys (pkg.dependencies),
  output: {
    format: 'umd',
    name: 'warpState',
    file: 'index.js',
    interop: false,
    globals: {
      'sanctuary-type-classes': 'sanctuaryTypeClasses'
    }
  }
};
