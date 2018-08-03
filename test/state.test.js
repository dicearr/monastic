import assert from 'assert';
import Z from 'sanctuary-type-classes';

import {
  put,
  get,
  modify,
  execState,
  evalState,
  State,
  run
} from '..';

suite ('State', function() {
  suite ('constructor', function() {
    test ('should return a State even if used as a function', function() {
      return assert.deepStrictEqual (State (Function.prototype).constructor, State);
    });
  });
  suite ('modify', function() {
    var state = Math.random ();
    test ('should return a State', function() {
      return assert.deepStrictEqual (modify (Function.prototype).constructor, State);
    });
    test ('should modify the previous state', function() {
      var res = execState (state) (modify (function(x) { return {x: x}; }));
      return assert.deepStrictEqual (res, {x: state});
    });
    test ('should set value to null', function() {
      var res = evalState () (modify (Function.prototype));
      return assert.deepStrictEqual (res, null);
    });
  });

  suite ('put', function() {
    var state = Math.random ();
    test ('should return a State', function() {
      return assert.deepStrictEqual (put (0).constructor, State);
    });
    test ('should set the state', function() {
      var res = execState () (put (state));
      return assert.deepStrictEqual (res, state);
    });
    test ('should set the value to null', function() {
      var res = evalState () (put (1));
      return assert.deepStrictEqual (res, null);
    });
  });

  suite ('get', function() {
    var state = Math.random ();
    test ('should be a State', function() {
      return assert.deepStrictEqual (get.constructor, State);
    });
    test ('should set both value and state to state', function() {
      var m = Z.chain (
        function() { return get; },
        put (state)
      );
      const res = run () (m);
      return assert.deepStrictEqual (res, {
        state: state,
        value: state
      });
    });
  });

  suite ('chainRec', function() {
    test ('should be stack-safe', function() {
      var m = Z.chainRec (State, function(next, done, v) {
        return Z.of (State, v < 10000 ? next (v + 1) : done (v));
      }, 1);
      return assert.deepStrictEqual (evalState () (m), 10000);
    });
  });
});
