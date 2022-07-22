import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { Iterable } from "immutable"

const Headers = ( { headers } )=>{
  return (
    <div>
      <h5>Response headers</h5>
      <pre className="microlight">{headers}</pre>
    </div>)
}
Headers.propTypes = {
  headers: PropTypes.array.isRequired
}

const Duration = ( { duration } ) => {
  return (
    <div>
      <h5>Request duration</h5>
      <pre className="microlight">{duration} ms</pre>
    </div>
  )
}
Duration.propTypes = {
  duration: PropTypes.number.isRequired
}


export default class LiveResponse extends React.Component {
  static propTypes = {
    response: PropTypes.instanceOf(Iterable).isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    displayRequestDuration: PropTypes.bool.isRequired,
    specSelectors: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired
  }

  login =(e) => {
    e.stopPropagation()
  
    let { security, authActions, authSelectors } = this.props
    let definitions = authSelectors.getDefinitionsByNames(security)
  
    authActions.showDefinitions(definitions)
  }

  shouldComponentUpdate(nextProps) {
    // BUG: props.response is always coming back as a new Immutable instance
    // same issue as responses.jsx (tryItOutResponse)
    return this.props.response !== nextProps.response
      || this.props.path !== nextProps.path
      || this.props.method !== nextProps.method
      || this.props.displayRequestDuration !== nextProps.displayRequestDuration
  }

  render() {
    const { response, getComponent, getConfigs, displayRequestDuration, specSelectors, path, method, security, authActions,authSelectors} = this.props
    const { showMutatedRequest, requestSnippetsEnabled } = getConfigs()

    const curlRequest = showMutatedRequest ? specSelectors.mutatedRequestFor(path, method) : specSelectors.requestFor(path, method)
    const status = response.get("status")
    const url = curlRequest.get("url")
    const headers = response.get("headers").toJS()
    const notDocumented = response.get("notDocumented")
    const isError = response.get("error")
    const body = response.get("text")
    const duration = response.get("duration")
    const headersKeys = Object.keys(headers)
    const contentType = headers["content-type"] || headers["Content-Type"]

    const ResponseBody = getComponent("responseBody")
    const returnObject = headersKeys.map(key => {
      var joinedHeaders = Array.isArray(headers[key]) ? headers[key].join() : headers[key]
      return <span className="headerline" key={key}> {key}: {joinedHeaders} </span>
    })
    const hasHeaders = returnObject.length !== 0
    const Markdown = getComponent("Markdown", true)
    const RequestSnippets = getComponent("RequestSnippets", true)
    const Curl = getComponent("curl")

    const AuthorizeOperationBtn = getComponent("authorizeOperationBtn")
    return (
      <div>
        <div className="responses-table actual-response">
          <div className="response">
            <div className="col response-col_status">{status && "Status Code : "}{status}
              {status && <span className="response-undocumented">
                <i> {response.get("message")}</i>
              </span>}
              {
                isError && !status ?
                  <div>
                    <h4><span className="server-error">
                      Error
                </span></h4>
                    <div className="response-col_description__inner">
                      <Markdown source={"Try out feature is not available in offline documentation."} />
                    </div>
                  </div>
                  : null
              }
              {status == "404" &&
                <div className="response-col_description__inner">
                  <h4><span className="server-error">
                    <span className="authorization__btn unlocked">
                      <svg width="10" height="10">
                        <use href="#unlocked" xlinkHref="#unlocked" />
                      </svg>
                      </span> Authentication Error
                </span></h4>
                <div className="markdown"><p>User credentials are missing, invalid or locked.<br/>
                Click{ 
                    (!security || !security.count()) ? null :
                      <AuthorizeOperationBtn
                          isAuthorized={authSelectors.isAuthorized(security)}
                          onClick={() => {
                            const applicableDefinitions = authSelectors.definitionsForRequirements(security)
                            authActions.showDefinitions(applicableDefinitions)
                          }}
                        />
                  } to set proper credentials. </p>
                </div>
                </div>
              }
            </div>
            <div className="col response-col_description">
              {
                url && <div>
                  <h4>Request URL</h4>
                  <div className="request-url">
                    <pre className="microlight">{url.replace(/%3D/g,"=")}</pre>
                  </div>
                </div>
              }
              {
                body ? <ResponseBody content={ body }
                                       contentType={ contentType }
                                       url={ url }
                                       headers={ headers }
                                       getConfigs={ getConfigs }
                                       getComponent={ getComponent }/>
                  : null
              }
              {
                hasHeaders ? <Headers headers={returnObject} /> : null
              }
              {
                displayRequestDuration && duration ? <Duration duration={duration} /> : null
              }
              {getConfigs().curl &&curlRequest && (requestSnippetsEnabled === true || requestSnippetsEnabled === "true"
                  ? <RequestSnippets request={ curlRequest }/>
                  : <Curl request={ curlRequest } getConfigs={ getConfigs } />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  static propTypes = {
    getComponent: PropTypes.func.isRequired,
    response: ImPropTypes.map
  }
}
