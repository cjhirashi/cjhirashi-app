/**
 * Unit Tests - API Helpers
 * Tests standardized API responses, error handling
 */

import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  type ApiSuccessResponse,
  type ApiErrorResponse,
} from '@/lib/api/helpers';

describe('API Helpers - Success Responses', () => {
  describe('apiSuccess', () => {
    it('returns success response with data', () => {
      const data = { id: '1', name: 'Test' };
      const response = apiSuccess(data);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('includes success flag in response', async () => {
      const data = { id: '1', name: 'Test' };
      const response = apiSuccess(data);

      const json = await response.json();

      expect(json).toEqual({
        success: true,
        data,
      });
    });

    it('includes optional message', async () => {
      const data = { id: '1' };
      const message = 'Operation successful';
      const response = apiSuccess(data, message);

      const json = await response.json();

      expect(json).toEqual({
        success: true,
        data,
        message,
      });
    });

    it('accepts custom status code', () => {
      const data = { id: '1' };
      const response = apiSuccess(data, undefined, 201);

      expect(response.status).toBe(201);
    });

    it('handles empty data', async () => {
      const response = apiSuccess(null);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });

    it('handles array data', async () => {
      const data = [{ id: '1' }, { id: '2' }];
      const response = apiSuccess(data);
      const json = await response.json();

      expect(json.data).toEqual(data);
      expect(json.data).toHaveLength(2);
    });

    it('handles nested object data', async () => {
      const data = {
        user: { id: '1', email: 'test@example.com' },
        settings: { theme: 'dark' },
      };
      const response = apiSuccess(data);
      const json = await response.json();

      expect(json.data).toEqual(data);
    });
  });
});

describe('API Helpers - Error Responses', () => {
  describe('apiError', () => {
    it('returns error response with message', () => {
      const error = 'Something went wrong';
      const response = apiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it('includes success false flag', async () => {
      const error = 'Invalid input';
      const response = apiError(error);
      const json = await response.json();

      expect(json).toEqual({
        success: false,
        error,
      });
    });

    it('includes optional details', async () => {
      const error = 'Validation failed';
      const details = { field: 'email', reason: 'Invalid format' };
      const response = apiError(error, details);
      const json = await response.json();

      expect(json).toEqual({
        success: false,
        error,
        details,
      });
    });

    it('accepts custom status code', () => {
      const error = 'Not found';
      const response = apiError(error, undefined, 404);

      expect(response.status).toBe(404);
    });

    it('handles 401 Unauthorized', () => {
      const error = 'Unauthorized';
      const response = apiError(error, undefined, 401);

      expect(response.status).toBe(401);
    });

    it('handles 403 Forbidden', () => {
      const error = 'Forbidden';
      const response = apiError(error, undefined, 403);

      expect(response.status).toBe(403);
    });

    it('handles 500 Internal Server Error', () => {
      const error = 'Server error';
      const response = apiError(error, undefined, 500);

      expect(response.status).toBe(500);
    });

    it('includes array details', async () => {
      const error = 'Multiple errors';
      const details = [{ field: 'name' }, { field: 'email' }];
      const response = apiError(error, details);
      const json = await response.json();

      expect(json.details).toEqual(details);
    });
  });
});

describe('API Helpers - Error Handling', () => {
  describe('handleApiError', () => {
    it('handles Error instance', async () => {
      const error = new Error('Test error');
      const response = await handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Test error');
      expect(json.details).toHaveProperty('stack');
    });

    it('includes stack trace in details', async () => {
      const error = new Error('Test error');
      const response = await handleApiError(error);
      const json = await response.json();

      expect(json.details.stack).toBeDefined();
      expect(typeof json.details.stack).toBe('string');
    });

    it('handles unknown error types', async () => {
      const error = 'String error';
      const response = await handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Unknown error occurred');
      expect(json.details).toEqual({ error: 'String error' });
    });

    it('handles null error', async () => {
      const response = await handleApiError(null);
      const json = await response.json();

      expect(json.error).toBe('Unknown error occurred');
      expect(json.details).toEqual({ error: null });
    });

    it('handles object error', async () => {
      const error = { code: 'ERR_001', message: 'Custom error' };
      const response = await handleApiError(error);
      const json = await response.json();

      expect(json.error).toBe('Unknown error occurred');
      expect(json.details).toEqual({ error });
    });

    it('handles TypeError', async () => {
      const error = new TypeError('Cannot read property');
      const response = await handleApiError(error);
      const json = await response.json();

      expect(json.error).toBe('Cannot read property');
    });

    it('handles ReferenceError', async () => {
      const error = new ReferenceError('Variable not defined');
      const response = await handleApiError(error);
      const json = await response.json();

      expect(json.error).toBe('Variable not defined');
    });
  });
});

describe('API Helpers - Type Safety', () => {
  it('apiSuccess returns typed response', async () => {
    interface UserData {
      id: string;
      email: string;
    }

    const data: UserData = { id: '1', email: 'test@example.com' };
    const response = apiSuccess<UserData>(data);
    const json: ApiSuccessResponse<UserData> = await response.json();

    expect(json.data.id).toBe('1');
    expect(json.data.email).toBe('test@example.com');
  });

  it('apiError returns typed response', async () => {
    const response = apiError('Error message');
    const json: ApiErrorResponse = await response.json();

    expect(json.success).toBe(false);
    expect(json.error).toBe('Error message');
  });
});

describe('API Helpers - Edge Cases', () => {
  describe('apiSuccess edge cases', () => {
    it('handles undefined data', async () => {
      const response = apiSuccess(undefined);
      const json = await response.json();

      expect(json.data).toBeUndefined();
    });

    it('handles boolean data', async () => {
      const response = apiSuccess(true);
      const json = await response.json();

      expect(json.data).toBe(true);
    });

    it('handles number data', async () => {
      const response = apiSuccess(42);
      const json = await response.json();

      expect(json.data).toBe(42);
    });

    it('handles string data', async () => {
      const response = apiSuccess('success');
      const json = await response.json();

      expect(json.data).toBe('success');
    });

    it('does not include message when undefined', async () => {
      const response = apiSuccess({ id: '1' }, undefined);
      const json = await response.json();

      expect(json).not.toHaveProperty('message');
    });

    it('does not include message when empty string', async () => {
      const response = apiSuccess({ id: '1' }, '');
      const json = await response.json();

      // Empty string message should still be included
      expect(json).toHaveProperty('message');
      expect(json.message).toBe('');
    });
  });

  describe('apiError edge cases', () => {
    it('handles empty error message', async () => {
      const response = apiError('');
      const json = await response.json();

      expect(json.error).toBe('');
    });

    it('handles very long error message', async () => {
      const longError = 'Error: ' + 'x'.repeat(1000);
      const response = apiError(longError);
      const json = await response.json();

      expect(json.error).toBe(longError);
    });

    it('does not include details when undefined', async () => {
      const response = apiError('Error', undefined);
      const json = await response.json();

      expect(json).not.toHaveProperty('details');
    });

    it('includes details when empty object', async () => {
      const response = apiError('Error', {});
      const json = await response.json();

      expect(json.details).toEqual({});
    });
  });
});

describe('API Helpers - Status Codes', () => {
  it('supports all common HTTP status codes', () => {
    expect(apiSuccess({}, undefined, 200).status).toBe(200);
    expect(apiSuccess({}, undefined, 201).status).toBe(201);
    expect(apiSuccess({}, undefined, 204).status).toBe(204);
    expect(apiError('Error', undefined, 400).status).toBe(400);
    expect(apiError('Error', undefined, 401).status).toBe(401);
    expect(apiError('Error', undefined, 403).status).toBe(403);
    expect(apiError('Error', undefined, 404).status).toBe(404);
    expect(apiError('Error', undefined, 422).status).toBe(422);
    expect(apiError('Error', undefined, 500).status).toBe(500);
    expect(apiError('Error', undefined, 503).status).toBe(503);
  });
});

describe('API Helpers - JSON Serialization', () => {
  it('serializes Date objects correctly', async () => {
    const data = { createdAt: new Date('2024-01-01') };
    const response = apiSuccess(data);
    const json = await response.json();

    expect(json.data.createdAt).toBeDefined();
  });

  it('serializes nested objects', async () => {
    const data = {
      user: { id: '1', profile: { name: 'Test' } },
    };
    const response = apiSuccess(data);
    const json = await response.json();

    expect(json.data.user.profile.name).toBe('Test');
  });

  it('serializes arrays in error details', async () => {
    const details = { errors: ['Error 1', 'Error 2'] };
    const response = apiError('Multiple errors', details);
    const json = await response.json();

    expect(json.details.errors).toEqual(['Error 1', 'Error 2']);
  });
});
