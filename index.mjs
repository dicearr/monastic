// compose :: ((b -> c), (a -> b)) -> (a -> c)
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

export default function State(run) {
  this.run = run;
}

// of :: a -> State s a
State.of = function(value) {
  return new State (function(state) {
    return {state: state, value: value};
  });
};

// get :: State s s
State.get = new State (function(state) {
  return {state: state, value: state};
});

// modify :: (s -> s) -> State s a
State.modify = function(f) {
  return new State (function(state) {
    return {state: f (state), value: null};
  });
};

// put :: s -> State s a
State.put = function(state) {
  return State.modify (constant (state));
};

// eval :: State s a ~> s -> a
State.prototype.eval = function(state) {
  return this.run (state).value;
};

// exec :: State s a ~> s -> s
State.prototype.exec = function(state) {
  return this.run (state).state;
};

// chain :: State s a ~> (a -> State s b) -> State s b
State.prototype.chain = function(f) {
  return new State (s => {
    const r = this.run (s);
    return f (r.value).run (r.state);
  });
};

// map :: State s a ~> (a -> b) -> State s b
State.prototype.map = function(f) {
  return this.chain (compose (f, State.of));
};

State.prototype.ap = function(a) {
  return this.chain (function(f) {
    return a.map (f);
  });
};

State.StateT = function(M) {

  function StateT(run) {
    this.run = run;
  }

  // of :: a -> StateT s a
  StateT.of = function(value) {
     return new StateT (function(state) {
       return M.of ({state: state, value: value});
     });
   };

  // get :: StateT s s
  StateT.get = new StateT (function(state) {
    return M.of ({state: state, value: state});
  });

  // modify :: (s -> s) -> StateT s a
  StateT.modify = function(f) {
    return new StateT (function(state) {
      return M.of ({state: f (state), value: null});
    });
  };

  // put :: s -> StateT s a
  StateT.put = function(state) {
    return StateT.modify (constant (state));
  };

  // eval :: StateT s a ~> s -> a
  StateT.prototype.eval = function(state) {
    return this.run (state).value;
  };

  // exec :: StateT s a ~> s -> s
  StateT.prototype.exec = function(state) {
    return this.run (state).state;
  };

  // chain :: StateT s a ~> (a -> StateT s b) -> StateT s b
  StateT.prototype.chain = function(f) {
    return new StateT (s => {
      const result = this.run (s);
      return result.chain (({value, state}) => f (value).run (state));
    });
  };

  // map :: StateT s a ~> (a -> b) -> StateT s b
  StateT.prototype.map = function(f) {
    return this.chain (compose (f, StateT.of));
  };

  State.prototype.ap = function(a) {
    return this.chain (f => a.map (f));
  };

  return StateT;
};
