import {StyleSheet} from 'react-native';
import config from "../src/config/app.js";

export default StyleSheet.create({
  container: {
    width: config.screenWidth,
    height: config.screenHeight
  },
  video: {
    width: config.screenWidth,
    height: config.screenHeight
  }
});
