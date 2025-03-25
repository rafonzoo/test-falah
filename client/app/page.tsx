'use client'

import { useTheme } from 'next-themes'
import { CgDarkMode } from 'react-icons/cg'
import dynamic from 'next/dynamic'

import { Button } from '@/components/ui/button'

const ThemeToggle = () => {
  const { setTheme } = useTheme()

  return (
    <div className='absolute right-0 bottom-0 left-0 z-5'>
      <div className='mx-auto max-w-[100px] pb-6'>
        <button
          className='mx-auto flex items-center gap-1.5 text-sm whitespace-nowrap'
          onClick={() =>
            setTheme((prev) => (prev === 'light' || prev === 'system' ? 'dark' : 'light'))
          }
        >
          <CgDarkMode size={32} />
        </button>
      </div>
    </div>
  )
}

const LetsGoButton = (props: React.ComponentProps<typeof Button>) => (
  <Button
    variant='ghost'
    className='bg-foreground hover:!bg-foreground text-background hover:!text-background h-11 rounded-full px-8 text-lg font-semibold hover:opacity-70'
    {...props}
  >{`Let's go!`}</Button>
)

const PopoverAuthentication = dynamic(() => import('@/app/client'), {
  ssr: false,
  loading: () => <LetsGoButton />,
})

export default function Home() {
  return (
    <main className='flex h-screen flex-col justify-center'>
      <ThemeToggle />
      <div className='mx-auto mb-[4vh] w-[87.5%] max-w-[640px]'>
        <div className='text-center'>
          <div className='mx-auto -mb-4 size-[300px] overflow-hidden md:size-[397px]'>
            <video
              playsInline
              muted
              src='/motion-intro.mp4'
              autoPlay
              loop
              className='-translate-x-3 -translate-y-4 md:-translate-y-6 dark:hue-rotate-60 dark:invert-100'
            />
          </div>
          <div className='mx-auto max-w-[342px] md:max-w-[478px]'>
            <h2 className='relative z-1 mb-16 text-[96px] leading-[100px] font-bold tracking-tight md:text-[140px]'>
              Joicè
            </h2>
            <PopoverAuthentication>
              <LetsGoButton />
            </PopoverAuthentication>
            <p className='mt-6 text-2xl leading-7 font-semibold md:mt-7 md:text-[40px] md:leading-[44px] md:tracking-tight'>
              Join or create a room to chat&nbsp;and video call with your&nbsp;team.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
