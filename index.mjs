//. # Warp State
//.
//. [![Build Status](https://travis-ci.com/wearereasonablepeople/warp-state.svg?token=6J5xkcjgCPqtiPMbBtzj&branch=master)](https://travis-ci.com/wearereasonablepeople/warp-state) [![Coverage Status](https://coveralls.io/repos/github/wearereasonablepeople/warp-state/badge.svg?branch=diego%2Finitial&t=Bckm7f)](https://coveralls.io/github/wearereasonablepeople/warp-state?branch=diego%2Finitial)
//.
//. A state monad implementation compliant to [Fantasy Land][1]
//. inspired by [fantasy-states][3].
//.
//. Usage in Node depends on `--experimental-modules`.
//.
//. With older Node versions, use [`esm`][2]

import Z from 'sanctuary-type-classes';

// compose :: (b -> c, a -> b) -> (a -> c)
export function compose(f, g) {
  return function(v) {
    return f (g (v));
  };
}

// constant :: a -> b -> a
export function constant(v) {
  return function() {
    return v;
  };
}

export function State(run) {
  if (!(this instanceof State)) return new State (run);
  this.run = run;
}

//. ## State
//.
//# fantasy-land/of :: a -> State s a
//.
//. Replace the value with the given one.
//.
//. ```js
//.   Z.of(State, 1).run(null) // {state: null, value: 1}
//. ```

State['fantasy-land/of'] = function of(value) {
  return new State (function(state) {
    return {state: state, value: value};
  });
};

//# modify :: (s -> s) -> State s Null
//.
//. Map an old state to a new one. The old state is thrown away.
//.
//. ```js
//.  put(2).run(1) // {state: 2, value: null}
//. ```

export function modify(f) {
  return new State (function(state) {
    return {state: f (state), value: null};
  });
}

//# put :: s -> State s Null
//.
//. Replace the state with the given one.
//.
//. ```js
//.  put(2).run(1) // {state: 2, value: null}
//. ```

export function put(state) {
  return modify (constant (state));
}

//# get :: State s s
//.
//. Replace the returned value of the computation with the state.
//.
//. ```js
//.  Z.chain(() => get, put(1)).run() // {state: 1, value: 1}
//. ```

export var get = new State (function(state) {
  return {state: state, value: state};
});

//# evalState :: s -> State s a -> a
//.
//. Evaluate a state computation with the given initial state and return
//. the final value, discarding the final state.
//.
//. ```js
//.  evalState()(Z.of (State, 1)) // 1
//. ```

export function evalState(state) {
  return function(m) {
    return m.run (state).value;
  };
}

//# execState :: s -> State s a -> s
//.
//. Evaluate a state computation with the given initial state and return
//. the final state, discarding the final value.
//.
//. ```js
//.  execState()(put (1)) // 1
//. ```

export function execState(state) {
  return function(m) {
    return m.run (state).state;
  };
}

//# fantasy-land/chain :: State s a ~> (a -> State s b) -> State s b
//.
//. Replace the State with a new one based on the result value of
//. the previous computation.
//.
//. ```js
//.   Z.chain(
//.     v => Z.of(State, v + 1),
//.     Z.of(State, 1)
//.   )
//.   .run(null) // {state: null, value: 2}
//. ```

State.prototype['fantasy-land/chain'] = function chain(f) {
  var self = this;
  return new State (function(s) {
    var r = self.run (s);
    return f (r.value).run (r.state);
  });
};

//# map :: State s a ~> (a -> b) -> State s b
//.
//. Map an old value to a new one. The old value is thrown away.
//.
//. ```js
//.   Z.map(
//.     x => x + 1,
//.     Z.of(State, 1)
//.   )
//.   .run(null) // {state: null, value: 2}
//. ```

State.prototype['fantasy-land/map'] = function map(f) {
  return this['fantasy-land/chain'] (compose (State['fantasy-land/of'], f));
};

//# ap :: State s a ~> State s (a -> b) -> State s b
//.
//. Combine two State values by applying the value of one over the value
//. within the other. The state of the applied is thrown.
//.
//. ```js
//.   Z.ap(
//.     Z.of(State, x => x + 1),
//.     Z.of(State, 1)
//.   )
//.   .run(null) // {state: null, value: 2}
//. ```

State.prototype['fantasy-land/ap'] = function ap(a) {
  return this['fantasy-land/map'] (evalState () (a));
};

//# StateT :: Monad m => m -> StateT s m a
//.
//. A state monad parametrised by the type m of the state to carry.
//.

export function StateT(M) {

  function StateT(run) {
    this.run = run;
  }

  //. ## StateT
  //.
  //# StateT.fantasy-land/of :: Monad m => a -> StateT s m a
  //.
  //. Replace the value inside the monad with the given one.
  //.
  //. ```js
  //.   const S = StateT(Monad)
  //.   Z.of(S, 1).run(null) // Monad({state: 2, value: 1})
  //. ```

  StateT['fantasy-land/of'] = function of(value) {
     return new StateT (function(state) {
       return Z.of (M, {state: state, value: value});
     });
   };

  //# StateT.modify :: Monad m => (s -> s) -> StateT s m Null
  //.
  //. Map the old state contained in the monad to a new one.
  //. The old state is thrown away.
  //.
  //. ```js
  //.   const {modify} = StateT(Monad)
  //.   modify(x => x + 1)
  //.   .run(2) // Monad({state: 3, value: null})
  //. ```

  StateT.modify = function modify(f) {
    return new StateT (function(state) {
      return Z.of (M, {state: f (state), value: null});
    });
  };

  //# StateT.put :: Monad m => s -> StateT s m Null
  //.
  //. Replace the state inside the monad with the given one.
  //.
  //. ```js
  //.   const {put} = StateT(Monad)
  //.   put(2).run(1) // Monad({state: 2, value: null})
  //. ```

  StateT.put = function put(state) {
    return StateT.modify (constant (state));
  };

  //# StateT.get :: Monad m => StateT s m s
  //.
  //. Replace the returned value of the computation, inside the monad,
  //. with the state.
  //.
  //. ```js
  //.   const {put} = StateT(Monad)
  //.   Z.chain(() => get, put(1))
  //.   .run() // Monad({state: 1, value: 1})
  //. ```

  StateT.get = new StateT (function(state) {
    return Z.of (M, {state: state, value: state});
  });

  //# StateT.evalState :: Monad m => s -> StateT s m a -> m a
  //.
  //. Evaluate a state computation with the given initial state and return
  //. the final value wrapped in a monad, discarding the final state.
  //.
  //. ```js
  //.   const S,{evalState} = StateT(Monad);
  //.   evalState()(Z.of (S, 1)) // Monad(1)
  //. ```
  StateT.evalState = function evalState(state) {
    return function(m) {
      return Z.map (
        function(res) { return res.value; },
        m.run (state)
      );
    };
  };

  //# StateT.execState :: Monad m => s -> StateT s m a -> m s
  //.
  //. Evaluate a state computation with the given initial state and return
  //. the final state wrapped in a monad, discarding the final value.
  //.
  //. ```js
  //.   const {execState, put} = StateT(Monad);
  //.   execState()(put(1)) // Monad(1)
  //. ```
  StateT.execState = function execState(state) {
    return function(m) {
      return Z.map (
        function(res) { return res.state; },
        m.run (state)
      );
    };
  };

  //# StateT.fantasy-land/chain :: Monad m => StateT s m a ~> (a -> StateT s m b) -> StateT s m b
  //.
  //. Replace the State with a new one based on the result value
  //. of the previous computation.
  //.
  //. ```js
  //.   const S = StateT (Monad)
  //.   Z.chain(
  //.     v => Z.of(S, v + 1),
  //.     Z.of(S, 1)
  //.   )
  //.   .run(null) // Monad({state: null, value: 2})
  //. ```
  StateT.prototype['fantasy-land/chain'] = function(f) {
    var self = this;
    return new StateT (function(s) {
      return Z.chain (
        function(state) { return f (state.value).run (state.state); },
        self.run (s)
      );
    });
  };

  //# StateT.fantasy-land/map :: Monad m => StateT s m a ~> (a -> b) -> StateT s m b
  //.
  //. Map the old value wrapped in the monad to a new one.
  //. The old value is thrown away.
  //.
  //. ```js
  //.   const S = StateT(Monad)
  //.   Z.map(
  //.     x => x + 1,
  //.     Z.of(S, 1)
  //.   )
  //.   .run(null) // Monad({state: null, value: 2})
  //. ```
  StateT.prototype['fantasy-land/map'] = function(f) {
    return this['fantasy-land/chain'] (compose (StateT['fantasy-land/of'], f));
  };

  //# StateT.fantasy-land/ap :: Monad m => State s m a ~> State s m (a -> b) -> State s m b
  //.
  //. Combine two StateT values by applying the value of one over the value
  //. within the other. The state of the applied is thrown.
  //.
  //. ```js
  //.   const S = StateT(Monad)
  //.   Z.ap(
  //.     Z.of(S, x => x + 1),
  //.     Z.of(S, 1)
  //.   )
  //.   .run(null) // Monad({state: null, value: 2})
  //. ```
  StateT.prototype['fantasy-land/ap'] = function(mf) {
    var mx = this;
    return new StateT (state => {
      var get = StateT.evalState (state); // Monad {st, val}
      return Z.map (
        function(value) { return {state: state, value: value}; },
        Z.ap (get (mf), get (mx))
      );
    });
  };

  return StateT;
}

//. [1]: https://github.com/fantasyland/fantasy-land
//. [2]: https://github.com/standard-things/esm
//. [3]: https://github.com/fantasyland/fantasy-states
