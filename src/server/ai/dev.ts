// Entry point for the Genkit developer UI: `npm run genkit:dev`.
import { config } from 'dotenv';
config();

import '@/server/ai/flows/ai-companion';
import '@/server/ai/flows/medicine-identification';
import '@/server/ai/flows/caregiver-tips';
