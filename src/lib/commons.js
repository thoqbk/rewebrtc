import {MediaStreamTrack, getUserMedia} from 'react-native-webrtc';
import config from "../config/app.js";

function getLocalStream(isFront, callback) {
  MediaStreamTrack.getSources(sourceInfos => {
    console.log(sourceInfos);
    let videoSourceId;
    sourceInfos.forEach((sourceInfo) => {
      if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
        videoSourceId = sourceInfo.id;
      }
    });
    getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: config.video.minWidth,
          minHeight: config.video.minHeight,
          minFrameRate: config.video.minFrameRate
        },
        facingMode: (isFront ? "user" : "environment"),
        optional: (videoSourceId ? [{sourceId: videoSourceId}] : [])
      }
    }, function (stream) {
      console.log('Got Stream: ', stream);
      callback(stream);
    }, (error) => {
      console.log("Error: ", error);
    });
  });
}


export default {
  getLocalStream
}
