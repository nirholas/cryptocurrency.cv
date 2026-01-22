import type { Meta, StoryObj } from '@storybook/react';
import { 
  FadeIn, 
  SlideUp, 
  ScaleIn, 
  Stagger, 
  Shimmer,
  Pulse,
  Bounce,
  HoverLift,
  HoverGlow,
} from '../src/components/Animations';

const meta: Meta = {
  title: 'Components/Animations',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 bg-amber-500 text-white rounded-lg font-medium">
    {children}
  </div>
);

export const FadeInExample: Story = {
  render: () => (
    <FadeIn>
      <Box>Fade In Animation</Box>
    </FadeIn>
  ),
};

export const SlideUpExample: Story = {
  render: () => (
    <SlideUp>
      <Box>Slide Up Animation</Box>
    </SlideUp>
  ),
};

export const ScaleInExample: Story = {
  render: () => (
    <ScaleIn>
      <Box>Scale In Animation</Box>
    </ScaleIn>
  ),
};

export const StaggerExample: Story = {
  render: () => (
    <Stagger className="space-y-2">
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Stagger>
  ),
};

export const ShimmerExample: Story = {
  render: () => (
    <Shimmer className="w-64 h-32 rounded-lg" />
  ),
};

export const PulseExample: Story = {
  render: () => (
    <Pulse>
      <Box>Pulsing</Box>
    </Pulse>
  ),
};

export const BounceExample: Story = {
  render: () => (
    <Bounce>
      <Box>Bouncing</Box>
    </Bounce>
  ),
};

export const HoverLiftExample: Story = {
  render: () => (
    <HoverLift>
      <Box>Hover to Lift</Box>
    </HoverLift>
  ),
};

export const HoverGlowExample: Story = {
  render: () => (
    <HoverGlow color="amber">
      <Box>Hover for Glow</Box>
    </HoverGlow>
  ),
};

export const AllAnimations: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <FadeIn><Box>Fade</Box></FadeIn>
      <SlideUp><Box>Slide</Box></SlideUp>
      <ScaleIn><Box>Scale</Box></ScaleIn>
      <Pulse><Box>Pulse</Box></Pulse>
      <Bounce><Box>Bounce</Box></Bounce>
      <HoverLift><Box>Lift</Box></HoverLift>
    </div>
  ),
};
