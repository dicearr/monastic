import jsc from 'jsverify';
import test from 'oletus';

import {
  property as _prop,
  truthy,
} from './utils.js';

const property = _prop (test);

import {compose, constant} from '../index.js';

property (
  'compose (f) (g) (x) === f (g (x))',
  jsc.constant (Math.sqrt), jsc.fun (jsc.nat), jsc.nat,
  (f, g, x) => compose (f) (g) (x) === f (g (x))
);

property (
  'constant (x) () === x',
  truthy,
  x => constant (x) () === x
);
