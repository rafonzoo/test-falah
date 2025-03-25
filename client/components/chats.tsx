'use client'

import type { ParticipantType } from '@/components/participant'
import { useEffect, useRef, useState } from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { IoAddOutline } from 'react-icons/io5'
import { FaUserCircle } from 'react-icons/fa'
import { useSocket } from '@/hooks/use-socket'
import { LuAudioLines } from 'react-icons/lu'
import { useRouter } from 'next/navigation'

type ChatType = {
  name: string
  content: string
  isMe: boolean
}

const SendMessage: React.FC<ParticipantType> = ({ token, room }) => {
  const [message, setMessage] = useState('')
  const socket = useSocket(token)
  const routerRef = useRef(useRouter())

  const sendMessage = () => {
    if (!socket || !message.trim()) return

    socket.emit('message', { content: message })
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className='bg-background sticky bottom-0 z-10 flex-col items-center pb-4'>
      <div className='bg-muted flex h-10 items-center border-t px-4'>
        <LuAudioLines size={20} />
        <p className='pl-3 text-sm font-medium'>Join group call</p>
        <button
          className='bg-primary text-primary-foreground ml-auto rounded-full px-3 py-1 text-xs font-semibold'
          onClick={() => routerRef.current.push(`/room/${room}?gc=1`)}
        >
          Join
        </button>
      </div>
      <div className='flex w-full items-center gap-3 border-t px-4 pt-4'>
        <div className='bg-secondary text-muted-foreground flex size-10 items-center justify-center rounded-full'>
          <IoAddOutline size={24} />
        </div>
        <div className='relative grow'>
          <Input
            name='message'
            type='text'
            placeholder='Type a message'
            autoComplete='off'
            value={message}
            className='h-10 rounded-full md:text-base'
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setMessage(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))
            }}
          />
        </div>
      </div>
    </div>
  )
}

export const Chats: React.FC<ParticipantType> = (auth) => {
  const [messages, setMessages] = useState<ChatType[]>([])
  const socket = useSocket(auth.token)
  const userRef = useRef(auth)

  useEffect(() => {
    if (!socket) return

    socket.on('message', (messages: { name: string; content: string }[]) => {
      setMessages(() =>
        messages.map((msg) => ({
          ...msg,
          isMe: msg.name === userRef.current.name,
        }))
      )
    })

    return () => {
      socket.off('message')
    }
  }, [socket])

  return (
    <div className='flex h-full flex-col justify-between'>
      <div className='bg-background max-h-full grow p-4'>
        <div className='mb-1 text-center text-[10px] leading-[13px] font-semibold tracking-wide opacity-50'>
          <p>iMessage</p>
          <p>Saturday 9:41 AM</p>
        </div>
        <ul className='flex flex-col gap-[18px]'>
          {messages.map(({ name, content, isMe }, index) => (
            <li
              key={index}
              className={cn(
                'grid w-full items-end gap-1.5',
                isMe ? 'grid-cols-1' : 'grid-cols-[2.25rem_auto]'
              )}
            >
              {!isMe && (
                <FaUserCircle className='text-foreground/20 dark:text-foreground/30 size-9' />
              )}
              <div className={cn('flex flex-col', isMe ? 'items-end' : '')}>
                {!isMe && (
                  <span className='text-muted-foreground px-3 text-[10px] leading-[13px] font-medium tracking-wide capitalize'>
                    {name}
                  </span>
                )}
                <div className='relative max-w-[80%]'>
                  <svg
                    width='17'
                    height='17'
                    viewBox='0 0 17 17'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className={cn(
                      'absolute bottom-0',
                      isMe ? '-right-1 -scale-x-100 fill-[#0078FF]' : 'fill-muted -left-1'
                    )}
                  >
                    <path d='M5 10.5C4.49857 13.5086 1.66667 16.3333 0 17C6.4 17 10.5 14.8333 11.5 13.5L16.5 15L16 0H5.5V2V4V4.5C5.5 5.5 5.5 7.5 5 10.5Z' />
                  </svg>
                  <p
                    className={cn(
                      'relative w-fit rounded-[20px] px-3 py-2 text-sm leading-[19px]',
                      isMe ? 'bg-[#0078FF] font-medium text-white' : 'bg-muted mt-0.5'
                    )}
                  >
                    {content}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <SendMessage {...auth} />
    </div>
  )
}
