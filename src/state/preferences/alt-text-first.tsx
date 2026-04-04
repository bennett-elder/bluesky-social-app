import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['altTextFirstEnabled']
type SetContext = (v: persisted.Schema['altTextFirstEnabled']) => void

const stateContext = createContext<StateContext>(
  persisted.defaults.altTextFirstEnabled,
)
stateContext.displayName = 'AltTextFirstStateContext'
const setContext = createContext<SetContext>(
  (_: persisted.Schema['altTextFirstEnabled']) => {},
)
setContext.displayName = 'AltTextFirstSetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(persisted.get('altTextFirstEnabled'))

  const setStateWrapped = useCallback(
    (altTextFirstEnabled: persisted.Schema['altTextFirstEnabled']) => {
      setState(altTextFirstEnabled)
      persisted.write('altTextFirstEnabled', altTextFirstEnabled)
    },
    [setState],
  )

  useEffect(() => {
    return persisted.onUpdate(
      'altTextFirstEnabled',
      nextAltTextFirstEnabled => {
        setState(nextAltTextFirstEnabled)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useAltTextFirstEnabled() {
  return useContext(stateContext)
}

export function useSetAltTextFirstEnabled() {
  return useContext(setContext)
}
