'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { notFound, redirect, RedirectType } from 'next/navigation'
import jwt from 'jsonwebtoken'

export async function getSession(routeRoom?: string) {
  const cookie = await cookies()
  const token = cookie.get('token')?.value

  if (!routeRoom) {
    return notFound()
  }

  if (!token) {
    return redirect('/?s=1', RedirectType.replace)
  }

  let name = ''
  let room = ''

  try {
    const auth = jwt.verify(token, 'kitakesana')

    name = decodeURIComponent((auth as { [x: string]: string }).name)
    room = (auth as { [x: string]: string }).room
  } catch (e) {
    console.log(e)
  }

  if (room !== routeRoom) return redirect('/', RedirectType.replace)
  return { name, room, token }
}

export async function setSession(form: FormData) {
  const name = encodeURIComponent((form.get('name') as string | null)?.trim() ?? '')
  const room = encodeURIComponent((form.get('room') as string | null)?.trim() ?? '')

  // Get the token
  const response = await fetch('http://localhost:3001/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, room }),
    next: { revalidate: 0 },
  })

  const { token } = (await response.json()) as { token: string }
  const cookie = await cookies()

  // Only http, and shorten token life in frontend (maxAge: 60 * 5)
  cookie.set('token', token, { httpOnly: true, path: '/' })

  revalidatePath('/room')
  redirect(`/room/${room}`)
}
