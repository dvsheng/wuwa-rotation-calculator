import { mapValues } from 'es-toolkit';

export type Resolved<TData, TInitial, TFinal> = TData extends TInitial
  ? TFinal
  : TData extends Date
    ? TData
    : TData extends Array<infer U>
      ? Array<Resolved<U, TInitial, TFinal>>
      : TData extends object
        ? { [K in keyof TData]: Resolved<TData[K], TInitial, TFinal> }
        : TData;

export const deepTransform = <TData, TInitial, TFinal>(
  data: TData,
  match: (value: unknown) => value is TInitial,
  transform: (value: TInitial) => TFinal,
): Resolved<TData, TInitial, TFinal> => {
  if (match(data)) {
    return transform(data) as Resolved<TData, TInitial, TFinal>;
  }
  if (Array.isArray(data)) {
    return data.map((item) => deepTransform(item, match, transform)) as Resolved<
      TData,
      TInitial,
      TFinal
    >;
  }
  if (data?.constructor.name === 'Object') {
    return mapValues(data, (value) =>
      deepTransform(value, match, transform),
    ) as Resolved<TData, TInitial, TFinal>;
  }
  return data as Resolved<TData, TInitial, TFinal>;
};
