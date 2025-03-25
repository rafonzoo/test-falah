import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

import { Button } from '@/components/ui/button'

const meta = {
  title: 'UI/Primary Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: { onClick: fn() },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Button',
    disabled: false,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
}

export const Disabled: Story = {
  args: {
    children: 'Button Disabled',
    disabled: true,
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
}
