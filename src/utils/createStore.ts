import $$observable from './utils/symbol-observable'

import { Action } from './types/actions'
import { Reducer } from './types/reducers'
import { Dispatch, ExtendState, Observer, PreloadedState, Store, StoreEnhancer } from './types/store'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'
import { kindOf } from './utils/kindOf'

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param preloadedState The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param enhancer The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
export default function createStore<S, A extends Action, Ext = {}, StateExt = never>(
  reducer: Reducer<S, A>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<S, A extends Action, Ext = {}, StateExt = never>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S>,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
export default function createStore<S, A extends Action, Ext = {}, StateExt = never>(
  reducer: Reducer<S, A>,
  preloadedState?: PreloadedState<S> | StoreEnhancer<Ext, StateExt> /*  */,
  enhancer?: StoreEnhancer<Ext, StateExt>
): Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext {
  /* 第一个函数重载签名入参为reducer和enhancer（redux增强剂）
     第二个函数重载签名入参为reducer和preloadedState（初始化state）和enhancer
     第三个函数实现签名兼容前两个重载签名的入参上，主要是体验在第二个参数上，第二个参数可为state也可为enhancer，
     第二第三个参数可以不传，state在此不传的话由第一个参数reducer函数的第一个参数赋予，
     这一个赋予动作会在createStore函数初始化时首次调用dispatch函数体现，末尾参数都是enhancer 
  */

  /*   
  总结: 
  第一个参数reducer为函数且必传，
  第二个参数为非必传参数，可为state或者enhancer，如果是state则不允许为函数类型，如果是函数则当做enhancer处理，
  第三个参数为非必传参数且必须为函数，会当做enhancer处理
  */

  // TODO 如果(preloadedState传入的是一个函数且enhancer也是函数)或者(enhancer是函数且第三个入参也是函数)抛出错误
  if (
    (typeof preloadedState === 'function' && typeof enhancer === 'function') ||
    (typeof enhancer === 'function' && typeof arguments[3] === 'function')
  ) {
    throw new Error(
      'It looks like you are passing several store enhancers to ' +
        'createStore(). This is not supported. Instead, compose them ' +
        'together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.'
    )
  }

  // TODO 如果(preloadedState传入的是一个函数且enhancer没有传)
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    // TODO 将preloadedState赋值给enhancer 这里走了第一个函数重载
    enhancer = preloadedState as StoreEnhancer<Ext, StateExt>
    preloadedState = undefined
  }

  // TODO 如果enhancer传了
  if (typeof enhancer !== 'undefined') {
    // TODO 如果enhancer传了且不是函数抛出错误
    if (typeof enhancer !== 'function') {
      throw new Error(`Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`)
    }
    // TODO 如果enhancer传了且是函数将createStore操作交给enhancer去处理
    return enhancer(createStore)(reducer, preloadedState as PreloadedState<S>) as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  }

  // TODO 如果reducer不是函数抛出错误
  if (typeof reducer !== 'function') {
    throw new Error(`Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`)
  }

  let currentReducer = reducer
  let currentState = preloadedState as S
  let currentListeners: (() => void)[] | null = []
  let nextListeners = currentListeners
  let isDispatching = false
  console.log(`%c init params----------------start`, 'color: red')
  console.log('reducer---', currentReducer)
  console.log('currentState---', currentState)
  console.log('currentListeners---', currentListeners)
  console.log(`%c init params----------------start`, 'color: red')
  /**
   * This makes a shallow copy of currentListeners so we can use
   * nextListeners as a temporary list while dispatching.
   *
   * This prevents any bugs around consumers calling
   * subscribe/unsubscribe in the middle of a dispatch.
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * Reads the state tree managed by the store.
   *
   * @returns The current state tree of your application.
   */
  function getState(): S {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState as S
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param listener A callback to be invoked on every dispatch.
   * @returns A function to remove this change listener.
   */
  function subscribe(listener: () => void) {
    if (typeof listener !== 'function') {
      throw new Error(`Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`)
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, subscribe from a ' +
          'component and invoke store.getState() in the callback to access the latest state. ' +
          'See https://redux.js.org/api/store#subscribelistener for more details.'
      )
    }

    let isSubscribed = true

    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
            'See https://redux.js.org/api/store#subscribelistener for more details.'
        )
      }

      isSubscribed = false

      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
      currentListeners = null
    }
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action: A) {
    // TODO 初始化CreateStore函数走一次初始化dispatch函数并执行调用,action仅传入type(随机数)无payload,此时reducer switch走default返回初始state

    if ((action.type as string).includes('@@redux')) {
      console.log(`%c createStore初始化调用一次dispatch -------`, 'color: #389e0d', action)
    } else {
      console.log(`%c 非初始化时view调用dispatch -------`, 'color: #08979c', action)
    }

    // TODO 检查传入的action是不是一个object类型
    if (!isPlainObject(action)) {
      throw new Error(
        `Actions must be plain objects. Instead, the actual type was: '${kindOf(
          action
        )}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`
      )
    }

    // TODO 检查action是否传入了type
    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. You may have misspelled an action type string constant.')
    }

    // TODO 是否正在dispatching
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    // TODO 通过dispatch校验

    // TODO 执行reducer里的switch
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    // TODO 通知订阅者 执行store.subscribe(listencer回调函数)
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    // TODO 返回当前传入的action 至此一次dispatch结束
    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param nextReducer The reducer for the store to use instead.
   * @returns The same store instance with a new reducer in place.
   */
  function replaceReducer<NewState, NewActions extends A>(
    nextReducer: Reducer<NewState, NewActions>
  ): Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext {
    if (typeof nextReducer !== 'function') {
      throw new Error(`Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`)
    }

    // TODO: do this more elegantly
    ;(currentReducer as unknown as Reducer<NewState, NewActions>) = nextReducer

    // This action has a similar effect to ActionTypes.INIT.
    // Any reducers that existed in both the new and old rootReducer
    // will receive the previous state. This effectively populates
    // the new state tree with any relevant data from the old one.
    dispatch({ type: ActionTypes.REPLACE } as A)
    // change the type of the store by casting it to the new store
    return store as unknown as Store<ExtendState<NewState, StateExt>, NewActions, StateExt, Ext> & Ext
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer: unknown) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError(`Expected the observer to be an object. Instead, received: '${kindOf(observer)}'`)
        }

        function observeState() {
          const observerAsObserver = observer as Observer<S>
          if (observerAsObserver.next) {
            observerAsObserver.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      },
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT } as A)

  const store = {
    dispatch: dispatch as Dispatch<A>,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable,
  } as unknown as Store<ExtendState<S, StateExt>, A, StateExt, Ext> & Ext
  return store
}
