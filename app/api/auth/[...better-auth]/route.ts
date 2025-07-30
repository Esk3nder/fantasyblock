import { auth } from '@/lib/auth';
import { toNodeHandler } from 'better-auth/node';

const { GET, POST } = toNodeHandler(auth);

export { GET, POST };