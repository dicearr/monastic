import pkg from './package.json';

export default {
  input: 'index.js',
  external: Object.keys (pkg.dependencies),
  output: {
    format: 'umd',
    name: 'Monastic',
    file: 'index.cjs',
    interop: false,
    globals: {
      'sanctuary-type-classes': 'sanctuaryTypeClasses'
    }
  }
};
