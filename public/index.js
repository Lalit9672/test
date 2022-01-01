window.onload = () => {
  document.getElementById("my-button").onclick = () => {
    init();
  };
  var socket = io("https://webstreams.herokuapp.com//");
  async function init() {
    navigator.getUserMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia;

    if (navigator.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      document.getElementById("video").srcObject = stream;
      const peer = createPeer();

      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    }
  }

  function createPeer() {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: ["turn:13.250.13.83:3478?transport=udp"],
          username: "YzYNCouZM1mhqhmseWk6",
          credential: "YzYNCouZM1mhqhmseWk6",
        },
      ],
      iceCandidatePoolSize: 10,
    });
    peer.onicecandidate = (event) => {
      event.candidate &&
        socket.on("senddata", (data) => {
          socket.emit("streamerdata", event.candidate.toJSON());
        });
    };
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

    return peer;
  }

  async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
      sdp: peer.localDescription,
    };

    const { data } = await axios.post("/broadcast", payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((e) => console.log(e));

    socket.on("viewdata", (data) => {
      console.log("stream data", data);
      const candidate = new RTCIceCandidate(data);
      peer
        .addIceCandidate(candidate)
        .then((data) => console.log("DATA", data))
        .catch((err) => console.log("ERR", err));
    });
  }
};
