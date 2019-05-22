import Z from 'sanctuary-type-classes';
import Maybe from 'sanctuary-maybe';

import {
  deepStrictEqual as eq,
  throws
} from 'assert';

import {
  constant as _k,
  fun,
  nat
} from 'jsverify';

import {
  primitive,
  identity,
  stateEquals,
  property as _prop,
  assertEquals
} from './utils';

import {
  StateT,
  run,
  compose
} from '..';

var S = StateT (Maybe);
var property = _prop (test);

function mul3(x) { return x * 3; }

function hoistFun(fn) {
  return function(mx) {
    return Z.of (Maybe, fn (mx.value));
  };
}

suite ('StateT (m)', function() {
  test ('metadata', function() {
    eq (typeof S, 'function');
    eq (S.length, 1);
  });
  suite ('.put', function() {
    test ('returns a StateT (m)', function() {
      eq (S.put (42) instanceof S, true);
      eq (S.put.length, 1);
    });
    test ('internal state is set to the given value', function() {
      assertEquals (S.execState (0) (S.put (42)), Z.of (Maybe, 42));
      assertEquals (
        S.execState () (Z.chain (function() { return S.put (42); }, S.put (21))),
        Z.of (Maybe, 42)
      );
    });
  });
  suite ('.modify', function() {
    test ('returns a StateT (m)', function() {
      eq (S.modify (Function.prototype) instanceof S, true);
      eq (S.modify.length, 1);
    });
    test ('internal value is set to null', function() {
      assertEquals (S.evalState () (S.modify (Function.prototype)), Z.of (Maybe, null));
      assertEquals (
        S.evalState () (Z.chain (
          function() { return S.modify (Function.prototype); },
          Z.of (S, 42)
        )),
        Z.of (Maybe, null)
      );
    });
    property ('S.put (a).chain (_ => S.modify (identity)) === S.put (a)', primitive, function(x) {
        return stateEquals (primitive) (
          Z.chain (function() { return S.modify (identity); }, S.put (x)),
          S.put (x)
        );
    });
    property ('S.put (a).chain (_ => S.modify (compose (f) (g))) === S.put (a).chain (_ => S.modify (f)).chain (_ => S.modify (g))'
    , _k (Math.sqrt), fun (nat), nat, function(f, g, x) {
      return stateEquals (nat) (
        Z.chain (function() { return S.modify (compose (f) (g)); }, S.put (x)),
        Z.chain (
          function() { return S.modify (f); },
          Z.chain (function() { return S.modify (g); }, S.put (x))
        )
      );
    });
  });
  suite ('.get', function() {
    test ('is a StateT (m)', function() {
      eq (S.get instanceof S, true);
    });
    test ('sets the internal value to its state', function() {
      eq (S.evalState (42) (S.get), Z.of (Maybe, 42));
      eq (
        S.evalState () (
          Z.chain (function() { return S.get; }, S.put (42))
        ),
        Z.of (Maybe, 42)
      );
    });
  });
  suite ('.run', function() {
    test ('returns the internal state an value wrapped in a Monad', function() {
      eq (run (42) (S.get), Z.of (Maybe, {state: 42, value: 42}));
    });
  });
  suite ('.lift', function() {
    test ('returns a StateT (m)', function() {
      eq (S.lift (Z.of (Maybe, 1)) instanceof S, true);
    });
    property ('S.lift (M.of (n)) === S.of (n)', primitive, function(x) {
      return stateEquals (primitive) (
        S.lift (Z.of (Maybe, x)),
        Z.of (S, x)
      );
    });
  });

  suite ('.hoist', function() {
    test ('returns a StateT (m)', function() {
      eq (
        S.hoist (Z.of (S, 1)) (Z.of (Maybe, Function.prototype)) instanceof S,
        true
      );
    });
    property ('S.hoist (Z.of (S, a)) (identity)) === Z.of (S, a)', primitive, function(x) {
        return stateEquals (primitive) (
          S.hoist (Z.of (S, x)) (identity),
          Z.of (S, x)
        );
    });
    property (
      'S.hoist (Z.of (S, a)) (compose (f) (g))) === S.hoist (S.hoist (Z.of (S, a)) (g)) (f)',
      _k (hoistFun (Math.sqrt)),
      _k (hoistFun (mul3)),
      nat,
      function(f, g, x) {
        return stateEquals (nat) (
          S.hoist (Z.of (S, x)) (compose (f) (g)),
          S.hoist (S.hoist (Z.of (S, x)) (g)) (f)
        );
      }
    );
  });
  suite ('.fantasy-land/chainRec', function() {
      test ('throws if the given monad is not ChainRec', function() {
        return throws (
          function() { return Z.chainRec ([], Function.prototype, 0); },
          /ChainRec\.methods\.chainRec\(\.\.\.\) is not a function/
        );
      });
      test ('is stack-safe', function() {
        var s = Z.chainRec (S, function(next, done, v) {
          return Z.of (S, v < 10000 ? next (v + 1) : done (v));
        }, 1);
        assertEquals (
          S.evalState () (s),
          Z.of (Maybe, 10000)
        );
      });
    });
});
