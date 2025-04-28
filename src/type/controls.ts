import { ReactNode } from 'react';

/**
 * Control panel item type for consistent formatting
 */
export type ControlItem = {
  id: string;
  label: string;
  description: string;
  control: ReactNode;
};
