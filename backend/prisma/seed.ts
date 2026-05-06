import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_PASSWORD ?? 'DemoPass123!';
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const owner = await prisma.user.upsert({
    where: { email: 'demo@stride.app' },
    update: {},
    create: { email: 'demo@stride.app', name: 'Aanya Mehta', passwordHash },
  });
  const dev = await prisma.user.upsert({
    where: { email: 'rohan@stride.app' },
    update: {},
    create: { email: 'rohan@stride.app', name: 'Rohan Verma', passwordHash },
  });
  const designer = await prisma.user.upsert({
    where: { email: 'priya@stride.app' },
    update: {},
    create: { email: 'priya@stride.app', name: 'Priya Sharma', passwordHash },
  });

  // Reset existing demo project state for an idempotent seed.
  const existingProject = await prisma.project.findFirst({
    where: { name: 'Stride launch', ownerId: owner.id },
  });
  if (existingProject) {
    await prisma.project.delete({ where: { id: existingProject.id } });
  }

  const project = await prisma.project.create({
    data: {
      name: 'Stride launch',
      description: 'Ship Stride v1 to first 50 small teams.',
      ownerId: owner.id,
      members: {
        create: [
          { userId: owner.id, role: 'ADMIN' },
          { userId: dev.id, role: 'MEMBER' },
          { userId: designer.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        createdById: owner.id,
        assigneeId: dev.id,
        title: 'Design login + signup screens',
        description: 'Two-column layout, brand left, form right. Match the Stride palette.',
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date(now - 2 * day),
        position: 0,
      },
      {
        projectId: project.id,
        createdById: owner.id,
        assigneeId: dev.id,
        title: 'Wire auth API to the SPA',
        description: 'Use TanStack Query, persist token via httpOnly cookie.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(now + 1 * day),
        position: 0,
      },
      {
        projectId: project.id,
        createdById: dev.id,
        assigneeId: designer.id,
        title: 'Project switcher in header',
        description: 'Listbox with current project + recent projects.',
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: new Date(now + 2 * day),
        position: 1,
      },
      {
        projectId: project.id,
        createdById: owner.id,
        assigneeId: null,
        title: 'Kanban drag-and-drop',
        description: 'HTML5 DnD between TODO / IN_PROGRESS / DONE columns.',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(now + 3 * day),
        position: 0,
      },
      {
        projectId: project.id,
        createdById: dev.id,
        assigneeId: dev.id,
        title: 'Task detail modal with comments',
        description: 'Show creator, assignee, due date, history of comments.',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date(now + 4 * day),
        position: 1,
      },
      {
        projectId: project.id,
        createdById: owner.id,
        assigneeId: designer.id,
        title: 'Onboarding empty states',
        description: 'No projects yet, no tasks yet, no members yet.',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(now + 6 * day),
        position: 2,
      },
      {
        projectId: project.id,
        createdById: owner.id,
        assigneeId: dev.id,
        title: 'Audit log for admin actions',
        description: 'Member added/removed, role changed, project renamed.',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(now - 1 * day),
        position: 3,
      },
    ],
  });

  // eslint-disable-next-line no-console
  console.log('Seeded demo data:');
  // eslint-disable-next-line no-console
  console.log(`  email:    demo@stride.app`);
  // eslint-disable-next-line no-console
  console.log(`  password: ${password}`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
