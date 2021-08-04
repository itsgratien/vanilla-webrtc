const constraints = {
  video: true,
  audio: true,
};

const localVideo = document.querySelector('.localVideo');

const remoteVideo = document.querySelector('.remoteVideo');

remoteVideo.style.display = 'none';

// handle calls
const startCallBtn = document.querySelector('.startCall');

const configuration = {};

const pc1 = new RTCPeerConnection(configuration);

const openMediaDevices = async (constraintValues) => {
  return await navigator.mediaDevices.getUserMedia(constraintValues);
};

const getConnectedDevices = async (type) => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  return devices.filter((item) => item.kind === type);
};

const triggerMediaDeviceStream = async () => {
  try {
    const localStream = await openMediaDevices(constraints);

    localVideo.srcObject = localStream;

    localStream.getTracks().forEach((item) => {
      pc1.addTrack(item, localStream);
    });

    return localStream;
  } catch (error) {
    console.log('error', error);
  }
};

const startCallFunc = async () => {
  const remoteStream = new MediaStream();

  remoteVideo.srcObject = remoteStream;

  remoteVideo.style.display = 'block';

  localVideo.style.display = 'none';

  pc1.addEventListener('track', async (event) => {
    remoteStream.addTrack(event.track, remoteStream);
  });

  const offer = await pc1.createOffer({
    offerToReceiveAudio: 1,
    offerToReceiveVideo: 1,
  });

  await pc1.setLocalDescription(offer);

  // if (offer) {
  //   pc1.setRemoteDescription(new RTCSessionDescription(offer));

  //   const answer = await pc1.createAnswer();

  //   await pc1.setLocalDescription(answer);
  // }

  // pc1.addEventListener('icecandidate', async (event) => {
  //   try {
  //     await pc1.addIceCandidate(event.candidate);

  //     console.log('success 1');
  //   } catch (error) {
  //     console.log('error', error);
  //   }
  // });

  // pc1.addEventListener('connectionstatechange', () => {
  //   if (pc1.connectionState === 'connected') {
  //     console.log('connected');
  //   }

  //   if (pc1.connectionState === 'closed') {
  //     console.log('closed');
  //   }

  //   if (pc1.connectionState === 'failed') {
  //     console.log('closed');
  //   }
  // });
};

startCallBtn.addEventListener('click', startCallFunc);

window.addEventListener('load', triggerMediaDeviceStream);
