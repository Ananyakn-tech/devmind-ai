import { Router } from 'express';
export const notificationRouter = Router();

notificationRouter.get('/', async (req, res) => {
  res.json([
    { id: 1, message: 'AI reviewed auth.service.ts — 2 issues found', read: false, createdAt: new Date() },
    { id: 2, message: 'Task "Add rate limiting" marked complete', read: false, createdAt: new Date() },
    { id: 3, message: 'PR #47 Socket.io refactor opened', read: true, createdAt: new Date() }
  ]);
});

notificationRouter.put('/:id/read', async (req, res) => {
  res.json({ success: true });
});
