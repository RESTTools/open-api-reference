import { fromJS, List } from "immutable"
import { fromJSOrdered, validateParam, paramToValue } from "core/utils"
import win from "../../window"

// selector-in-reducer is suboptimal, but `operationWithMeta` is more of a helper
import {
  specJsonWithResolvedSubtrees,
  parameterValues,
  parameterInclusionSettingFor,
} from "./selectors"

import {
  UPDATE_SPEC,
  UPDATE_URL,
  UPDATE_JSON,
  UPDATE_PARAM,
  UPDATE_EMPTY_PARAM_INCLUSION,
  VALIDATE_PARAMS,
  SET_RESPONSE,
  SET_REQUEST,
  SET_MUTATED_REQUEST,
  UPDATE_RESOLVED,
  UPDATE_RESOLVED_SUBTREE,
  UPDATE_OPERATION_META_VALUE,
  CLEAR_RESPONSE,
  CLEAR_REQUEST,
  CLEAR_VALIDATE_PARAMS,
  SET_SCHEME
} from "./actions"
import { paramToIdentifier } from "../../utils"


const supportBothVersions= (payload)=>{
  const readContent= (content)=>{
    if(typeof content == "object"){
      const types  = Object.keys(content);
      const values = Object.values(content);
      if(values.length>0 && values[0].schema){
        return [types, values[0].schema]
      }
    }
    return [];
  }

  payload.swagger = '2.0'
  delete payload.openapi;
  const secDefs = {...(payload?.securityDefinitions), ...(payload?.components?.securitySchemes)};
  Object.values(secDefs)
  .forEach(secDef => {    
    if(typeof secDef == "object"){
      if(secDef.type == "basic"){
        secDef.scheme = secDef.type;
        secDef.type = "http";
      }
    }
  })
  payload.securityDefinitions = secDefs; 
  payload.components = payload.components || {};  
  payload.components.securitySchemes = secDefs;

  Object.values(payload?.paths || {})
    .forEach(url => typeof url == "object" && Object.values(url || {})
      .forEach(op=>{
          if(typeof op == "object"){
            if(op?.requestBody?.content){
              const [types, schema] = readContent(op?.requestBody?.content);
              if(schema){
                if(!op.parameters){
                  op.parameters = [];
                }
                op.parameters.push({              
                  in: "body",
                  name: "body",
                  description: op?.requestBody?.description,
                  required: true,
                  schema: schema
                });
                op.consumes = types;
              }
              delete op.requestBody;
            }
            Object.values(op?.responses || {}).forEach(res=>{
              if(typeof res == "object"){
                if(res?.content){
                  const [types, schema] = readContent(res?.content);
                  if(schema){
                    res.schema = schema;
                    op.produces = op?.produces || [];
                    types.forEach(type=>{
                      if(!op.produces.includes(type)){                        
                        op?.produces.push(type);
                      }
                    });
                  }
                  delete res.content;
                }
              }
            })
          }
        }
      )
  );
  return payload;
}

export default {

  [UPDATE_SPEC]: (state, action) => {
    return (typeof action.payload === "string")
      ? state.set("spec", action.payload)
      : state
  },

  [UPDATE_URL]: (state, action) => {
    return state.set("url", action.payload+"")
  },

  [UPDATE_JSON]: (state, action) => {
    return state.set("json", fromJSOrdered(supportBothVersions(action.payload)))
  },

  [UPDATE_RESOLVED]: (state, action) => {
    return state.setIn(["resolved"], fromJSOrdered(action.payload))
  },

  [UPDATE_RESOLVED_SUBTREE]: (state, action) => {
    const { value, path } = action.payload
    return state.setIn(["resolvedSubtrees", ...path], fromJSOrdered(supportBothVersions(value)))
  },

  [UPDATE_PARAM]: ( state, {payload} ) => {
    let { path: pathMethod, paramName, paramIn, param, value, isXml } = payload

    let paramKey = param ? paramToIdentifier(param) : `${paramIn}.${paramName}`

    const valueKey = isXml ? "value_xml" : "value"

    return state.setIn(
      ["meta", "paths", ...pathMethod, "parameters", paramKey, valueKey],
      value
    )
  },

  [UPDATE_EMPTY_PARAM_INCLUSION]: ( state, {payload} ) => {
    let { pathMethod, paramName, paramIn, includeEmptyValue } = payload

    if(!paramName || !paramIn) {
      console.warn("Warning: UPDATE_EMPTY_PARAM_INCLUSION could not generate a paramKey.")
      return state
    }

    const paramKey = `${paramIn}.${paramName}`

    return state.setIn(
      ["meta", "paths", ...pathMethod, "parameter_inclusions", paramKey],
      includeEmptyValue
    )
  },

  [VALIDATE_PARAMS]: ( state, { payload: { pathMethod, isOAS3, isXml } } ) => {
    const op = specJsonWithResolvedSubtrees(state).getIn(["paths", ...pathMethod])
    const paramValues = parameterValues(state, pathMethod, isXml).toJS()
    return state.updateIn(["meta", "paths", ...pathMethod, "parameters"], fromJS({}), paramMeta => {
      return op.get("parameters", List()).reduce((res, param) => {

        const value = paramToValue(param, paramValues)
        const isEmptyValueIncluded = parameterInclusionSettingFor(state, pathMethod, param.get("name"), param.get("in"))
        const errors = validateParam(param, value, {
          bypassRequiredCheck: isEmptyValueIncluded,
          isOAS3,
          isXml
        })
        return res.setIn([paramToIdentifier(param), "errors"], fromJS(errors))
      }, paramMeta)
    })
  },
  [CLEAR_VALIDATE_PARAMS]: ( state, { payload:  { pathMethod } } ) => {
    return state.updateIn( [ "meta", "paths", ...pathMethod, "parameters" ], fromJS([]), parameters => {
      return parameters.map(param => param.set("errors", fromJS([])))
    })
  },

  [SET_RESPONSE]: (state, { payload: { res, path, method } } ) =>{
    let result
    if ( res.error ) {
      result = Object.assign({
        error: true,
        name: res.err.name,
        message: res.err.message,
        statusCode: res.err.statusCode
      }, res.err.response)
    } else {
      result = res
    }

    // Ensure headers
    result.headers = result.headers || {}

    let newState = state.setIn( [ "responses", path, method ], fromJSOrdered(result) )

    // ImmutableJS messes up Blob. Needs to reset its value.
    if ((win.Blob && res.data instanceof win.Blob )|| (res.data&&res.data.size) ) {
      newState = newState.setIn( [ "responses", path, method, "text" ], res.data)
    }
    return newState
  },

  [SET_REQUEST]: (state, { payload: { req, path, method } } ) =>{
    return state.setIn( [ "requests", path, method ], fromJSOrdered(req))
  },

  [SET_MUTATED_REQUEST]: (state, { payload: { req, path, method } } ) =>{
    return state.setIn( [ "mutatedRequests", path, method ], fromJSOrdered(req))
  },

  [UPDATE_OPERATION_META_VALUE]: (state, { payload: { path, value, key } }) => {
    // path is a pathMethod tuple... can't change the name now.
    let operationPath = ["paths", ...path]
    let metaPath = ["meta", "paths", ...path]

    if(
      !state.getIn(["json", ...operationPath])
      && !state.getIn(["resolved", ...operationPath])
      && !state.getIn(["resolvedSubtrees", ...operationPath])
    ) {
      // do nothing if the operation does not exist
      return state
    }

    return state.setIn([...metaPath, key], fromJS(value))
  },

  [CLEAR_RESPONSE]: (state, { payload: { path, method } } ) =>{
    return state.deleteIn( [ "responses", path, method ])
  },

  [CLEAR_REQUEST]: (state, { payload: { path, method } } ) =>{
    return state.deleteIn( [ "meta", "paths", path, method ])
  },

  [SET_SCHEME]: (state, { payload: { scheme, path, method } } ) =>{
    if ( path && method ) {
      return state.setIn( [ "scheme", path, method ], scheme)
    }

    if (!path && !method) {
      return state.setIn( [ "scheme", "_defaultScheme" ], scheme)
    }

  }

}
