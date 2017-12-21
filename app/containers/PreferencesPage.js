// @flow

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { push } from 'react-router-redux';
import Preferences from '../components/Preferences';

import type { ReduxState, ReduxDispatch } from '../redux/store';
import type { SharedRouteProps } from '../routes';

const mapStateToProps = (state: ReduxState) => state;
const mapDispatchToProps = (dispatch: ReduxDispatch, _props: SharedRouteProps) => {
  const { push: pushHistory } = bindActionCreators({ push }, dispatch);
  return {
    onClose: () => pushHistory('/settings'),
    onChangeLanSharing: (_changed) => {},
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Preferences);
