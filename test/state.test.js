import assert from 'assert';
import Z from 'sanctuary-type-classes';

import {
  put,
  get,
  modify,
  execState
} from '..';

suite ('Functions', function() {
  test ('modify', function() {
    var state = Math.random ();
    var res = modify (function(x) { return x + 1; }).run (state);
    assert.deepStrictEqual (res.state, state + 1);
    assert.equal (res.value, undefined);
  });
  test ('put', function() {
    var state = Math.random ();
    var res = execState () (put (state));
    assert.deepStrictEqual (res, state);
  });
  test ('get', function() {
    var state = Math.random ();
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
