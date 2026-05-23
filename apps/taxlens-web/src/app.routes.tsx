import { Route, Routes } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';

import { HomeScreen } from '@features/health/home-screen.tsx';
import { SimulatorScreen } from '@features/simulator/simulator-screen.tsx';

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.HOME} element={<HomeScreen />} />
      <Route path={ROUTES.SIMULATOR} element={<SimulatorScreen />} />
      <Route path="*" element={<HomeScreen />} />
    </Routes>
  );
}
