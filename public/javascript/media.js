const socket = io('/');

const server = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

let pc = new RTCPeerConnection(server);

let answer = null;

//documents
const localVideo = document.querySelector('.localVideo');

const remoteVideo = document.querySelector('.remoteVideo');

const callButton = document.querySelector('.callButton');

const hangupButton = document.querySelector('.hangupButton');

const answerButton = document.querySelector('.answerButton');

const openWebCamButton = document.querySelector('.openWebcamButton');

answerButton.style.display = 'none';

// setup media devices

// create offer
callButton.onclick = async () => {
  try {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localVideo.srcObject = localStream;

    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });

    const offer = await pc.createOffer();
    // set offer to local description

    await pc.setLocalDescription(offer);

    // send offer to signaling channel
    socket.emit('create-offer', { offer, callId: userId });

    // listen to incoming message
    socket.on('receive-answer', async (res) => {
      if (res) {
        const mediaStream = new MediaStream();

        remoteVideo.srcObject = mediaStream;

        const remoteStream = mediaStream;

        pc.addEventListener('track', async (event) => {
          event.streams[0].getTracks().forEach((t) => {
            remoteStream.addTrack(t, remoteStream);
          });
        });

        const remoteDesc = new RTCSessionDescription(res.answer);

        await pc.setRemoteDescription(remoteDesc);
      }
    });
    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        socket.emit('create-icecandidate', { icecandidate: event.candidate });
      }
    });

    socket.on('receive-icecandidate', async (res) => {
      try {
        if (res.icecandidate) {
          if (!pc || pc.remoteDescription) {
            await pc.addIceCandidate(res.icecandidate);
          }
        }
      } catch (error) {
        console.log('failed to add ice candidate', error);
      }
    });
  } catch (error) {
    console.log('call error', error);
  }
};

socket.on('receive-offer', async (res) => {
  if (res && res.callId !== userId) {
    alert(`Someone is calling you with ID of: ${res.callId}`);

    callButton.style.display = 'none';

    answerButton.style.display = 'block';

    answerButton.setAttribute('callId', res.callId);

    pc.setRemoteDescription(new RTCSessionDescription(res.offer));

    const newAnswer = await pc.createAnswer();

    await pc.setLocalDescription(answer);

    answer = newAnswer;
  }
});

answerButton.onclick = async () => {
  try {
    if (answer) {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localVideo.srcObject = localStream;

      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      const mediaStream = new MediaStream();

      remoteVideo.srcObject = mediaStream;

      const remoteStream = mediaStream;

      pc.addEventListener('track', async (event) => {
        event.streams[0].getTracks().forEach((t) => {
          remoteStream.addTrack(t, remoteStream);
        });
      });

      const callId = answerButton.getAttribute('callId');

      socket.emit('create-answer', { answer, callId, userId });
    }
    pc.addEventListener('icecandidate', (event) => {
      if (event.candidate) {
        socket.emit('create-icecandidate', { icecandidate: event.candidate });
      }
    });

    socket.on('receive-icecandidate', async (res) => {
      try {
        if (res.icecandidate) {
          if (!pc || pc.remoteDescription) {
            await pc.addIceCandidate(res.icecandidate);
          }
        }
      } catch (error) {
        console.log('failed to add ice candidate', error);
      }
    });
  } catch (error) {
    console.log('answer error', error);
  }
};
