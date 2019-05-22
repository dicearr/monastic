import Z from 'sanctuary-type-classes';

import {deepStrictEqual} from 'assert';

import {
  assert,
  forall,
  number,
  oneof,
  falsy,
  string,
  bool
} from 'jsverify';

import {run} from '../';

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
      assert (forall.apply (this, args));
    });
  };
}

export function identity(x) { return x; }

export var truthy = oneof (number, string, bool);
export var primitive = oneof (truthy, falsy);
