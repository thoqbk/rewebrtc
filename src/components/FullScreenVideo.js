import React, {Component} from 'react';
import {StyleSheet, Text, TouchableHighlight, View, ListView, Image} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import config from "../config/app.js";
import styles from "../../style/fullScreenVideo.js";

export default class FullScreenVideo extends Component{

  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return <View style={styles.container}>
      {
        config.useRCTView ?
        <RTCView streamURL={this.props.streamURL} style={styles.video} />
        :
        <Image source={this.props.streamURL} style={styles.video} resizeMode={"contain"} />
      }
    </View>
  }
}
