import React from "react"
import PropTypes from "prop-types"
import ImPropTypes from "react-immutable-proptypes"
import { fromJS } from "immutable"

const noop = ()=>{}

export default class ContentType extends React.Component {

  static propTypes = {
    ariaControls: PropTypes.string,
    contentTypes: PropTypes.oneOfType([ImPropTypes.list, ImPropTypes.set, ImPropTypes.seq]),
    controlId: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
    ariaLabel: PropTypes.string
  }

  static defaultProps = {
    onChange: noop,
    value: null,
    contentTypes: fromJS(["application/json"]),
  }

  componentDidMount() {
    // Needed to populate the form, initially
    if(this.props.contentTypes) {
      this.props.onChange(this.props.contentTypes.first())
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if(!nextProps.contentTypes || !nextProps.contentTypes.size) {
      return
    }

    if(!nextProps.contentTypes.includes(nextProps.value)) {
      nextProps.onChange(nextProps.contentTypes.first())
    }
  }

  onChangeWrapper = e => this.props.onChange(e.target.value)

  render() {
    let { ariaControls, ariaLabel, className, contentTypes, controlId, value } = this.props

    if ( !contentTypes || !contentTypes.size )
      return null

    return (
      <span className={ "content-type-wrapper " + ( className || "" ) }>
        <select aria-controls={ariaControls} aria-label={ariaLabel} className="content-type" id={controlId} onChange={this.onChangeWrapper} value={value || ""} >
          { contentTypes.map( (val) => {
            return <option title={val} key={ val } value={ val }>{ val.endsWith("xml") ? "XML": val.endsWith("json") ? "JSON":val}</option>
          }).toArray()}
        </select>
      </span>
    )
  }
}
