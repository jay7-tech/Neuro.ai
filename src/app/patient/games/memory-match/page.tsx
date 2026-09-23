'use client';

import { usePatientContext } from '@/components/app/patient-shell';
import { GameShell } from '@/components/features/games/game-shell';
import { MemoryMatch } from '@/components/features/games/games';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <GameShell patientId={patientId} game="memory_match" title="Memory match" instructions="Turn over two cards at a time to find the pairs.">
      {(props) => <MemoryMatch {...props} />}
    </GameShell>
  );
}
