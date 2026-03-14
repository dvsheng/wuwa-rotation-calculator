import { createMiddleware } from '@tanstack/react-start';

const MAX_LOG_VALUE_LENGTH = 10_000;

const truncateLogValue = (value: string) =>
  value.length > MAX_LOG_VALUE_LENGTH
    ? `${value.slice(0, MAX_LOG_VALUE_LENGTH)}... [truncated]`
    : value;

const serializeLogValue = (value: unknown): string => {
  if (value === undefined) {
    return 'undefined';
  }

  if (value instanceof Error) {
    return truncateLogValue(
      JSON.stringify(
        {
          name: value.name,
          message: value.message,
          stack: value.stack,
        },
        undefined,
        2,
      ),
    );
  }

  if (typeof Response !== 'undefined' && value instanceof Response) {
    return JSON.stringify({
      type: 'Response',
      status: value.status,
      statusText: value.statusText,
      redirected: value.redirected,
      url: value.url,
    });
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return truncateLogValue(
      JSON.stringify(
        {
          type: 'FormData',
          entries: Array.from(value.entries(), ([key, entryValue]) => [
            key,
            typeof entryValue === 'string'
              ? entryValue
              : {
                  type: 'File',
                  name: entryValue.name,
                  size: entryValue.size,
                  fileType: entryValue.type,
                },
          ]),
        },
        undefined,
        2,
      ),
    );
  }

  try {
    return truncateLogValue(
      JSON.stringify(
        value,
        (_, propertyValue) => {
          if (typeof propertyValue === 'bigint') {
            return propertyValue.toString();
          }

          if (propertyValue instanceof Error) {
            return {
              name: propertyValue.name,
              message: propertyValue.message,
              stack: propertyValue.stack,
            };
          }

          return propertyValue;
        },
        2,
      ),
    );
  } catch {
    return truncateLogValue(String(value));
  }
};

export const serverFunctionLogger = createMiddleware({ type: 'function' }).server(
  async ({ data, method, next, serverFnMeta }) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const label = `${method} ${serverFnMeta.name} (${serverFnMeta.filename})`;

    console.log(`[${timestamp}] ${label} - Input\n${serializeLogValue(data)}`);

    try {
      const nextResult = (await next()) as Awaited<ReturnType<typeof next>> & {
        result?: unknown;
      };
      const duration = Date.now() - startTime;

      console.log(
        `[${timestamp}] ${label} - Output (${duration}ms)\n${serializeLogValue(nextResult.result)}`,
      );

      return nextResult;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(
        `[${timestamp}] ${label} - Error (${duration}ms)\n${serializeLogValue(error)}`,
      );
      throw error;
    }
  },
);

export { serializeLogValue };
