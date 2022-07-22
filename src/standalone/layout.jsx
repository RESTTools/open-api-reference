import React from "react"
import PropTypes from "prop-types"

export default class StandaloneLayout extends React.Component {

  static propTypes = {
    showPopup: PropTypes.bool,
    errSelectors: PropTypes.object.isRequired,
    errActions: PropTypes.object.isRequired,
    specActions: PropTypes.object.isRequired,
    specSelectors: PropTypes.object.isRequired,
    layoutSelectors: PropTypes.object.isRequired,
    layoutActions: PropTypes.object.isRequired,
    getComponent: PropTypes.func.isRequired,
    authSelectors: PropTypes.func.isRequiredAuthorizePopup
  }

  render() {
    const { getComponent, authSelectors } = this.props
    const Container = getComponent("Container")
    const MainContainer = getComponent("MainContainer", true)
    const AuthorizationPopup = getComponent("authorizationPopup", true)
    const BaseLayout = getComponent("BaseLayout", true)

    return (
      <Container className='swagger-ui'>
        {/* {BaseLayout ? <BaseLayout /> : null} */}
        {MainContainer ? <MainContainer /> : null}
        {!!authSelectors.shownDefinitions() && <AuthorizationPopup />}
      </Container>
      
    )
  }

}
