import React from "react"
import { fromJS, Iterable } from "immutable"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { defaultStatusCode, getAcceptControllingResponse } from "core/utils"
import createHtmlReadyId from "../../helpers/create-html-ready-id"

export default class Responses extends React.Component {
  static propTypes = {
    tryItOutResponse: PropTypes.instanceOf(Iterable),
    responses: PropTypes.instanceOf(Iterable).isRequired,
    produces: PropTypes.instanceOf(Iterable),
    producesValue: PropTypes.any,
    displayRequestDuration: PropTypes.bool.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    specPath: ImPropTypes.list.isRequired,
    fn: PropTypes.object.isRequired
  }

  static defaultProps = {
    tryItOutResponse: null,
    produces: fromJS(["application/json"]),
    displayRequestDuration: false
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      activeTab: 'current'
    }
  }

  activeTab =( e ) => {
    let { target : { dataset : { name } } } = e
    this.setState({
      activeTab: name,
    })
  }

  // These performance-enhancing checks were disabled as part of Multiple Examples
  // because they were causing data-consistency issues
  //
  // shouldComponentUpdate(nextProps) {
  //   // BUG: props.tryItOutResponse is always coming back as a new Immutable instance
  //   let render = this.props.tryItOutResponse !== nextProps.tryItOutResponse
  //   || this.props.responses !== nextProps.responses
  //   || this.props.produces !== nextProps.produces
  //   || this.props.producesValue !== nextProps.producesValue
  //   || this.props.displayRequestDuration !== nextProps.displayRequestDuration
  //   || this.props.path !== nextProps.path
  //   || this.props.method !== nextProps.method
  //   return render
  // }

	onChangeProducesWrapper = ( val ) => this.props.specActions.changeProducesValue([this.props.path, this.props.method], val)

  onResponseContentTypeChange = ({ controlsAcceptHeader, value }) => {
    const { oas3Actions, path, method } = this.props
    if(controlsAcceptHeader) {
      oas3Actions.setResponseContentType({
        value,
        path,
        method
      })
    }
  }

  render() {
    let {
      responses,
      tryItOutResponse,
      getComponent,
      getConfigs,
      specSelectors,
      fn,
      producesValue,
      displayRequestDuration,
      specPath,
      path,
      method,
      oas3Selectors,
      oas3Actions,
      security, authActions,authSelectors
    } = this.props
    let defaultCode = defaultStatusCode( responses )

    const ContentType = getComponent( "contentType" )
    const LiveResponse = getComponent( "liveResponse" )
    const Response = getComponent( "response" )

    let produces = this.props.produces && this.props.produces.size ? this.props.produces : Responses.defaultProps.produces

    const isSpecOAS3 = specSelectors.isOAS3()
    const errorCodeMessage = specSelectors.errorCodeMessage()

    const acceptControllingResponse = isSpecOAS3 ?
      getAcceptControllingResponse(responses) : null

    const regionId = createHtmlReadyId(`${method}${path}_responses`)
    const controlId = `${regionId}_select`

    let showExpected = this.state.activeTab!="current" || !tryItOutResponse
    let showCurrent = tryItOutResponse && this.state.activeTab==="current"
    return (
      <div className="responses-wrapper">        
        <div className="opblock-section-header">
          <h4>{ showCurrent? "Current Response":"Expected Responses"}</h4>
          {showCurrent ? <button className="btn"  data-name="expected" onClick={ this.activeTab }>Expected Responses</button>:null}
          {tryItOutResponse && this.state.activeTab!="current" ? <button className="btn" data-name="current" onClick={ this.activeTab }>Current Response</button> : null}          
        </div>      
        <div className="opblock-saperater"/>        
       
          <div className="accept-header">
          <div className="accept-header-right">
          <span>Accept : </span>              
              <ContentType value={producesValue}
                         ariaControls={regionId}
                         ariaLabel="Response content type"
                         className="execute-content-type"
                         contentTypes={produces}
                         controlId={controlId}
                         onChange={this.onChangeProducesWrapper} />
        </div></div>
        {
          !tryItOutResponse || !(this.state.activeTab==="current") ? null
                            : <div className="responses-inner">
                                <LiveResponse response={ tryItOutResponse }
                                              getComponent={ getComponent }
                                              getConfigs={ getConfigs }
                                              specSelectors={ specSelectors }
                                              path={ this.props.path }
                                              method={ this.props.method }
                                              displayRequestDuration={ displayRequestDuration }                                                
                                              security={security}
                                              authActions={authActions}
                                              authSelectors={authSelectors} />
                              </div>

        }
        {showExpected?
        <div className="responses-inner">
          <div className="responses-table">
              {
                responses.entrySeq().map( ([code, response]) => {

                  let className = tryItOutResponse && tryItOutResponse.get("status") == code ? "response_current" : ""
                  return (
                    <Response key={ code }
                              path={path}
                              method={method}
                              specPath={specPath && specPath.push(code)}
                              isDefault={defaultCode === code}
                              fn={fn}
                              className={ className }
                              code={ code }
                              response={ response }
                              specSelectors={ specSelectors }
                              controlsAcceptHeader={response === acceptControllingResponse}
                              onContentTypeChange={this.onResponseContentTypeChange}
                              contentType={ producesValue }
                              getConfigs={ getConfigs }
                              activeExamplesKey={oas3Selectors && oas3Selectors.activeExamplesMember(
                                path,
                                method,
                                "responses",
                                code
                              )}
                              oas3Actions={oas3Actions}
                              getComponent={ getComponent }
                              produces={producesValue} />
                    )
                }).toArray()
              }
        </div>
          {errorCodeMessage && <p className="response-link"><i type="button" dangerouslySetInnerHTML={{ __html: errorCodeMessage }}></i></p>}
        </div>:null}
      </div>
    )
  }
}
