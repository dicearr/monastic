//. # Warp State

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
  this.run = run;
}

// of :: a -> State s a
State['fantasy-land/of'] = of;

export function of(value) {
  return new State (function(state) {
    return {state: state, value: value};
  });
}

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
  return this['fantasy-land/chain'] (compose (of, f));
};

// ap :: State s a ~> State s (a -> b) -> State s b
State.prototype['fantasy-land/ap'] = function ap(a) {
  return this['fantasy-land/map'] (evalState () (a));
};

export function StateT(M) {

  function StateT(run) {
    this.run = run;
  }

  // of :: Monad m => a -> StateT s m a
  StateT.of  = function(value) {
     return new StateT (function(state) {
       return M.of ({state: state, value: value});
     });
   };

  // get :: Monad m => StateT s m s
  StateT.get = new StateT (function(state) {
    return M.of ({state: state, value: state});
  });

  // modify :: Monad m => (s -> s) -> StateT s m Null
  StateT.modify = function(f) {
    return new StateT (function(state) {
      return M.of ({state: f (state), value: null});
    });
  };

  // put :: Monad m => s -> StateT s m Null
  StateT.put = function(state) {
    return StateT.modify (constant (state));
  };

  // eval :: Monad m => StateT s m a ~> s -> m a
  StateT.prototype.eval = function(state) {
    return this.run (state).map (function(res) {
      return res.value;
    });
  };

  // exec :: Monad m => StateT s m a ~> s -> m s
  StateT.prototype.exec = function(state) {
    return this.run (state).map (function(res) {
      return res.state;
    });
  };

  // chain :: Monad m => StateT s m a ~> (a -> StateT s m b) -> StateT s m b
  StateT.prototype.chain = function(f) {
    var self = this;
    return new StateT (function(s) {
      var result = self.run (s);
      return result.chain (({value, state}) => f (value).run (state));
    });
  };

  // map :: Monad m => StateT s m a ~> (a -> b) -> StateT s m b
  StateT.prototype.map = function(f) {
    return this.chain (compose (f, StateT.of));
  };

  // ap :: Monad m => State s m a ~> State s m (a -> b) -> State s m b
  StateT.prototype.ap = function(a) {
    return this.map (a.eval ());
  };

  return StateT;
}
