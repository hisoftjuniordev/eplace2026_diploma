import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sysQuery } from '../config/db';
import sql from 'mssql';
import { authMiddleware } from '../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email in geslo sta obvezna' });
    return;
  }

  try {
    const result = await sysQuery(
      `SELECT u.id, u.email, u.geslo_hash, u.vloga, u.tenant_id, u.ime, u.priimek, u.aktivno
       FROM dbo.users u WHERE u.email = @email`,
      (req) => req.input('email', sql.NVarChar, email)
    );

    const user = result.recordset[0];
    if (!user || !user.aktivno) {
      res.status(401).json({ error: 'Napačen email ali geslo' });
      return;
    }

    const valid = await bcrypt.compare(password, user.geslo_hash);
    if (!valid) {
      res.status(401).json({ error: 'Napačen email ali geslo' });
      return;
    }

    const token = jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenant_id,
        email: user.email,
        vloga: user.vloga,
        ime: user.ime,
        priimek: user.priimek,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        ime: user.ime,
        priimek: user.priimek,
        vloga: user.vloga,
        tenantId: user.tenant_id,
      },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Napaka strežnika' });
  }
});

authRouter.get('/me', authMiddleware, (req: Request, res: Response): void => {
  res.json(req.user);
});
