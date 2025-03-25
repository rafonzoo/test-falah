'use client'

import { useEffect, useRef, useState } from 'react'
import { IoClose, IoVideocam } from 'react-icons/io5'
import { HiSpeakerWave } from 'react-icons/hi2'
import { BsFillMicMuteFill } from 'react-icons/bs'
import { useSocket } from '@/hooks/use-socket'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FaUserCircle } from 'react-icons/fa'
import type { ParticipantType } from '@/components/participant'

const CALL_STATES = {
  IDLE: 'idle',
  CALLING: 'calling',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  FAILED: 'failed',
}

export const PeerToPeerCall: React.FC<ParticipantType> = (auth) => {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const searchParams = useSearchParams()
  const [callState, setCallState] = useState(CALL_STATES.IDLE)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const authRef = useRef(auth)
  const socket = useSocket(authRef.current.token)
  const rtc = useRef<RTCPeerConnection | null>(null)
  const recipient = useRef({ target: searchParams.get('vc') })
  const routerRef = useRef(useRouter())

  useEffect(() => {
    if (!socket) return

    socket.on('hangup', () => {
      new Promise((res) => res(rtc.current?.close())).then(() => routerRef.current.back())
    })

    socket.on('signal', async (data) => {
      try {
        await rtc.current?.addIceCandidate(
          new RTCIceCandidate({
            sdpMLineIndex: data.label,
            candidate: data.candidate,
          })
        )
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    })

    socket.on('offer', async (data) => {
      if (data.offer.sdp && rtc.current) {
        await rtc.current.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await rtc.current?.createAnswer()
        await rtc.current.setLocalDescription(answer)

        return socket.emit('answer', answer)
      }
    })

    socket.on('answer', async (data: RTCSessionDescriptionInit) => {
      if (data.sdp && rtc.current && rtc.current.signalingState === 'have-local-offer') {
        await rtc.current.setRemoteDescription(new RTCSessionDescription(data))
      }
    })

    const media = navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })

    media
      .then(async (stream) => {
        if (!localStreamRef.current) {
          localStreamRef.current = stream
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        if (!rtc.current) {
          rtc.current = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:127.0.0.1:3478', username: 'user1', credential: 'password123' },
              { urls: 'stun:127.0.0.1:3478', username: 'user2', credential: 'securepass' },
            ],
          })
        }

        const tracks = stream.getTracks()
        for (let i = 0; i < tracks.length; i++) {
          rtc.current.addTrack(tracks[i], localStreamRef.current)
        }

        setCallState(CALL_STATES.CALLING)

        rtc.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0]
            remoteStreamRef.current = event.streams[0]
          }
        }

        rtc.current.onconnectionstatechange = () => {
          console.log('Connection state change:', rtc.current?.connectionState)
          setCallState(rtc.current?.connectionState ?? CALL_STATES.IDLE)
        }

        rtc.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('signal', {
              label: event.candidate.sdpMLineIndex,
              candidate: event.candidate.candidate,
            })
          }
        }

        if (rtc.current.signalingState === 'stable') {
          const offer = await rtc.current.createOffer()
          await rtc.current.setLocalDescription(offer)

          socket.emit('offer', {
            offer,
            from: authRef.current.name,
            to: recipient.current.target,
          })
        }
      })
      .catch((error) => {
        console.log('Error accessing media devices:', error)
        alert('Could not access camera or microphone')
        socket?.emit('hangup')
      })

    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      rtc.current?.close()
      rtc.current = null
    }
  }, [socket])

  // Track failure call
  useEffect(() => {
    if (callState === CALL_STATES.DISCONNECTED) {
      remoteStreamRef.current?.getTracks().forEach((track) => track.stop())
    }

    if (callState === CALL_STATES.FAILED) {
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      socket?.emit('hangup')
    }
  }, [callState, socket])

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })

      setIsMuted((prev) => !prev)
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })

      setIsVideoOff((prev) => !prev)
    }
  }

  const toggleSpeaker = () => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.muted = !remoteVideoRef.current.muted
      setIsSpeakerOff((prev) => !prev)
    }
  }

  return (
    <div className='absolute inset-0'>
      <div className='relative flex h-full w-full flex-col bg-black text-white md:justify-end'>
        {/* Main video (local during calling, remote when connected) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className='absolute top-0 left-0 h-full w-full -scale-x-100 object-cover'
          onLoad={() => toggleMute()}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={cn(
            'absolute right-6 bottom-6 z-10 aspect-[9/16] w-24 -scale-x-100 rounded-lg border border-white/20 bg-zinc-900 object-cover md:aspect-video md:w-[270px]',
            ![CALL_STATES.CONNECTED, CALL_STATES.DISCONNECTED].includes(callState) && 'invisible'
          )}
        />

        {/* Call control info */}
        <div className='relative mx-auto w-full max-w-[390px] px-4 pt-4 md:mt-auto md:mb-6 md:ml-0 md:px-8'>
          <div className='-mx-2 rounded-[48px] bg-zinc-700/60 p-2 backdrop-blur-lg'>
            <div className='flex items-center gap-2'>
              <FaUserCircle className='size-11 text-white/60' />
              <div>
                <p className='text-sm font-semibold capitalize'>{recipient.current.target}</p>
                <p className='flex w-full items-center gap-1 text-xs font-semibold'>
                  <IoVideocam size={16} className='text-white/70' />
                  <span className='text-zinc-400'>
                    {callState === CALL_STATES.IDLE && 'Checking permission...'}
                    {callState === CALL_STATES.CALLING && 'Calling...'}
                    {callState === CALL_STATES.CONNECTING && 'Connecting...'}
                    {callState === CALL_STATES.CONNECTED && 'Connected'}
                    {callState === CALL_STATES.DISCONNECTED && 'Reconnecting...'}
                    {callState === CALL_STATES.FAILED && 'Call failed'}
                  </span>
                </p>
              </div>

              {(callState === CALL_STATES.CALLING || callState === CALL_STATES.CONNECTING) && (
                <div className='ml-auto flex gap-2'>
                  <button
                    className='inline-flex size-11 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600'
                    onClick={() => socket?.emit('hangup')}
                  >
                    <IoClose size={28} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Call controls when connected */}
          {[CALL_STATES.CONNECTED, CALL_STATES.DISCONNECTED].includes(callState) && (
            <div className='mt-3 flex rounded-[20px] text-center'>
              <div className='flex gap-4'>
                <div className='mr-auto'>
                  <button
                    onClick={toggleSpeaker}
                    className={cn(
                      'inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-300',
                      isSpeakerOff ? 'bg-zinc-700/60 backdrop-blur-lg' : 'bg-white text-black'
                    )}
                  >
                    <HiSpeakerWave size={22} />
                  </button>
                  <p className='mt-0.5 text-[10px] leading-3.5 font-medium tracking-wide text-white/90'>
                    Speaker
                  </p>
                </div>
                <div>
                  <button
                    onClick={toggleVideo}
                    className={cn(
                      'inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-300',
                      isVideoOff ? 'bg-zinc-700/60 backdrop-blur-lg' : 'bg-white text-black'
                    )}
                  >
                    <IoVideocam size={26} />
                  </button>
                  <p className='mt-0.5 text-[10px] leading-3.5 font-medium tracking-wide text-white/90'>
                    Video
                  </p>
                </div>
                <div>
                  <button
                    onClick={toggleMute}
                    className={cn(
                      'inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-zinc-300',
                      isMuted ? 'bg-zinc-700/60 backdrop-blur-lg' : 'bg-white text-black'
                    )}
                  >
                    <BsFillMicMuteFill size={20} />
                  </button>
                  <p className='mt-0.5 text-[10px] leading-3.5 font-medium tracking-wide text-white/90'>
                    Mute
                  </p>
                </div>
              </div>
              <div className='ml-auto'>
                <button
                  className='inline-flex size-11 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600'
                  onClick={() => socket?.emit('hangup')}
                >
                  <IoClose size={28} />
                </button>
                <p className='mt-0.5 text-[10px] leading-3.5 font-medium tracking-wide text-white/90'>
                  End
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
