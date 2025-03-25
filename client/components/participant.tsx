'use client'

import { useEffect, useRef, useState } from 'react'
import { FaUserCircle } from 'react-icons/fa'
import { IoClose, IoVideocam } from 'react-icons/io5'

import { Button } from '@/components/ui/button'
import { useSocket } from '@/hooks/use-socket'
import { useRouter } from 'next/navigation'
import { IoIosCall } from 'react-icons/io'

type RoomParticipants = { name: string } & RoomType

type RoomType = { online: boolean; socketId: string }

type RoomUserType = { [u: string]: RoomType }

export type ParticipantType = {
  name: string
  room: string
  token: string
}

export const Participant: React.FC<ParticipantType> = (auth) => {
  const [participant, setParticipant] = useState<RoomParticipants[]>([])
  const [incomingCall, setIncomingCall] = useState('')
  const [callToName, setCallToName] = useState('')
  const socket = useSocket(auth.token)
  const authRef = useRef(auth)
  const me = authRef.current.name
  const router = useRouter()
  const navigate = useRef((path: string) => {
    router.push(`/room/${auth.room}?vc=${path}`)
  })

  useEffect(() => {
    if (!socket) return

    socket.on('roomUsers', (inRoom: RoomUserType) => {
      setParticipant(Object.keys(inRoom).map((name) => ({ ...inRoom[name], name })))
    })

    // Ask target to connect
    socket.on('ask', (data) => {
      if (data.to === authRef.current.name) {
        setIncomingCall(data.from)
      }
    })

    // Bring caller to the room
    socket.on('accept', (data) => {
      if (data.to === authRef.current.name) {
        navigate.current(data.from)
      }
    })

    // Bring target to the room
    socket.on('offer', (data) => {
      if (data.to === authRef.current.name) {
        navigate.current(data.from)
      }
    })

    // Abort both caller or target
    socket.on('cancel', (name) => {
      if (name === authRef.current.name) {
        setIncomingCall('')
        setCallToName('')
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [socket])

  const itsMe = participant.find((user) => user.name === me)
  const onlineUsers = [
    ...(itsMe ? [itsMe] : []),
    ...participant.filter((user) => user.name !== me && user.online),
    ...participant.filter((user) => user.name !== me && !user.online),
  ]

  return (
    <div className='border-b-foreground/20 bg-background border-b'>
      {(incomingCall || callToName) && (
        <div className='fixed top-0 right-0 left-0 z-5'>
          <div className='relative mx-auto w-full max-w-[390px] px-4 pt-4'>
            <div className='rounded-[48px] bg-zinc-800/80 p-2 text-white backdrop-blur-lg'>
              <div className='flex items-center gap-2'>
                <FaUserCircle className='size-11 text-white/60 dark:text-white/30' />
                <div>
                  <p className='text-sm font-semibold capitalize'>{incomingCall || callToName}</p>
                  <p className='flex w-full items-center gap-1 text-xs font-semibold capitalize'>
                    <IoVideocam size={16} className='text-white/70' />
                    <span className='text-white/50'>
                      {incomingCall ? 'Incoming call...' : 'Calling...'}
                    </span>
                  </p>
                </div>
                <div className='ml-auto flex gap-2'>
                  <button
                    className='inline-flex size-11 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600'
                    onClick={() => {
                      socket?.emit('cancel', incomingCall || callToName)
                      void (incomingCall ? setIncomingCall('') : setCallToName(''))
                    }}
                  >
                    <IoClose size={28} />
                  </button>
                  {incomingCall && (
                    <button
                      className='inline-flex size-11 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600'
                      onClick={() => {
                        socket?.emit('accept', { to: incomingCall, from: authRef.current.name })
                        setIncomingCall('')
                      }}
                    >
                      <IoIosCall size={28} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ul className='flex min-h-[99px] flex-nowrap gap-3 overflow-x-auto p-4 text-center'>
        {onlineUsers.map((user, index) => (
          <li key={index} className='flex w-12 flex-col'>
            <Button
              variant='ghost'
              className='relative h-auto cursor-pointer rounded-full !p-0 !opacity-100'
              disabled={user.name === authRef.current.name || !user.online}
              onClick={() => {
                socket?.emit('ask', { to: user.name, from: authRef.current.name })
                setCallToName(user.name)
              }}
            >
              <FaUserCircle className='text-foreground/20 dark:text-foreground/30 size-12' />
              {user.name !== authRef.current.name && user.online && (
                <span className='bg-background absolute -right-1.5 -bottom-2 flex size-7 items-center justify-center rounded-full'>
                  <IoVideocam className='text-ring' />
                </span>
              )}
            </Button>
            <p className='mt-1 max-w-full truncate text-[10px] leading-[15px] font-medium capitalize'>
              {user.name === me ? 'Me' : user.name}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
