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
          path="simple-demo"
          lazy={async () => ({
            Component: (await import('./routes/simple-demo/SimpleDemoPage'))
              .default,
          })}
        />
        <Route
          path="ripple"
          lazy={async () => ({
            Component: (await import('./routes/ripple/RipplePage')).default,
          })}
        />
        <Route
          path="forest"
          lazy={async () => ({
            Component: (await import('./routes/forest/ForestPage')).default,
          })}
        />
        <Route
          path="towards"
          lazy={async () => ({
            Component: (await import('./routes/towards/TowardsPage')).default,
          })}
        />
        <Route
          path="moon"
          lazy={async () => ({
            Component: (await import('./routes/moon/MoonPage')).default,
          })}
        />
        <Route
          path="hourglass"
          lazy={async () => ({
            Component: (await import('./routes/moon/HourglassPage')).default,
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
