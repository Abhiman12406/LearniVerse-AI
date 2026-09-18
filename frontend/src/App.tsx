import React, { useEffect } from 'react';
import { ClassroomCanvas } from './components/canvas/ClassroomCanvas';
import { HUD } from './components/ui/HUD';
import { useClassroomStore } from './store/useClassroomStore';
import { soundSystem } from './audio/soundSystem';

import { StationConsoleModal } from './components/ui/StationConsoleModal';
import { ArrayStationConsole } from './components/ui/ArrayStationConsole';
import { LinkedListConsole } from './components/ui/LinkedListConsole';
import { TelemetryDrawer } from './components/ui/TelemetryDrawer';

export const App: React.FC = () => {
  const { fetchLearnerProfile, fetchWorldState } = useClassroomStore();

  useEffect(() => {
    // Load authoritative learner profile and world state from backend
    fetchLearnerProfile();
    fetchWorldState();

    // Audio context initialization on first interaction
    const handleFirstInteraction = () => {
      soundSystem.init();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [fetchLearnerProfile, fetchWorldState]);

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <ClassroomCanvas />
      <HUD />
      <StationConsoleModal />
      <ArrayStationConsole />
      <LinkedListConsole />
      <TelemetryDrawer />
    </main>
  );
};

export default App;
