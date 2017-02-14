import {StyleSheet} from 'react-native';
import config from "../src/config/app.js";

export default StyleSheet.create({
  container: {
    position: "absolute",
    //borderWidth: 1, borderColor: "red",
    height: config.thumbnailHeight,
    width: config.screenWidth,
    bottom: 0,
    left: 0
  },
  thumbnailContainer: {
    //borderWidth: 1, borderColor: "green"
    paddingLeft: 10
  },
  thumbnail: {
    width: 100,
    height: config.thumbnailHeight
  },
  activeThumbnail: {
    borderColor: "#CCC", borderWidth: 2
  }
});
