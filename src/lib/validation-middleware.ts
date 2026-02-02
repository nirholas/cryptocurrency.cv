/**
 * Validation Middleware
 * 
 * Validates requests against Zod schemas and returns
 * consistent error responses for validation failures
 */

import { NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { ApiError, ValidationError } from './api-error';

/**
 * Validate query parameters against schema
 */
export function validateQuery<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> } {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const result = schema.safeParse(params);

    if (!result.success) {
      return {
        success: false,
        error: ApiError.validation(
          'Query parameter validation failed',
          zodErrorToValidationErrors(result.error)
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return {
      success: false,
      error: ApiError.badRequest('Failed to parse query parameters'),
    };
  }
}

/**
 * Validate request body against schema
 */
export async function validateBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return {
        success: false,
        error: ApiError.validation(
          'Request body validation failed',
          zodErrorToValidationErrors(result.error)
        ),
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: ApiError.badRequest('Invalid JSON in request body'),
      };
    }

    return {
      success: false,
      error: ApiError.badRequest('Failed to parse request body'),
    };
  }
}

/**
 * Validate path parameter against schema
 */
export function validateParam<T extends z.ZodType>(
  value: string,
  schema: T,
  paramName: string
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof ApiError.validation> } {
  const result = schema.safeParse(value);

  if (!result.success) {
    return {
      success: false,
      error: ApiError.validation(
        `Path parameter '${paramName}' validation failed`,
        zodErrorToValidationErrors(result.error)
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Convert Zod errors to ValidationError format
 */
function zodErrorToValidationErrors(error: ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: String(err.path.join('.')),
    message: err.message,
    received: err.code === 'invalid_type' ? (err as any).received : undefined,
    expected: err.code === 'invalid_type' ? (err as any).expected : undefined,
  }));
}

/**
 * Higher-order function to wrap route handler with validation
 */
export function withQueryValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const validation = validateQuery(request, schema);
    
    if (!validation.success) {
      return validation.error;
    }
    
    return handler(request, validation.data);
  };
}

/**
 * Higher-order function to wrap route handler with body validation
 */
export function withBodyValidation<T extends z.ZodType>(
  schema: T,
  handler: (request: NextRequest, data: z.infer<T>) => Promise<Response>
) {
  return async (request: NextRequest) => {
    const validation = await validateBody(request, schema);
    
    if (!validation.success) {
      return validation.error;
    }
    
    return handler(request, validation.data);
  };
}
