import assert from 'assert';
import Z from 'sanctuary-type-classes';

import {
  put,
  get,
  modify,
  execState,
  evalState,
  State
} from '..';

suite ('State', function() {
  suite ('constructor', function() {
    test ('should return a State even if used as a function', function() {
      assert.deepStrictEqual (State (Function.prototype).constructor, State);
    });
  });
  suite ('modify', function() {
    var state = Math.random ();
    test ('should return a State', function() {
      assert.deepStrictEqual (modify (Function.prototype).constructor, State);
    });
    test ('should modify the previous state', function() {
      var res = execState (state) (modify (function(x) { return {x: x}; }));
      assert.deepStrictEqual (res, {x: state});
    });
    test ('should set value to null', function() {
      var res = evalState () (modify (Function.prototype));
      assert.deepStrictEqual (res, null);
    });
  });

  suite ('put', function() {
    var state = Math.random ();
    test ('should return a State', function() {
      assert.deepStrictEqual (put (0).constructor, State);
    });
    test ('should set the state', function() {
      var res = execState () (put (state));
      assert.deepStrictEqual (res, state);
    });
    test ('should set the value to null', function() {
      var res = evalState () (put (1));
      assert.deepStrictEqual (res, null);
    });
  });

  suite ('get', function() {
    var state = Math.random ();
    test ('should be a State', function() {
      assert.deepStrictEqual (get.constructor, State);
    });
    test ('should set both value and state to state', function() {
      var res = Z.chain (
        function() { return get; },
        put (state)
      ).run ();
      assert.deepStrictEqual (res, {
        state: state,
        value: state
      });
    });
  });
});
