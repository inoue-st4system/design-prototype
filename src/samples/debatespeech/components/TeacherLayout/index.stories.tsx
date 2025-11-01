import type { Meta, StoryObj } from '@storybook/react';

import { TeacherLayout } from '.';

const meta = {
  component: TeacherLayout,
  args: {
    children: <div>Hello</div>,
    title: 'Teacher Layout',
    breadcrumbs: [
      { label: 'Home', href: '/' },
      { label: 'Teacher Layout', href: '/teacher-layout' },
    ],
  },
} satisfies Meta<typeof TeacherLayout>;

export default meta;

export const Palette: StoryObj<typeof meta> = {};
