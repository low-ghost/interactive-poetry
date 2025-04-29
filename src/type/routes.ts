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
  FOREST = '/forest',
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
