// backend/src/routes/users.ts
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const userRouter = Router();
userRouter.use(authenticate);

userRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const [reviewCount, docCount, bugCount, recentReviews] = await Promise.all([
    prisma.codeReview.count({ where: { userId } }),
    prisma.document.count({ where: { userId } }),
    prisma.bug.count({ where: { reporterId: userId } }),
    prisma.codeReview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, language: true, status: true, createdAt: true },
    }),
  ]);

  res.json({ reviewCount, docCount, bugCount, recentReviews });
});

userRouter.patch('/profile', async (req: AuthRequest, res: Response) => {
  const { name, username, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name, username, avatar },
    select: { id: true, name: true, email: true, username: true, avatar: true, plan: true },
  });

  res.json(user);
});
