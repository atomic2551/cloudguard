import { jsonSingle } from '@/lib/api/response';

export async function POST() {
  return jsonSingle({ success: true, message: 'Logged out successfully' });
}
