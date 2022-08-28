import state from './state'

function reducer(currentState = state, actions: any) {
  switch (actions.type) {
    case 'user':
      return { ...currentState, user: actions.payload }

    case 'count':
      return { ...currentState, count: actions.payload }

    default:
      return currentState
  }
}

export default reducer
