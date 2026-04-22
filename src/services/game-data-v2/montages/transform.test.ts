import { describe, expect, it } from 'vitest';

import type { MontageAsset } from '../repostiory';

import { toMontage } from './transform';
import { NotificationType } from './types';

describe('toMontage / transformSkillBehavior dedup', () => {
  it('dedupes options with empty requiredTags regardless of NOT operator', () => {
    const montage = toMontage(
      createMontageAsset([
        createSkillBehavior('detail_0', [
          { bullets: [1001], conditions: [{ tags: [], reverse: false }] },
          { bullets: [1002], conditions: [{ tags: [], reverse: true }] },
        ]),
      ]),
    );

    expect(montage.notifications).toHaveLength(1);
    expect(montage.notifications[0]).toMatchObject({
      type: NotificationType.SPAWN_BULLETS,
      bullets: [1001],
    });
  });

  it('keeps separate options when same non-empty tag has different negation', () => {
    const montage = toMontage(
      createMontageAsset([
        createSkillBehavior('detail_0', [
          { bullets: [1001], conditions: [{ tags: ['some.tag'], reverse: false }] },
          { bullets: [1002], conditions: [{ tags: ['some.tag'], reverse: true }] },
        ]),
      ]),
    );

    expect(montage.notifications).toHaveLength(1);
    expect(montage.notifications[0]).toMatchObject({
      type: NotificationType.DYNAMIC_BEHAVIOR,
      options: [
        { bullets: [1001], condition: { requiredTags: ['some.tag'] } },
        { bullets: [1002], condition: { requiredTags: ['some.tag'], operator: 'NOT' } },
      ],
    });
  });

  it('dedupes options with identical non-empty tags and same operator', () => {
    const montage = toMontage(
      createMontageAsset([
        createSkillBehavior('detail_0', [
          { bullets: [1001], conditions: [{ tags: ['some.tag'], reverse: false }] },
          { bullets: [1002], conditions: [{ tags: ['some.tag'], reverse: false }] },
        ]),
      ]),
    );

    expect(montage.notifications).toHaveLength(1);
    expect(montage.notifications[0]).toMatchObject({
      type: NotificationType.SPAWN_BULLETS,
      bullets: [1001],
    });
  });

  it('keeps separate options with different non-empty tags', () => {
    const montage = toMontage(
      createMontageAsset([
        createSkillBehavior('detail_0', [
          { bullets: [1001], conditions: [{ tags: ['tag.a'], reverse: false }] },
          { bullets: [1002], conditions: [{ tags: ['tag.b'], reverse: false }] },
        ]),
      ]),
    );

    expect(montage.notifications[0]).toMatchObject({
      type: NotificationType.DYNAMIC_BEHAVIOR,
      options: [
        { bullets: [1001], condition: { requiredTags: ['tag.a'] } },
        { bullets: [1002], condition: { requiredTags: ['tag.b'] } },
      ],
    });
  });
});

type BehaviorOption = {
  bullets: Array<number>;
  conditions: Array<{ tags: Array<string>; reverse: boolean }>;
};

const createSkillBehavior = (
  detailName: string,
  options: Array<BehaviorOption>,
): { notifyName: string; detailName: string; detail: object } => ({
  notifyName: 'TsAnimNotifySkillBehavior_C',
  detailName,
  detail: {
    Name: detailName,
    Type: 'TsAnimNotifySkillBehavior_C',
    Properties: {
      技能行为: options.map((option) => ({
        SkillBehaviorActionGroup: option.bullets.map((bulletId) => ({
          Bullets: [{ bulletRowName: String(bulletId), bulletCount: 1, BlackboardKey: '' }],
          BuffId: 0,
          Tag: { TagName: 'None' },
        })),
        SkillBehaviorConditionGroup: option.conditions.map((cond) => ({
          TagToCheck: cond.tags,
          Reverse: cond.reverse,
          AnyTag: false,
          ConditionType: '',
          IgnoreZ: false,
          Sign: false,
          ComparisonLogic: '',
          Value: 0,
          RangeL: 0,
          RangeR: 0,
          AttributeId1: 0,
          AttributeId2: 0,
          AttributeRate: 0,
        })),
        SkillBehaviorConditionFormula: '',
        SkillBehaviorContinue: true,
      })),
    },
  },
});

const createMontageAsset = (
  notifies: Array<ReturnType<typeof createSkillBehavior>>,
): MontageAsset =>
  ({
    name: 'AM_Test',
    characterName: 'TestChar',
    data: {
      Properties: {
        Notifies: notifies.map((n, i) => ({
          NotifyName: n.notifyName,
          LinkValue: i * 0.1,
          Duration: 0,
          Notify: {
            ObjectName: `${n.notifyName}'AM_Test:${n.detailName}'`,
          },
          NotifyStateClass: null,
        })),
      },
    },
    notifyDetails: notifies.map((n) => n.detail),
  }) as unknown as MontageAsset;
