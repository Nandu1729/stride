import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  task: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(async () => ({ _max: { position: 2 } })),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  membership: { findUnique: vi.fn() },
  comment: { findMany: vi.fn(), create: vi.fn() },
}));

vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

import { createTask, deleteTask, updateTask } from '../src/services/tasks.service.js';

const baseTask = {
  id: 't1',
  projectId: 'p1',
  title: 'A task',
  description: null,
  status: 'TODO' as const,
  priority: 'MEDIUM' as const,
  dueDate: null,
  position: 0,
  createdById: 'u-creator',
  assigneeId: 'u-assignee',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('tasks.service.createTask', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a task with the next position in its column', async () => {
    prismaMock.membership.findUnique.mockResolvedValueOnce({ role: 'MEMBER' });
    prismaMock.task.create.mockResolvedValueOnce({ ...baseTask, position: 3 });
    const created = await createTask('p1', 'u-creator', {
      title: 'A task',
      assigneeId: 'u-assignee',
      status: 'TODO',
      priority: 'MEDIUM',
    });
    expect(created.position).toBe(3);
    expect(prismaMock.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 3, projectId: 'p1', createdById: 'u-creator' }),
      }),
    );
  });

  it('rejects assignment to a non-member', async () => {
    prismaMock.membership.findUnique.mockResolvedValueOnce(null);
    await expect(
      createTask('p1', 'u-creator', { title: 't', assigneeId: 'stranger' } as never),
    ).rejects.toMatchObject({ status: 403 });
  });
});

describe('tasks.service.updateTask (RBAC)', () => {
  beforeEach(() => vi.clearAllMocks());

  function buildTaskWithMembership(role: 'ADMIN' | 'MEMBER', userId: string) {
    return {
      ...baseTask,
      project: { members: [{ id: 'm1', projectId: 'p1', userId, role }] },
    };
  }

  it('admin can edit any task', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce(buildTaskWithMembership('ADMIN', 'admin-u'));
    prismaMock.task.update.mockResolvedValueOnce({ ...baseTask, title: 'Renamed' });
    const updated = await updateTask('t1', 'admin-u', { title: 'Renamed' });
    expect(updated.title).toBe('Renamed');
  });

  it('creator can edit their own task', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce(buildTaskWithMembership('MEMBER', 'u-creator'));
    prismaMock.task.update.mockResolvedValueOnce({ ...baseTask, title: 'Mine' });
    const updated = await updateTask('t1', 'u-creator', { title: 'Mine' });
    expect(updated.title).toBe('Mine');
  });

  it('assignee can edit a task assigned to them', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce(
      buildTaskWithMembership('MEMBER', 'u-assignee'),
    );
    prismaMock.task.update.mockResolvedValueOnce({ ...baseTask, status: 'IN_PROGRESS' });
    const updated = await updateTask('t1', 'u-assignee', { status: 'IN_PROGRESS' });
    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('member who is neither creator nor assignee is forbidden', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce(buildTaskWithMembership('MEMBER', 'u-other'));
    await expect(updateTask('t1', 'u-other', { title: 'x' })).rejects.toMatchObject({ status: 403 });
  });

  it('non-member is forbidden', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce({
      ...baseTask,
      project: { members: [] },
    });
    await expect(updateTask('t1', 'stranger', { title: 'x' })).rejects.toMatchObject({ status: 403 });
  });

  it('returns 404 when the task does not exist', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce(null);
    await expect(updateTask('missing', 'u-creator', { title: 'x' })).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('tasks.service.deleteTask', () => {
  beforeEach(() => vi.clearAllMocks());

  it('admin can delete any task', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce({
      ...baseTask,
      project: { members: [{ id: 'm', projectId: 'p1', userId: 'admin', role: 'ADMIN' }] },
    });
    prismaMock.task.delete.mockResolvedValueOnce({});
    await expect(deleteTask('t1', 'admin')).resolves.toBeUndefined();
  });

  it('creator can delete their own task', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce({
      ...baseTask,
      project: { members: [{ id: 'm', projectId: 'p1', userId: 'u-creator', role: 'MEMBER' }] },
    });
    prismaMock.task.delete.mockResolvedValueOnce({});
    await expect(deleteTask('t1', 'u-creator')).resolves.toBeUndefined();
  });

  it('assignee cannot delete a task they did not create', async () => {
    prismaMock.task.findUnique.mockResolvedValueOnce({
      ...baseTask,
      project: { members: [{ id: 'm', projectId: 'p1', userId: 'u-assignee', role: 'MEMBER' }] },
    });
    await expect(deleteTask('t1', 'u-assignee')).rejects.toMatchObject({ status: 403 });
  });
});
