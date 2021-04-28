# Monastic

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Coverage](https://codecov.io/gh/dicearr/monastic/branch/master/graph/badge.svg)](https://codecov.io/gh/dicearr/monastic)

A state monad implementation compliant to [Fantasy Land][1]
inspired by [fantasy-states][2].

```console
$ npm install --save monastic
```

## State
#### <a name="State" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L28">`State :: (s -⁠> {state :: s, value :: a}) -⁠> State s a`</a>

State [type representative][3].

#### <a name="State.fantasy-land/of" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L36">`State.fantasy-land/of :: a -⁠> State s a`</a>

Fantasy Land compliant implementation of Of.

```js
> evalState (null) (Z.of (State, 1))
1
```

#### <a name="run" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L48">`run :: s -⁠> State s a -⁠> {state :: s, value :: a}`</a>

Evaluate a State instance with the given initial state and return both
the internal state and value.

```js
> run (1) (Z.of (State, 2))
{state: 1, value: 2}
```

#### <a name="modify" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L61">`modify :: (s -⁠> s) -⁠> State s Null`</a>

Creates a State instance which transforms its internal state using the
given transformation function, and has a value of `null`.

```js
> execState (1) (modify (s => s + 1))
2
```

Modify can be used inside chain to get a new State instance with the
internal state transformed.

```js
> execState (null) (
.   Z.chain (() => modify (s => s * 2), put (2))
. )
4
```

#### <a name="put" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L84">`put :: s -⁠> State s Null`</a>

Creates a State instance which sets its internal state to the given value,
and has a value of `null`.

```js
> execState (1) (put (2))
2
```

#### <a name="get" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L97">`get :: State s s`</a>

A State instance whose value is its internal state.

```js
> evalState () (
.   Z.chain (() => get, put (1))
. )
1
```

#### <a name="evalState" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L109">`evalState :: s -⁠> State s a -⁠> a`</a>

Evaluate a State instance with the given initial state and return
the final value, discarding the final state.

```js
> evalState () (Z.of (State, 1))
1
```

#### <a name="execState" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L122">`execState :: s -⁠> State s a -⁠> s`</a>

Evaluate a State instance with the given initial state and return
the final state, discarding the final value.

```js
> execState () (put (1))
1
```

#### <a name="State.fantasy-land/chainRec" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L135">`State.fantasy-land/chainRec :: ((a -⁠> c, b -⁠> c, v) -⁠> State s c, v) -⁠> State s b`</a>

Fantasy Land compliant implementation of ChainRec.

```js
> const f = (next, done, v) => Z.of (State, v > 10 ? done (v) : next (v + 1))

> evalState (null) (Z.chainRec (State, f, 1))
11
```

#### <a name="State.prototype.fantasy-land/chain" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L156">`State.prototype.fantasy-land/chain :: State s a ~> (a -⁠> State s b) -⁠> State s b`</a>

Fantasy Land compliant implementation of Chain.

```js
> evalState (null) (
.   Z.chain (v => Z.of (State, v + 1), Z.of (State, 1))
. )
2
```

#### <a name="State.prototype.fantasy-land/map" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L173">`State.prototype.fantasy-land/map :: State s a ~> (a -⁠> b) -⁠> State s b`</a>

Fantasy Land compliant implementation of Map.

```js
> evalState (null) (
.   Z.map (x => x + 1, Z.of (State, 1))
. )
2
```

#### <a name="State.prototype.fantasy-land/ap" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L187">`State.prototype.fantasy-land/ap :: State s a ~> State s (a -⁠> b) -⁠> State s b`</a>

Fantasy Land compliant implementation of Ap.

```js
> evalState (null) (
.   Z.ap (Z.of (State, x => x + 1), Z.of (State, 1))
. )
2
```

#### <a name="StateT" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L205">`StateT :: Monad m => m -⁠> StateT s m a`</a>

A state monad parametrised by the type m of the state to carry.

```js
> import Maybe from 'sanctuary-maybe'

> const StateMaybe = StateT (Maybe)

> StateMaybe.evalState () (Z.of (StateMaybe, 42))
Z.of (Maybe, 42)
```

## StateT
#### <a name="StateT(m).run" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L225">`StateT(m).run :: s -⁠> StateT s m a -⁠> m s a`</a>

Evaluate a StateT(m) instance with the given initial state and return
both the internal state and value wrapped in a monad.

```js
> run (1) (Z.of (StateMaybe, 2))
Z.of (Maybe, {state: 1, value: 2})
```

#### <a name="StateT(m).fantasy-land/of" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L236">`StateT(m).fantasy-land/of :: Monad m => a -⁠> StateT s m a`</a>

Fantasy Land compliant implementation of Of.

```js
> StateMaybe.evalState (null) (Z.of (StateMaybe, 1))
Z.of (Maybe, 1)
```

#### <a name="StateT(m).modify" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L248">`StateT(m).modify :: Monad m => (s -⁠> s) -⁠> StateT s m Null`</a>

Creates a StateT(m) instance which transforms its internal state using
the given transformation function, and has a value of `null`.

```js
> StateMaybe.execState (2) (StateMaybe.modify (x => x + 1))
Z.of (Maybe, 3)
```

#### <a name="StateT(m).put" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L261">`StateT(m).put :: Monad m => s -⁠> StateT s m Null`</a>

Creates a StateT(m) instance which sets its internal state to the given
value, and has a value of `null`.

```js
> StateMaybe.execState (1) (StateMaybe.put (2))
Z.of (Maybe, 2)
```

#### <a name="StateT(m).get" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L274">`StateT(m).get :: Monad m => StateT s m s`</a>

A StateT(m) instance whose value is its internal state.

```js
> run () (
.   Z.chain (() => StateMaybe.get, StateMaybe.put (1))
. )
Z.of (Maybe, {state: 1, value: 1})
```

#### <a name="StateT(m).evalState" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L286">`StateT(m).evalState :: Monad m => s -⁠> StateT s m a -⁠> m a`</a>

Evaluate a StateT(m) instance with the given initial state and return
the final value wrapped in a monad, discarding the final state.

```js
> StateMaybe.evalState () (Z.of (StateMaybe, 1))
Z.of (Maybe, 1)
```

#### <a name="StateT(m).execState" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L299">`StateT(m).execState :: Monad m => s -⁠> StateT s m a -⁠> m s`</a>

Evaluate a StateT(m) instance with the given initial state and return
the final state wrapped in a monad, discarding the final value.

```js
> StateMaybe.execState () (StateMaybe.put (1))
Z.of (Maybe, 1)
```

#### <a name="StateT(m).lift" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L312">`StateT(m).lift :: Monad m => Monad b -⁠> StateT s m b`</a>

Creates a StateT(m) instance and sets its value to the value wrapped
in the given Monad.

```js
> StateMaybe.evalState () (
.   StateMaybe.lift (Z.of (Maybe, 1))
. )
Z.of (Maybe, 1)
```

#### <a name="StateT(m).fantasy-land/chainRec" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L329">`StateT(m).fantasy-land/chainRec :: ((a -⁠> c, b -⁠> c, v) -⁠> State s m c, v) -⁠> State s m b`</a>

Fantasy Land compliant implementation of ChainRec.

```js
> const recf = (next, done, v) =>
.   Z.of (StateMaybe, v > 10 ? done (v) : next (v + 1));
> StateMaybe.evalState (null) (
.    Z.chainRec (StateMaybe, recf, 1)
. )
Z.of (Maybe, 11)
```

#### <a name="StateT(m).hoist" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L354">`StateT(m).hoist :: Monad m => StateT s m a -⁠> (m a -⁠> m b) -⁠> StateT s m b`</a>

Creates a StateT(m) instance which transforms its internal value using
the given transformation function.

```js
> StateMaybe.evalState (null) (
.   StateMaybe.hoist (Z.of (StateMaybe, 1)) (x => Z.map (v => v + 1, x))
. )
Z.of (Maybe, 2)
```

#### <a name="StateT(m).prototype.fantasy-land/chain" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L374">`StateT(m).prototype.fantasy-land/chain :: Monad m => StateT s m a ~> (a -⁠> StateT s m b) -⁠> StateT s m b`</a>

Fantasy Land compliant implementation of Chain.

```js
> StateMaybe.evalState (null) (
.   Z.chain (v => Z.of (StateMaybe, v + 1), Z.of (StateMaybe, 1))
. )
Z.of (Maybe, 2)
```

#### <a name="StateT(m).prototype.fantasy-land/map" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L391">`StateT(m).prototype.fantasy-land/map :: Monad m => StateT s m a ~> (a -⁠> b) -⁠> StateT s m b`</a>

Fantasy Land compliant implementation of Map.

```js
> StateMaybe.evalState (null) (
.   Z.map (x => x + 1, Z.of (StateMaybe, 1))
. )
Z.of (Maybe, 2)
```

#### <a name="StateT(m).prototype.fantasy-land/ap" href="https://github.com/dicearr/monastic/blob/v3.0.2/index.js#L407">`StateT(m).prototype.fantasy-land/ap :: Monad m => State s m a ~> State s m (a -⁠> b) -⁠> State s m b`</a>

Fantasy Land compliant implementation of Ap.

```js
> StateMaybe.evalState (null) (
.   Z.ap (Z.of (StateMaybe, x => x + 1), Z.of (StateMaybe, 1))
. )
Z.of (Maybe, 2)
```

[1]: https://github.com/fantasyland/fantasy-land
[2]: https://github.com/fantasyland/fantasy-states
[3]: https://github.com/fantasyland/fantasy-land/#type-representatives
