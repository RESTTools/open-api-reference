import { createSelector } from "reselect"
import { List, Map, fromJS } from "immutable"

const state = state => state

export const shownDefinitions = createSelector(
    state,
    auth => auth.get( "showDefinitions" )
)

export const definitionsToAuthorize = createSelector(
    state,
    () => ( { specSelectors } ) => {
      let definitions = specSelectors.securityDefinitions() || Map({})
      let list = List()

      
      definitions.entrySeq().forEach( ([ defName, definition ]) => {
        const type = definition.get("type")

        if(type === "oauth2" && definition.get("flows")) {
          definition.get("flows").entrySeq().forEach(([flowKey, flowVal]) => {
            let translatedDef = fromJS({
              flow: flowKey,
              authorizationUrl: flowVal.get("authorizationUrl"),
              tokenUrl: flowVal.get("tokenUrl"),
              scopes: flowVal.get("scopes"),
              type: definition.get("type"),
              description: definition.get("description")
            })

            list = list.push(new Map({
              [defName]: translatedDef.filter((v) => {
                return v !== undefined
              })
            }))
          })
        }
        else if(type === "http" || type === "apiKey" || type === "oauth2") {
          list = list.push(new Map({
            [defName]: definition
          }))
        }
        else if(type === "openIdConnect" && definition.get("openIdConnectData")) {
          let oidcData = definition.get("openIdConnectData")
          let grants = oidcData.get("grant_types_supported") || ["authorization_code", "implicit"]
          grants.forEach((grant) => {
            // Convert from OIDC list of scopes to the OAS-style map with empty descriptions
            let translatedScopes = oidcData.get("scopes_supported") &&
              oidcData.get("scopes_supported").reduce((acc, cur) => acc.set(cur, ""), new Map())

            let translatedDef = fromJS({
              flow: grant,
              authorizationUrl: oidcData.get("authorization_endpoint"),
              tokenUrl: oidcData.get("token_endpoint"),
              scopes: translatedScopes,
              type: "oauth2",
              openIdConnectUrl: definition.get("openIdConnectUrl")
            })

            list = list.push(new Map({
              [defName]: translatedDef.filter((v) => {
                // filter out unset values, sometimes `authorizationUrl`
                // and `tokenUrl` come out as `undefined` in the data
                return v !== undefined
              })
            }))
          })
        }
      })

      return list
    }
)


export const getDefinitionsByNames = ( state, securities ) => ( { specSelectors } ) => {
  console.warn("WARNING: getDefinitionsByNames is deprecated and will be removed in the next major version.")
  let securityDefinitions = specSelectors.securityDefinitions()
  let result = List()

  securities.valueSeq().forEach( (names) => {
    let map = Map()
    names.entrySeq().forEach( ([name, scopes]) => {
      let definition = securityDefinitions.get(name)
      let allowedScopes

      if ( definition.get("type") === "oauth2" && scopes.size ) {
        allowedScopes = definition.get("scopes")

        allowedScopes.keySeq().forEach( (key) => {
          if ( !scopes.contains(key) ) {
            allowedScopes = allowedScopes.delete(key)
          }
        })

        definition = definition.set("allowedScopes", allowedScopes)
      }

      map = map.set(name, definition)
    })

    result = result.push(map)
  })

  return result
}

export const definitionsForRequirements = (state, securities = List()) => ({ authSelectors }) => {
  const allDefinitions = authSelectors.definitionsToAuthorize() || List()
  return allDefinitions.filter((def) => {
    return securities.some(sec => sec.get(def.keySeq().first()))
  })
}

export const authorized = createSelector(
    state,
    auth => auth.get("authorized") || Map()
)


export const isAuthorized = ( state, securities ) => ( { authSelectors } ) => {
  let authorized = authSelectors.authorized()

  if(!List.isList(securities)) {
    return null
  }

  return !!securities.toJS().filter( ( security ) => {
      let isAuthorized = true

      return Object.keys(security).map((key) => {
        return !isAuthorized || !!authorized.get(key)
      }).indexOf(false) === -1
    }).length
}

export const getConfigs = createSelector(
    state,
    auth => auth.get( "configs" )
)
