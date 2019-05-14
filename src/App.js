import React from "react";
import { connect } from "react-redux";
import Routes from "./routes";
import {
  me,
  createConnection,
  matchListeners,
  chatListener,
  readyToListen,
  postLocation,
  resListener,
  setUserLocation
} from "./store";

class App extends React.Component {
  state = { init: false };
  async componentDidMount() {
    const user = await this.props.me(this.initSocket);
    if (user) {
      await this.initSocket();
      if (user.location) {
        this.props.setUserLocation(user.location.coordinates);
      }
    }
    this.setState({ init: true });
  }
  initSocket = async () => {
    window.navigator.geolocation.getCurrentPosition(
      this.props.postLocation,
      err => console.log(err),
      {
        timeout: 30000,
        enableHighAccuracy: false,
        maximumAge: 60000
      }
    );
    await Promise.all([
      this.props.createConnection(),
      this.props.readyToListen()
    ]);
    await this.props.matchListeners();
    this.props.chatListener();
    this.props.resListener();
  };
  render() {
    return this.state.init ? (
      <Routes initSocket={this.initSocket} />
    ) : (
      <div>Loading...</div>
    );
  }
}

const mapStateToProps = ({ user }) => ({
  user
});

export default connect(
  mapStateToProps,
  {
    me,
    createConnection,
    matchListeners,
    readyToListen,
    chatListener,
    postLocation,
    resListener,
    setUserLocation
  }
)(App);
