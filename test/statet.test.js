import assert from 'assert';
import Z from 'sanctuary-type-classes';

import {
  State,
  StateT
} from '..';

var S = StateT (State);

suite ('StateT', function() {
  suite ('modify', function() {
    var rand = Math.random ();
    test ('should return a StateT (State)', function() {
      assert.deepStrictEqual (S.modify (Function.prototype).constructor, S);
    });
    test ('should modify the previous state', function() {
      var m = S.execState (rand) (S.modify (function(x) { return {x: x}; }));
      Z.map (
        function(res) { return assert.deepStrictEqual (res, {x: rand}); },
        m
      );
    });
    test ('should set value to null', function() {
      var m = S.evalState () (S.modify (Function.prototype));
      Z.map (
        function(res) { return assert.deepStrictEqual (res, null); },
        m
      );
    });
  });

  suite ('put', function() {
    var rand = Math.random ();
    test ('should return a StateT', function() {
      assert.deepStrictEqual (S.put (0).constructor, S);
    });
    test ('should set the state', function() {
      var res = S.execState () (S.put (rand)).run ();
      return assert.deepStrictEqual (res.value, rand);
    });
    test ('should set the value to null', function() {
      var m = S.evalState () (S.put (1));
      Z.map (
        function(res) { return assert.deepStrictEqual (res, null); },
        m
      );
    });
  });

  suite ('get', function() {
    var rand = Math.random ();
    test ('should be a StateT', function() {
      assert.deepStrictEqual (S.get.constructor, S);
    });
    test ('should set both value and state to state', function() {
      var res = Z.chain (
        function() { return S.get; },
        S.put (rand)
      ).run ().run ();
      return assert.deepStrictEqual (res.value, {
        state: rand,
        value: rand
      });
    });
  });

  suite ('lift', function() {
    var rand = Math.random ();
    test ('should return a StateT', function() {
      assert.deepStrictEqual (S.lift (Z.of (State, 1)).constructor, S);
    });
    test ('should replace the value', function() {
      var res = S.evalState (2) (S.lift (Z.of (State, rand))).run ();
      return assert.deepStrictEqual (res.value, rand);
    });
  });

  suite ('hoist', function() {
    var rand = Math.random ();
    test ('should return a StateT', function() {
      assert.deepStrictEqual (
        S.hoist (Z.of (S, 1)) (function() { return Z.of (State, 1); }).constructor,
        S
      );
    });
    test ('should replace the value', function() {
      var s = S.hoist (Z.of (S, rand)) (function(m) {
        return Z.map (function(v) { return v + 1; }, m);
      });
      var res = S.evalState (null) (s).run ();
      return assert.deepStrictEqual (res.value, rand + 1);
    });
  });
});
