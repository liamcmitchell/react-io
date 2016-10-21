import mapPropsStream from 'recompose/mapPropsStream'
import {from} from 'rxjs/observable/from'
import {switchMap} from 'rxjs/operator/switchMap'
import {combineLatest} from 'rxjs/observable/combineLatest'
import {map} from 'rxjs/operator/map'
import values from 'lodash/values'
import keys from 'lodash/keys'
import zipObject from 'lodash/zipObject'
import createHelper from 'recompose/createHelper'

// Like recompose/withProps but resolves observables.
const withObservables = observables => {

  return mapPropsStream(props$ => {
    return from(props$)::switchMap(props => {

      const observableProps = typeof observables === 'function' ?
        observables(props) :
        observables

      return combineLatest(values(observableProps))
        ::map(latestValues => ({
          ...props,
          // Rebuild prop map.
          ...zipObject(keys(observableProps), latestValues)
        }))
    })
  })
}

export default createHelper(withObservables, 'withObservables')
