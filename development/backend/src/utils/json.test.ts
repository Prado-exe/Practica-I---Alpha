import { describe, it, expect, vi } from 'vitest';
import { sendJson } from './json';

describe('JSON Utils', () => {
  it('sendJson debería configurar los headers y enviar los datos stringificados', () => {

    const res = {
      writeHead: vi.fn(),
      end: vi.fn()
    } as any;

    const payload = { ok: true, msg: 'Hello' };
    sendJson(res, 201, payload);

    expect(res.writeHead).toHaveBeenCalledWith(201, expect.objectContaining({
      "Content-Type": "application/json; charset=utf-8"
    }));
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(payload));
  });
});