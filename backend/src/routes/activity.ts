// backend/src/routes/activity.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const activityRouter = Router();
activityRouter.use(authenticate);

activityRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { workspaceId, limit = '20' } = req.query;

  const where: any = { userId: req.user!.id };
  if (workspaceId) where.workspaceId = workspaceId;

  const activities = await prisma.activity.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(limit),
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  res.json(activities);
});

// ─────────────────────────────────────────────────────────────────────────────

// backend/src/routes/notifications.ts (inlined here for brevity)
import { Router as Router2, Response as Response2 } from 'express';
import { authenticate as authenticate2, AuthRequest as AuthRequest2 } from '../middleware/auth';

export const notificationRouter = Router2();
notificationRouter.use(authenticate2);

notificationRouter.get('/', async (req: AuthRequest2, res: Response2) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
});

notificationRouter.patch('/:id/read', async (req: AuthRequest2, res: Response2) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  res.json({ ok: true });
});

notificationRouter.patch('/read-all', async (req: AuthRequest2, res: Response2) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ ok: true });
});
