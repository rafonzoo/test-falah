import { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
}

export default config
