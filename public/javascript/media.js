const socket = io('/');

const constraints = { video: true, audio: true };

const localVideo = document.querySelector('.localVideo');

const callBtn = document.querySelector('.startCall');

let pc1;

let pc2;

let localStream;

const configuration = {};

const openMediaDevices = async (constraintValues) => {
  return await navigator.mediaDevices.getUserMedia(constraintValues);
};

const getConnectedDevices = async (type) => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  return devices.filter((item) => item.kind === type);
};

const triggerMediaDeviceStream = async () => {
  try {
    const s = await openMediaDevices(constraints);

    localVideo.srcObject = s;

    localStream = s;

    return localStream;
  } catch (error) {
    console.log('error', error);
  }
};

const makeCall = async () => {
  try {
    const callingUser = callBtn.getAttribute('data-username');

    pc1 = new RTCPeerConnection(configuration);

    const offer = await pc1.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });

    await pc1.setLocalDescription(offer);

    socket.emit('make-call', { offer, username: callingUser });

    socket.on('receive-answer', async (answer) => {
      if (answer) {
        const remoteDesc = new RTCSessionDescription(answer);

        await pc1.setRemoteDescription(remoteDesc);
      }
    });

    //listen to local ice candidate
    pc1.addEventListener('icecandidate', (event) => {
      socket.emit('ice', { candidate: event.candidate, username });
    });

    //listen to remote ice candidate
    socket.on('receive-ice', async (data) => {
      await pc1.addIceCandidate(data);
    });

    pc1.addEventListener('connectionstatechange', (event) => {
      if (pc1.connectionState === 'connected') {
        console.log('connected pc1');
      }
    });

    if (localStream) {
      localStream.getTracks().forEach((v) => {
        pc1.addTrack(v, localStream);
      });
    }

    const remoteStream = new MediaStream();

    const remoteVideo = document.createElement('video');

    remoteVideo.autoplay = true;

    remoteVideo.srcObject = remoteStream;

    pc1.addEventListener('track', async (event) => {
      remoteStream.addTrack(event.track, remoteStream);
    });

    const videoOutput = document.querySelector('.videoOutput');

    videoOutput.appendChild(remoteVideo);
  } catch (error) {}
};

const receiveCall = async (value) => {
  pc2 = new RTCPeerConnection(configuration);

  pc2.setRemoteDescription(new RTCSessionDescription(value.offer));

  const answer = await pc2.createAnswer();

  await pc2.setLocalDescription(answer);

  socket.emit('answer', answer);

  //listen to local ice candidate
  pc2.addEventListener('icecandidate', (event) => {
    socket.emit('ice', { candidate: event.candidate, username });
  });

  //listen to remote ice candidate
  socket.on('receive-ice', async (data) => {
    await pc2.addIceCandidate(data);
  });

  pc2.addEventListener('connectionstatechange', (event) => {
    if (pc2.connectionState === 'connected') {
      console.log('connected pc2');
    }
  });
};

window.addEventListener('load', triggerMediaDeviceStream);

callBtn.addEventListener('click', makeCall);

socket.on('incoming-call', receiveCall);
