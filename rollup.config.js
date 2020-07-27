import pkg from './package.json';

export default {
  input: 'index.js',
  external: Object.keys (pkg.dependencies),
  output: {
    format: 'umd',
    file: 'index.cjs',
    name: 'monastic',
    interop: false,
    globals: {
      'sanctuary-type-classes': 'sanctuaryTypeClasses',
    },
  },
};
