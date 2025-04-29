import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from 'react-router-dom';
import RootLayout from './layouts/RootLayout';

const router = createBrowserRouter(
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
      </Route>
      <Route
        path="*"
        lazy={async () => ({
          Component: (await import('./routes/not-found/NotFoundPage')).default,
        })}
      />
    </>,
  ),
  {
    basename: import.meta.env.BASE_URL,
  },
);

const App = () => <RouterProvider router={router} />;

export default App;
