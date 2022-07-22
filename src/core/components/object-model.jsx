import React, { Component, } from "react"
import PropTypes from "prop-types"
import { List } from "immutable"
import ImPropTypes from "react-immutable-proptypes"

const braceOpen = "{"
const braceClose = "}"
const propClass = "property"

export default class ObjectModel extends Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    getConfigs: PropTypes.func.isRequired,
    expanded: PropTypes.bool,
    onToggle: PropTypes.func,
    specSelectors: PropTypes.object.isRequired,
    name: PropTypes.string,
    displayName: PropTypes.string,
    isRef: PropTypes.bool,
    expandDepth: PropTypes.number,
    depth: PropTypes.number,
    specPath: ImPropTypes.list.isRequired,
    includeReadOnly: PropTypes.bool,
    includeWriteOnly: PropTypes.bool,
  }

  render(){
    let { schema, name, displayName, isRef, getComponent, getConfigs, depth, onToggle, expanded, specPath, ...otherProps } = this.props
    let { specSelectors,expandDepth, includeReadOnly, includeWriteOnly, skipInList } = otherProps
    
    if(!schema) {
      return null
    }

    const { showExtensions } = getConfigs()

    let description = schema.get("description")
    let properties = schema.get("properties")
    let additionalProperties = schema.get("additionalProperties")
    let title = schema.get("title") || displayName || name
    let requiredProperties = schema.get("required")
    let infoProperties = schema
      .filter( ( v, key) => ["maxProperties", "minProperties", "nullable", "example"].indexOf(key) !== -1 )
    let deprecated = schema.get("deprecated")

    const JumpToPath = getComponent("JumpToPath", true)
    const Markdown = getComponent("Markdown", true)
    const Model = getComponent("Model")
    const ModelCollapse = getComponent("ModelCollapse")
    const Property = getComponent("Property")

    const JumpToPathSection = () => {
      return <span className="model-jump-to-path"><JumpToPath specPath={specPath} /></span>
    }
    const collapsedContent = (<span>
        <span>{ braceOpen }</span>...<span>{ braceClose }</span>
        {
          isRef ? <JumpToPathSection /> : ""
        }
    </span>)

    const anyOf = schema.get("anyOf") 
    const oneOf =  schema.get("oneOf") 
    const not =  schema.get("not")

    const titleEl = title && <span className="model-title">
      {/* { isRef && schema.get("$$ref") && <span className="model-hint">{ schema.get("$$ref") }</span> } */}
      <span className="model-title__text">{ title }</span>
    </span>

    return <span className="model">
      <ModelCollapse
        modelName={name}
        title={titleEl}
        onToggle = {onToggle}
        expanded={ true /*expanded ? true : depth <= expandDepth*/ }
        collapsedContent={ collapsedContent }>

         <span className="brace-open object">{ braceOpen }</span>
          {
            !isRef ? null : <JumpToPathSection />
          }
          <span className="inner-object">
            {
              <div className="model model-margin" >
              {
                !description ? <p/>: <span className="description">
                    <span>
                      <Markdown source={ description } />
                    </span>
                  </span>
              }
              {
                !deprecated ? null :
                  <span className={"property"}>
                    <span>
                      deprecated:
                    </span>
                    <span>
                      true
                    </span>
                  </span>
               
              }
              {
                !(properties && properties.size) ? null : properties.entrySeq().filter(
                    ([, value]) => {
                      return (!value.get("readOnly") || includeReadOnly) &&
                        (!value.get("writeOnly") || includeWriteOnly)
                    }
                ).map(
                    ([key, value]) => {
                      let isDeprecated = value.get("deprecated")
                      let isRequired = List.isList(requiredProperties) && requiredProperties.contains(key)

                      let classNames = ["property-row"]

                      if (isDeprecated) {
                        classNames.push("deprecated")
                      }

                      if (isRequired) {
                        classNames.push("required")
                      }

                      if((!includeReadOnly && value.get("readOnly")) ||
                      (!includeWriteOnly && value.get("writeOnly")) ||
                      (skipInList && value.get("skipInList")) ) {
                        return null
                      }
                      return (<span key={key} className={isDeprecated && "deprecated"}>
                        <span className={isRequired?"model-field-bold" : "model-field"}>
                          { key }{ isRequired && <span style={{ color: "red" }}>*</span>  }
                        </span>
                        <div className="model-field-type">
                          <Model key={ `object-${name}-${key}_${value}` } { ...otherProps }
                                 required={ isRequired }
                                 getComponent={ getComponent }
                                 specPath={specPath && specPath.push("properties", key)}
                                 getConfigs={ getConfigs }
                                 schema={ value }
                                 depth={ depth + 1 } 
                                 includeReadOnly={includeReadOnly}
                                  includeWriteOnly={includeWriteOnly}
                                  skipInList={skipInList} />
                        </div>
                      </span>)
                    }).toArray()
              }
              {
                // empty row befor extensions...
                !showExtensions ? null : <span><span>&nbsp;</span></span>
              }
              {
                !showExtensions ? null :
                  schema.entrySeq().map(
                    ([key, value]) => {
                      if(key.slice(0,2) !== "x-") {
                        return
                      }

                      const normalizedValue = !value ? null : value.toJS ? value.toJS() : value

                      return (<span key={key} className="extension">
                        <span>
                          { key }
                        </span>
                        <span>
                          { JSON.stringify(normalizedValue) }
                        </span>
                      </span>)
                    }).toArray()
              }
              {
                !additionalProperties || !additionalProperties.size ? null
                  : <span>
                    <span>{ "< * >:" }</span>
                    <span>
                      <Model { ...otherProps } required={ false }
                             getComponent={ getComponent }
                             specPath={specPath.push("additionalProperties")}
                             getConfigs={ getConfigs }
                             schema={ additionalProperties }
                             depth={ depth + 1 } />
                    </span>
                  </span>
              }
              {
                !anyOf ? null
                  : <span>
                    <span>{ "anyOf ->" }</span>
                    <span>
                      {anyOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={specPath.push("anyOf", k)}
                                 getConfigs={ getConfigs }
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </span>
                  </span>
              }
              {
                !oneOf ? null
                  : <span>
                    <span>{ "oneOf ->" }</span>
                    <span>
                      {oneOf.map((schema, k) => {
                        return <div key={k}><Model { ...otherProps } required={ false }
                                 getComponent={ getComponent }
                                 specPath={specPath.push("oneOf", k)}
                                 getConfigs={ getConfigs }
                                 schema={ schema }
                                 depth={ depth + 1 } /></div>
                      })}
                    </span>
                  </span>
              }
              {
                !not ? null
                  : <span>
                    <span>{ "not ->" }</span>
                    <span>
                      <div>
                        <Model { ...otherProps }
                               required={ false }
                               getComponent={ getComponent }
                               specPath={specPath.push("not")}
                               getConfigs={ getConfigs }
                               schema={ not }
                               depth={ depth + 1 } />
                      </div>
                    </span>
                  </span>
              }
              </div>
          }
        </span>
        <span className="brace-close">{ braceClose }</span>
      </ModelCollapse>
      {
        infoProperties.size ? infoProperties.entrySeq().map( ( [ key, v ] ) => <Property key={`${key}-${v}`} propKey={ key } propVal={ v } propClass={ propClass } />) : null
      }
    </span>
  }
}
