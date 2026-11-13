import { memo } from 'react';
import { ButtonView } from './ButtonView';
import { DpadView } from './DpadView';
import { StickView } from './StickView';
import { TouchpadView } from './TouchpadView';
import { TriggerView } from './TriggerView';
import { ControlViewProps } from './types';

function ControlViewBase({ control, ...rest }: ControlViewProps) {
  switch (control.kind) {
    case 'button':
      return <ButtonView control={control} {...rest} />;
    case 'stick':
      return <StickView control={control} {...rest} />;
    case 'dpad':
      return <DpadView control={control} {...rest} />;
    case 'trigger':
      return <TriggerView control={control} {...rest} />;
    case 'touchpad':
      return <TouchpadView control={control} {...rest} />;
  }
}

/** Draws any control with the renderer for its kind. */
export const ControlView = memo(ControlViewBase);
