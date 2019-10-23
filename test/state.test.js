import Z from 'sanctuary-type-classes';
import {deepStrictEqual as eq} from 'assert';
import jsc from 'jsverify';
import test from 'oletus';

import {
  property as _property,
  stateEquals,
  identity,
  primitive
} from './utils.js';

import {
  put,
  get,
  modify,
  execState,
  evalState,
  State,
  run,
  compose
} from '../index.js';

var property = _property (test);

test ('metadata', function() {
  eq (typeof State, 'function');
  eq (State.length, 1);
});
test ('constructor', function() {
  eq (State (42), new State (42));
});

test ('.put returns a state', function() {
  eq (put (42) instanceof State, true);
  eq (put.length, 1);
});
test ('.put sets the internal state to the given value', function() {
  eq (execState (0) (put (42)), 42);
  eq (
    execState () (Z.chain (function() { return put (42); }, put (21))),
    42
  );
});

test ('.modify returns a state', function() {
  eq (modify (Function.prototype) instanceof State, true);
  eq (modify.length, 1);
});
test ('.modify sets the internal value to null', function() {
  eq (evalState () (modify (Function.prototype)), null);
  eq (
    evalState () (Z.chain (
      function() { return modify (Function.prototype); },
      Z.of (State, 42)
    )),
    null
  );
});

property ('put (a).chain (_ => modify (identity)) === put (a)', primitive, function(x) {
    return stateEquals (primitive) (
      Z.chain (function() { return modify (identity); }, put (x)),
      put (x)
    );
});

property (
'put (a).chain (_ => modify (compose (f) (g))) === put (a).chain (_ => modify (f)).chain (_ => modify (g))'
, jsc.constant (Math.sqrt), jsc.fun (jsc.nat), jsc.nat, function(f, g, x) {
  return stateEquals (jsc.nat) (
    Z.chain (function() { return modify (compose (f) (g)); }, put (x)),
    Z.chain (
      function() { return modify (f); },
      Z.chain (function() { return modify (g); }, put (x))
    )
  );
});

test ('.get is a state', function() {
  eq (get instanceof State, true);
});
test ('.get sets the internal value to its state', function() {
  eq (evalState (42) (get), 42);
  eq (
    evalState () (
      Z.chain (function() { return get; }, put (42))
    ),
    42
  );
});

test ('.run returns internal state an value', function() {
  eq (run (42) (get), {state: 42, value: 42});
});

test ('.fantasy-land/chainRec should be stack-safe', function() {
  eq (evalState () (
    Z.chainRec (State, function(next, done, v) {
      return Z.of (State, v < 10000 ? next (v + 1) : done (v));
    }, 1)
  ), 10000);
});
