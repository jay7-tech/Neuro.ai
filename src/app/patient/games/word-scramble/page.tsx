'use client';

import { usePatientContext } from '@/components/app/patient-shell';
import { GameShell } from '@/components/features/games/game-shell';
import { WordScramble } from '@/components/features/games/games';

export default function Page() {
  const { patientId } = usePatientContext();
  return (
    <GameShell patientId={patientId} game="word_scramble" title="Word puzzle" instructions="Rearrange the letters to make a word.">
      {(props) => <WordScramble {...props} />}
    </GameShell>
  );
}
