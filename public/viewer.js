window.onload = () => {
  document.getElementById("my-button").onclick = () => {
    init();
  };

  var socket = io("https://webstreams.herokuapp.com/");
  async function init() {
    const peer = createPeer();
    peer.addTransceiver("video", { direction: "recvonly" });
    socket.on("stream", (data) => {
      console.log("viewer data", data);
      try {
        peer
          .addIceCandidate(new RTCIceCandidate(data))
          .then((data) => console.log("DATA", data))
          .catch((err) => console.log("ERR", err));
      } catch (err) {
        peer
          .addIceCandidate(new RTCIceCandidate(data))
          .then((data) => console.log("DATA", data))
          .catch((err) => console.log("ERR", err));
      }
    });
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
    peer.ontrack = handleTrackEvent;
    peer.onicecandidate = (event) => {
      event.candidate && socket.emit("sendmestreamdata", "send it fast");

      event.candidate && socket.emit("viewerdata", event.candidate.toJSON());
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

    const { data } = await axios.post("/consumer", payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleTrackEvent(e) {
    document.getElementById("video").srcObject = e.streams[0];
  }
};
