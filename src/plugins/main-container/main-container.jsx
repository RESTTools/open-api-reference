import React from "react";
import PropTypes from "prop-types";
import { helpers } from "swagger-client";
import { createDeepLinkPath } from "core/utils";
import Im from "immutable"
import OperationPage from "./operation-page";

const { opId } = helpers;

function createMarkup(htmlFile) {
  return { __html: htmlFile };
}

export default class MainContainer extends React.Component {
  onscroll() {
    var mainContainer = document.getElementById("mainContainer");
    if (window.pageYOffset >= 64) {
      var menuBar = document.getElementById("menuBar");
      mainContainer.classList.add("main-container-sticky");
      mainContainer.style.paddingLeft = menuBar.offsetWidth + "px";
    } else {
      mainContainer.classList.remove("main-container-sticky");;
      mainContainer.style.paddingLeft = "0";
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      searchValue: "",
      searching: false,
      searchPlaceHolder: "Search",
      toggleNav: false,
      toggleMenu: false,
      collapseBack: false,
      selectedGroup: ""
    };

    this.handleSearch = this.handleSearch.bind(this);
    this.handleSearchFocus = this.handleSearchFocus.bind(this);
    this.handleSearchBlur = this.handleSearchBlur.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    window.onscroll = this.onscroll;
  }

  handleGroupFocus(groupNameId, event) {
    this.setState({ selectedGroup: groupNameId });
    setTimeout(() => {
      var groupElement = document.getElementById(groupNameId);
      if(groupElement){
        var rect = groupElement.getBoundingClientRect();
        var popup = groupElement.getElementsByClassName("tab-group-sub-items")[0];
        if(popup){
          popup.style.left = rect.right + "px";
          if (window.innerHeight > popup.offsetHeight + rect.top) {
            popup.style.top = rect.top + "px";
          } else {
            popup.style.bottom = "2px";
          }
          if(popup.offsetHeight>window.innerHeight){            
            popup.style.overflowY = "auto";    
            popup.style.overflowX = "hidden";
            popup.style.height = "100vh";
          }
          popup.classList.add("tab-group-sub-items-full");
       }
      }
    },10);
  }

  handleGroupBlur(groupNameId, event) {
    if(groupNameId==this.state.selectedGroup){      
     this.setState({ selectedGroup: "" });
    }
  }

  handleSearch(event) {
    if (event.target.value.length > 2) {
      this.setState({
        searchValue: event.target.value,
        searching: true,
        searchPlaceHolder: ""
      });
    } else {
      this.setState({
        searchValue: event.target.value,
        searching: false,
        searchPlaceHolder: ""
      });
    }
  }

  handleSearchFocus(event) {
    this.setState({
      searchValue: this.state.searchValue,
      searching: this.state.searching,
      searchPlaceHolder: ""
    });
  }

  handleSearchBlur(event) {
    var active = document.getElementById("sideHeader");
    if (active) {
      active.classList.remove("show-hide-search");
    }
    var collapseBackAfterSearch = this.state.collapseBack;
    if (collapseBackAfterSearch) {
      this.setState({
        collapseBack: false,
        searchValue: "",
        searching: false,
        searchPlaceHolder: "Search",
        toggleNav: !this.state.toggleNav
      });
    } else {
      this.setState({
        searchValue: "",
        searching: false,
        searchPlaceHolder: "Search"
      });
    }
  }

  showSubMenu(id, key,group) {
  //   sidebar select first
    var selected = document.getElementsByClassName("tab-black-open")[0];
    if (selected) {
      selected.classList.remove("tab-black-open");
    }
    var active = document.getElementById(id);
    if (active && active!=selected) {
      active.classList.add("tab-black-open");
    }
    this.setState({
      selectedGroup: group ? group : ""
    });

  }

  showContent(key, selfId, activeId, pageTitle) {
    this.setState({
      searchValue: this.state.searchValue,
      searching: this.state.searching,
      searchPlaceHolder: this.state.searchPlaceHolder,
      toggleMenu: false,
      selectedGroup: ""
    });
    if(pageTitle){
      document.title = pageTitle;
    }

    if (key == "info") {
      history.replaceState({}, key, `?${key}`);
    } else {
      var url = `?${key[1]}/${key[2]}`;
      history.replaceState({}, `${key[2]}`, url);
    }
    // window scroll
    if (window.pageYOffset >= 64) {
      window.scrollTo(0, 64);
    }
  }

  toggleMenubar() {
    this.setState({ toggleNav: !this.state.toggleNav });

    setTimeout(() => {
      this.onscroll();
    }, 0);
  }

  toggleSearch() {
    var active = document.getElementById("sideHeader");
    if (active && !active.classList.contains("show-hide-search")) {
      this.setState({
        searchValue: "",
        searching: false,
        searchPlaceHolder: "Search",
        toggleNav: window.innerWidth < 1025,
        collapseBack:
          (this.state.toggleNav && window.innerWidth > 1024) ||
          (!this.state.toggleNav && window.innerWidth < 1025)
      });
      active.classList.add("show-hide-search");
      setTimeout(() => {
        var searchValue = document.getElementById("searchValue");
        if (searchValue) {
          searchValue.focus();
        }
      }, 0);
    }
  }

  static propTypes = {    
    specSelectors: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    oas3Actions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    oas3Selectors: PropTypes.func.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired,
    fn: PropTypes.func.isRequired
  };

  render() {
    let {
      specSelectors,
      specActions,
      oas3Actions,      
      oas3Selectors,
      getComponent,
      layoutSelectors,
      layoutActions,
      authActions,
      authSelectors,
      getConfigs,
      fn,
      exicuting
    } = this.props;

    let taggedOps = specSelectors.taggedOperations();
    const footer = specSelectors.footer()

    let info = specSelectors.info();

    let url = specSelectors.url();
    let basePath = specSelectors.basePath();
    let host = specSelectors.host();
    let externalDocs = specSelectors.externalDocs();
    let OperationContainer = getComponent("OperationContainer",true );

    let showSummary = layoutSelectors.showSummary();
    let {
      docExpansion,
      displayOperationId,
      displayRequestDuration,
      maxDisplayedTags,
      deepLinking
    } = getConfigs();


    let filter = layoutSelectors.currentFilter();

    let somethingShown = false;
    if (filter) {
      if (filter !== true) {
        taggedOps = taggedOps.filter((tagObj, tag) => {
          return tag.indexOf(filter) !== -1;
        });
      }
    }

    if (maxDisplayedTags && !isNaN(maxDisplayedTags) && maxDisplayedTags >= 0) {
      taggedOps = taggedOps.slice(0, maxDisplayedTags);
    }

    return (
      <div id="mainContainer" className="main-container">
        <aside className="main-menu e-main-menu" id="menuBar">
          <div
            className={
              this.state.toggleNav
                ? "tabs-menu-holder collapsed"
                : "tabs-menu-holder"
            }
          >
            <div className="toolbox">
              <table id="sideHeader" className="side-header">
                <tbody>
                  <tr>
                    <td
                      title="Search"
                      className="icon-col"
                      onMouseDown={this.toggleSearch}
                    >
                      <i className="fa fa-search search-icon" />
                    </td>
                    <td id="searchCol" className="search-col">
                      <section className="search-section">
                        <div className="search-tab">
                          <div
                            className={
                              this.state.searching
                                ? "black-search-box black-searching"
                                : "black-search-box"
                            }
                          >
                            <input
                              id="searchValue"
                              type="search"
                              value={this.state.searchValue}
                              onChange={this.handleSearch}
                              placeholder={this.state.searchPlaceHolder}
                              onFocus={this.handleSearchFocus}
                              onBlur={this.handleSearchBlur}
                            ></input>
                          </div>
                          {this.state.searching && (
                            <ul className="search-list">
                              {taggedOps.map((tagObj, tag) => {
                                let operations = tagObj.get("operations");
                                let tagDescription = tagObj.getIn(
                                  ["tagDetails", "description"],
                                  null
                                );
                                let isShownKey = [
                                  "operations-tag",
                                  createDeepLinkPath(tag)
                                ];
                                let showTag = layoutSelectors.isShown(
                                  isShownKey
                                );
                                return operations
                                  .map(op => {
                                    const path = op.get("path", "");
                                    const method = op.get("method", "");
                                    const operationId =
                                      op.getIn(["operation", "operationId"]) ||
                                      op.getIn([
                                        "operation",
                                        "__originalOperationId"
                                      ]) ||
                                      opId(op.get("operation"), path, method) ||
                                      op.get("id");

                                    const isShownKey = [
                                      "operations",
                                      createDeepLinkPath(tag),
                                      createDeepLinkPath(operationId)
                                    ];
                                    let showOp = layoutSelectors.isShown(
                                      isShownKey
                                    );
                                    if (showOp) {
                                      somethingShown = true;
                                    }
                                    const displayName = op.getIn([
                                      "operation",
                                      "displayName"
                                    ]);
                                    var searchString =
                                      isShownKey[1] + " " + isShownKey[2];
                                    if (displayName) {
                                      searchString =
                                        searchString + " " + displayName;
                                    }
                                    return (
                                      searchString
                                        .toLowerCase()
                                        .includes(
                                          this.state.searchValue.toLowerCase()
                                        ) && (
                                        <li
                                          key={"search-" + operationId}
                                          name={"search-" + operationId}
                                        >
                                          <a
                                            onMouseDown={this.showContent.bind(
                                              this,
                                              isShownKey,
                                              "sidebar-" + isShownKey.join("-"),
                                              "sidebar-" + tag,
                                              displayName ? displayName : operationId
                                            )}
                                            id={
                                              "sidebar-" + isShownKey.join("-")
                                            }
                                          >
                                            {displayName && <i>{tag}: </i>}
                                            {displayName
                                              ? displayName
                                              : operationId}
                                          </a>
                                        </li>
                                      )
                                    );
                                  })
                                  .toArray();
                              })}
                            </ul>
                          )}
                        </div>
                      </section>
                    </td>

                    <td className="collapse-col">
                      <div className="sidebar-controller">
                        <a
                          className="tabs-expand-btn"
                          onClick={this.toggleMenubar.bind(this)}
                        >
                          <i
                            className={
                              !this.state.toggleNav
                                ? "fa fa-angle-left"
                                : "fa fa-angle-left fa-rotate-180"
                            }
                            aria-hidden="true"
                          ></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="menu-tabs-wrapper" id="menuTabsWrapper" > 
              <div
                className={
                  (window.location.href.endsWith("?info") || window.location.href.indexOf('?') < 0)
                    ? "menu-tab hasNoSubItems active"
                    : "menu-tab hasNoSubItems"
                }
                onClick={this.showContent.bind(
                  this,
                  "info",
                  "sidebar-info",
                  "sidebar-info",
                  "Overview"
                )}
              >
                <a className="tab-icon">
                  <i className="fa fa-home" aria-hidden="true"></i>
                  <span className="tab-title">Overview</span>
                </a>
              </div>

              {taggedOps
                .map((tagObj, tag) => {
                  let operations = tagObj.get("operations");
                  let operationsMap = tagObj.get("operationsMap");

                  let icon = tagObj.getIn(["tagDetails", "icon"], null);
                  let tagName = tagObj.getIn(
                    ["tagDetails", "displayName"],
                    null
                  );
                  let order = tagObj.getIn(["tagDetails", "order"], null);

                  let operationProcess = op => {
                    const path = op.get("path", "");
                    const method = op.get("method", "");
                    const operationId =
                      op.getIn(["operation", "operationId"]) ||
                      op.getIn(["operation", "__originalOperationId"]) ||
                      opId(op.get("operation"), path, method) ||
                      op.get("id");
                    const isShownKey = [
                      "operations",
                      createDeepLinkPath(tag),
                      createDeepLinkPath(operationId)
                    ];
                    let showOp = window.location.href.endsWith(
                      `?${isShownKey[1]}/${isShownKey[2]}`
                    );

                    let showTitle = "";
                    let displayName = op.getIn(["operation", "displayName"]);
                    if (!displayName) {
                      displayName = operationId;
                    }
                    if (showOp) {
                      somethingShown = true;
                    }
                    const showSaperator =
                      order &&
                      order.indexOf &&
                      order.get(order.indexOf(displayName) + 1) === "---";
                    return (
                      <li
                        className={showSaperator ? "saperated-operation" : null}
                        key={"operation-" + isShownKey.join("-")}
                        onClick={this.showContent.bind(
                          this,
                          isShownKey,
                          "sidebar-" + isShownKey.join("-"),
                          "sidebar-" + tag,
                          displayName ? displayName : operationId
                        )}
                      >
                        <a
                          title={showTitle ? showTitle : null}
                          id={"sidebar-" + isShownKey.join("-")}
                          className={showOp ? "active" : null}
                        >
                          {displayName}
                        </a>
                      </li>
                    );
                  };

                  let groupProcess = (operations, groupName) => {
                    let displayName = null;
                    let groupOperations = operations.filter(op => {
                      const path = op.get("path", "");
                      const method = op.get("method", "");
                      const operationId =
                        op.getIn(["operation", "operationId"]) ||
                        op.getIn(["operation", "__originalOperationId"]) ||
                        opId(op.get("operation"), path, method) ||
                        op.get("id");
                      const isShownKey = [
                        "operations",
                        createDeepLinkPath(tag),
                        createDeepLinkPath(operationId)
                      ];
                      let selected = window.location.href.endsWith(
                        `/${isShownKey[2]}`
                      );
                      if (selected) {
                        displayName = op.getIn(["operation", "displayName"]);
                        if (!displayName) {
                          displayName = operationId;
                        }
                        somethingShown = true;
                        return true;
                      }
                      return true;
                    });

                    
                  var op = operations.get(0);
                  var isShownKey;
                  if (op) {
                    const operationId =
                      op.getIn(["operation", "operationId"]) ||
                      op.getIn(["operation", "__originalOperationId"]) ||
                      opId(op.get("operation"), path, method) ||
                      op.get("id");
                    isShownKey = [
                      "operations",
                      createDeepLinkPath(tag),
                      createDeepLinkPath(operationId)
                    ];
                  }

                    let groupNameId =
                      "groupname_" +
                      groupName.replace(/\s+/g, "-").toLowerCase();
                    return (
                      <li
                        id={groupNameId}
                        key={'group-'+groupNameId}
                        className={
                          displayName ? "tab-group selected-group" : "tab-group"
                        }
                        onMouseEnter={this.handleGroupFocus.bind(
                          this,
                          groupNameId
                        )}
                        onMouseLeave={this.handleGroupBlur.bind(
                          this,
                          groupNameId
                        )}
                      >
                        <a className="tab-group-name" 
                        // onClick={this.showSubMenu.bind(
                        //   this,
                        //   "sidebar-" + tag,
                        //   isShownKey,groupNameId
                        // )}
                        >
                          {groupName}
                          <i className="fa fa-angle-right tab-group-arrow"></i>
                        </a>
                        <div className="tab-group-operation">{displayName}</div>
                        {this.state.selectedGroup === groupNameId && (
                          <div className="tab-group-holder">
                            {
                              <ul className="tab-group-sub-items">
                                {groupOperations
                                  .map(operationProcess)
                                  .toArray()}
                              </ul>
                            }
                          </div>
                        )}
                      </li>
                    );
                  };

                  var op = operations.get(0);
                  var isShownKey;
                  if (op) {
                    const operationId =
                      op.getIn(["operation", "operationId"]) ||
                      op.getIn(["operation", "__originalOperationId"]) ||
                      opId(op.get("operation"), path, method) ||
                      op.get("id");
                    isShownKey = [
                      "operations",
                      createDeepLinkPath(tag),
                      createDeepLinkPath(operationId)
                    ];
                  }
                  return (
                    <div
                      key={'menu-'+tag}
                      id={"sidebar-" + tag}
                      className={
                        window.location.href.indexOf(`?${tag}/`) > -1
                          ? "menu-tab active"
                          : "menu-tab"
                      }
                    >
                      <a
                        className="tab-icon"
                        onClick={this.showSubMenu.bind(
                          this,
                          "sidebar-" + tag,
                          isShownKey
                        )}
                      >
                        <i
                          className={icon ? icon : "fa fa-cogs"}
                          aria-hidden="true"
                        ></i>
                        <span className="tab-title">
                          {tagName ? tagName : tag}
                        </span>
                      </a>
                      {operationsMap &&<ul className="tab-sub-items">
                        
                          {operationsMap.map(groupProcess).toArray()}
                      </ul>}

                      {!operationsMap &&<ul className="tab-sub-items">
                        
                          {operations.map(operationProcess).toArray()}
                      </ul>}
                    </div>
                  );
                })
                .toArray()}
            </div>
          </div>
        </aside>

        <section
          id="mainSection"
          className={
            this.state.toggleNav
              ? "main-section content-sidebar-hider"
              : "main-section"
          }
        >
          <div className="sidebar-backdrop"></div>
          {!somethingShown || window.location.href.endsWith("?info") ? (            
            <div className="description">
              {info.get("description") ? <div dangerouslySetInnerHTML={createMarkup(info.get("description"))} /> : window.overview ?
                <div dangerouslySetInnerHTML={createMarkup(window.overview)} /> : null
              }
            </div>
          ) : null}
          {taggedOps
            .map((tagObj, tag) => {
              let operations = tagObj.get("operations");
              let tagDescription = tagObj.getIn(
                ["tagDetails", "description"],
                null
              );
              let tagExternalDocsDescription = tagObj.getIn([
                "tagDetails",
                "externalDocs",
                "description"
              ]);
              let tagExternalDocsUrl = tagObj.getIn([
                "tagDetails",
                "externalDocs",
                "url"
              ]);

              let isShownKey = ["operations-tag", createDeepLinkPath(tag)];

              let showTag = window.location.href.indexOf(`?${tag}/`) > -1;
              return showTag ? (
                <div className="opblock-tag-section" key={"operation-" + tag}>
                  {operations
                    .map(op => {
                      const path = op.get("path", "");
                      const method = op.get("method", "");
                      
                        const specPath = Im.List(["paths", path, method])
                      const jumpToKey = `paths.${path}.${method}`;

                      const operationId =
                        op.getIn(["operation", "operationId"]) ||
                        op.getIn(["operation", "__originalOperationId"]) ||
                        opId(op.get("operation"), path, method) ||
                        op.get("id");
                      const isShownKey = [
                        "operations",
                        createDeepLinkPath(tag),
                        createDeepLinkPath(operationId)
                      ];

                      const allowTryItOut = specSelectors.allowTryItOutFor(
                        op.get("path"),
                        op.get("method")
                      );
                      const response = specSelectors.responseFor(
                        op.get("path"),
                        op.get("method")
                      );
                      const request = specSelectors.requestFor(
                        op.get("path"),
                        op.get("method")
                      );

                      let shown = window.location.href.endsWith(
                        `?${isShownKey[1]}/${isShownKey[2]}`
                      );


                      return shown ? (
                        <OperationPage
                        specPath={specPath}
                          {...op.toObject()}
                          isShownKey={isShownKey}
                          jumpToKey={jumpToKey}
                          showSummary={showSummary}
                          key={isShownKey}
                          response={response}
                          request={request}
                          allowTryItOut={allowTryItOut}
                          displayOperationId={displayOperationId}
                          displayRequestDuration={displayRequestDuration}
                          specActions={specActions}
                          specSelectors={specSelectors}
                          oas3Actions={oas3Actions}
                          oas3Selectors={oas3Selectors}
                          layoutActions={layoutActions}
                          layoutSelectors={layoutSelectors}
                          authActions={authActions}
                          authSelectors={authSelectors}
                          getComponent={getComponent}
                          fn={fn}
                          getConfigs={getConfigs}
                          tag={tag}
                          operationId={operationId}
                        />
                      ) : null;
                    })
                    .toArray()}
                </div>
              ) : null;
            })
            .toArray()}
          {taggedOps.size < 1 ? (
            <h3> No operations defined in spec! </h3>
          ) : null}
{footer && <footer className="footer" type="button" dangerouslySetInnerHTML={{ __html: footer }}></footer>}
          
        </section>
      </div>
    );
  }
}

MainContainer.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  oas3Actions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  oas3Selectors: PropTypes.func.isRequired,
  layoutSelectors: PropTypes.object.isRequired,
  layoutActions: PropTypes.object.isRequired,
  authActions: PropTypes.object.isRequired,
  authSelectors: PropTypes.object.isRequired,
  getConfigs: PropTypes.func.isRequired,
  fn: PropTypes.func.isRequired
};
