import { describe, expect, it } from 'vitest';
import hy from '@/messages/hy.json';
import { targetGroupKey } from '@/lib/i18n/target-group-name';

describe('targetGroupKey', () => {
  it('camelCases the English API name', () => {
    expect(targetGroupKey('Older Persons')).toBe('olderPersons');
    expect(targetGroupKey('LGBT Persons')).toBe('lgbtPersons');
    expect(targetGroupKey('People with HIV')).toBe('peopleWithHiv');
  });

  it('maps every API target group name to an Armenian translation', () => {
    const apiNames = ['Children', 'Older Persons', 'People with Disabilities', 'Single Parents', 'Women', 'Youth', 'LGBT Persons', 'People with HIV'];
    for (const name of apiNames) {
      expect(hy.targetGroups).toHaveProperty(targetGroupKey(name));
    }
  });
});
