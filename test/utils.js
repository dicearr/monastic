import Z from 'sanctuary-type-classes';
import {deepStrictEqual} from 'assert';
import jsc from 'jsverify';

import {run} from '../index.js';

function eq(expected) {
  return function(actual) {
    return deepStrictEqual (actual, expected);
  };
}

export function stateEquals(arb) {
  return function(actual, expected) {
    var initialState = arb.generator (100);
    return Z.equals (
      run (initialState) (actual),
      run (initialState) (expected)
    );
  };
}

export function assertEquals(expected, actual) {
  return eq (true) (Z.equals (expected, actual));
}

export function property(t) {
  return function(property) {
    var args = Array.prototype.slice.call (arguments, 1);
    return t (property, function() {
      jsc.assert (jsc.forall.apply (this, args));
    });
  };
}

export function identity(x) { return x; }

export var truthy = jsc.oneof (jsc.number, jsc.string, jsc.bool);
export var primitive = jsc.oneof (truthy, jsc.falsy);
