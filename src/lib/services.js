/**
 * rewebrtc-server project
 *
 * Tho Q Luong <thoqbk@gmail.com>
 * Feb 12, 2017
 */

const IS_BROWSER = (module == null || module.exports == null);

let WebRTC = null;

if(IS_BROWSER) {
  WebRTC = {
    MediaStreamTrack: window.MediaStreamTrack,
    getUserMedia: window.navigator.getUserMedia,
    RTCPeerConnection: window.RTCPeerConnection,
    RTCSessionDescription: window.RTCSessionDescription,
    RTCIceCandidate: window.RTCIceCandidate
  }
} else {
  WebRTC = require('react-native-webrtc');
}


let socket = null;
let onFriendLeftCallback = null;
let onFriendConnectedCallback = null;
let onDataChannelMessageCallback = null;


if(IS_BROWSER) {
  socket = io();
} else {
  const socketIOClient = require('socket.io-client');
  socket = socketIOClient('https://rewebrtc.herokuapp.com', {transports: ['websocket'], jsonp: false});
}

var configuration = {"iceServers": [{"url": "stun:stun.l.google.com:19302"}]};
var peerConnections = {}; //map of {socketId: socket.io id, RTCPeerConnection}
let localStream = null;
let friends = null; //list of {socketId, name}
let me = null; //{socketId, name}

function createPeerConnection(friend, isOffer, onDataChannelMessage) {
  let socketId = friend.socketId;
  var retVal = new WebRTC.RTCPeerConnection(configuration);

  peerConnections[socketId] = retVal;

  retVal.onicecandidate = function (event) {
    console.log('onicecandidate');
    if (event.candidate) {
      socket.emit('exchange', {'to': socketId, 'candidate': event.candidate});
    }
  };

  function createOffer() {
    retVal.createOffer(function(desc) {
      console.log('createOffer', desc);
      retVal.setLocalDescription(desc, function () {
        console.log('setLocalDescription', retVal.localDescription);
        socket.emit('exchange', {'to': socketId, 'sdp': retVal.localDescription });
      }, logError);
    }, logError);
  }

  retVal.onnegotiationneeded = function () {
    console.log('onnegotiationneeded');
    if (isOffer) {
      createOffer();
    }
  }

  retVal.oniceconnectionstatechange = function(event) {
    console.log('oniceconnectionstatechange');
    if (event.target.iceConnectionState === 'connected') {
      createDataChannel();
    }
  };

  retVal.onsignalingstatechange = function(event) {
    console.log('onsignalingstatechange');
  };

  retVal.onaddstream = function (event) {
    console.log('onaddstream');
    //var element = document.createElement('video');
    //element.id = "remoteView" + socketId;
    //element.autoplay = 'autoplay';
    //element.src = URL.createObjectURL(event.stream);
    //remoteViewContainer.appendChild(element);
    if(onFriendConnectedCallback != null) {
      onFriendConnectedCallback(socketId, event.stream);
    }
  };

  retVal.addStream(localStream);

  function createDataChannel() {
    if (retVal.textDataChannel) {
      return;
    }
    var dataChannel = retVal.createDataChannel("text");

    dataChannel.onerror = function (error) {
      console.log("dataChannel.onerror", error);
    };

    dataChannel.onmessage = function (event) {
      console.log("dataChannel.onmessage:", event.data);
      if(onDataChannelMessageCallback != null) {
        onDataChannelMessageCallback(JSON.parse(event.data));
      }
    };

    dataChannel.onopen = function () {
      console.log('dataChannel.onopen');
    };

    dataChannel.onclose = function () {
      console.log("dataChannel.onclose");
    };

    retVal.textDataChannel = dataChannel;
  }

  return retVal;
}

function exchange(data) {
  var fromId = data.from;
  var pc;
  if (fromId in peerConnections) {
    pc = peerConnections[fromId];
  } else {
    let friend = friends.filter((friend) => friend.socketId == fromId)[0];
    if(friend == null) {
      friend = {
        socketId: fromId,
        name: ""
      }
    }
    pc = createPeerConnection(friend, false);
  }

  if (data.sdp) {
    //console.log('exchange sdp', data);
    pc.setRemoteDescription(new WebRTC.RTCSessionDescription(data.sdp), function () {
      if (pc.remoteDescription.type == "offer")
      pc.createAnswer(function(desc) {
        //console.log('createAnswer', desc);
        pc.setLocalDescription(desc, function () {
          //console.log('setLocalDescription', pc.localDescription);
          socket.emit('exchange', {'to': fromId, 'sdp': pc.localDescription });
        }, logError);
      }, logError);
    }, logError);
  } else {
    //console.log('exchange candidate', data);
    pc.addIceCandidate(new WebRTC.RTCIceCandidate(data.candidate));
  }
}

function leave(socketId) {
  console.log('leave', socketId);
  var pc = peerConnections[socketId];
  pc.close();
  delete peerConnections[socketId];
  if(onFriendLeftCallback != null) {
    onFriendLeftCallback(socketId);
  }
}

socket.on('exchange', function(data){
  exchange(data);
});

socket.on('leave', function(socketId){
  leave(socketId);
});

socket.on('connect', function(data) {
  console.log('connect');
});

socket.on("join", function(friend) {
  //new friend:
  friends.push(friend);
  console.log("New friend joint conversation: ", friend);
});

function logError(error) {
  console.log("logError", error);
}

//------------------------------------------------------------------------------
//  Utils

//------------------------------------------------------------------------------
// Services
function countFriends(roomId, callback) {
  socket.emit("count", roomId, (count) => {
    console.log("Count friends result: ", count);
    callback(count);
  });
}

function loadLocalStream2(muted) {
  navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
    localStream = stream;
    var selfView = document.getElementById("selfView");
    selfView.src = URL.createObjectURL(stream);
    selfView.muted = muted;
  }, logError);
}

function getLocalStream(isFront, callback) {
  WebRTC.MediaStreamTrack.getSources(sourceInfos => {
    console.log(sourceInfos);
    let videoSourceId;
    for (const i = 0; i < sourceInfos.length; i++) {
      const sourceInfo = sourceInfos[i];
      if(sourceInfo.kind == "video" && sourceInfo.facing == (isFront ? "front" : "back")) {
        videoSourceId = sourceInfo.id;
      }
    }
    WebRTC.getUserMedia({
      audio: true,
      video: {
        mandatory: {
          minWidth: 500, // Provide your own width, height and frame rate here
          minHeight: 300,
          minFrameRate: 30
        },
        facingMode: (isFront ? "user" : "environment"),
        optional: (videoSourceId ? [{sourceId: videoSourceId}] : [])
      }
    }, function (stream) {
      localStream = stream;
      console.log("Got Local Stream");
      callback(stream);
    }, (error) => {
      console.log("Get LocalStream Fail: ", error);
    });
  });
}

function broadcastMessage(message) {
  for (var key in peerConnections) {
    var pc = peerConnections[key];
    pc.textDataChannel.send(JSON.stringify(message));
  }
}

/**
 *
 * callbacks: {
 *    joined: function of () => {},
 *    friendConnected: (socketId, stream) => {},
 *    friendLeft: (socketId) => {},
 *    dataChannelMessage: (message) => {}
 * }
 *
 */
function join(roomId, name, callbacks) {
  onFriendLeftCallback = callbacks.friendLeft;
  onFriendConnectedCallback = callbacks.friendConnected;
  onDataChannelMessageCallback = callbacks.dataChannelMessage;
  socket.emit('join', {roomId, name}, function(result){
    friends = result;
    console.log('Joins', friends);
    friends.forEach((friend) => {
      createPeerConnection(friend, true);
    });
    if(callbacks.joined != null) {
      me = {
        socketId: socket.id,
        name: name
      }
      callbacks.joined();
    }
  });
}
//------------------------------------------------------------------------------
// Exports
if(!IS_BROWSER) {
  module.exports = {
    join,
    countFriends,
    getLocalStream,
    broadcastMessage
  }
}
