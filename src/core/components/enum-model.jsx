import React from "react"
import ImPropTypes from "react-immutable-proptypes"

const EnumModel = ({ value, getComponent }) => {
  let ModelCollapse = getComponent("ModelCollapse")
  let collapsedContent = <span>Options [ { value.count() } ]</span>
  return <span className="prop-enum">
    <ModelCollapse expanded={ value.count()<= 5 } collapsedContent={ collapsedContent }>
      [ { value.join(", ") } ]
    </ModelCollapse>
  </span>
}
EnumModel.propTypes = {
  value: ImPropTypes.iterable,
  getComponent: ImPropTypes.func
}

export default EnumModel