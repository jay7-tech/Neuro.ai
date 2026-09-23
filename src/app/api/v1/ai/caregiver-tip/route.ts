import { handler } from '@/server/http/handler';
import { getCaregiverTip } from '@/ai/flows/caregiver-tips';
import { CaregiverTipInput } from '@/lib/contracts';

export const POST = handler({ body: CaregiverTipInput, rateLimit: 'ai' }, ({ body }) => getCaregiverTip(body.topic));
