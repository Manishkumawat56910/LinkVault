import { Router, Response } from 'express';
import { adminDb } from '../firebaseAdmin';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

const router = Router();

/**
 * GET /api/profile
 * Get logged-in user profile (creates if missing)
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userRef = adminDb.collection('users').doc(req.user!.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // Create default profile
      const email = req.user!.email || '';
      const baseUsername = email ? email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
      let username = `${baseUsername || 'user'}${Math.floor(100 + Math.random() * 900)}`;

      // Ensure username uniqueness
      const existing = await adminDb.collection('users').where('username', '==', username).limit(1).get();
      if (!existing.empty) {
        username = `${baseUsername || 'user'}${Date.now().toString().slice(-4)}`;
      }
      
      const newProfile = {
        uid: req.user!.uid,
        email: email,
        username: username,
        name: req.user!.email?.split('@')[0] || 'User',
        bio: '',
        theme: 'dark',
        buttonStyle: 'rounded',
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRef.set(newProfile);
      return res.json(newProfile);
    }

    res.json(userDoc.data());
  } catch (error) {
    console.error('Error fetching/creating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/profile
 * Update user profile
 */
router.put('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  const allowedUpdates = [
    'name', 'bio', 'username', 'theme', 
    'buttonStyle', 'backgroundColor', 
    'socialLinks', 'isPublic'
  ];

  const filteredUpdates: any = {};
  allowedUpdates.forEach(key => {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  });

  try {
    // Validate username if provided
    if (filteredUpdates.username !== undefined) {
      const cleanUsername = String(filteredUpdates.username).toLowerCase().trim();
      if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 characters (letters, numbers, underscores)' });
      }
      filteredUpdates.username = cleanUsername;

      // Check username uniqueness if changing
      const usernameCheck = await adminDb.collection('users')
        .where('username', '==', cleanUsername)
        .get();
      
      const existingUser = usernameCheck.docs.find(doc => doc.id !== req.user!.uid);
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    if (filteredUpdates.bio !== undefined) {
      filteredUpdates.bio = String(filteredUpdates.bio).slice(0, 160);
    }
    if (filteredUpdates.name !== undefined) {
      filteredUpdates.name = String(filteredUpdates.name).slice(0, 50);
    }
    if (filteredUpdates.theme && !['light', 'dark', 'gradient'].includes(filteredUpdates.theme)) {
      filteredUpdates.theme = 'dark';
    }
    if (filteredUpdates.buttonStyle && !['rounded', 'square', 'outline', 'shadow'].includes(filteredUpdates.buttonStyle)) {
      filteredUpdates.buttonStyle = 'rounded';
    }

    filteredUpdates.updatedAt = new Date().toISOString();

    const userRef = adminDb.collection('users').doc(req.user!.uid);
    // Use set with merge: true so it creates or updates without throwing NOT_FOUND
    await userRef.set(filteredUpdates, { merge: true });
    
    const updatedDoc = await userRef.get();
    res.json(updatedDoc.data());
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

