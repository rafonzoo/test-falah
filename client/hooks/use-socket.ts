import { useEffect, useRef, useState } from 'react'

export const useSocket = (token?: string) => {
  const tokenRef = useRef(token)
  const [socket, setSocket] = useState<import('socket.io-client').Socket | null>(null)

  useEffect(() => {
    async function loadSocket() {
      const { io } = await import('socket.io-client')

      setSocket(
        io('http://localhost:3001', {
          withCredentials: true,
          auth: {
            token: tokenRef.current,
          },
        })
      )
    }

    loadSocket()
  }, [])

  useEffect(() => {
    return () => {
      socket?.disconnect()
    }
  }, [socket])

  return socket
}
