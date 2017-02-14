import React, { Component } from 'react';
import {StyleSheet, Text, TouchableHighlight, View, ListView, Image} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import styles from "../../style/thumbnails.js";
import config from "../config/app.js";

export default class Thumbnails extends Component {

  constructor(props) {
    super(props);
    const dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: dataSource.cloneWithRows(props.streams.filter(stream => stream.id != props.activeStreamId))
    }
  }

  componentWillReceiveProps(nextProps) {
    let b = nextProps.streams != this.props.streams || nextProps.activeStreamId != this.props.activeStreamId;
    if(b) {
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(nextProps.streams.filter(stream => stream.id != nextProps.activeStreamId))
      })
    }
  }

  render() {
    if(this.props.streams.length <= 1) {
      return null;
    }
    //ELSE:
    return <ListView style={styles.container}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      dataSource={this.state.dataSource}
      renderRow={this.renderRow.bind(this)} />
  }

  renderRow(stream, sectionId, rowId) {
    let thumbnailStyles = [styles.thumbnail];
    if(rowId == this.props.activeStreamId) {
      thumbnailStyles.push(styles.activeThumbnail);
    }
    return <TouchableHighlight style={styles.thumbnailContainer}
        onPress={() => this.handleThumbnailPress(stream.id)}>
      {
        config.useRCTView ?
        <RTCView streamURL={stream.url} style={thumbnailStyles} />
        :
        <Image source={stream.url} resizeMode={"contain"} style={thumbnailStyles} />
      }

    </TouchableHighlight>
  }

  handleThumbnailPress(streamId) {
    this.props.setActive(streamId);
  }
}
