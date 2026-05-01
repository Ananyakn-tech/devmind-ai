// backend/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        username: body.email.split('@')[0] + Math.random().toString(36).slice(2, 6),
      },
      select: { id: true, name: true, email: true, username: true, avatar: true, plan: true },
    });

    // Create a default personal workspace
    const slug = `${user.username}-workspace`;
    const workspace = await prisma.workspace.create({
      data: {
        name: `${user.name}'s Workspace`,
        slug,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: 'OWNER' },
        },
      },
    });

    const token = generateToken(user.id);

    res.status(201).json({ user, token, defaultWorkspace: workspace });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user || !user.password) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValid = await bcrypt.compare(body.password, user.password);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        plan: user.plan,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    throw error;
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      avatar: true,
      plan: true,
      createdAt: true,
      ownedWorkspaces: { select: { id: true, name: true, slug: true } },
      workspaceMembers: {
        include: { workspace: { select: { id: true, name: true, slug: true, logo: true } } },
      },
    },
  });

  res.json(user);
});

// POST /api/auth/logout
authRouter.post('/logout', authenticate, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
