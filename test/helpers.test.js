import {
  fun,
  constant as _k,
  nat
} from 'jsverify';

import {
  property as _prop,
  truthy
} from './utils';

var property = _prop (test);

import {compose, constant} from '..';

suite ('Helpers', function() {
  property (
    'compose (f) (g) (x) === f (g (x))',
    _k (Math.sqrt), fun (nat), nat,
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
});
