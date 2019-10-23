import jsc from 'jsverify';
import test from 'oletus';

import {
  property as _prop,
  truthy
} from './utils.js';

var property = _prop (test);

import {compose, constant} from '../index.js';

property (
  'compose (f) (g) (x) === f (g (x))',
  jsc.constant (Math.sqrt), jsc.fun (jsc.nat), jsc.nat,
  function(f, g, x) {
    return compose (f) (g) (x) === f (g (x));
  }
);

property (
  'constant (x) () === x',
  truthy,
  function(x) {
    return constant (x) () === x;
  }
);
