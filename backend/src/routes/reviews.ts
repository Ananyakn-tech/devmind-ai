// backend/src/routes/reviews.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { analyzeCode } from '../services/aiService';
import { AppError } from '../middleware/errorHandler';
import { io } from '../index';

export const reviewRouter = Router();
reviewRouter.use(authenticate);

const createReviewSchema = z.object({
  title: z.string().min(1).max(200),
  language: z.string(),
  code: z.string().min(1).max(100000),
  workspaceId: z.string().optional(),
});

// GET /api/reviews — list user's reviews
reviewRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { workspaceId, page = '1', limit = '10' } = req.query;

  const where: any = { userId: req.user!.id };
  if (workspaceId) where.workspaceId = workspaceId;

  const [reviews, total] = await Promise.all([
    prisma.codeReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        _count: { select: { suggestions: true, comments: true } },
      },
    }),
    prisma.codeReview.count({ where }),
  ]);

  res.json({ reviews, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// GET /api/reviews/:id
reviewRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const review = await prisma.codeReview.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
    include: {
      suggestions: { orderBy: [{ severity: 'asc' }, { line: 'asc' }] },
      comments: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!review) throw new AppError('Review not found', 404);
  res.json(review);
});

// POST /api/reviews — create review (triggers AI analysis)
reviewRouter.post('/', async (req: AuthRequest, res: Response) => {
  const body = createReviewSchema.parse(req.body);

  // Create review in PENDING state
  const review = await prisma.codeReview.create({
    data: {
      title: body.title,
      language: body.language,
      code: body.code,
      workspaceId: body.workspaceId,
      userId: req.user!.id,
      status: 'PENDING',
    },
  });

  // Respond immediately, run AI in background
  res.status(202).json({ review, message: 'Review queued for analysis' });

  // Async AI analysis
  (async () => {
    try {
      await prisma.codeReview.update({
        where: { id: review.id },
        data: { status: 'IN_PROGRESS' },
      });

      io.to(`user:${req.user!.id}`).emit('review:started', { reviewId: review.id });

      const result = await analyzeCode(body.code, body.language);

      await prisma.$transaction([
        prisma.codeReview.update({
          where: { id: review.id },
          data: { status: 'COMPLETED' },
        }),
        prisma.suggestion.createMany({
          data: result.suggestions.map((s) => ({
            reviewId: review.id,
            line: s.line || null,
            severity: s.severity,
            category: s.category,
            title: s.title,
            description: s.description,
            suggestion: s.suggestion,
            codeSnippet: s.codeSnippet || null,
          })),
        }),
        prisma.activity.create({
          data: {
            type: 'REVIEW_COMPLETED',
            description: `Completed review: ${review.title}`,
            userId: req.user!.id,
            workspaceId: body.workspaceId,
            reviewId: review.id,
          },
        }),
      ]);

      io.to(`user:${req.user!.id}`).emit('review:completed', {
        reviewId: review.id,
        summary: result.summary,
        overallScore: result.overallScore,
        suggestionsCount: result.suggestions.length,
      });
    } catch (error) {
      await prisma.codeReview.update({
        where: { id: review.id },
        data: { status: 'FAILED' },
      });
      io.to(`user:${req.user!.id}`).emit('review:failed', { reviewId: review.id });
    }
  })();
});

// DELETE /api/reviews/:id
reviewRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const review = await prisma.codeReview.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!review) throw new AppError('Review not found', 404);

  await prisma.codeReview.delete({ where: { id: req.params.id } });
  res.json({ message: 'Review deleted' });
});

// POST /api/reviews/:id/comments
reviewRouter.post('/:id/comments', async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content) throw new AppError('Content is required', 400);

  const comment = await prisma.comment.create({
    data: {
      content,
      userId: req.user!.id,
      reviewId: req.params.id,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  io.to(`review:${req.params.id}`).emit('comment:new', comment);
  res.status(201).json(comment);
});
