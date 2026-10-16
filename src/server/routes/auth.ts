import { Router } from 'express';
import { adminAuth, adminDb } from '../firebaseAdmin';
import { generateUsername } from '../../lib/utils';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    let finalUsername = (username || generateUsername(email)).toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!finalUsername || finalUsername.length < 3) {
      finalUsername = generateUsername(email);
    }

    // 2. Check if username is taken
    const usernameCheck = await adminDb.collection('users')
      .where('username', '==', finalUsername)
      .limit(1)
      .get();

    if (!usernameCheck.empty) {
      finalUsername = `${finalUsername}${Math.floor(100 + Math.random() * 900)}`;
    }

    // 3. Create user profile in Firestore
    const userData = {
      uid: userRecord.uid,
      name: name || '',
      email: email,
      username: finalUsername,
      bio: '',
      theme: 'dark',
      buttonStyle: 'rounded',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: userData 
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
