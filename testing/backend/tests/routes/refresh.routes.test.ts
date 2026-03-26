import { describe, it, expect, vi, beforeEach } from 'vitest';
import { refreshAction } from '@/routes/refresh.routes';
import * as authService from '@/services/auth.service';
import * as cookieUtils from '@/utils/request-cookies';
import * as cookieSetters from '@/utils/cookies';
import * as jsonUtils from '@/utils/json';

vi.mock('@/services/auth.service');
vi.mock('@/utils/request-cookies');
vi.mock('@/utils/cookies');
vi.mock('@/utils/json');

describe('Refresh Routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('debería responder 401 si no hay cookie de refreshToken', async () => {
    vi.mocked(cookieUtils.parseCookies).mockReturnValue({});
    await refreshAction({ headers: {} } as any, {} as any);
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 401, expect.anything());
  });

  it('debería responder 200 y establecer la cookie si es válido', async () => {
    vi.mocked(cookieUtils.parseCookies).mockReturnValue({ refreshToken: 'valid' });
    vi.mocked(authService.refreshUserSession).mockResolvedValue({ message: 'OK', accessToken: 'acc', refreshToken: 'ref', account: { email: 'e' } } as any);
    
    await refreshAction({ socket: {}, headers: {} } as any, {} as any);
    
    expect(cookieSetters.setRefreshTokenCookie).toHaveBeenCalled();
    expect(jsonUtils.sendJson).toHaveBeenCalledWith(expect.anything(), 200, expect.anything());
  });
});