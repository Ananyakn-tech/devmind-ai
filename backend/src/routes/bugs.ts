// backend/src/routes/bugs.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { suggestBugFix } from '../services/aiService';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

export const bugRouter = Router();
bugRouter.use(authenticate);

const createBugSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  labels: z.array(z.string()).default([]),
  assigneeId: z.string().optional(),
  workspaceId: z.string(),
  dueDate: z.string().optional(),
  aiSuggest: z.boolean().default(true),
});

const updateBugSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']).optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  labels: z.array(z.string()).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  order: z.number().optional(),
});

// GET /api/bugs?workspaceId=xxx
bugRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { workspaceId, status, priority, assigneeId } = req.query;

  if (!workspaceId) throw new AppError('workspaceId is required', 400);

  const where: any = { workspaceId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;

  const bugs = await prisma.bug.findMany({
    where,
    orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'desc' }],
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  });

  // Group by status for kanban
  const kanban = {
    TODO: bugs.filter((b) => b.status === 'TODO'),
    IN_PROGRESS: bugs.filter((b) => b.status === 'IN_PROGRESS'),
    IN_REVIEW: bugs.filter((b) => b.status === 'IN_REVIEW'),
    DONE: bugs.filter((b) => b.status === 'DONE'),
  };

  res.json({ bugs, kanban });
});

// GET /api/bugs/:id
bugRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const bug = await prisma.bug.findUnique({
    where: { id: req.params.id },
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!bug) throw new AppError('Bug not found', 404);
  res.json(bug);
});

// POST /api/bugs
bugRouter.post('/', async (req: AuthRequest, res: Response) => {
  const body = createBugSchema.parse(req.body);

  let aiSuggestion: string | undefined;
  if (body.aiSuggest) {
    try {
      aiSuggestion = await suggestBugFix(body.title, body.description);
    } catch {
      // Non-fatal — continue without AI suggestion
    }
  }

  const bug = await prisma.bug.create({
    data: {
      title: body.title,
      description: body.description,
      priority: body.priority,
      labels: body.labels,
      assigneeId: body.assigneeId,
      workspaceId: body.workspaceId,
      reporterId: req.user!.id,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      aiSuggestion,
    },
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: 'BUG_CREATED',
      description: `Reported bug: ${bug.title}`,
      userId: req.user!.id,
      workspaceId: body.workspaceId,
      bugId: bug.id,
    },
  });

  io.to(`workspace:${body.workspaceId}`).emit('bug:new', bug);
  res.status(201).json(bug);
});

// PATCH /api/bugs/:id
bugRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const body = updateBugSchema.parse(req.body);

  const bug = await prisma.bug.update({
    where: { id: req.params.id },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
    },
    include: {
      reporter: { select: { id: true, name: true, avatar: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.activity.create({
    data: {
      type: 'BUG_UPDATED',
      description: `Updated bug: ${bug.title}`,
      userId: req.user!.id,
      workspaceId: bug.workspaceId,
      bugId: bug.id,
    },
  });

  io.to(`workspace:${bug.workspaceId}`).emit('bug:updated', bug);
  res.json(bug);
});

// DELETE /api/bugs/:id
bugRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const bug = await prisma.bug.findUnique({ where: { id: req.params.id } });
  if (!bug) throw new AppError('Bug not found', 404);

  await prisma.bug.delete({ where: { id: req.params.id } });
  io.to(`workspace:${bug.workspaceId}`).emit('bug:deleted', { id: bug.id });
  res.json({ message: 'Bug deleted' });
});

// POST /api/bugs/:id/comments
bugRouter.post('/:id/comments', async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content) throw new AppError('Content required', 400);

  const comment = await prisma.comment.create({
    data: { content, userId: req.user!.id, bugId: req.params.id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  res.status(201).json(comment);
});
