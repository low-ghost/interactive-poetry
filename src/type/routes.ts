import { ReactNode } from 'react';

/**
 * Type definitions for route configuration
 */

/**
 * Enum for available routes
 */
export enum AppRoutes {
  HOME = '/',
  SIMPLE_DEMO = '/simple-demo',
  RIPPLE = '/ripple',
}

/**
 * Route Metadata
 */
export type RouteConfig = {
  path: string;
  label: string;
  icon?: string;
  children?: RouteConfig[];
};

/**
 * Control panel item type for consistent formatting
 */
export interface ControlItem {
  id: string;
  label: string;
  description: string;
  control: ReactNode;
}
