import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from "react-router-dom";
import "./App.css";
import Header from "./header";
import Home from "./home";
import Items from "./items";
import { useInactive, useTimeout } from "./useInactive"; // Import the useInactive hook
import { ItemsProvider } from "./useItems";
import { UserContextProvider } from "./useUser";


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Header />}>
      <Route index element={<Home />} />
      <Route path="items" element={<Items />} />
    </Route>
  )
);


function App() {
  const { timeout } = useTimeout();
  useInactive(timeout);

  return (

    <UserContextProvider>
      <ItemsProvider>

        <RouterProvider router={router} />


      </ItemsProvider>
    </UserContextProvider>
  );
}

export default App;
