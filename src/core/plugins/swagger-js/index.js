import resolve from "swagger-client/es/resolver"
import { execute, buildRequest } from "swagger-client/es/execute"
import Http, { makeHttp, serializeRes } from "swagger-client/es/http"
import resolveSubtree from "swagger-client/es/subtree-resolver"
import { opId } from "swagger-client/es/helpers"
import { loaded } from "./configs-wrap-actions"
import isPlainObject from 'lodash/isPlainObject'
import isArray from 'lodash/isArray'
import {applySecurities} from "swagger-client/es/execute/oas3/build-request"

const toLower = str => String.prototype.toLowerCase.call(str)

export default function({ configs, getConfigs }) {
  return {
    fn: {
      fetch: makeHttp(Http, configs.preFetch, configs.postFetch),
      buildRequest: buildRequestNew,
      execute: executeNew,
      resolve,
      resolveSubtree: (obj, path, opts, ...rest) => {
        if(opts === undefined) {
          const freshConfigs = getConfigs()
          opts = {
            modelPropertyMacro: freshConfigs.modelPropertyMacro,
            parameterMacro: freshConfigs.parameterMacro,
            requestInterceptor: freshConfigs.requestInterceptor,
            responseInterceptor: freshConfigs.responseInterceptor
          }
        }

        return resolveSubtree(obj, path, opts, ...rest)
      },
      serializeRes,
      opId
    },
    statePlugins: {
      configs: {
        wrapActions: {
          loaded,
        }
      }
    },
  }
}

function buildRequestNew(options,removeRaw) {
  let rawParam;
  if(options.parameters && options.parameters["query.raw"] ){
    rawParam = options.parameters["query.raw"];
    if(removeRaw){
      options.parameters["query.raw"] = undefined;
    }
  }

  var spec = options.spec,
      operation = options.operation.toJS ? options.operation.toJS() : options.operation,
      securities = options.securities;

  let request = buildRequest(options);
  request = applySecurities({
    request: request,
    securities: securities,
    operation: operation,
    spec: spec
  });
  
  if(request?.headers && request.headers?.authorization == request.headers?.Authorization){
    delete request.headers.authorization;
  }
  if(rawParam){
    if(request.url.indexOf("?") >0){
      request.url = request.url + "&" + rawParam
    }else{
      request.url = request.url + "?" + rawParam
    }
  }
  return  request;
}

function executeNew({
  http: userHttp,
  fetch, // This is legacy
  spec,
  operationId,
  pathName,
  method,
  parameters,
  securities,
  ...extras
}) {
  // Provide default fetch implementation
  const http = userHttp || fetch || stockHttp // Default to _our_ http

  if (pathName && method && !operationId) {
    operationId = `${toLower(method)}-${pathName}`//legacyIdFromPathMethod(pathName, method)
  }

  const request = buildRequestNew({spec, operationId, parameters, securities, http, ...extras},true)

  if (request.body && (isPlainObject(request.body) || isArray(request.body))) {
    request.body = JSON.stringify(request.body)
  }

  // Build request and execute it
  return http(request)
}