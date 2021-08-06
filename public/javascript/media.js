const socket = io('/');

const server = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

let pc = new RTCPeerConnection(server);

let localStream = null;

let remoteStream = null;

//documents
const localVideo = document.querySelector('.localVideo');

const remoteVideo = document.querySelector('.remoteVideo');

const callButton = document.querySelector('.callButton');

const hangupButton = document.querySelector('.hangupButton');

const answerButton = document.querySelector('.answerButton');

const openWebCamButton = document.querySelector('.openWebcamButton');

answerButton.style.display = 'none';

//notify user
socket.on('notify-call', (value) => {
  alert(`Someone is calling you with ID of: ${value.callId}`);

  callButton.style.display = 'none';

  answerButton.style.display = 'block';

  answerButton.setAttribute('callId', value.callId);

  answerButton.setAttribute('offerId', value.offerId);
});

// setup media devices
openWebCamButton.onclick = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  remoteStream = new MediaStream();

  // add track from local stream to peerConnection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  //pull track from remote stream and add to video stream
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track, remoteStream);
    });
  };

  localVideo.srcObject = localStream;

  remoteVideo.srcObject = remoteStream;
};

// create offer
callButton.onclick = async () => {
  const offerDescription = await pc.createOffer();

  await pc.setLocalDescription(offerDescription);

  const offer = {
    offer: offerDescription,
    userId,
  };
  // create offer by sending create-offer event
  socket.emit('create-offer', offer);

  //listen to remote answer
  socket.on('get-remote-answer', (value) => {
    if (!pc.currentRemoteDescription && value) {
      const answerDescription = new RTCSessionDescription(value.answer);

      pc.setRemoteDescription(answerDescription);
    }
  });

  // listen to remote ice candidate and turn them to local peer connection
  socket.on('get-icecandidate', async (value) => {
    console.log('value', value);
    const candidate = new RTCIceCandidate(value.candidate);

    await pc.addIceCandidate(candidate);
  });
};

// answer call with unique id of user who is calling you
answerButton.onclick = async () => {
  const callId = answerButton.getAttribute('callId');

  const offerId = answerButton.getAttribute('offerId');

  const callOfferRes = await (
    await fetch(`/offer/${callId}/${offerId}`)
  ).json();

  const offerDescription = await callOfferRes.data;

  await pc.setRemoteDescription(
    new RTCSessionDescription(offerDescription.offer)
  );

  const answerDescription = await pc.createAnswer();

  await pc.setLocalDescription(answerDescription);

  socket.emit('add-answer', { userId: callId, answer: answerDescription });

  //listen
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('add-icecandidate', {
        userId: callId,
        candidate: event.candidate,
      });
    }
  };
};
