import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AssetIcon, WeaponTypeIcon } from './AssetIcon';

describe('AssetIcon', () => {
  it('uses theme-aware monochrome classes for shared asset icons', () => {
    render(<AssetIcon name="weapon" />);

    expect(screen.getByAltText('weapon')).toHaveClass(
      'brightness-0',
      'dark:brightness-0',
      'dark:invert',
    );
  });

  it('uses theme-aware monochrome classes for weapon type icons', () => {
    render(<WeaponTypeIcon weaponType="Sword" />);

    expect(screen.getByAltText('Sword')).toHaveClass(
      'brightness-0',
      'dark:brightness-0',
      'dark:invert',
    );
  });
});
