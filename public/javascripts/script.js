$(document).ready(function() {
  var constraints = {
    video: true,
    audio: false
  };
  var sdpConstraints = {
    mandatory: {
      OfferToReceiveVideo: true,
      OfferToReceiveAudio: false
    }
  };
  var localStream = null;
  var peerConnection = null;
  var localVideo = document.getElementById('video_self');
  var remoteVideo = document.getElementById('video_other');

  // ------------------------------------------------------------ //

  /**
   * ローカル用RTCPeerConnection生成
   *
   * @return {RTCPeerConnection}
   */
  var createPeerConnection = function() {
    var pc = new RTCPeerConnection();
    pc.onicecandidate = function(event) {
      if (event.candidate) {
        socket.emit(
          'message',
          {
            type: 'candidate',
            candidate: event.candidate.candidate,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            sdpMid: event.candidate.sdpMid
          }
        );
      }
    };
    pc.addStream(localStream);
    pc.addEventListener('addstream', function(event) {
      attachMediaStream(remoteVideo, event.stream);
    });

    return pc;
  };

  /**
   * シグナリングサーバーへオファーを送信
   *
   * @param {RTCPeerConnection} pc
   */
  var sendOffer = function(pc) {
    // successCallback
    pc.createOffer(
      function(description) {
        pc.setLocalDescription(description);
        socket.emit(
          'message',
          {
            type: 'offer',
            sdp: description.sdp
          }
        );
      },
      // errorCallback
      function(err) {
        console.log('Failed to create session description: ', err);
      },
      // constraints
      sdpConstraints
    );
  };

  /**
   * サーバーからオファーを受信した時
   *
   * @param {Object} data
   */
  var onGetOfferMessage = function(data) {
    peerConnection = createPeerConnection();
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  };

  /**
   * 受信したオファーに対して返答
   *
   * @param {RTCPeerConnection} pc
   */
  var sendAnswer = function(pc) {
    peerConnection.createAnswer(
      // successCallback
      function(description) {
        pc.setLocalDescription(description);
        socket.emit(
          'message',
          {
            type: 'answer',
            sdp: description.sdp
          }
        );
      },
      // errorCallback
      function(err) {
        console.log('Failed to create session description: ', err);
      },
      // constraints
      sdpConstraints
    );
  };

  /**
   * サーバーからオファーに対する返答を受信した時
   *
   * @param {Object} data
   */
  var onGetAnswerMessage = function(data) {
    peerConnection.setRemoteDescription(new RTCSessionDescription(data));
  };

  /**
   * サーバーからCandidateを受信した時
   *
   * @param {Object} data
   */
  var onGetCandidateMessage = function(data) {
    peerConnection.addIceCandidate(new RTCIceCandidate(data));
  };

  // ------------------------------------------------------------ //

  // シグナリングサーバーからメッセージを受信
  socket.on('message', function(data) {
    switch (data.type) {
      case 'offer':
        onGetOfferMessage(data);
        break;
      case 'answer':
        onGetAnswerMessage(data);
        break;
      case 'candidate':
        onGetCandidateMessage(data);
        break;
    }
  });

  // ------------------------------------------------------------ //

  $(document).on('click', '#btn_call', function() {
    peerConnection = createPeerConnection();
    sendOffer(peerConnection);
  });

  $(document).on('click', '#btn_answer', function() {
    sendAnswer(peerConnection);
  });

  // ------------------------------------------------------------ //

  // ブラウザからメディアデバイスの使用許可を求める
  getUserMedia(
    // constraints
    constraints,
    // successCallback
    function(stream) {
      attachMediaStream(localVideo, stream);
      localStream = stream;
    },
    // errorCallback
    function(err) {
      console.log('getUserMedia() error: ', err);
    }
  );
});
