import store from '@/store'

import { Button } from 'antd'
import { useEffect } from 'react'

const ReduxComponent: React.FC = () => {
  const storeClick = () => {
    const state = store.getState()
    store.dispatch({
      type: 'count',
      payload: state.count + 1,
    })
  }

  useEffect(() => {
    store.subscribe(() => {
      console.log(store.getState().count)
    })
  }, [])

  return (
    <div className="middleContainer">
      <h2 className="marginBottom">ReduxComponent</h2>
      <div className="marginBottom">
        <Button type="primary" onClick={storeClick}>
          store {store.getState().count}
        </Button>
      </div>
    </div>
  )
}

export default ReduxComponent
