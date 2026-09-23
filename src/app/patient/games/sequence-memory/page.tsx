'use client';

import { usePatientContext } from '@/components/app/patient-shell';
import { GameShell } from '@/components/features/games/game-shell';
import { SequenceMemory } from '@/components/features/games/games';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <GameShell patientId={patientId} game="sequence_memory" title="Number memory" instructions="Watch the numbers, then type them in order.">
      {(props) => <SequenceMemory {...props} />}
    </GameShell>
  );
}
