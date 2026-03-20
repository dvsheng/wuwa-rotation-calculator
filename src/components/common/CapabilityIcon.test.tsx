import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CapabilityIconDisplay } from './CapabilityIcon';

describe('CapabilityIconDisplay', () => {
  it('uses theme-aware monochrome classes for capability icons', () => {
    const { container } = render(<CapabilityIconDisplay url="/capability.png" />);

    const image = container.querySelector('img');

    expect(image).not.toBeNull();
    expect(image).toHaveClass('brightness-0', 'dark:brightness-0', 'dark:invert');
  });
});
