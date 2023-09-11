import { RuleAccessSystem } from './authentication';

const ruleFile = {
  'item/*': {
    publish: "user.role === 'admin'",
    subscribe: "user.role === 'admin' || user.role === 'user'",
  },
  'user-profile/$username': {
    publish: 'user.id === $username',
    subscribe: true,
  },
  'test-case/$username/for/$role': {
    publish: 'user.id === $username && user.role === $role',
    subscribe: 'user.role === $role',
  },
};

const accessSystem = new RuleAccessSystem(ruleFile);

const user = {
  id: 'admin123',
  role: 'admin',
};

const user2 = {
  id: 'user123',
  role: 'user',
};

// Test RuleAccessSystem canPublish and canSubscribe
const assert = (value: boolean, expected: boolean) => {
  if (value != expected) {
    throw new Error(`Expected ${expected}, got ${value}`);
  } else console.debug(`Passed: ${value} === ${expected}`);
};

const assertTrue = (value: boolean) => {
  assert(value, true);
};

const assertFalse = (value: boolean) => {
  assert(value, false);
};

export const testRuleSystem = () => {
  console.log('Testing RuleAccessSystem');
  assertTrue(accessSystem.canPublish('item/1234/attribute', user));
  assertFalse(accessSystem.canPublish('item/1234/attribute', user2));
  assertFalse(accessSystem.canPublish('item/1234/attribute', {}));
  assertFalse(accessSystem.canPublish('item/1234/attribute', null));
  assertTrue(accessSystem.canSubscribe('item/1234/attribute', user));
  assertTrue(accessSystem.canSubscribe('item/1234/attribute', user2));
  assertFalse(accessSystem.canSubscribe('item/1234/attribute', {}));
  assertFalse(accessSystem.canSubscribe('item/1234/attribute', null));

  assertTrue(accessSystem.canPublish('user-profile/admin123', user));
  assertFalse(accessSystem.canPublish('user-profile/admin123', user2));
  assertFalse(accessSystem.canPublish('user-profile/admin123', {}));
  assertFalse(accessSystem.canPublish('user-profile/admin123', null));
  assertTrue(accessSystem.canSubscribe('user-profile/admin123', user));
  assertTrue(accessSystem.canSubscribe('user-profile/admin123', user2));
  assertTrue(accessSystem.canSubscribe('user-profile/admin123', {}));
  assertFalse(accessSystem.canSubscribe('user-profile/admin123', null));

  assertFalse(accessSystem.canPublish('user-profile/user123', user));
  assertTrue(accessSystem.canPublish('user-profile/user123', user2));
  assertFalse(accessSystem.canPublish('user-profile/user123', {}));
  assertFalse(accessSystem.canPublish('user-profile/user123', null));
  assertTrue(accessSystem.canSubscribe('user-profile/user123', user));
  assertTrue(accessSystem.canSubscribe('user-profile/user123', user2));
  assertTrue(accessSystem.canSubscribe('user-profile/user123', {}));
  assertFalse(accessSystem.canSubscribe('user-profile/user123', null));

  assertTrue(accessSystem.canPublish('test-case/admin123/for/admin', user));
  assertFalse(accessSystem.canPublish('test-case/admin123/for/admin', user2));
  assertFalse(accessSystem.canPublish('test-case/admin123/for/admin', {}));
  assertFalse(accessSystem.canPublish('test-case/admin123/for/admin', null));
  assertTrue(accessSystem.canSubscribe('test-case/admin123/for/admin', user));
  assertFalse(accessSystem.canSubscribe('test-case/admin123/for/admin', user2));
  assertFalse(accessSystem.canSubscribe('test-case/admin123/for/admin', {}));
  assertFalse(accessSystem.canSubscribe('test-case/admin123/for/admin', null));

  assertFalse(accessSystem.canPublish('test-case/user123/for/admin', user));
  assertFalse(accessSystem.canPublish('test-case/user123/for/admin', user2));
  assertFalse(accessSystem.canPublish('test-case/user123/for/admin', {}));
  assertFalse(accessSystem.canPublish('test-case/user123/for/admin', null));
  assertTrue(accessSystem.canSubscribe('test-case/user123/for/admin', user));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/admin', user2));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/admin', {}));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/admin', null));

  assertFalse(accessSystem.canPublish('test-case/user123/for/user', user));
  assertTrue(accessSystem.canPublish('test-case/user123/for/user', user2));
  assertFalse(accessSystem.canPublish('test-case/user123/for/user', {}));
  assertFalse(accessSystem.canPublish('test-case/user123/for/user', null));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/user', user));
  assertTrue(accessSystem.canSubscribe('test-case/user123/for/user', user2));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/user', {}));
  assertFalse(accessSystem.canSubscribe('test-case/user123/for/user', null));
  console.log('Passed RuleAccessSystem tests');
};
