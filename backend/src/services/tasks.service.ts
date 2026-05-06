import type { Prisma } from '@prisma/client';
import { Forbidden, NotFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateCommentInput,
  CreateTaskInput,
  TaskFilter,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/tasks.js';

const TASK_INCLUDE = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

export async function listTasks(projectId: string, filter: TaskFilter) {
  const where: Prisma.TaskWhereInput = { projectId };
  if (filter.status) where.status = filter.status;
  if (filter.priority) where.priority = filter.priority;
  if (filter.assigneeId) where.assigneeId = filter.assigneeId;
  if (filter.overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'DONE' };
  }

  return prisma.task.findMany({
    where,
    include: TASK_INCLUDE,
    orderBy: [{ status: 'asc' }, { position: 'asc' }, { createdAt: 'asc' }],
  });
}

async function validateAssignee(projectId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const m = await prisma.membership.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
  });
  if (!m) throw Forbidden('Assignee must be a member of the project');
}

export async function createTask(projectId: string, createdById: string, input: CreateTaskInput) {
  await validateAssignee(projectId, input.assigneeId ?? null);
  const max = await prisma.task.aggregate({
    where: { projectId, status: input.status ?? 'TODO' },
    _max: { position: true },
  });
  const nextPos = (max._max.position ?? -1) + 1;

  return prisma.task.create({
    data: {
      projectId,
      createdById,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'TODO',
      priority: input.priority ?? 'MEDIUM',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assigneeId: input.assigneeId ?? null,
      position: nextPos,
    },
    include: TASK_INCLUDE,
  });
}

export async function getTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      ...TASK_INCLUDE,
      project: { include: { members: { where: { userId } } } },
      comments: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!task) throw NotFound('Task');
  if (task.project.members.length === 0) throw Forbidden('You do not have access to this task');
  const { project: _project, ...rest } = task;
  return rest;
}

export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { where: { userId } } } } },
  });
  if (!task) throw NotFound('Task');

  const membership = task.project.members[0];
  if (!membership) throw Forbidden('You do not have access to this task');

  // Members may only edit tasks they created or are assigned to. Admins can edit anything.
  const canEdit =
    membership.role === 'ADMIN' || task.createdById === userId || task.assigneeId === userId;
  if (!canEdit) throw Forbidden('Members can only edit tasks they created or are assigned to');

  if (input.assigneeId !== undefined) {
    await validateAssignee(task.projectId, input.assigneeId);
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.dueDate !== undefined
        ? { dueDate: input.dueDate ? new Date(input.dueDate) : null }
        : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.position !== undefined ? { position: input.position } : {}),
    },
    include: TASK_INCLUDE,
  });
}

export async function updateTaskStatus(
  taskId: string,
  userId: string,
  input: UpdateTaskStatusInput,
) {
  return updateTask(taskId, userId, {
    status: input.status,
    ...(input.position !== undefined ? { position: input.position } : {}),
  });
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { where: { userId } } } } },
  });
  if (!task) throw NotFound('Task');
  const membership = task.project.members[0];
  if (!membership) throw Forbidden('You do not have access to this task');

  const canDelete = membership.role === 'ADMIN' || task.createdById === userId;
  if (!canDelete) throw Forbidden('Only the creator or an admin can delete a task');

  await prisma.task.delete({ where: { id: taskId } });
}

export async function listComments(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { where: { userId } } } } },
  });
  if (!task) throw NotFound('Task');
  if (task.project.members.length === 0) throw Forbidden('You do not have access to this task');

  return prisma.comment.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createComment(taskId: string, userId: string, input: CreateCommentInput) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { where: { userId } } } } },
  });
  if (!task) throw NotFound('Task');
  if (task.project.members.length === 0) throw Forbidden('You do not have access to this task');

  return prisma.comment.create({
    data: { taskId, userId, body: input.body },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}
