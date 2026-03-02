import { Router } from 'express';
import { z } from 'zod';
import { signJwt } from '../middleware/auth';
import { verifyPassword } from '../repositories/usersRepository';

const router = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(3) });

router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', errors: parsed.error.flatten() });
  }

  verifyPassword(parsed.data.email, parsed.data.password)
    .then((user) => {
      if (!user) return res.status(401).json({ message: 'Invalid credentials' });
      const token = signJwt({ id: user.id, email: user.email, role: user.role as any, name: user.name });
      return res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
    })
    .catch((err) => res.status(500).json({ message: err.message ?? 'Login failed' }));
});

export default router;
