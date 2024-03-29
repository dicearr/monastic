//. # Monastic
//.
//. [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
//. [![Code Coverage](https://codecov.io/gh/dicearr/monastic/branch/master/graph/badge.svg)](https://codecov.io/gh/dicearr/monastic)
//.
//. A state monad implementation compliant to [Fantasy Land][1]
//. inspired by [fantasy-states][2].
//.
//. ```console
//. $ npm install --save monastic
//. ```

import Z from 'sanctuary-type-classes';

//           compose :: (b -> c) -> (a -> b) -> a -> c
export const compose = f => g => x => f (g (x));

//           constant :: a -> b -> a
export const constant = x => () => x;

//           next :: a -> {done :: Boolean, value :: a}
export const next = v => ({done: false, value: v});

//           done :: b -> {done :: Boolean, value :: a}
export const done = v => ({done: true, value: v});

//. ## State
//# State :: (s -> {state :: s, value :: a}) -> State s a
//.
//. State [type representative][3].
export function State(run) {
  if (!(this instanceof State)) return new State (run);
  this.run = run;
}

//# State.fantasy-land/of :: a -> State s a
//.
//. Fantasy Land compliant implementation of Of.
//.
//. ```js
//. > evalState (null) (Z.of (State, 1))
//. 1
//. ```
State['fantasy-land/of'] = function of(value) {
  return new State (state => ({state: state, value: value}));
};

//# run :: s -> State s a -> {state :: s, value :: a}
//.
//. Evaluate a State instance with the given initial state and return both
//. the internal state and value.
//.
//. ```js
//. > run (1) (Z.of (State, 2))
//. {state: 1, value: 2}
//. ```
export function run(state) {
  return m => m.run (state);
}

//# modify :: (s -> s) -> State s Null
//.
//. Creates a State instance which transforms its internal state using the
//. given transformation function, and has a value of `null`.
//.
//. ```js
//. > execState (1) (modify (s => s + 1))
//. 2
//. ```
//.
//. Modify can be used inside chain to get a new State instance with the
//. internal state transformed.
//.
//. ```js
//. > execState (null) (
//. .   Z.chain (() => modify (s => s * 2), put (2))
//. . )
//. 4
//. ```
export function modify(f) {
  return new State (state => ({state: f (state), value: null}));
}

//# put :: s -> State s Null
//.
//. Creates a State instance which sets its internal state to the given value,
//. and has a value of `null`.
//.
//. ```js
//. > execState (1) (put (2))
//. 2
//. ```
export function put(state) {
  return modify (constant (state));
}

//# get :: State s s
//.
//. A State instance whose value is its internal state.
//.
//. ```js
//. > evalState () (
//. .   Z.chain (() => get, put (1))
//. . )
//. 1
//. ```
export const get = new State (state => ({state: state, value: state}));

//# evalState :: s -> State s a -> a
//.
//. Evaluate a State instance with the given initial state and return
//. the final value, discarding the final state.
//.
//. ```js
//. > evalState () (Z.of (State, 1))
//. 1
//. ```
export function evalState(state) {
  return m => m.run (state).value;
}

//# execState :: s -> State s a -> s
//.
//. Evaluate a State instance with the given initial state and return
//. the final state, discarding the final value.
//.
//. ```js
//. > execState () (put (1))
//. 1
//. ```
export function execState(state) {
  return m => m.run (state).state;
}

//# State.fantasy-land/chainRec :: ((a -> c, b -> c, v) -> State s c, v) -> State s b
//.
//. Fantasy Land compliant implementation of ChainRec.
//.
//. ```js
//. > const f = (next, done, v) => Z.of (State, v > 10 ? done (v) : next (v + 1))
//.
//. > evalState (null) (Z.chainRec (State, f, 1))
//. 11
//. ```
State['fantasy-land/chainRec'] = function chainRec(f, v) {
  return new State ((state => {
    let r = {state: state, value: next (v)};
    while (!r.value.done) {
      r = f (next, done, r.value.value).run (r.state);
    }
    return {state: r.state, value: r.value.value};
  }));
};


//# State.prototype.fantasy-land/chain :: State s a ~> (a -> State s b) -> State s b
//.
//. Fantasy Land compliant implementation of Chain.
//.
//. ```js
//. > evalState (null) (
//. .   Z.chain (v => Z.of (State, v + 1), Z.of (State, 1))
//. . )
//. 2
//. ```
State.prototype['fantasy-land/chain'] = function chain(f) {
  return new State ((s => {
    const r = this.run (s);
    return f (r.value).run (r.state);
  }));
};

//# State.prototype.fantasy-land/map :: State s a ~> (a -> b) -> State s b
//.
//. Fantasy Land compliant implementation of Map.
//.
//. ```js
//. > evalState (null) (
//. .   Z.map (x => x + 1, Z.of (State, 1))
//. . )
//. 2
//. ```
State.prototype['fantasy-land/map'] = function map(f) {
  return this['fantasy-land/chain'] (compose (State['fantasy-land/of']) (f));
};

//# State.prototype.fantasy-land/ap :: State s a ~> State s (a -> b) -> State s b
//.
//. Fantasy Land compliant implementation of Ap.
//.
//. ```js
//. > evalState (null) (
//. .   Z.ap (Z.of (State, x => x + 1), Z.of (State, 1))
//. . )
//. 2
//. ```
State.prototype['fantasy-land/ap'] = function ap(a) {
  return State (state1 => {
    const {state: state2, value: f} = run (state1) (a);
    const {state: state3, value: x} = run (state2) (this);
    return {state: state3, value: f (x)};
  });
};

//# StateT :: Monad m => m -> StateT s m a
//.
//. A state monad parametrised by the type m of the state to carry.
//.
//. ```js
//. > import Maybe from 'sanctuary-maybe'
//.
//. > const StateMaybe = StateT (Maybe)
//.
//. > StateMaybe.evalState () (Z.of (StateMaybe, 42))
//. Z.of (Maybe, 42)
//. ```
export function StateT(M) {

  function StateT(run) {
    this.run = run;
  }


  //. ## StateT
  //# StateT(m).run :: s -> StateT s m a -> m s a
  //.
  //. Evaluate a StateT(m) instance with the given initial state and return
  //. both the internal state and value wrapped in a monad.
  //.
  //. ```js
  //. > run (1) (Z.of (StateMaybe, 2))
  //. Z.of (Maybe, {state: 1, value: 2})
  //. ```
  StateT.run = run;

  //# StateT(m).fantasy-land/of :: Monad m => a -> StateT s m a
  //.
  //. Fantasy Land compliant implementation of Of.
  //.
  //. ```js
  //. > StateMaybe.evalState (null) (Z.of (StateMaybe, 1))
  //. Z.of (Maybe, 1)
  //. ```
  StateT['fantasy-land/of'] = function of(value) {
     return new StateT (state => Z.of (M, {state: state, value: value}));
   };

  //# StateT(m).modify :: Monad m => (s -> s) -> StateT s m Null
  //.
  //. Creates a StateT(m) instance which transforms its internal state using
  //. the given transformation function, and has a value of `null`.
  //.
  //. ```js
  //. > StateMaybe.execState (2) (StateMaybe.modify (x => x + 1))
  //. Z.of (Maybe, 3)
  //. ```
  StateT.modify = function modify(f) {
    return new StateT (state => Z.of (M, {state: f (state), value: null}));
  };

  //# StateT(m).put :: Monad m => s -> StateT s m Null
  //.
  //. Creates a StateT(m) instance which sets its internal state to the given
  //. value, and has a value of `null`.
  //.
  //. ```js
  //. > StateMaybe.execState (1) (StateMaybe.put (2))
  //. Z.of (Maybe, 2)
  //. ```
  StateT.put = function put(state) {
    return StateT.modify (constant (state));
  };

  //# StateT(m).get :: Monad m => StateT s m s
  //.
  //. A StateT(m) instance whose value is its internal state.
  //.
  //. ```js
  //. > run () (
  //. .   Z.chain (() => StateMaybe.get, StateMaybe.put (1))
  //. . )
  //. Z.of (Maybe, {state: 1, value: 1})
  //. ```
  StateT.get = new StateT (state => Z.of (M, {state: state, value: state}));

  //# StateT(m).evalState :: Monad m => s -> StateT s m a -> m a
  //.
  //. Evaluate a StateT(m) instance with the given initial state and return
  //. the final value wrapped in a monad, discarding the final state.
  //.
  //. ```js
  //. > StateMaybe.evalState () (Z.of (StateMaybe, 1))
  //. Z.of (Maybe, 1)
  //. ```
  StateT.evalState = function evalState(state) {
    return m => Z.map (res => res.value, m.run (state));
  };

  //# StateT(m).execState :: Monad m => s -> StateT s m a -> m s
  //.
  //. Evaluate a StateT(m) instance with the given initial state and return
  //. the final state wrapped in a monad, discarding the final value.
  //.
  //. ```js
  //. > StateMaybe.execState () (StateMaybe.put (1))
  //. Z.of (Maybe, 1)
  //. ```
  StateT.execState = function execState(state) {
    return m => Z.map (res => res.state, m.run (state));
  };

  //# StateT(m).lift :: Monad m => Monad b -> StateT s m b
  //.
  //. Creates a StateT(m) instance and sets its value to the value wrapped
  //. in the given Monad.
  //.
  //. ```js
  //. > StateMaybe.evalState () (
  //. .   StateMaybe.lift (Z.of (Maybe, 1))
  //. . )
  //. Z.of (Maybe, 1)
  //. ```
  StateT.lift = function lift(m) {
    return new StateT (state => (
      Z.map (value => ({state: state, value: value}), m)
    ));
  };

  //# StateT(m).fantasy-land/chainRec :: ((a -> c, b -> c, v) -> State s m c, v) -> State s m b
  //.
  //. Fantasy Land compliant implementation of ChainRec.
  //.
  //. ```js
  //. > const recf = (next, done, v) =>
  //. .   Z.of (StateMaybe, v > 10 ? done (v) : next (v + 1));
  //. > StateMaybe.evalState (null) (
  //. .    Z.chainRec (StateMaybe, recf, 1)
  //. . )
  //. Z.of (Maybe, 11)
  //. ```
  StateT['fantasy-land/chainRec'] = function chainRec(f, v) {
    return new StateT (state => {
      let oState = state;
      return Z.map (
        value => ({state: oState, value: value}),
        Z.chainRec (M, (next, done, v) => Z.map (
            res => { oState = res.state; return res.value; },
            f (next, done, v).run (oState)
          ), v)
      );
    });
  };

  //# StateT(m).hoist :: Monad m => StateT s m a -> (m a -> m b) -> StateT s m b
  //.
  //. Creates a StateT(m) instance which transforms its internal value using
  //. the given transformation function.
  //.
  //. ```js
  //. > StateMaybe.evalState (null) (
  //. .   StateMaybe.hoist (Z.of (StateMaybe, 1)) (x => Z.map (v => v + 1, x))
  //. . )
  //. Z.of (Maybe, 2)
  //. ```
  StateT.hoist = function hoist(m) {
    return function(f) {
      return new StateT (state => Z.map (
        value => ({state: state, value: value}),
        f (StateT.evalState (state) (m))
      ));
    };
  };

  //# StateT(m).prototype.fantasy-land/chain :: Monad m => StateT s m a ~> (a -> StateT s m b) -> StateT s m b
  //.
  //. Fantasy Land compliant implementation of Chain.
  //.
  //. ```js
  //. > StateMaybe.evalState (null) (
  //. .   Z.chain (v => Z.of (StateMaybe, v + 1), Z.of (StateMaybe, 1))
  //. . )
  //. Z.of (Maybe, 2)
  //. ```
  StateT.prototype['fantasy-land/chain'] = function(f) {
    return new StateT (s => Z.chain (
      state => f (state.value).run (state.state),
      this.run (s)
    ));
  };

  //# StateT(m).prototype.fantasy-land/map :: Monad m => StateT s m a ~> (a -> b) -> StateT s m b
  //.
  //. Fantasy Land compliant implementation of Map.
  //.
  //. ```js
  //. > StateMaybe.evalState (null) (
  //. .   Z.map (x => x + 1, Z.of (StateMaybe, 1))
  //. . )
  //. Z.of (Maybe, 2)
  //. ```
  StateT.prototype['fantasy-land/map'] = function(f) {
    return this['fantasy-land/chain'] (
      compose (StateT['fantasy-land/of']) (f)
    );
  };

  //# StateT(m).prototype.fantasy-land/ap :: Monad m => State s m a ~> State s m (a -> b) -> State s m b
  //.
  //. Fantasy Land compliant implementation of Ap.
  //.
  //. ```js
  //. > StateMaybe.evalState (null) (
  //. .   Z.ap (Z.of (StateMaybe, x => x + 1), Z.of (StateMaybe, 1))
  //. . )
  //. Z.of (Maybe, 2)
  //. ```
  StateT.prototype['fantasy-land/ap'] = function(mf) {
    const mx = this;
    return new StateT (state1 => Z.chain (
      ({state: state2, value: f}) => Z.map (
        ({state, value: x}) => ({state, value: f (x)}),
        mx.run (state2)
      ),
      mf.run (state1)
    ));
  };

  return StateT;
}

//. [1]: https://github.com/fantasyland/fantasy-land
//. [2]: https://github.com/fantasyland/fantasy-states
//. [3]: https://github.com/fantasyland/fantasy-land/#type-representatives
