export function compose(f, g) {
  return function(v) {
    return f (g (v));
  };
}

export function constant(v) {
  return function() {
    return v;
  };
}

export default function State(run) {
  this.run = run;
}

State.of = function(value) {
  return new State (function(state) {
    return {value: value, state: state};
  });
};

State.get = new State (function(state) {
  return {value: state, state: state};
});

State.modify = function(f) {
  return new State (function(state) {
    return {value: null, state: f (state)};
  });
};

State.prototype.put = function(state) {
  return State.modify (constant (state));
};

State.prototype.eval = function(state) {
  return this.run (state).value;
};

State.prototype.exec = function(state) {
  return this.run (state).state;
};

State.prototype.chain = function(f) {
  return new State (s => {
    const r = this.run (s);
    return f (r.value).run (r.state);
  });
};

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

  StateT.of = function(value) {
     return new StateT (function(state) {
       return M.of ({value: value, state: state});
     });
   };

  StateT.get = new StateT (function(state) {
    return M.of ({value: state, state});
  });

  StateT.modify = function(f) {
    return new StateT (function(state) {
      return M.of ({value: null, state: f (state)});
    });
  };

  StateT.put = function(state) {
    return StateT.modify (constant (state));
  };

  StateT.prototype.eval = function(state) {
    return this.run (state).value;
  };

  StateT.prototype.exec = function(state) {
    return this.run (state).state;
  };

  StateT.prototype.chain = function(f) {
    return new StateT (s => {
      const result = this.run (s);
      return result.chain (({value, state}) => f (value).run (state));
    });
  };

  StateT.prototype.map = function(f) {
    return this.chain (compose (f, StateT.of));
  };

  State.prototype.ap = function(a) {
    return this.chain (f => a.map (f));
  };

  return StateT;
};
