import assert from 'assert';
import Z from 'sanctuary-type-classes';
import Maybe from 'sanctuary-maybe';

import {
  StateT,
  run
} from '..';

// M can be any data structure compliant to fantasy-land Monad and Setoid
var M = Maybe;
var S = StateT (M);

suite ('StateT', function() {

  suite ('modify', function() {
    var rand = Math.random ();
    test ('should return a StateT(M)', function() {
      return assert.deepStrictEqual (S.modify (Function.prototype).constructor, S);
    });
    test ('should receive the previous state as argument', function() {
      var r;
      S.execState (rand) (S.modify (function(x) { r = x; return Z.of (S, 1); }));
      return assert.deepStrictEqual (r, rand);
    });
    test ('should replace the state with the function result', function() {
      var m = S.execState (rand) (S.modify (function(x) { return {x: x}; }));
      return assert.ok (Z.equals (m, Z.of (M, {x: rand})));
    });
    test ('should set value to null', function() {
      var m = S.evalState (rand) (S.modify (Function.prototype));
      return assert.ok (Z.equals (m, Z.of (M, null)));
    });
  });

  suite ('put', function() {
    var rand = Math.random ();
    test ('should return a StateT(M)', function() {
      return assert.deepStrictEqual (S.put (0).constructor, S);
    });
    test ('should set the state', function() {
      var m = S.execState (null) (S.put (rand));
      return assert.ok (Z.equals (m, Z.of (M, rand)));
    });
    test ('should set the value to null', function() {
      var m = S.evalState (null) (S.put (1));
      return assert.ok (Z.equals (m, Z.of (M, null)));
    });
  });

  suite ('get', function() {
    var rand = Math.random ();
    test ('should be a StateT', function() {
      return assert.deepStrictEqual (S.get.constructor, S);
    });
    test ('should set both value and state to state', function() {
      var sm = Z.chain (function() { return S.get; }, S.put (rand));
      var m = run () (sm);
      return assert.ok (Z.equals (m, Z.of (M, {
        state: rand,
        value: rand
      })));
    });
  });

  suite ('lift', function() {
    var rand = Math.random ();
    test ('should return a StateT', function() {
      return assert.deepStrictEqual (S.lift (Z.of (M, 1)).constructor, S);
    });
    test ('should replace the value', function() {
      var m = S.evalState (2) (S.lift (Z.of (M, rand)));
      return assert.ok (Z.equals (m, Z.of (M, rand)));
    });
  });

  suite ('hoist', function() {
    var rand = Math.random ();
    test ('should return a StateT', function() {
      return assert.deepStrictEqual (
        S.hoist (Z.of (S, 1)) (function() { return Z.of (M, 1); }).constructor,
        S
      );
    });
    test ('should replace the value', function() {
      var s = S.hoist (Z.of (S, rand)) (function(m) {
        return Z.map (function(v) { return v + 1; }, m);
      });
      var m = S.evalState (null) (s);
      return assert.ok (Z.equals (m, Z.of (M, rand + 1)));
    });
  });

  suite ('chainRec', function() {
    test ('should throw if M is not ChainRec', function() {
      return assert.throws (
        function() { return Z.chainRec ([], Function.prototype, 0); },
        /ChainRec\.methods\.chainRec\(\.\.\.\) is not a function/
      );
    });
    test ('should be stack-safe', function() {
      var s = Z.chainRec (S, function(next, done, v) {
        return Z.of (S, v < 10000 ? next (v + 1) : done (v));
      }, 1);
      var m = S.evalState () (s);
      return assert.ok (Z.equals (m, Z.of (M, 10000)));
    });
  });

});
