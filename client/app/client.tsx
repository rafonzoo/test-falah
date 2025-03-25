'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { setSession } from '@/action/auth'
import { ImSpinner3 } from 'react-icons/im'
import { useSearchParams } from 'next/navigation'

const FormInput = () => {
  const [loading, setLoading] = useState(false)
  const { pending } = useFormStatus()
  return (
    <>
      <Input
        type='text'
        name='name'
        placeholder='Enter your name'
        id='name'
        autoComplete='off'
        required
        disabled={pending}
      />
      <Select name='room' disabled={pending} required defaultValue='engineer'>
        <SelectTrigger className='w-full text-base' size='lg'>
          <SelectValue placeholder='Select your team' />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Team</SelectLabel>
            <SelectItem value='engineer'>Engineer</SelectItem>
            <SelectItem value='designer'>Designer</SelectItem>
            <SelectItem value='dev-ops'>DevOps</SelectItem>
            <SelectItem value='sqa'>QA</SelectItem>
            <SelectItem value='marketing'>Marketing</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        disabled={pending || loading}
        className='mt-2.5 bg-blue-500 text-lg font-semibold text-white hover:bg-blue-400'
        onClick={(e) => {
          e.preventDefault()
          setLoading(true)
          e.currentTarget.closest('form')?.requestSubmit()
        }}
      >
        {pending || loading ? <ImSpinner3 className='!size-5 animate-spin' /> : 'Enter'}
      </Button>
    </>
  )
}

export default function PopoverAuthentication({ children }: { children?: React.ReactNode }) {
  const defaultOpen = useSearchParams().get('s')
  const [open, onOpenChange] = useState(Boolean(defaultOpen))

  return (
    <Popover modal {...{ open, onOpenChange }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side='top' sideOffset={12}>
        <h2 className='font-semibold'>Join the team</h2>
        <form action={setSession} className='mt-2.5 flex flex-col gap-2.5 *:h-12 *:md:text-base'>
          <FormInput />
        </form>
      </PopoverContent>
    </Popover>
  )
}
