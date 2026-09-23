// Entry point for the Genkit developer UI: `npm run genkit:dev`.
import { config } from 'dotenv';
config();

import '@/ai/flows/ai-companion';
import '@/ai/flows/medicine-identification';
import '@/ai/flows/caregiver-tips';
