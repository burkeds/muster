import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDeviceCodeLogin } from './useDeviceCodeLogin';
import { DeviceCodeError, type DeviceCodeResponse } from '@tiled/client-core';
import type { AboutAuthenticationProvider } from '@tiled/client-core';

const startDeviceCodeAuth = vi.fn();
const pollDeviceCodeToken = vi.fn();
vi.mock('@tiled/client-core', () => ({
  startDeviceCodeAuth: (...a: unknown[]) => startDeviceCodeAuth(...a),
  pollDeviceCodeToken: (...a: unknown[]) => pollDeviceCodeToken(...a),
  DeviceCodeError: class extends Error {
    kind: 'pending' | 'expired' | 'denied' | 'error';
    constructor(kind: 'pending' | 'expired' | 'denied' | 'error', msg: string) {
      super(msg);
      this.kind = kind;
    }
  },
}));

const makeClient = () => ({
  startDeviceCode: (p: AboutAuthenticationProvider) => startDeviceCodeAuth(p),
  pollDeviceCode: (args: { verificationUri: string; deviceCode: string }) =>
    pollDeviceCodeToken(args),
});

const provider = { links: { auth_endpoint: '/authorize' } } as AboutAuthenticationProvider;
const device: DeviceCodeResponse = {
  authorization_uri: 'https://keycloak.desy.de/auth',
  verification_uri: '/token',
  interval: 1,
  expires_in: 900,
  device_code: 'dc',
  user_code: 'ABCD-EFGH',
};

beforeEach(() => {
  vi.useFakeTimers();
  startDeviceCodeAuth.mockReset();
  pollDeviceCodeToken.mockReset();
  window.open = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useDeviceCodeLogin', () => {
  it('opens the authorization URI and reports pending then completes', async () => {
    const onSuccess = vi.fn();
    startDeviceCodeAuth.mockResolvedValue(device);
    // First poll: pending. Second poll: success.
    pollDeviceCodeToken
      .mockRejectedValueOnce(new DeviceCodeError('pending', 'wait'))
      .mockResolvedValueOnce({ access_token: 'AT', refresh_token: 'RT' });

    const { result } = renderHook(() => useDeviceCodeLogin(makeClient(), onSuccess));

    await act(async () => {
      await result.current.start(provider);
    });

    expect(window.open).toHaveBeenCalledWith('https://keycloak.desy.de/auth', '_blank');
    expect(result.current.device?.user_code).toBe('ABCD-EFGH');
    expect(result.current.waiting).toBe(true);

    // The first poll returned "pending" and scheduled a retry after interval=1s.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(onSuccess).toHaveBeenCalledWith({ access_token: 'AT', refresh_token: 'RT' });
    expect(result.current.waiting).toBe(false);
  });

  it('surfaces a start error', async () => {
    startDeviceCodeAuth.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useDeviceCodeLogin(makeClient(), vi.fn()));

    await act(async () => {
      await result.current.start(provider);
    });

    expect(result.current.error).toBe('boom');
    expect(result.current.waiting).toBe(false);
  });
});
