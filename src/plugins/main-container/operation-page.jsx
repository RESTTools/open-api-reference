import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import { getList } from "core/utils";
import * as CustomPropTypes from "core/proptypes";
import UseCases from "./use-cases";

//import "less/opblock"

function createMarkup(htmlFile) {
  return { __html: htmlFile };
}

export default class OperationPage extends PureComponent {
  static propTypes = {
    specPath: ImPropTypes.list.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string,
    operation: PropTypes.object.isRequired,
    showSummary: PropTypes.bool,

    isShownKey: CustomPropTypes.arrayOrString.isRequired,
    jumpToKey: CustomPropTypes.arrayOrString.isRequired,

    allowTryItOut: PropTypes.bool,

    displayOperationId: PropTypes.bool,
    displayRequestDuration: PropTypes.bool,

    response: PropTypes.object,
    request: PropTypes.object,

    getComponent: PropTypes.func.isRequired,
    authActions: PropTypes.object,
    authSelectors: PropTypes.object,
    specActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    oas3Selectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    fn: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired,
    
    isAuthorized: PropTypes.bool
  };

  static defaultProps = {
    showSummary: true,
    response: null,
    allowTryItOut: true,
    displayOperationId: false,
    displayRequestDuration: false
  };

  constructor(props, context) {
    super(props, context);
    this.state = {
      tryItOutEnabled: false,
      showUseCases: false
    };
    let { specActions, path, method } = this.props;
    //NOCLEAR   specActions.clearRequest( path, method )
    //NOCLEAR  specActions.clearResponse( path, method )
    this.toggleUseCases = this.toggleUseCases.bind(this);

    // this.codeContent = {
    //   method: method,
    //   path:path,
    //   baseUrl:"baseurl",
    //   body:"{\"body\"}",
    //   classname : className+"Api",
    //   operationId: operationId,
    //   returnType: "Object",
    //   allParams: []
    // }
  }

  onClearClick = () => {
    let { specActions, path, method } = this.props;
    specActions.clearRequest(path, method);
    specActions.clearResponse(path, method);
    specActions.clearValidateParams([path, method]);
    //NOCLEAR   this.setState({ tryItOutEnabled: true })
  };

  toggleUseCases() {
    this.setState({
      tryItOutEnabled: this.state.tryItOutEnabled,
      showUseCases: !this.state.showUseCases
    });
  }

  componentWillReceiveProps(nextProps) {
    const defaultContentType = "application/json";
    let { specActions, path, method, operation } = nextProps;
    let producesValue = operation.get("produces_value");
    let produces = operation.get("produces");
    let consumes = operation.get("consumes");
    let consumesValue = operation.get("consumes_value");

    if (nextProps.response !== this.props.response) {
      this.setState({ executeInProgress: false });
    }

    if (producesValue === undefined) {
      producesValue =
        produces && produces.size ? produces.first() : defaultContentType;
      // specActions.changeProducesValue([path, method], producesValue);
    }

    if (consumesValue === undefined) {
      consumesValue =
        consumes && consumes.size ? consumes.first() : defaultContentType;
      // specActions.changeConsumesValue([path, method], consumesValue);
    }
  }

  toggleShown = () => {
    let { layoutActions, isShownKey } = this.props;
    layoutActions.show(isShownKey, !this.isShown());
  };

  isShown = () => {
    let { layoutSelectors, isShownKey, getConfigs } = this.props;
    let { docExpansion } = getConfigs();

    return layoutSelectors.isShown(isShownKey, docExpansion === "full"); // Here is where we set the default
  };

  onTryoutClick = () => {
    let { specActions, path, method } = this.props;
    this.setState({ tryItOutEnabled: !this.state.tryItOutEnabled });
  };

  onCancelClick = () => {
    let { specActions, path, method } = this.props;
    //NOCLEAR  specActions.clearRequest( path, method )
    //NOCLEAR  specActions.clearResponse( path, method )
    //NOCLEAR  specActions.clearValidateParams([path, method])
    this.setState({ tryItOutEnabled: !this.state.tryItOutEnabled });
  };

  onExecute = () => {
    this.setState({ executeInProgress: true });
  };

  render() {
    let {
      isShownKey,
      jumpToKey,
      path,
      method,
      operation,
      showSummary,
      response,
      request,
      allowTryItOut,
      displayOperationId,
      displayRequestDuration,
      fn,
      getComponent,
      specActions,
      specSelectors,
      authActions,
      authSelectors,
      getConfigs,
      oas3Actions,      
      oas3Selectors,
      tag,      
      specPath
    } = this.props;

    let useCases = operation.get("useCases");
    let fitUseCases = operation.get("fitUseCases");
    let summary = operation.get("summary");
    let description = operation.get("description");
    let deprecated = operation.get("deprecated");
    let externalDocs = operation.get("externalDocs");
    let responses = operation.get("responses");
    let security = operation.get("security") || specSelectors.security();
    let produces = operation.get("produces");
    let schemes = operation.get("schemes");
    let parameters = getList(operation, ["parameters"]);
    let operationId = operation.get("__originalOperationId");
    let operationScheme = specSelectors.operationScheme(path, method);

    const Responses = getComponent("responses");
    const Parameters = getComponent("parameters");
    // const Execute = getComponent("execute")
    const Clear = getComponent("clear");
    const AuthorizeOperationBtn = getComponent("authorizeOperationBtn");
    const JumpToPath = getComponent("JumpToPath", true);
    const Markdown = getComponent("Markdown");
    const Schemes = getComponent("schemes");

    const { deepLinking } = getConfigs();

    const isDeepLinkingEnabled = deepLinking && deepLinking !== "false";
    // Merge in Live Response
    if (responses && response && response.size > 0) {
      let notDocumented = !responses.get(String(response.get("status")));
      response = response.set("notDocumented", notDocumented);
    }

    let { tryItOutEnabled } = this.state;
    let shown = window.location.href.endsWith(
      `?${isShownKey[1]}/${isShownKey[2]}`
    ); //this.isShown()
    let onChangeKey = [path, method]; // Used to add values to _this_ operation ( indexed by path and method )

    return (
      <div
        className={
          deprecated
            ? "opblock opblock-deprecated opblock-hidden opblock-show"
            : shown
              ? `opblock opblock-${method} opblock-show `
              : `opblock opblock-hidden opblock-show opblock-${method}`
        }
        id={isShownKey.join("-")}
      >
        <div className="opblock-summary">{summary}</div>
        {description ? (
          description.startsWith("LINK@") ? (
            <div
              dangerouslySetInnerHTML={createMarkup(
                window[description.replace("LINK@", "")]
              )}
            />
          ) : (
            <div className="opblock-description">
              <Markdown source={description} />
            </div>
          )
        ) : null}

        <UseCases
          commonUseCases={useCases}
          fitUseCases={fitUseCases}
          getComponent={getComponent}
          pathMethod={[path, method]}
          path={path}
          method={method}
        />

        {method && (
          <div
            className={`opblock-summary opblock-summary-${method} opblock-method`}
          >
            <span className="opblock-summary-method">
              {method.toUpperCase()}
            </span>
            <span
              className={
                deprecated
                  ? "opblock-summary-path__deprecated"
                  : "opblock-summary-path"
              }
            >
              <div className="nostyle">
                <span>{path}</span>
              </div>
              <JumpToPath path={jumpToKey} />
            </span>

            {displayOperationId && operationId ? (
              <span className="opblock-summary-operation-id">
                {operationId}
              </span>
            ) : null}

            {!security || !security.count() ? null : (
              <AuthorizeOperationBtn
              isAuthorized={authSelectors.isAuthorized(security)}
              onClick={() => {
                const applicableDefinitions = authSelectors.definitionsForRequirements(security)
                authActions.showDefinitions(applicableDefinitions)
              }}
            />
            )}
          </div>
        )}
        {deprecated && (
          <h4 className="opblock-title_normal"> Warning: Deprecated</h4>
        )}

        {externalDocs && externalDocs.get("url") ? (
          <div className="opblock-external-docs-wrapper">
            <h4 className="opblock-title_normal">Find more details</h4>
            <div className="opblock-external-docs">
              <span className="opblock-external-docs__description">
                <Markdown source={externalDocs.get("description")} />
              </span>
              <a
                className="opblock-external-docs__link"
                href={externalDocs.get("url")}
              >
                {externalDocs.get("url")}
              </a>
            </div>
          </div>
        ) : null}

        {/* {
          this.state.showUseCases ? <div className="dialog-ux">
            <div className="backdrop-ux"></div>
            <div className="modal-ux">
              <div className="modal-dialog-ux">
                <div className="modal-ux-inner">
                  <div className="modal-ux-header">
                    <h3>Common use cases</h3>
                    <button type="button" className="close-modal" onClick={this.toggleUseCases}>
                      <svg width="20" height="20">
                        <use href="#close" xlinkHref="#close" />
                      </svg>
                    </button>
                  </div>
                  <div className="modal-ux-content">


                    <div dangerouslySetInnerHTML={{__html: useCases}} />
                  </div>
                </div>
              </div>
            </div>
          </div> : null
        } */}
        <div
          className={
            !(!tryItOutEnabled || (tryItOutEnabled && response))
              ? "opblock-body tryout-mode"
              : "opblock-body"
          }
        >
          {method && (
            <div>
              <section className="section-perameter">
                                <Parameters
                  parameters={parameters}
                  specPath={specPath.push("parameters")}
                  operation={operation}
                  onChangeKey={onChangeKey}
                  onTryoutClick={this.onTryoutClick}
                  onCancelClick={this.onCancelClick}
                  tryItOutEnabled = { tryItOutEnabled }
                  allowTryItOut={allowTryItOut}

                  fn={fn}
                  getComponent={ getComponent }
                  specActions={ specActions }
                  specSelectors={ specSelectors }
                  pathMethod={ [path, method] }
                  getConfigs={ getConfigs }
                  oas3Actions={ oas3Actions }
                  oas3Selectors={ oas3Selectors }
                  
                  onExecute={this.onExecute}
                  onClearClick={this.onClearClick}   
                  authSelectors={authSelectors}        
                  path={path}
                  method={method}
                  tag={tag}

                />
                {/* <Parameters
                  parameters={parameters}
                  operation={operation}
                  onChangeKey={onChangeKey}
                  onTryoutClick={this.onTryoutClick}
                  onCancelClick={this.onCancelClick}
                  tryItOutEnabled={tryItOutEnabled}
                  allowTryItOut={allowTryItOut}
                  fn={fn}
                  getComponent={getComponent}
                  specActions={specActions}
                  specSelectors={specSelectors}
                  pathMethod={[path, method]}
                  getConfigs={getConfigs}
                  path={path}
                  method={method}
                  onExecute={this.onExecute}
                  onClearClick={this.onClearClick}
                  codeContent={this.codeContent}
                  tag={tag}
                /> */}

                {!tryItOutEnabled || !allowTryItOut ? null : schemes &&
                schemes.size ? (
                  <div className="opblock-schemes">
                    <Schemes
                      schemes={schemes}
                      path={path}
                      method={method}
                      specActions={specActions}
                      currentScheme={operationScheme}
                    />
                  </div>
                ) : null}

                {/* <div className={(!tryItOutEnabled || !response || !allowTryItOut) ? "execute-wrapper" : "btn-group"}>
                  {!tryItOutEnabled || !allowTryItOut ? null :

                    <Execute
                      getComponent={getComponent}
                      operation={operation}
                      specActions={specActions}
                      specSelectors={specSelectors}
                      path={path}
                      method={method}
                      onExecute={this.onExecute} />
                  }

                  {(!tryItOutEnabled || !response || !allowTryItOut) ? null :
                    <Clear
                      onClick={this.onClearClick}
                      specActions={specActions}
                      path={path}
                      method={method} />
                  }
                </div> */}
              </section>
              <section className="section-response">
                {this.state.executeInProgress ? (
                  <div className="loading-container">
                    <div className="loading" />
                  </div>
                ) : null}

                {!responses && true? null : (
                  
                  // <Responses
                  //   onChangeKey={onChangeKey}
                  //   responses={responses}
                  //   request={request}
                  //   tryItOutResponse={response}
                  //   getComponent={getComponent}
                  //   getConfigs={getConfigs}
                  //   specSelectors={specSelectors}
                  //   oas3Actions={oas3Actions}
                  //   specActions={specActions}
                  //   produces={produces}
                  //   producesValue={operation.get("produces_value")}
                  //   path={path}
                  //   method={method}
                  //   displayRequestDuration={displayRequestDuration}
                  //   executeInProgress={this.state.executeInProgress}
                  //   security={security}
                  //   authActions={authActions}
                  //   authSelectors={authSelectors}
                  //   fn={fn}
                  // />
                  
                 <Responses
                    responses={ responses }
                    request={ request }
                    tryItOutResponse={ response }
                    getComponent={ getComponent }
                    getConfigs={ getConfigs }
                    specSelectors={ specSelectors }
                    oas3Actions={oas3Actions}
                    oas3Selectors={oas3Selectors}
                    specActions={ specActions }
                    produces={specSelectors.producesOptionsFor([path, method]) }
                    producesValue={ specSelectors.currentProducesFor([path, method]) }
                    specPath={specPath.push("responses")}
                    path={ path }
                    method={ method }
                    displayRequestDuration={ displayRequestDuration }
                    fn={fn}
                    security={security}
                    authActions={authActions}
                    authSelectors={authSelectors}
                    />
              
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    );
  }
}
