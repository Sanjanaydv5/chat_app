import React, { useEffect, useRef, useState } from 'react';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa';
import { useChatStore } from '../../store/chatStore';
import useUserStore from '../../store/useUserStore';
import { getSocket } from '../../services/chat.service';

const VideoCall = () => {
    const { call, localStream, remoteStream, endCall, answerCall, rejectCall, incomingCall } = useChatStore();
    const { user: currentUser } = useUserStore();
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerConnection = useRef();
    const socket = getSocket();

    // WebRTC Configuration
    const servers = {
        iceServers: [
            { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
        ]
    };

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Initialize WebRTC Peer Connection
    const createPeerConnection = (targetId) => {
        const pc = new RTCPeerConnection(servers);
        
        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('ice_candidate', { to: targetId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            useChatStore.setState({ remoteStream: event.streams[0] });
        };

        if (localStream) {
            localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }

        peerConnection.current = pc;
        return pc;
    };

    // Handle Signaling
    useEffect(() => {
        const handleSignal = async () => {
            if (call.calling && !call.accepted && call.isOutgoing) {
                // Initiator logic
                const pc = createPeerConnection(call.targetId);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                socket.emit('call_user', {
                    userToCall: call.targetId,
                    signalData: offer,
                    from: currentUser._id,
                    name: currentUser.username
                });
            } else if (call.accepted && call.isIncoming && call.signal) {
                // Receiver logic
                const pc = createPeerConnection(call.targetId);
                await pc.setRemoteDescription(new RTCSessionDescription(call.signal));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                socket.emit('answer_call', { to: call.targetId, signal: answer });
            } else if (call.accepted && call.isOutgoing && call.signal) {
                // Initiator receiving answer
                if (peerConnection.current) {
                    await peerConnection.current.setRemoteDescription(new RTCSessionDescription(call.signal));
                }
            }
        };

        if (socket && (call.calling || (call.accepted && call.signal))) {
            handleSignal();
        }

        // Handle ICE candidates from store state
        if (call.candidate && peerConnection.current) {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(call.candidate))
                .catch(e => console.error("Error adding ice candidate:", e));
        }

    }, [call, socket, currentUser]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks()[0].enabled = isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks()[0].enabled = isVideoOff;
            setIsVideoOff(!isVideoOff);
        }
    };

    if (incomingCall && !call.accepted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="bg-[#2a3942] p-8 rounded-3xl text-center shadow-2xl border border-gray-700 animate-pulse">
                    <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                        {incomingCall.name[0].toUpperCase()}
                    </div>
                    <h2 className="text-white text-2xl font-bold mb-2">{incomingCall.name}</h2>
                    <p className="text-gray-400 mb-8 font-medium">Incoming Video Call...</p>
                    <div className="flex gap-6 justify-center">
                        <button onClick={answerCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30">
                            <FaVideo />
                        </button>
                        <button onClick={rejectCall} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/30">
                            <FaPhoneSlash />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!call.targetId && !call.calling) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col">
            {/* Main Video Area */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                {remoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 bg-gray-700 rounded-full mb-4 animate-ping"></div>
                        <p className="text-white text-xl font-medium">Calling...</p>
                    </div>
                )}

                {/* Local Preview */}
                <div className="absolute top-6 right-6 w-1/4 max-w-[240px] aspect-video bg-[#111b21] rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl z-10">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                </div>
            </div>

            {/* Controls */}
            <div className="h-32 bg-[#111b21] flex items-center justify-center gap-8 border-t border-gray-800">
                <button 
                    onClick={toggleMute} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-[#2a3942] text-gray-300 hover:bg-[#3b4a54]'}`}
                >
                    {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                </button>
                
                <button 
                    onClick={() => endCall(call.targetId)} 
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-2xl text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                    <FaPhoneSlash />
                </button>

                <button 
                    onClick={toggleVideo} 
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-[#2a3942] text-gray-300 hover:bg-[#3b4a54]'}`}
                >
                    {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                </button>
            </div>
        </div>
    );
};

export default VideoCall;
