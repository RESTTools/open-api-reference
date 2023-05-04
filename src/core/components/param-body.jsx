import React, { PureComponent } from "react"
import PropTypes from "prop-types"
import { fromJS, List } from "immutable"
import { getSampleSchema , validateXML} from "core/utils" 
import { getKnownSyntaxHighlighterLanguage } from "core/utils/jsonParse"
import formatXml from "xml-but-prettier"

const NOOP = Function.prototype

export default class ParamBody extends PureComponent {

  static propTypes = {
    param: PropTypes.object,
    onChange: PropTypes.func,
    onChangeConsumes: PropTypes.func,
    consumes: PropTypes.object,
    consumesValue: PropTypes.string,
    fn: PropTypes.object.isRequired,
    getConfigs: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
    isExecute: PropTypes.bool,
    specSelectors: PropTypes.object.isRequired,
    pathMethod: PropTypes.array.isRequired
  };

  static defaultProp = {
    consumes: fromJS(["application/json"]),
    param: fromJS({}),
    onChange: NOOP,
    onChangeConsumes: NOOP,
  };

  constructor(props, context) {
    super(props, context)

    this.state = {
      isEditBox: false,
      value: "",
      invalidMsg: undefined,
      modes: ["sample"]
    }
    this.isEditBox = this.state.isEditBox
    let { param, fn: { inferSchema } } = this.props
    let schema = inferSchema(param.toJS())
    this.showReduce = schema && schema.modes && schema.modes[0] && schema.modes[0] === "sample"
    if (!this.showReduce) {
      this.state.modes = null;
    }

  }

  setModes() {
    if (this.state.modes === null) {
      this.state.modes = ["sample"];
    } else {
      this.state.modes = null;
    }
    this.onChange(this.sample("xml"), { isXml: true, isEditBox: false })
    this.onChange(this.sample(""), { isEditBox: false })
  }

  format() {
    let { isExecute, consumesValue = "" } = this.props
    let isXml = /xml/i.test(consumesValue)
    let isJson = /json/i.test(consumesValue)
    if (isXml) {
      try {
        validateXML(this.state.value)
        let formated = formatXml(this.state.value, {
          textNodesOnSameLine: true,
          indentor: "  "
        })
        this.setState({ value: formated, invalidMsg: "OK" })
        this.onChange(formated, { isXml: isXml, isEditBox: isExecute })
      } catch (e) {
        this.setState({ invalidMsg: "Syntax Error : Invalid XML" })
      }
    } else if (isJson) {
      try {
        let oldValue = JSON.parse(this.state.value);
        let formated = JSON.stringify(oldValue, null, "  ")
        this.setState({ value: formated, invalidMsg: "OK" })
        this.onChange(formated, { isXml: isXml, isEditBox: isExecute })
      } catch (e) {
        this.setState({ invalidMsg: "Syntax Error : Invalid JSON" })
      }
    }
  }

  textAreaTextHeight = 14.4;
  textAreaPaddings = 40;
  componentDidMount() {
    this.updateValues.call(this, this.props)
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.updateValues.call(this, nextProps)
  }

  updateValues = (props) => {
    let { param, isExecute, consumesValue="" } = props
    let isXml = /xml/i.test(consumesValue)
    let isJson = /json/i.test(consumesValue)
    let paramValue = isXml ? param.get("value_xml") : param.get("value")

    if ( paramValue !== undefined ) {
      let val = !paramValue ? "": paramValue
      this.setState({ value: val })
      this.onChange(val, {isXml: isXml, isEditBox: isExecute})
    } else {
      if (isXml) {
        this.onChange(this.sample("xml"), {isXml: isXml, isEditBox: isExecute})
      } else {
        this.onChange(this.sample(), {isEditBox: isExecute})
      }
    }
    this.setState({ invalidMsg: undefined })
  }

  sample = (xml) => {
    let { param, fn:{inferSchema} } = this.props
    let schema = inferSchema(param.toJS())

    return getSampleSchema(schema, xml, {
      includeWriteOnly: true,
      modes: this.state.modes
    })
  }

  onChange = (value, { isEditBox, isXml }) => {
    this.setState({value, isEditBox})
    this._onChange(value, isXml)
  }

  _onChange = (val, isXml) => { (this.props.onChange || NOOP)(val, isXml) }

  handleOnChange = e => {
    const {consumesValue} = this.props
    const isXml = /xml/i.test(consumesValue)
    const inputValue = e.target.value
    this.onChange(inputValue, {isXml, isEditBox: this.state.isEditBox})
  }

  toggleIsEditBox = () => this.setState( state => ({isEditBox: !state.isEditBox}))

  render() {
    let {
      onChangeConsumes,
      param,
      isExecute,
      specSelectors,
      pathMethod,
      xsd,type,
      getConfigs,
      getComponent
      , fn: { inferSchema }, errors
    } = this.props

    const Button = getComponent("Button")
    const TextArea = getComponent("TextArea")
    const HighlightCode = getComponent("highlightCode")
    const ContentType = getComponent("contentType")
    // for domains where specSelectors not passed
    let parameter = specSelectors ? specSelectors.parameterWithMetaByIdentity(pathMethod, param) : param
    let consumesValue = specSelectors.contentTypeValues(pathMethod).get("requestContentType")
    let consumes = this.props.consumes && this.props.consumes.size ? this.props.consumes : ParamBody.defaultProp.consumes

    let { value, isEditBox } = this.state
    let language = null
    let testValueForJson = getKnownSyntaxHighlighterLanguage(value)
    if (testValueForJson) {
      language = "json"
    }

    return (
      <div className="body-param" data-param-name={param.get("name")} data-param-in={param.get("in")}>
        {
          isEditBox && isExecute
            ? <div className="body-actions body-editor">
              
      
            <ul>
              {isExecute && this.state.invalidMsg && <li> {this.state.invalidMsg === "OK" ? <i className="format-ok fa fa fa-check-circle"></i> : <div className="format-error"> <i className="fa fa-warning"></i> {this.state.invalidMsg} </div>}</li>}
              {isExecute && !this.state.invalidMsg && <li><a title={type && type.indexOf('xml') > -1 ?  'Format XML' : 'Format JSON'} onClick={this.format.bind(this)} > Format {type && type.indexOf("xml") > -1 ?  "XML" : "JSON"}</a></li>}
              
              {this.showReduce && <li><a onClick={this.setModes.bind(this)} title={this.state.modes ? "Complete Input" : "Sample Input"}>{this.state.modes ? "Expand" : "Sample"}</a></li>}
              {xsd && type && type.indexOf("xml") > -1 &&
      <li><a title="XSD"  target="_blank" href={xsd}>XSD <i className="fa fa-external-link"></i></a></li>}
            </ul>
            <TextArea className={"body-param__text tryout_body" + (errors && errors.count() ? " invalid" : "")}
              title={errors && errors.count() ? errors.get(0) : ""}
              value={value} onChange={this.handleOnChange} style={{
                height: (Math.min(this.textAreaPaddings + (value.match(/\r?\n/g) || '').length * this.textAreaTextHeight, 400) + "px")
              }} />
            {errors && errors.count() ? <div className="error-msg">{errors.get(0)}</div> : null}
          </div>
          : <div className="body-actions">
            
    
          <ul >
   {this.showReduce && <li><a onClick={this.setModes.bind(this)} title={this.state.modes ? "Complete Input" : "Sample Input"}>{this.state.modes ? "Expand" : "Sample"}</a></li>}
              
   {xsd && type && type.indexOf("xml") > -1 &&
      <li><a title="XSD"  target="_blank" href={xsd}>XSD <i className="fa fa-external-link"></i></a></li>}
            
            </ul> 
          <HighlightCode className="body-param__example"
            value={value} 
            language={ language }
            getConfigs={ getConfigs }/>
            </div>
        }



        {/* <div className="body-param-options">
          {
            !isExecute ? null
                       : <div className="body-param-edit">
                        <Button className={isEditBox ? "btn cancel body-param__example-edit" : "btn edit body-param__example-edit"}
                                 onClick={this.toggleIsEditBox}>{ isEditBox ? "Cancel" : "Edit"}
                         </Button>
                         </div>
          }
          <label htmlFor="">
            <span>Parameter content type</span>
            <ContentType
              value={ consumesValue }
              contentTypes={ consumes }
              onChange={onChangeConsumes}
              className="body-param-content-type"
              ariaLabel="Parameter content type" />
          </label>
        </div> */}
      </div>
    )

  }
}
