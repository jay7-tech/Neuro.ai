'use client';

import { usePatientContext } from '@/components/app/patient-shell';
import { GameShell } from '@/components/features/games/game-shell';
import { ColorMatch } from '@/components/features/games/games';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <GameShell
      patientId={patientId}
      game="color_match"
      title="Colour match"
      instructions="Read the word and tap the colour it names."
    >
      {(props) => <ColorMatch {...props} />}
    </GameShell>
  );
}
