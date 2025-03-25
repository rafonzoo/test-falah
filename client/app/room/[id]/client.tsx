'use client'

import { MultiPeerCall } from '@/components/call-multi-peer'
import { PeerToPeerCall } from '@/components/call-peer-to-peer'
import type { ParticipantType } from '@/components/participant'
import { useSearchParams } from 'next/navigation'

type RoomClientProps = ParticipantType & {
  children?: React.ReactNode
}

export const RoomClient: React.FC<RoomClientProps> = ({ children, ...auth }) => {
  const sp = useSearchParams()

  if (sp.get('gc') /** TODO */) {
    return <MultiPeerCall {...auth} />
  }

  if (sp.get('vc')) {
    return <PeerToPeerCall {...auth} />
  }

  return <main className='flex h-full flex-col'>{children}</main>
}
