import { Router, Response, Request } from 'express';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../firebaseAdmin';
import { clickLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * GET /api/public/profile/:username
 * Fetch public profile and links by username
 */
router.get('/profile/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // 1. Find user by username
    const userSnapshot = await adminDb.collection('users')
      .where('username', '==', username.toLowerCase().trim())
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }

    const userData = userSnapshot.docs[0].data();
    
    // Explicitly check if isPublic is false (treat undefined as true for older profiles)
    if (userData.isPublic === false) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }

    const userId = userSnapshot.docs[0].id;

    // 2. Fetch active links for this user
    const linksSnapshot = await adminDb.collection('links')
      .where('userId', '==', userId)
      .get();

    const links = linksSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter((link: any) => link.isActive !== false) // Default to true if undefined
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    // Strip private PII like email before sending public profile
    const { email: _email, ...safeProfile } = userData;

    res.json({
      profile: safeProfile,
      links
    });
  } catch (error: any) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/public/click/:linkId
 * Record a click on a link
 */
router.post('/click/:linkId', clickLimiter, async (req: Request, res: Response) => {
  const { linkId } = req.params;
  const { referrer, device, browser } = req.body;

  if (!linkId) {
    return res.status(400).json({ error: 'Link ID is required' });
  }

  try {
    const linkRef = adminDb.collection('links').doc(linkId);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const linkData = linkDoc.data();
    const ownerId = linkData?.userId;

    // 1. Atomic increment click count on the link
    await linkRef.update({
      clickCount: FieldValue.increment(1)
    });

    // 2. Record click analytics with verified ownerId
    await adminDb.collection('clicks').add({
      linkId,
      userId: ownerId,
      referrer: typeof referrer === 'string' ? referrer.slice(0, 500) : 'direct',
      device: typeof device === 'string' ? device.slice(0, 50) : 'desktop',
      browser: typeof browser === 'string' ? browser.slice(0, 50) : 'unknown',
      clickedAt: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

