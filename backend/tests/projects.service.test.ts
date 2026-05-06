import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  project: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  membership: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: { findUnique: vi.fn() },
  $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb(prismaMock)),
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import {
  createProject,
  inviteMember,
  removeMember,
  updateMemberRole,
} from '../src/services/projects.service.js';

describe('projects.service.createProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates the project and adds owner as ADMIN', async () => {
    prismaMock.project.create.mockResolvedValueOnce({
      id: 'p1',
      name: 'Stride launch',
      description: 'Ship v1',
      ownerId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const project = await createProject('u1', { name: 'Stride launch', description: 'Ship v1' });
    expect(project.id).toBe('p1');
    expect(project.role).toBe('ADMIN');
    expect(prismaMock.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Stride launch',
          ownerId: 'u1',
          members: { create: { userId: 'u1', role: 'ADMIN' } },
        }),
      }),
    );
  });
});

describe('projects.service.inviteMember', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invites an existing user', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u2', email: 'r@s.app', name: 'R' });
    prismaMock.membership.findUnique.mockResolvedValueOnce(null);
    prismaMock.membership.create.mockResolvedValueOnce({
      id: 'm1',
      projectId: 'p1',
      userId: 'u2',
      role: 'MEMBER',
      joinedAt: new Date(),
      user: { id: 'u2', email: 'r@s.app', name: 'R' },
    });

    const m = await inviteMember('p1', { email: 'r@s.app', role: 'MEMBER' });
    expect(m.userId).toBe('u2');
  });

  it('rejects when user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    await expect(inviteMember('p1', { email: 'ghost@s.app', role: 'MEMBER' })).rejects.toMatchObject({
      status: 404,
    });
  });

  it('rejects duplicate membership', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'u2' });
    prismaMock.membership.findUnique.mockResolvedValueOnce({ id: 'm1' });
    await expect(inviteMember('p1', { email: 'r@s.app', role: 'MEMBER' })).rejects.toMatchObject({
      status: 409,
    });
  });
});

describe('projects.service.updateMemberRole', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses to demote the project owner', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({ ownerId: 'u1' });
    await expect(updateMemberRole('p1', 'u1', { role: 'MEMBER' })).rejects.toMatchObject({
      status: 409,
    });
  });

  it('updates a non-owner member to ADMIN', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({ ownerId: 'u1' });
    prismaMock.membership.update.mockResolvedValueOnce({
      id: 'm1',
      projectId: 'p1',
      userId: 'u2',
      role: 'ADMIN',
      joinedAt: new Date(),
      user: { id: 'u2', email: 'r@s.app', name: 'R' },
    });
    const updated = await updateMemberRole('p1', 'u2', { role: 'ADMIN' });
    expect(updated.role).toBe('ADMIN');
  });
});

describe('projects.service.removeMember', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses to remove the project owner', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({ ownerId: 'u1' });
    await expect(removeMember('p1', 'u1')).rejects.toMatchObject({ status: 409 });
  });

  it('removes a regular member', async () => {
    prismaMock.project.findUnique.mockResolvedValueOnce({ ownerId: 'u1' });
    prismaMock.membership.delete.mockResolvedValueOnce({});
    await expect(removeMember('p1', 'u2')).resolves.toBeUndefined();
    expect(prismaMock.membership.delete).toHaveBeenCalledOnce();
  });
});
