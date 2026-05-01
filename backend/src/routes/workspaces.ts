// backend/src/routes/workspaces.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const workspaceRouter = Router();
workspaceRouter.use(authenticate);

// GET /api/workspaces — user's workspaces
workspaceRouter.get('/', async (req: AuthRequest, res: Response) => {
  const workspaces = await prisma.workspaceMember.findMany({
    where: { userId: req.user!.id },
    include: {
      workspace: {
        include: {
          _count: { select: { members: true, bugs: true, codeReviews: true } },
        },
      },
    },
  });

  res.json(workspaces.map((m) => ({ ...m.workspace, role: m.role })));
});

// GET /api/workspaces/:id
workspaceRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.user!.id } },
  });

  if (!member) throw new AppError('Workspace not found', 404);

  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      },
      _count: { select: { bugs: true, codeReviews: true, documents: true } },
    },
  });

  res.json({ ...workspace, myRole: member.role });
});

// POST /api/workspaces
workspaceRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description } = req.body;
  if (!name) throw new AppError('Name is required', 400);

  const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      slug,
      ownerId: req.user!.id,
      members: { create: { userId: req.user!.id, role: 'OWNER' } },
    },
  });

  res.status(201).json(workspace);
});

// POST /api/workspaces/:id/invite
workspaceRouter.post('/:id/invite', async (req: AuthRequest, res: Response) => {
  const { email, role = 'MEMBER' } = req.body;
  if (!email) throw new AppError('Email is required', 400);

  // Check if requester has permission
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.user!.id } },
  });

  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new AppError('Insufficient permissions', 403);
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      email,
      workspaceId: req.params.id,
      role,
      expiresAt,
    },
  });

  // In production: send invitation email here
  res.status(201).json({ invitation, inviteLink: `${process.env.CLIENT_URL}/invite/${invitation.token}` });
});

// POST /api/workspaces/join/:token
workspaceRouter.post('/join/:token', async (req: AuthRequest, res: Response) => {
  const invitation = await prisma.invitation.findUnique({
    where: { token: req.params.token },
  });

  if (!invitation || invitation.status !== 'PENDING') {
    throw new AppError('Invalid or expired invitation', 400);
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    throw new AppError('Invitation has expired', 400);
  }

  // Add user to workspace
  const existing = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: invitation.workspaceId, userId: req.user!.id } },
  });

  if (!existing) {
    await prisma.workspaceMember.create({
      data: { workspaceId: invitation.workspaceId, userId: req.user!.id, role: invitation.role },
    });
  }

  await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'ACCEPTED' } });

  const workspace = await prisma.workspace.findUnique({ where: { id: invitation.workspaceId } });
  res.json({ workspace, message: 'Successfully joined workspace' });
});

// GET /api/workspaces/:id/stats
workspaceRouter.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  const [bugsByStatus, reviewsByStatus, recentActivity] = await Promise.all([
    prisma.bug.groupBy({
      by: ['status'],
      where: { workspaceId: req.params.id },
      _count: true,
    }),
    prisma.codeReview.groupBy({
      by: ['status'],
      where: { workspaceId: req.params.id },
      _count: true,
    }),
    prisma.activity.findMany({
      where: { workspaceId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { id: true, name: true, avatar: true } } },
    }),
  ]);

  res.json({ bugsByStatus, reviewsByStatus, recentActivity });
});
