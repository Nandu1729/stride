import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  CreateProjectSchema,
  InviteMemberSchema,
  UpdateMemberSchema,
  UpdateProjectSchema,
} from '../schemas/projects.js';
import {
  createProject,
  deleteProject,
  getProject,
  inviteMember,
  listMembers,
  listProjectsForUser,
  removeMember,
  updateMemberRole,
  updateProject,
} from '../services/projects.service.js';
import { getProjectDashboard } from '../services/dashboard.service.js';

const router: Router = Router();

const ProjectParam = z.object({ id: z.string().min(1) });
const MemberParams = z.object({ id: z.string().min(1), userId: z.string().min(1) });

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const list = await listProjectsForUser(req.user!.id);
    res.json({ projects: list });
  } catch (e) {
    next(e);
  }
});

router.post('/', validateBody(CreateProjectSchema), async (req, res, next) => {
  try {
    const project = await createProject(req.user!.id, req.body);
    res.status(201).json({ project });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', validateParams(ProjectParam), async (req, res, next) => {
  try {
    const project = await getProject(req.params.id, req.user!.id);
    res.json({ project });
  } catch (e) {
    next(e);
  }
});

router.patch(
  '/:id',
  validateParams(ProjectParam),
  requireRole('ADMIN'),
  validateBody(UpdateProjectSchema),
  async (req, res, next) => {
    try {
      const project = await updateProject(req.params.id, req.body);
      res.json({ project });
    } catch (e) {
      next(e);
    }
  },
);

router.delete('/:id', validateParams(ProjectParam), requireRole('ADMIN'), async (req, res, next) => {
  try {
    await deleteProject(req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

router.get('/:id/members', validateParams(ProjectParam), requireRole('MEMBER'), async (req, res, next) => {
  try {
    const members = await listMembers(req.params.id);
    res.json({ members });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/members',
  validateParams(ProjectParam),
  requireRole('ADMIN'),
  validateBody(InviteMemberSchema),
  async (req, res, next) => {
    try {
      const member = await inviteMember(req.params.id, req.body);
      res.status(201).json({ member });
    } catch (e) {
      next(e);
    }
  },
);

router.patch(
  '/:id/members/:userId',
  validateParams(MemberParams),
  requireRole('ADMIN'),
  validateBody(UpdateMemberSchema),
  async (req, res, next) => {
    try {
      const member = await updateMemberRole(req.params.id, req.params.userId, req.body);
      res.json({ member });
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  '/:id/members/:userId',
  validateParams(MemberParams),
  requireRole('ADMIN'),
  async (req, res, next) => {
    try {
      await removeMember(req.params.id, req.params.userId);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  },
);

router.get(
  '/:id/dashboard',
  validateParams(ProjectParam),
  requireRole('MEMBER'),
  async (req, res, next) => {
    try {
      const dashboard = await getProjectDashboard(req.params.id);
      res.json({ dashboard });
    } catch (e) {
      next(e);
    }
  },
);

export default router;
