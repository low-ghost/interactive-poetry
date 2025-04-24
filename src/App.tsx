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
            Component: (await import('./routes/about/AboutPage')).default,
          })}
        />
        <Route
          path="simple-demo"
          lazy={async () => ({
            Component: (await import('./routes/simple-demo/SimpleDemoPage'))
              .default,
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

function App() {
  return <RouterProvider router={router} />;
}

export default App;
