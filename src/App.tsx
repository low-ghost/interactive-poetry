import { AppRoutes } from '@type/routes';
import {
  Route,
  RouterProvider,
  createHashRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import RootLayout from './layouts/RootLayout';

const router = createHashRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<RootLayout />}>
        <Route
          index
          lazy={async () => ({
            Component: (await import('./routes/home/HomePage')).default,
          })}
        />
        <Route
          path={AppRoutes.SIMPLE_DEMO}
          lazy={async () => ({
            Component: (await import('./routes/simple-demo/SimpleDemoPage'))
              .default,
          })}
        />
        <Route
          path={AppRoutes.RIPPLE}
          lazy={async () => ({
            Component: (await import('./routes/ripple/RipplePage')).default,
          })}
        />
        <Route
          path={AppRoutes.FOREST}
          lazy={async () => ({
            Component: (await import('./routes/forest/ForestPage')).default,
          })}
        />
        <Route
          path={AppRoutes.TOWARDS}
          lazy={async () => ({
            Component: (await import('./routes/towards/TowardsPage')).default,
          })}
        />
        <Route
          path={AppRoutes.MOON}
          lazy={async () => ({
            Component: (await import('./routes/moon/MoonPage')).default,
          })}
        />
        <Route
          path={AppRoutes.ALPHABET}
          lazy={async () => ({
            Component: (await import('./routes/alphabet/AlphabetPage')).default,
          })}
        />
      </Route>
      <Route
        path="*"
        lazy={async () => ({
          Component: (await import('./routes/not-found/NotFoundPage')).default,
        })}
      />
    </>,
  ),
);

const App = () => <RouterProvider router={router} />;

export default App;
