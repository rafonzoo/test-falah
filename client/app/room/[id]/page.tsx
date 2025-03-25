import { getSession } from '@/action/auth'
import { Chats } from '@/components/chats'
import { Participant } from '@/components/participant'
import { RoomClient } from './client'

type RoomPageProps = {
  params: Promise<{ id?: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const roomName = (await params).id
  const auth = await getSession(roomName)

  return (
    <RoomClient {...auth}>
      <Participant {...auth} />
      <div className='grow'>
        <Chats {...auth} />
      </div>
    </RoomClient>
  )
}
