import { prisma } from '../lib/prisma.js';

export async function getProjectDashboard(projectId: string) {
  const now = new Date();

  const [byStatus, byPriority, overdue, recent, topAssignees, total, due7] = await Promise.all([
    prisma.task.groupBy({ by: ['status'], where: { projectId }, _count: { _all: true } }),
    prisma.task.groupBy({ by: ['priority'], where: { projectId }, _count: { _all: true } }),
    prisma.task.findMany({
      where: { projectId, dueDate: { lt: now }, status: { not: 'DONE' } },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: { assignee: { select: { id: true, name: true, email: true } } },
    }),
    prisma.task.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.task.groupBy({
      by: ['assigneeId'],
      where: { projectId, assigneeId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { assigneeId: 'desc' } },
      take: 5,
    }),
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({
      where: {
        projectId,
        status: { not: 'DONE' },
        dueDate: {
          gte: now,
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  const assigneeUsers = await prisma.user.findMany({
    where: { id: { in: topAssignees.map((t) => t.assigneeId).filter((x): x is string => !!x) } },
    select: { id: true, name: true, email: true },
  });

  const done = byStatus.find((s) => s.status === 'DONE')?._count._all ?? 0;
  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    counts: {
      total,
      todo: byStatus.find((s) => s.status === 'TODO')?._count._all ?? 0,
      inProgress: byStatus.find((s) => s.status === 'IN_PROGRESS')?._count._all ?? 0,
      done,
      overdue: overdue.length,
      dueThisWeek: due7,
    },
    byPriority: {
      low: byPriority.find((p) => p.priority === 'LOW')?._count._all ?? 0,
      medium: byPriority.find((p) => p.priority === 'MEDIUM')?._count._all ?? 0,
      high: byPriority.find((p) => p.priority === 'HIGH')?._count._all ?? 0,
    },
    completion,
    overdue,
    recent,
    topAssignees: topAssignees.map((t) => ({
      user: assigneeUsers.find((u) => u.id === t.assigneeId) ?? null,
      count: t._count._all,
    })),
  };
}
