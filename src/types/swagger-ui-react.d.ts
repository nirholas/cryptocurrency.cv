// Type definitions for swagger-ui-react
// Project: https://github.com/swagger-api/swagger-ui

declare module 'swagger-ui-react' {
  import * as React from 'react';

  export interface SwaggerUIProps {
    url?: string;
    spec?: Record<string, unknown>;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    filter?: boolean | string;
    requestInterceptor?: (req: unknown) => unknown;
    responseInterceptor?: (res: unknown) => unknown;
    onComplete?: (system: unknown) => void;
    supportedSubmitMethods?: string[];
    validatorUrl?: string | null;
    withCredentials?: boolean;
    persistAuthorization?: boolean;
    deepLinking?: boolean;
    displayOperationId?: boolean;
    displayRequestDuration?: boolean;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    tryItOutEnabled?: boolean;
    plugins?: unknown[];
    presets?: unknown[];
    layout?: string;
  }

  const SwaggerUI: React.ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
