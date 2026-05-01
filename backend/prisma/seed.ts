// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@devmind.ai' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@devmind.ai',
      username: 'demouser',
      password: hashedPassword,
      plan: 'PRO',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      description: 'A sample workspace to explore DevMind features',
      ownerId: demoUser.id,
      members: {
        create: { userId: demoUser.id, role: 'OWNER' },
      },
    },
  });

  console.log('✅ Created workspace:', workspace.name);

  // Create sample bugs
  const bugData = [
    {
      title: 'Login page crashes on mobile Safari',
      description: 'When a user tries to log in on iOS Safari 16, the page crashes after submitting the form. Steps: Open Safari on iPhone, navigate to /auth/login, fill credentials, tap Sign In.',
      priority: 'CRITICAL' as const,
      status: 'IN_PROGRESS' as const,
      labels: ['mobile', 'safari', 'auth'],
      aiSuggestion: '**Root Cause:** Likely a JavaScript compatibility issue with iOS Safari 16 and modern async/await syntax or Promise chains.\n\n**Fix Steps:**\n1. Add a polyfill for `globalThis` if missing\n2. Check if `fetch` API usage needs the `credentials: include` flag\n3. Test with Babel targeting `>0.25%, not dead, iOS >= 14`\n4. Add error boundary around the login form component\n\n**Prevention:** Set up cross-browser testing in your CI/CD pipeline with BrowserStack or Sauce Labs.',
    },
    {
      title: 'API returns 500 for large file uploads',
      description: 'When uploading files larger than 10MB via the code review feature, the API returns a 500 Internal Server Error. The issue seems to be in the multer configuration.',
      priority: 'HIGH' as const,
      status: 'TODO' as const,
      labels: ['api', 'upload', 'backend'],
      aiSuggestion: '**Root Cause:** The Express body-parser or Multer middleware likely has a default 10MB size limit.\n\n**Fix:**\n```js\napp.use(express.json({ limit: "50mb" }));\nconst upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });\n```\n\n**Prevention:** Add explicit file size limits and return meaningful 413 errors.',
    },
    {
      title: 'Dark mode flickers on page load',
      description: 'There is a brief flash of white/light mode before the dark theme loads. This is a classic FOUC (Flash of Unstyled Content) problem.',
      priority: 'MEDIUM' as const,
      status: 'TODO' as const,
      labels: ['ui', 'dark-mode', 'ux'],
      aiSuggestion: '**Root Cause:** Theme class is applied via JavaScript after hydration, causing a flash.\n\n**Fix:** Add an inline script in <head> before CSS loads:\n```html\n<script>\n  const theme = localStorage.getItem("theme") || "system";\n  if (theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)) {\n    document.documentElement.classList.add("dark");\n  }\n</script>\n```',
    },
    {
      title: 'Notification emails not sending in production',
      description: 'Invitation emails are working locally but not in the production environment. Checked the SMTP configuration and it looks correct.',
      priority: 'HIGH' as const,
      status: 'IN_REVIEW' as const,
      labels: ['email', 'production', 'notifications'],
      aiSuggestion: '**Root Cause:** Could be SMTP firewall rules blocking port 587, or missing SPF/DKIM DNS records causing spam filtering.\n\n**Steps:**\n1. Check if port 587 or 465 is open on your Railway/EC2 instance\n2. Use a dedicated email service like Resend, SendGrid, or SES\n3. Add SPF record: `v=spf1 include:sendgrid.net ~all`\n4. Set up DKIM via your email provider\n5. Check spam folder and email delivery logs',
    },
    {
      title: 'Kanban drag-and-drop not working on touch',
      description: 'The bug tracker Kanban board drag-and-drop functionality does not work on touch devices (phones and tablets).',
      priority: 'LOW' as const,
      status: 'DONE' as const,
      labels: ['mobile', 'kanban', 'ux'],
      aiSuggestion: '**Fix:** Use the `@dnd-kit/core` library which supports both mouse and touch events natively, replacing any HTML5 drag-and-drop implementation.',
    },
  ];

  for (const bug of bugData) {
    await prisma.bug.create({
      data: {
        ...bug,
        reporterId: demoUser.id,
        workspaceId: workspace.id,
      },
    });
  }

  console.log(`✅ Created ${bugData.length} sample bugs`);

  // Create sample activities
  const activityTypes = [
    { type: 'REVIEW_COMPLETED' as const, description: 'Completed review: Auth service refactor' },
    { type: 'BUG_CREATED' as const, description: 'Reported bug: Login page crashes on mobile Safari' },
    { type: 'DOC_GENERATED' as const, description: 'Generated README for: API Gateway module' },
    { type: 'BUG_UPDATED' as const, description: 'Updated bug: Kanban drag-and-drop (DONE)' },
  ];

  for (const activity of activityTypes) {
    await prisma.activity.create({
      data: {
        ...activity,
        userId: demoUser.id,
        workspaceId: workspace.id,
      },
    });
  }

  console.log('✅ Created sample activities');
  console.log('\n🎉 Seed complete!');
  console.log('📧 Demo login: demo@devmind.ai / demo1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
