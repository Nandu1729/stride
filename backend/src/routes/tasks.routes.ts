import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  CreateCommentSchema,
  CreateTaskSchema,
  TaskFilterSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
} from '../schemas/tasks.js';
import {
  createComment,
  createTask,
  deleteTask,
  getTask,
  listComments,
  listTasks,
  updateTask,
  updateTaskStatus,
} from '../services/tasks.service.js';

const router: Router = Router();
const projectScoped: Router = Router({ mergeParams: true });
const TaskParam = z.object({ id: z.string().min(1) });
const ProjectParam = z.object({ id: z.string().min(1) });

// /api/projects/:id/tasks (mounted from projects.routes.ts via app)
projectScoped.use(requireAuth, requireRole('MEMBER'));

projectScoped.get(
  '/',
  validateParams(ProjectParam),
  validateQuery(TaskFilterSchema),
  async (req, res, next) => {
    try {
      const filter = (req.validatedQuery as z.infer<typeof TaskFilterSchema>) ?? {};
      const tasks = await listTasks(req.params.id, filter);
      res.json({ tasks });
    } catch (e) {
      next(e);
    }
  },
);

projectScoped.post(
  '/',
  validateParams(ProjectParam),
  validateBody(CreateTaskSchema),
  async (req, res, next) => {
    try {
      const task = await createTask(req.params.id, req.user!.id, req.body);
      res.status(201).json({ task });
    } catch (e) {
      next(e);
    }
  },
);

// /api/tasks/:id
router.use(requireAuth);

router.get('/:id', validateParams(TaskParam), async (req, res, next) => {
  try {
    const task = await getTask(req.params.id, req.user!.id);
    res.json({ task });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', validateParams(TaskParam), validateBody(UpdateTaskSchema), async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.user!.id, req.body);
    res.json({ task });
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/:id/status',
  validateParams(TaskParam),
  validateBody(UpdateTaskStatusSchema),
  async (req, res, next) => {
    try {
      const task = await updateTaskStatus(req.params.id, req.user!.id, req.body);
      res.json({ task });
    } catch (e) {
      next(e);
    }
  },
);

router.delete('/:id', validateParams(TaskParam), async (req, res, next) => {
  try {
    await deleteTask(req.params.id, req.user!.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get('/:id/comments', validateParams(TaskParam), async (req, res, next) => {
  try {
    const comments = await listComments(req.params.id, req.user!.id);
    res.json({ comments });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/comments',
  validateParams(TaskParam),
  validateBody(CreateCommentSchema),
  async (req, res, next) => {
    try {
      const comment = await createComment(req.params.id, req.user!.id, req.body);
      res.status(201).json({ comment });
    } catch (e) {
      next(e);
    }
  },
);

export { router as tasksRouter, projectScoped as projectTasksRouter };
