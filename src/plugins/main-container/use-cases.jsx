import React from "react";
import PropTypes from "prop-types";
import { List } from "immutable";

function createMarkup(htmlFile) {
  return { __html: htmlFile };
}

export default class UseCases extends React.Component {
  static propTypes = {
    getComponent: PropTypes.func.isRequired,
    path: PropTypes.string.isRequired,
    method: PropTypes.string
  };

  constructor(props, context) {
    super(props, context);
    this.useCases = {};
    this.useCaseKeys = [];
    this.state = {
      activeTab: "",
      collapsed: true
    };
  }

  activeTab = tab => {
    this.setState({
      activeTab: tab,
      shown: true
    });
  };

  toggleCollapsed = () => {
    this.setState({
      activeTab:
        this.state.collapsed && this.state.activeTab == ""
          ? this.useCaseKeys[0]
          : this.state.activeTab,
      collapsed: !this.state.collapsed
    });
  };

  render() {
    let {
      getComponent,
      commonUseCases,
      fitUseCases,
      path,
      method
    } = this.props;
    let identifier = (method + path).replace(/\//g, "_");
    const Markdown = getComponent("Markdown");
    const Collapse = getComponent("Collapse");
    if (commonUseCases) {
      this.useCases["Common"] = commonUseCases;
    }
    if (fitUseCases) {
      this.useCases["FIT"] = fitUseCases;
    }
    if (window.enforcements) {
      Object.keys(window.enforcements).map(enforcementName => {
        let enforcement = window.enforcements[enforcementName];
        if (enforcement.usecases && enforcement.usecases[identifier]) {
          let cases = enforcement.usecases[identifier];
          if (cases) {
            if (cases instanceof Array) {
              this.useCases[enforcementName.toUpperCase()] = new List(cases);
            } else if (cases.startsWith && cases.startsWith("LINK@")) {
              this.useCases[enforcementName.toUpperCase()] = cases;
            }
          }
        }
      });
    }
    this.useCaseKeys = Object.keys(this.useCases);
    if (this.useCaseKeys.length == 1) {
      this.state.activeTab = this.useCaseKeys[0];
    }
    if (this.useCaseKeys.length < 1) {
      return null;
    } else {
      return (
        <section className="faqs">
          <div className="collapse-button">
            {" "}
            <span onClick={this.toggleCollapsed}>
              <span
                className={
                  "collapse-button-toggle" +
                  (this.state.collapsed ? " collapsed" : "")
                }
              />
              <span className="title" onClick={this.toggleCollapsed}>
                Common use cases
              </span>
            </span>
          </div>
          {!this.state.collapsed &&
            this.useCaseKeys.length > 1 && (
              <ul className="tab">
                {this.useCaseKeys.map(useCase => {
                  return (
                    true && (
                      <li
                        onClick={this.activeTab.bind(this, useCase)}
                        key={useCase + "-tab"}
                        className={
                          "tabitem" +
                          (this.state.activeTab === useCase ? " active" : "")
                        }
                      >
                        <a className="tablinks">{useCase}</a>
                      </li>
                    )
                  );
                })}
              </ul>
            )}
          <Collapse isOpened={!this.state.collapsed}>
            {
              <div className="usecase-body">
                {this.useCaseKeys.length > 1 ? (
                  this.useCaseKeys.map(useCase => {
                    return (
                      this.state.activeTab === useCase && (
                        <div key={"usecase-" + useCase}>
                          {!(this.useCases[useCase] instanceof List) && this.useCases[useCase].replace ? (
                            <div
                              dangerouslySetInnerHTML={createMarkup(
                                window[
                                  this.useCases[useCase].replace("LINK@", "")
                                ]
                              )}
                            />
                          ) : (
                            <div className="opblock-description">
                              <div>
                                {this.useCases[useCase].map &&
                                  this.useCases[useCase]
                                    .map((usecase, index) => {
                                      return (
                                        <div
                                          key={"usecase-" + useCase + index}
                                          className="opblock-description"
                                        >
                                          <Markdown source={usecase} />
                                        </div>
                                      );
                                    })
                                    .toArray()}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    );
                  })
                ) : (
                  <div>
                    {!(this.useCases[this.useCaseKeys[0]] instanceof List )  && this.useCases[this.useCaseKeys[0]].replace ? (
                      <div
                        dangerouslySetInnerHTML={createMarkup(
                          window[
                            this.useCases[this.useCaseKeys[0]].replace(
                              "LINK@",
                              ""
                            )
                          ]
                        )}
                      />
                    ) : (
                      <div className="opblock-description">
                        <div>
                          {this.useCases[this.useCaseKeys[0]].map &&
                            this.useCases[this.useCaseKeys[0]]
                              .map((usecase, index) => {
                                return (
                                  <div
                                    key={
                                      "usecase-" + this.useCaseKeys[0] + index
                                    }
                                    className="opblock-description"
                                  >
                                    <Markdown source={usecase} />
                                  </div>
                                );
                              })
                              .toArray()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            }
          </Collapse>
        </section>
      );
    }
  }
}
