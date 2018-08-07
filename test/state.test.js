import Z from 'sanctuary-type-classes';
import {deepStrictEqual as eq} from 'assert';
import {constant as _k, fun, nat} from 'jsverify';

import {
  property as _property,
  stateEquals,
  identity,
  primitive
} from './utils';

import {
  put,
  get,
  modify,
  execState,
  evalState,
  State,
  run,
  compose
} from '..';

var property = _property (test);

suite ('State', function() {
  test ('metadata', function() {
    eq (typeof State, 'function');
    eq (State.length, 1);
  });
  test ('constructor', function() {
    eq (State (42), new State (42));
  });
  suite ('.put', function() {
    test ('returns a state', function() {
      eq (put (42) instanceof State, true);
      eq (put.length, 1);
    });
    test ('internal state is set to the given value', function() {
      eq (execState (0) (put (42)), 42);
      eq (
        execState () (Z.chain (function() { return put (42); }, put (21))),
        42
      );
    });
  });
  suite ('.modify', function() {
    test ('returns a state', function() {
      eq (modify (Function.prototype) instanceof State, true);
      eq (modify.length, 1);
    });
    test ('internal value is set to null', function() {
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
    , _k (Math.sqrt), fun (nat), nat, function(f, g, x) {
      return stateEquals (nat) (
        Z.chain (function() { return modify (compose (f) (g)); }, put (x)),
        Z.chain (
          function() { return modify (f); },
          Z.chain (function() { return modify (g); }, put (x))
        )
      );
    });
  });
  suite ('.get', function() {
    test ('is a state', function() {
      eq (get instanceof State, true);
    });
    test ('sets the internal value to its state', function() {
      eq (evalState (42) (get), 42);
      eq (
        evalState () (
          Z.chain (function() { return get; }, put (42))
        ),
        42
      );
    });
  });
  suite ('.run', function() {
    test ('returns internal state an value', function() {
      eq (run (42) (get), {state: 42, value: 42});
    });
  });
  suite ('.fantasy-land/chainRec', function() {
    test ('should be stack-safe', function() {
      eq (evalState () (
        Z.chainRec (State, function(next, done, v) {
          return Z.of (State, v < 10000 ? next (v + 1) : done (v));
        }, 1)
      ), 10000);
    });
  });
});
