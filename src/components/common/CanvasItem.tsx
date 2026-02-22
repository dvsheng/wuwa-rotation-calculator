import { isNil } from 'es-toolkit/predicate';
import React, { useState } from 'react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type { ParameterInstance } from '@/schemas/rotation';
import type { Parameter } from '@/services/game-data';

import { ParameterConfigurationDialog } from './ParameterConfigurationDialog';

export interface CanvasItemProperties {
  /** Main title for tooltip */
  title: string;
  /** Subtitle for tooltip (e.g., character name) */
  subtitle?: string;
  /** Description text shown in tooltip */
  description?: string;
  /** Parameters for configuration */
  parameters?: Array<ParameterInstance & Parameter>;
  /** Called when parameters are saved */
  onSaveParameters?: (values: Array<ParameterInstance & Parameter>) => void;
  /** Attacks covered by this item. When length > 1, per-stack configuration is offered. */
  buffedAttacks?: Array<{ name: string }>;
  isDialogClickable: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Children render function or elements */
  children:
    | React.ReactNode
    | ((properties: {
        shouldShowWarning: boolean;
        openDialog: () => void;
      }) => React.ReactNode);
}

/**
 * Unstyled wrapper component that provides:
 * - Tooltip on hover
 * - Parameter configuration dialog on click (if parameters exist)
 * - Warning indicator state
 *
 * Consumers own all styling and layout.
 */
export const CanvasItem = ({
  title,
  subtitle,
  description,
  parameters,
  onSaveParameters,
  buffedAttacks,
  isDialogClickable,
  onOpenChange,
  children,
}: CanvasItemProperties) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const hasParameters = (parameters?.length ?? 0) > 0;
  const shouldShowWarning =
    hasParameters &&
    (parameters?.some((p) => {
      const hasStackConfig = (p.valueConfiguration?.length ?? 0) > 0;
      if (hasStackConfig) {
        return p.valueConfiguration!.some((v) => Number.isNaN(v) || isNil(v));
      }
      return Number.isNaN(p.value) || isNil(p.value);
    }) ??
      false);

  const handleClick = () => {
    if (hasParameters && onSaveParameters && isDialogClickable) {
      setIsDialogOpen(true);
      onOpenChange?.(true);
    }
  };

  const handleSaveParameters = (values: Array<ParameterInstance & Parameter>) => {
    onSaveParameters?.(values);
    setIsDialogOpen(false);
    onOpenChange?.(false);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={handleClick}
            className={
              hasParameters && onSaveParameters ? 'h-full cursor-pointer' : 'h-full'
            }
          >
            {typeof children === 'function'
              ? children({ shouldShowWarning, openDialog: () => setIsDialogOpen(true) })
              : children}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <Text variant="tiny" className="font-bold">
            {subtitle ? `${subtitle} - ` : ''}
            {title}
          </Text>
          {description && <Text variant="tiny">{description}</Text>}
          {shouldShowWarning && (
            <Text variant="tiny" className="mt-1 font-bold text-amber-500">
              Configuration required
            </Text>
          )}
          {hasParameters && !shouldShowWarning && (
            <div className="mt-1 space-y-0.5">
              {parameters?.flatMap((p, parameterIndex) => {
                if ((p.valueConfiguration?.length ?? 0) > 0) {
                  return p.valueConfiguration!.map((v, stackIndex) => (
                    <Text
                      key={`${parameterIndex}-${stackIndex}`}
                      variant="tiny"
                      className="text-primary font-bold"
                    >
                      {`${buffedAttacks?.[stackIndex]?.name ?? `Attack ${stackIndex + 1}`}: ${v}`}
                    </Text>
                  ));
                }
                return [
                  <Text
                    key={parameterIndex}
                    variant="tiny"
                    className="text-primary font-bold"
                  >
                    {parameters.length > 1
                      ? `Value ${parameterIndex + 1}: `
                      : 'Value: '}
                    {p.value}
                  </Text>,
                ];
              })}
            </div>
          )}
        </TooltipContent>
      </Tooltip>

      {isDialogOpen && hasParameters && (
        <div onClick={(event) => event.stopPropagation()}>
          <ParameterConfigurationDialog
            title={title}
            description={description}
            parameters={parameters}
            buffedAttacks={buffedAttacks}
            isOpen={isDialogOpen}
            onOpenChange={onOpenChange}
            setIsOpen={setIsDialogOpen}
            onSaveParameters={handleSaveParameters}
          />
        </div>
      )}
    </>
  );
};
