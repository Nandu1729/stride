import { describe, expect, it } from 'vitest';
import { LoginSchema, SignupSchema } from '../src/schemas/auth.js';
import { CreateProjectSchema, InviteMemberSchema } from '../src/schemas/projects.js';
import { CreateTaskSchema, UpdateTaskSchema } from '../src/schemas/tasks.js';

describe('SignupSchema', () => {
  it('accepts a valid signup payload and lowercases the email', () => {
    const parsed = SignupSchema.parse({
      name: '  Aanya Mehta  ',
      email: 'AANYA@stride.APP',
      password: 'StrongPassw0rd',
    });
    expect(parsed.name).toBe('Aanya Mehta');
    expect(parsed.email).toBe('aanya@stride.app');
  });

  it('rejects short passwords', () => {
    expect(() =>
      SignupSchema.parse({ name: 'A', email: 'a@b.c', password: 'short' }),
    ).toThrowError();
  });

  it('rejects bad email', () => {
    expect(() =>
      SignupSchema.parse({ name: 'A', email: 'not-an-email', password: 'longenough' }),
    ).toThrowError();
  });
});

describe('LoginSchema', () => {
  it('accepts an email and password', () => {
    const parsed = LoginSchema.parse({ email: 'a@b.co', password: 'x' });
    expect(parsed.email).toBe('a@b.co');
  });
});

describe('CreateProjectSchema', () => {
  it('trims name and treats blank description as undefined', () => {
    const parsed = CreateProjectSchema.parse({ name: '  Stride v1  ', description: '' });
    expect(parsed.name).toBe('Stride v1');
    expect(parsed.description).toBeUndefined();
  });
  it('rejects empty name', () => {
    expect(() => CreateProjectSchema.parse({ name: '   ' })).toThrowError();
  });
});

describe('InviteMemberSchema', () => {
  it('defaults role to MEMBER', () => {
    const parsed = InviteMemberSchema.parse({ email: 'x@y.com' });
    expect(parsed.role).toBe('MEMBER');
  });
  it('accepts ADMIN role', () => {
    const parsed = InviteMemberSchema.parse({ email: 'x@y.com', role: 'ADMIN' });
    expect(parsed.role).toBe('ADMIN');
  });
});

describe('CreateTaskSchema', () => {
  it('defaults status to TODO and priority to MEDIUM', () => {
    const parsed = CreateTaskSchema.parse({ title: 'Build kanban' });
    expect(parsed.status).toBe('TODO');
    expect(parsed.priority).toBe('MEDIUM');
  });

  it('accepts a valid ISO due date', () => {
    const parsed = CreateTaskSchema.parse({
      title: 't',
      dueDate: '2026-05-10T00:00:00.000Z',
    });
    expect(parsed.dueDate).toBe('2026-05-10T00:00:00.000Z');
  });

  it('rejects an invalid status', () => {
    expect(() => CreateTaskSchema.parse({ title: 't', status: 'WAT' })).toThrowError();
  });
});

describe('UpdateTaskSchema', () => {
  it('allows partial updates including null assignee', () => {
    const parsed = UpdateTaskSchema.parse({ assigneeId: null });
    expect(parsed.assigneeId).toBeNull();
  });
});
