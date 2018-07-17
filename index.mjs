//. # Warp State
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

// of :: a -> State s a
State['fantasy-land/of'] = function of(value) {
  return new State (function(state) {
    return {state: state, value: value};
  });
};

// get :: State s s
export var get = new State (function(state) {
  return {state: state, value: state};
});

// modify :: (s -> s) -> State s Null
export function modify(f) {
  return new State (function(state) {
    return {state: f (state), value: null};
  });
}

// put :: s -> State s Null
export function put(state) {
  return modify (constant (state));
}

// evalState :: s -> State s a -> a
export function evalState(state) {
  return function(m) {
    return m.run (state).value;
  };
}

// execState :: s -> State s a -> s
export function execState(state) {
  return function(m) {
    return m.run (state).state;
  };
}

// chain :: State s a ~> (a -> State s b) -> State s b
State.prototype['fantasy-land/chain'] = function chain(f) {
  var self = this;
  return new State (function(s) {
    var r = self.run (s);
    return f (r.value).run (r.state);
  });
};

// map :: State s a ~> (a -> b) -> State s b
State.prototype['fantasy-land/map'] = function map(f) {
  return this['fantasy-land/chain'] (compose (State['fantasy-land/of'], f));
};

// ap :: State s a ~> State s (a -> b) -> State s b
State.prototype['fantasy-land/ap'] = function ap(a) {
  return this['fantasy-land/map'] (evalState () (a));
};

// StateT :: Monad m => m -> StateT s m a
export function StateT(M) {

  function StateT(run) {
    this.run = run;
  }

  // of :: Monad m => a -> StateT s m a
  StateT['fantasy-land/of'] = function of(value) {
     return new StateT (function(state) {
       return Z.of (M, {state: state, value: value});
     });
   };

  // get :: Monad m => StateT s m s
  StateT.get = new StateT (function(state) {
    return Z.of (M, {state: state, value: state});
  });

  // modify :: Monad m => (s -> s) -> StateT s m Null
  StateT.modify = function modify(f) {
    return new StateT (function(state) {
      return Z.of (M, {state: f (state), value: null});
    });
  };

  // put :: Monad m => s -> StateT s m Null
  StateT.put = function put(state) {
    return StateT.modify (constant (state));
  };

  // evalState :: Monad m => s -> StateT s m a -> m a
  StateT.evalState = function evalState(state) {
    return function(m) {
      return Z.map (
        function(res) { return res.value; },
        m.run (state)
      );
    };
  };

  // execState :: Monad m => s -> StateT s m a -> m s
  StateT.execState = function execState(state) {
    return function(m) {
      return Z.map (
        function(res) { return res.state; },
        m.run (state)
      );
    };
  };

  // chain :: Monad m => StateT s m a ~> (a -> StateT s m b) -> StateT s m b
  StateT.prototype['fantasy-land/chain'] = function(f) {
    var self = this;
    return new StateT (function(s) {
      return Z.chain (
        function(state) { return f (state.value).run (state.state); },
        self.run (s)
      );
    });
  };

  // map :: Monad m => StateT s m a ~> (a -> b) -> StateT s m b
  StateT.prototype['fantasy-land/map'] = function(f) {
    return this['fantasy-land/chain'] (compose (StateT['fantasy-land/of'], f));
  };

  // ap :: Monad m => State s m a ~> State s m (a -> b) -> State s m b
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
