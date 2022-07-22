import React, { Component } from "react"
import PropTypes from "prop-types"
import { Map, List } from "immutable"
import ImPropTypes from "react-immutable-proptypes"

export default class Parameters extends Component {

  constructor(props) {
    super(props)
    this.state = {
      mode: "Definition",
      callbackVisible: false,
      parametersVisible: true,
    }
  }

  static propTypes = {
    parameters: ImPropTypes.list.isRequired,
    operation: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    fn: PropTypes.object.isRequired,
    tryItOutEnabled: PropTypes.bool,
    allowTryItOut: PropTypes.bool,
    onTryoutClick: PropTypes.func,
    onCancelClick: PropTypes.func,
    onChangeKey: PropTypes.array,
    pathMethod: PropTypes.array.isRequired,
    getConfigs: PropTypes.func.isRequired,
    specPath: ImPropTypes.list.isRequired,
    path, method, onExecute, onClearClick,tag
  }


  static defaultProps = {
    onTryoutClick: Function.prototype,
    onCancelClick: Function.prototype,
    tryItOutEnabled: false,
    allowTryItOut: true,
    onChangeKey: [],
    specPath: [],
  }

  setMode = (mode) => {
    this.setState({
      mode: mode
    })
  }

  onChange = (param, value, isXml) => {
    let {
      specActions: { changeParamByIdentity },
      onChangeKey,
    } = this.props

    changeParamByIdentity(onChangeKey, param, value, isXml)
  }

  onChangeConsumesWrapper = (val) => {
    let {
      specActions: { changeConsumesValue },
      onChangeKey,
    } = this.props
    
    changeConsumesValue(onChangeKey, val)
    this.props.specActions.changeProducesValue([this.props.path, this.props.method], val)

  }

  toggleTab = (tab) => {
    if (tab === "parameters") {
      return this.setState({
        parametersVisible: true,
        callbackVisible: false,
      })
    } else if (tab === "callbacks") {
      return this.setState({
        callbackVisible: true,
        parametersVisible: false,
      })
    }
  }

  onChangeMediaType = ({ value, pathMethod }) => {
    let { specActions, oas3Selectors, oas3Actions } = this.props
    const userHasEditedBody = oas3Selectors.hasUserEditedBody(...pathMethod)
    const shouldRetainRequestBodyValue = oas3Selectors.shouldRetainRequestBodyValue(...pathMethod)
    oas3Actions.setRequestContentType({ value, pathMethod })
    oas3Actions.initRequestBodyValidateError({ pathMethod })
    if (!userHasEditedBody) {
      if(!shouldRetainRequestBodyValue) {
        oas3Actions.setRequestBodyValue({ value: undefined, pathMethod })
      }
      specActions.clearResponse(...pathMethod)
      specActions.clearRequest(...pathMethod)
      specActions.clearValidateParams(pathMethod)
    }
  }

  render() {

    let {
      onTryoutClick,
      parameters,
      allowTryItOut,
      tryItOutEnabled,
      specPath,
      fn,
      getComponent,
      getConfigs,
      specSelectors,
      specActions,
      pathMethod,
      oas3Actions,
      oas3Selectors,
      operation, path, method, onExecute, onClearClick,tag,authSelectors
    } = this.props

    const ParameterRow = getComponent("parameterRow")
    const TryItOutButton = getComponent("TryItOutButton")
    const Execute = getComponent("execute")
    const CodeSection = getComponent("CodeSection")
    const ContentType = getComponent("contentType")
    const Callbacks = getComponent("Callbacks", true)
    const RequestBody = getComponent("RequestBody", true)
    const Clear = getComponent("clear")
    
    const clientCode = getConfigs().clientCode
    const isExecute = tryItOutEnabled && allowTryItOut
    const isOAS3 = specSelectors.isOAS3()


    const requestBody = operation.get("requestBody")
    const groupedParametersArr = Object.values(parameters
      .reduce((acc, x) => {
        const key = x.get("in")
        acc[key] ??= []
        acc[key].push(x)
        return acc
      }, {}))
      .reduce((acc, x) => acc.concat(x), [])

    const retainRequestBodyValueFlagForOperation = (f) => oas3Actions.setRetainRequestBodyValueFlag({ value: f, pathMethod })
    
    return (
      <div className="opblock-section">
        <div className="opblock-section-header">
          <h4 className="opblock-title">Request</h4>
          { this.state.mode === "Definition" && tryItOutEnabled ? 
            <Execute
              operation={ operation }
              specActions={ specActions }
              specSelectors={ specSelectors }
              oas3Selectors={ oas3Selectors }
              oas3Actions={ oas3Actions }
              path={ path }
              method={ method }
              onExecute={ onExecute }/>
            : null}

        {clientCode  && clientCode.constructor === Array&& clientCode.length > 0 && !tryItOutEnabled && this.state.mode === "Definition" &&
              <button className="btn client-code" onClick={this.setMode.bind(this,"Code")}>Client Code</button>
          }
          {getConfigs().tryout &&  this.state.mode === "Definition" && allowTryItOut ? (
            <TryItOutButton
              isOAS3={specSelectors.isOAS3()}
              hasUserEditedBody={oas3Selectors.hasUserEditedBody(...pathMethod)}
              enabled={tryItOutEnabled}
              onCancelClick={this.props.onCancelClick}
              onTryoutClick={onTryoutClick}
              onResetClick={() => oas3Actions.setRequestBodyValue({ value: undefined, pathMethod })}/>
          ) : null}

          {!(this.state.mode === "Definition") &&
              <button className="btn try-out__btn" onClick={this.setMode.bind(this,"Definition")}>Back to Definition</button>
          }
          
        </div>
        <div className="opblock-saperater" />
        {this.state.mode === "Definition" && this.state.parametersVisible ? <div className="parameters-container">
          <div className="table-container">
              { !!groupedParametersArr.length &&
                groupedParametersArr.map((parameter, i) => (
                  <ParameterRow
                    fn={fn}
                    specPath={specPath.push(i.toString())}
                    getComponent={getComponent}
                    getConfigs={getConfigs}
                    rawParam={parameter}
                    param={specSelectors.parameterWithMetaByIdentity(pathMethod, parameter)}
                    key={`${parameter.get("in")}.${parameter.get("name")}`}
                    onChange={this.onChange}
                    onChangeConsumes={this.onChangeConsumesWrapper}
                    specSelectors={specSelectors}
                    specActions={specActions}
                    oas3Actions={oas3Actions}
                    oas3Selectors={oas3Selectors}
                    pathMethod={pathMethod}
                    isExecute={isExecute} />
                ))
              }
              {this.state.callbackVisible ? <div className="callbacks-container opblock-description-wrapper">
                <Callbacks
                  callbacks={Map(operation.get("callbacks"))}
                  specPath={specPath.slice(0, -1).push("callbacks")}
                />
              </div> : null}
              {
                isOAS3 && requestBody && this.state.parametersVisible &&
                <div className="opblock-section opblock-section-request-body">
                  <div className="opblock-section-header">
                    <h4 className={`opblock-title parameter__name ${requestBody.get("required") && "required"}`}>Body</h4>
                    <label>
                      <ContentType
                        value={oas3Selectors.requestContentType(...pathMethod)}
                        contentTypes={requestBody.get("content", List()).keySeq()}
                        onChange={(value) => {
                          this.onChangeMediaType({ value, pathMethod })
                        }}
                        className="body-param-content-type" 
                        ariaLabel="Request content type" />
                    </label>
                  </div>
                  <div className="opblock-description-wrapper">
                    <RequestBody
                      setRetainRequestBodyValueFlag={retainRequestBodyValueFlagForOperation}
                      userHasEditedBody={oas3Selectors.hasUserEditedBody(...pathMethod)}
                      specPath={specPath.slice(0, -1).push("requestBody")}
                      requestBody={requestBody}
                      requestBodyValue={oas3Selectors.requestBodyValue(...pathMethod)}
                      requestBodyInclusionSetting={oas3Selectors.requestBodyInclusionSetting(...pathMethod)}
                      requestBodyErrors={oas3Selectors.requestBodyErrors(...pathMethod)}
                      isExecute={isExecute}
                      getConfigs={getConfigs}
                      activeExamplesKey={oas3Selectors.activeExamplesMember(
                        ...pathMethod,
                        "requestBody",
                        "requestBody", // RBs are currently not stored per-mediaType
                      )}
                      updateActiveExamplesKey={key => {
                        this.props.oas3Actions.setActiveExamplesMember({
                          name: key,
                          pathMethod: this.props.pathMethod,
                          contextType: "requestBody",
                          contextName: "requestBody", // RBs are currently not stored per-mediaType
                        })
                      }
                      }
                      onChange={(value, path) => {
                        if (path) {
                          const lastValue = oas3Selectors.requestBodyValue(...pathMethod)
                          const usableValue = Map.isMap(lastValue) ? lastValue : Map()
                          return oas3Actions.setRequestBodyValue({
                            pathMethod,
                            value: usableValue.setIn(path, value),
                          })
                        }
                        oas3Actions.setRequestBodyValue({ value, pathMethod })
                      }}
                      onChangeIncludeEmpty={(name, value) => {
                        oas3Actions.setRequestBodyInclusion({
                          pathMethod,
                          value,
                          name,
                        })
                      }}
                      contentType={oas3Selectors.requestContentType(...pathMethod)} />
                  </div>
                </div>
              }
              <div className="tryout-bottom">{tryItOutEnabled ?               
                <Execute
                  operation={ operation }
                  specActions={ specActions }
                  specSelectors={ specSelectors }
                  oas3Selectors={ oas3Selectors }
                  oas3Actions={ oas3Actions }
                  path={ path }
                  method={ method }
                  onExecute={ onExecute }/> : null}
                  {getConfigs().tryout && <button className="btn execute-fusia" onClick={onClearClick}>Reset</button>}                            
              </div>
          </div>
        </div> : null}

        { (this.state.mode === "Code") && <CodeSection 
                  fn={fn}
                  getComponent={getComponent}
                  operation={operation}
                  parameters={parameters}
                  specActions={specActions}
                  specSelectors={specSelectors}
                  path={path}
                  method={method}
                  tag={tag}
                  authSelectors={authSelectors}
                  clientCode={clientCode}/>}
      </div>
    )
  }
}
