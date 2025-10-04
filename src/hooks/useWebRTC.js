import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

export default function useWebRTC(currentUserId) {
    const socket = useRef(io("http://localhost:5000", {
        transports: ['websocket'], // force websocket
    })).current;

    // queue for ICE candidates arriving too early
    const iceQueue = useRef([]);
    const pc = useRef(null);
    const localStream = useRef(null);

    const [remoteStream, setRemoteStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);

    // Handle incoming events
    useEffect(() => {

        socket.emit('connection', () => {
            console.log('connected to socket server', socket.id);
            socket.emit('join', currentUserId);
        });

        socket.emit('join', currentUserId);

        socket.on("incoming-call", ({ from, fromUser, offer, callType }) => {
            setIncomingCall({ from, fromUser, offer, callType });
        });

        socket.on("call-accepted", async ({ answer }) => {
            if (pc.current) {
                await pc.current.setRemoteDescription(answer);
                // flush queued ICE
                for (const c of iceQueue.current) {
                    try {
                        await pc.current.addIceCandidate(c);
                    } catch (err) {
                        console.error("Error adding queued ICE", err);
                    }
                }
                iceQueue.current = [];
            }
        });

        socket.on("call-rejected", () => {
            alert("Call rejected");
            hangup();
        });

        socket.on("ice-candidate", async ({ candidate }) => {
            if (candidate) {
                if (pc.current && pc.current.remoteDescription) {
                    try {
                        await pc.current.addIceCandidate(candidate);
                    } catch (err) {
                        console.error("Error adding ICE candidate", err);
                    }
                } else {
                    iceQueue.current.push(candidate);
                }
            }
        });

    }, [currentUserId]);

    // create RTCPeerConnection and local stream
    const createPeerConnection = async (to, callType) => {
        pc.current = new RTCPeerConnection();

        // Clean up previous stream to avoid NotReadableError
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
        }

        localStream.current = await navigator.mediaDevices.getUserMedia(
            callType === "video" ? { audio: true, video: true } : { audio: true }
        );

        localStream.current.getTracks().forEach((track) =>
            pc.current.addTrack(track, localStream.current)
        );

        const remote = new MediaStream();
        pc.current.ontrack = (event) => {
            remote.addTrack(event.track);
            setRemoteStream(remote);
        };

        pc.current.onicecandidate = ({ candidate }) => {
            if (candidate) {
                socket.emit("ice-candidate", { to, candidate });
            }
        };
    };

    const callUser = async (to, callType, fromUser) => {
        await createPeerConnection(to, callType);

        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);

        socket.emit("call-user", { to, offer, callType, fromUser });
    };

    const acceptCall = async () => {
        const { from, offer, callType } = incomingCall;
        await createPeerConnection(from, callType);

        await pc.current.setRemoteDescription(offer);
        const answer = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answer);

        socket.emit("accept-call", { to: from, answer });

        // flush any queued ICE
        for (const c of iceQueue.current) {
            try {
                await pc.current.addIceCandidate(c);
            } catch (err) {
                console.error("Error adding queued ICE after accept", err);
            }
        }
        iceQueue.current = [];
        setIncomingCall(null);
    };

    const rejectCall = () => {
        socket.emit("reject-call", { to: incomingCall.from });
        setIncomingCall(null);
    };

    const hangup = () => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach((t) => t.stop());
            localStream.current = null;
        }
        setRemoteStream(null);
        setIncomingCall(null);
    };

    return {
        socket,
        localStream,
        remoteStream,
        incomingCall,
        callUser,
        acceptCall,
        rejectCall,
        hangup,
    };
}
