import assert from 'assert';
import Z from 'sanctuary-type-classes';

import {
  State,
  StateT
} from '..';

var S = StateT (State);

suite ('StateT', function() {
  suite ('modify', function() {
    var state = Math.random ();
    test ('should return a StateT (State)', function() {
      assert.deepStrictEqual (S.modify (Function.prototype).constructor, S);
    });
    test ('should modify the previous state', function() {
      var m = S.execState (state) (S.modify (function(x) { return {x: x}; }));
      Z.map (
        function(res) { return assert.deepStrictEqual (res, {x: state}); },
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
    var state = Math.random ();
    test ('should return a StateT', function() {
      assert.deepStrictEqual (S.put (0).constructor, S);
    });
    test ('should set the state', function() {
      var res = S.execState () (S.put (state)).run ();
      return assert.deepStrictEqual (res.value, state);
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
    var state = Math.random ();
    test ('should be a StateT', function() {
      assert.deepStrictEqual (S.get.constructor, S);
    });
    test ('should set both value and state to state', function() {
      var res = Z.chain (
        function() { return S.get; },
        S.put (state)
      ).run ().run ();
      return assert.deepStrictEqual (res.value, {
        state: state,
        value: state
      });
    });
  });
});
