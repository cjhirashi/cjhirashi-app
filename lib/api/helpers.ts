/**
 * API Helpers - Standardized response handlers
 */

import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, message?: string, status = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  );
}

/**
 * Standard API error response
 */
export function apiError(error: string, details?: unknown, status = 400): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Handle async API route errors
 */
export async function handleApiError(error: unknown): Promise<NextResponse<ApiErrorResponse>> {
  console.error('API Error:', error);

  if (error instanceof Error) {
    return apiError(error.message, { stack: error.stack }, 500);
  }

  return apiError('Unknown error occurred', { error }, 500);
}
