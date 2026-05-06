import type { Role } from '@prisma/client';
import { Conflict, NotFound } from '../lib/errors.js';
import { prisma } from '../lib/prisma.js';
import type {
  CreateProjectInput,
  InviteMemberInput,
  UpdateMemberInput,
  UpdateProjectInput,
} from '../schemas/projects.js';

export async function listProjectsForUser(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    orderBy: { joinedAt: 'desc' },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          ownerId: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tasks: true, members: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.project,
    role: m.role,
    joinedAt: m.joinedAt,
  }));
}

export async function createProject(userId: string, input: CreateProjectInput) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        ownerId: userId,
        members: {
          create: { userId, role: 'ADMIN' },
        },
      },
      select: { id: true, name: true, description: true, ownerId: true, createdAt: true, updatedAt: true },
    });
    return { ...project, role: 'ADMIN' as Role };
  });
}

export async function getProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, members: { some: { userId } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { tasks: true, members: true } },
    },
  });
  if (!project) throw NotFound('Project');

  const myMembership = project.members.find((m) => m.userId === userId);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    myRole: myMembership?.role ?? 'MEMBER',
    members: project.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user,
    })),
    counts: project._count,
  };
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  const exists = await prisma.project.findUnique({ where: { id: projectId } });
  if (!exists) throw NotFound('Project');

  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
    select: { id: true, name: true, description: true, ownerId: true, createdAt: true, updatedAt: true },
  });
}

export async function deleteProject(projectId: string) {
  const exists = await prisma.project.findUnique({ where: { id: projectId } });
  if (!exists) throw NotFound('Project');
  await prisma.project.delete({ where: { id: projectId } });
}

export async function inviteMember(projectId: string, input: InviteMemberInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw NotFound(`User with email ${input.email}`);

  const existing = await prisma.membership.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existing) throw Conflict('User is already a member of this project');

  const membership = await prisma.membership.create({
    data: { projectId, userId: user.id, role: input.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return membership;
}

export async function listMembers(projectId: string) {
  return prisma.membership.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function updateMemberRole(projectId: string, userId: string, input: UpdateMemberInput) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) throw NotFound('Project');
  if (project.ownerId === userId && input.role !== 'ADMIN') {
    throw Conflict('Project owner must remain an admin');
  }
  return prisma.membership.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role: input.role },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function removeMember(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { ownerId: true } });
  if (!project) throw NotFound('Project');
  if (project.ownerId === userId) {
    throw Conflict('Project owner cannot be removed. Transfer ownership first.');
  }
  await prisma.membership.delete({
    where: { projectId_userId: { projectId, userId } },
  });
}
