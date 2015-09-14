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
  var connections = {};
  var localVideo = document.getElementById('video_self');

  // ------------------------------------------------------------ //

  /**
   * Connection
   *
   * @param {String} id
   * @param {RTCPeerConnection} peer
   */
  var Connection = function(id, peer) {
    this.id = id;
    this.peer = peer;
  };

  var getConnection = function(id) {
    return connections[id];
  };

  var addConnection = function(connection) {
    connections[connection.id] = connection;
  };

  // ------------------------------------------------------------ //

  /**
   * Callメッセージを送信
   */
  var sendCallMessage = function() {
    socket.emit('message', { type: 'call' });
  };

  /**
   * Callメッセージを受信した時
   *
   * @param {Object} data
   */
  var onGetCallMessage = function(data) {
    createInfoNotify('Callメッセージを受信しました');

    var id = data.from;
    var peer = createPeerConnection();
    var connection = new Connection(id, peer);
    addConnection(connection);
    sendOffer(id, peer);
  };

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
      var $video = $('<video>').attr('autoplay', true);
      $('#video_lists').append($video);
      attachMediaStream($video.get(0), event.stream);
    });

    return pc;
  };

  /**
   * オファーを送信
   *
   * @param {String} id 通信相手のID
   * @param {RTCPeerConnection} pc
   */
  var sendOffer = function(id, pc) {
    // successCallback
    pc.createOffer(
      function(description) {
        pc.setLocalDescription(description);
        socket.emit(
          'message',
          {
            type: 'offer',
            sdp: description.sdp,
            sendto: id
          }
        );
        createInfoNotify('オファーを送信しました');
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
    createInfoNotify('オファーを受信しました');
    var id = data.from;
    var peer = createPeerConnection();
    peer.setRemoteDescription(new RTCSessionDescription(data));
    addConnection(new Connection(id, peer));

    // 自動返信
    sendAnswer(id, peer);
  };

  /**
   * 受信したオファーに対して返答
   *
   * @param {String} id
   * @param {RTCPeerConnection} peer
   */
  var sendAnswer = function(id, peer) {
    peer.createAnswer(
      // successCallback
      function(description) {
        peer.setLocalDescription(description);
        socket.emit(
          'message',
          {
            type: 'answer',
            sdp: description.sdp,
            sendto: id
          }
        );
        createInfoNotify('オファーに返答しました');
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
    createInfoNotify('オファーが許可されました');

    var id = data.from;
    var conn = getConnection(id);
    conn.peer.setRemoteDescription(new RTCSessionDescription(data));
  };

  /**
   * サーバーからCandidateを受信した時
   *
   * @param {Object} data
   */
  var onGetCandidateMessage = function(data) {
    var id = data.from;
    var conn = getConnection(id);
    conn.peer.addIceCandidate(new RTCIceCandidate(data));
  };

  /**
   * 通知を作成
   *
   * @param {String} text 通知メッセージ
   */
  var createInfoNotify = function(text) {
    new PNotify({
      text: text,
      type: 'info'
    });
  };

  // ------------------------------------------------------------ //

  // シグナリングサーバーからメッセージを受信
  socket.on('message', function(data) {
    console.log(data.type, connections);
    switch (data.type) {
      case 'call':
        onGetCallMessage(data);
        break;
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
    sendCallMessage();
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
