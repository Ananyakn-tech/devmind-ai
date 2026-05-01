// backend/src/routes/documents.ts
import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateDocumentation, DocType } from '../services/aiService';
import { AppError } from '../middleware/errorHandler';

export const documentRouter = Router();
documentRouter.use(authenticate);

const generateSchema = z.object({
  title: z.string().min(1).max(200),
  language: z.string(),
  code: z.string().min(1).max(100000),
  docType: z.enum(['README', 'JSDOC', 'DOCSTRING', 'API_DOCS', 'CHANGELOG']),
  projectName: z.string().optional(),
  workspaceId: z.string().optional(),
});

// GET /api/documents
documentRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { workspaceId, docType, page = '1', limit = '10' } = req.query;

  const where: any = { userId: req.user!.id };
  if (workspaceId) where.workspaceId = workspaceId;
  if (docType) where.type = docType;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: {
        id: true, title: true, type: true, language: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  res.json({ documents, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// GET /api/documents/:id
documentRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!doc) throw new AppError('Document not found', 404);
  res.json(doc);
});

// POST /api/documents/generate
documentRouter.post('/generate', async (req: AuthRequest, res: Response) => {
  const body = generateSchema.parse(req.body);

  const content = await generateDocumentation(
    body.code,
    body.language,
    body.docType as DocType,
    body.projectName
  );

  const doc = await prisma.document.create({
    data: {
      title: body.title,
      type: body.docType,
      inputCode: body.code,
      content,
      language: body.language,
      userId: req.user!.id,
      workspaceId: body.workspaceId,
    },
  });

  await prisma.activity.create({
    data: {
      type: 'DOC_GENERATED',
      description: `Generated ${body.docType} for: ${body.title}`,
      userId: req.user!.id,
      workspaceId: body.workspaceId,
    },
  });

  res.status(201).json(doc);
});

// DELETE /api/documents/:id
documentRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.id, userId: req.user!.id },
  });

  if (!doc) throw new AppError('Document not found', 404);

  await prisma.document.delete({ where: { id: req.params.id } });
  res.json({ message: 'Document deleted' });
});
