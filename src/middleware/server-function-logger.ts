import { createMiddleware } from '@tanstack/react-start';

const MAX_LOG_JSON_LENGTH = 2000;
const MAX_LOG_STRING_LENGTH = 300;
const MAX_LOG_STACK_LENGTH = 800;
const MAX_LOG_ARRAY_ITEMS = 10;
const MAX_LOG_OBJECT_ENTRIES = 12;
const MAX_LOG_DEPTH = 3;

const truncateString = (value: string, maxLength = MAX_LOG_STRING_LENGTH) =>
  value.length > maxLength
    ? `${value.slice(0, maxLength)}... [truncated ${value.length - maxLength} chars]`
    : value;

const getValueType = (value: unknown) => {
  if (value === undefined) {
    return 'undefined';
  }

  if (value === null) {
    return 'null';
  }

  if (Array.isArray(value)) {
    return 'array';
  }

  if (value instanceof Error) {
    return 'error';
  }

  if (typeof Response !== 'undefined' && value instanceof Response) {
    return 'response';
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    return 'form-data';
  }

  return typeof value;
};

const sanitizeLogValue = (
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown => {
  if (value === undefined) {
    return '[undefined]';
  }

  if (value === null || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Error) {
    return {
      type: 'Error',
      name: value.name,
      message: truncateString(value.message),
      stack: value.stack
        ? truncateString(value.stack, MAX_LOG_STACK_LENGTH)
        : undefined,
    };
  }

  if (typeof Response !== 'undefined' && value instanceof Response) {
    return {
      type: 'Response',
      status: value.status,
      statusText: value.statusText,
      redirected: value.redirected,
      url: truncateString(value.url),
    };
  }

  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const entries = [...value.entries()];
    return {
      type: 'FormData',
      entryCount: entries.length,
      entries: entries.slice(0, MAX_LOG_ARRAY_ITEMS).map(([key, entryValue]) => [
        key,
        typeof entryValue === 'string'
          ? truncateString(entryValue)
          : {
              type: 'File',
              name: truncateString(entryValue.name),
              size: entryValue.size,
              fileType: entryValue.type,
            },
      ]),
      truncated: entries.length > MAX_LOG_ARRAY_ITEMS || undefined,
    };
  }

  if (typeof value !== 'object') {
    return truncateString(String(value));
  }

  if (depth >= MAX_LOG_DEPTH) {
    return `[${getValueType(value)} truncated at depth ${MAX_LOG_DEPTH}]`;
  }

  if (seen.has(value)) {
    return '[circular]';
  }

  seen.add(value);

  if (Array.isArray(value)) {
    const items = value
      .slice(0, MAX_LOG_ARRAY_ITEMS)
      .map((item) => sanitizeLogValue(item, depth + 1, seen));

    return {
      type: 'array',
      itemCount: value.length,
      items,
      truncated: value.length > MAX_LOG_ARRAY_ITEMS || undefined,
    };
  }

  const entries = Object.entries(value);
  const sanitizedEntries = Object.fromEntries(
    entries
      .slice(0, MAX_LOG_OBJECT_ENTRIES)
      .map(([key, propertyValue]) => [
        key,
        sanitizeLogValue(propertyValue, depth + 1, seen),
      ]),
  );

  return {
    ...sanitizedEntries,
    __truncated: entries.length > MAX_LOG_OBJECT_ENTRIES || undefined,
    __entryCount: entries.length,
  };
};

const serializeLogValue = (value: unknown): unknown => {
  const sanitizedValue = sanitizeLogValue(value);
  const serializedValue = JSON.stringify(sanitizedValue);

  if (serializedValue.length <= MAX_LOG_JSON_LENGTH) {
    return sanitizedValue;
  }

  return {
    type: 'truncated-json',
    originalType: getValueType(value),
    preview: truncateString(serializedValue, MAX_LOG_JSON_LENGTH),
    serializedLength: serializedValue.length,
  };
};

export const serverFunctionLogger = createMiddleware({ type: 'function' }).server(
  async ({ data, method, next, serverFnMeta }) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const baseLogEntry = {
      event: 'server_function',
      timestamp,
      method,
      serverFunction: serverFnMeta.name,
      sourceFile: serverFnMeta.filename,
      serverFunctionId: serverFnMeta.id,
    };

    console.info({
      ...baseLogEntry,
      phase: 'input',
      input: serializeLogValue(data),
    });

    try {
      const nextResult = (await next()) as Awaited<ReturnType<typeof next>> & {
        result?: unknown;
      };
      const durationMs = Date.now() - startTime;

      console.info({
        ...baseLogEntry,
        phase: 'output',
        durationMs,
        output: serializeLogValue(nextResult.result),
      });

      return nextResult;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      console.error({
        ...baseLogEntry,
        phase: 'error',
        durationMs,
        error: serializeLogValue(error),
      });
      throw error;
    }
  },
);

export { serializeLogValue };
