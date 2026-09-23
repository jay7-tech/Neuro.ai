import { BackLink } from '@/components/app/patient-shell';
import { ExerciseView } from '@/components/features/exercise/exercise-view';

export const metadata = { title: 'Gentle exercise' };

export default function ExercisePage() {
  return (
    <div>
      <BackLink />
      <ExerciseView />
    </div>
  );
}
