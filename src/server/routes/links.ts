import { Router, Response } from 'express';
import { adminDb } from '../firebaseAdmin';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * PUT /api/links/reorder
 * Bulk update link order
 * NOTE: This must be defined BEFORE /:id routes to avoid Express matching "reorder" as an :id
 */
router.put('/reorder', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { linkIds } = req.body; // Array of link IDs in the new order

  if (!Array.isArray(linkIds)) {
    return res.status(400).json({ error: 'linkIds must be an array' });
  }

  try {
    // Verify all links belong to the user
    const linksSnapshot = await adminDb.collection('links')
      .where('userId', '==', req.user!.uid)
      .get();
    
    const userLinkIds = new Set(linksSnapshot.docs.map(doc => doc.id));
    const validLinkIds = Array.from(new Set(linkIds.filter(id => userLinkIds.has(id))));

    if (validLinkIds.length === 0) {
      return res.json({ success: true, updatedCount: 0 });
    }

    const batch = adminDb.batch();
    
    validLinkIds.forEach((id, index) => {
      const linkRef = adminDb.collection('links').doc(id);
      batch.update(linkRef, { order: index, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
    res.json({ success: true, updatedCount: validLinkIds.length });
  } catch (error) {
    console.error('Error reordering links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/links
 * Get all links for logged-in user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Note: No .orderBy() here to avoid requiring a Firestore composite index.
    // We sort in memory instead.
    const linksSnapshot = await adminDb.collection('links')
      .where('userId', '==', req.user!.uid)
      .get();

    const links = linksSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

    res.json(links);
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/links
 * Create a new link
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { title, url, icon, isActive } = req.body;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  // Validate URL format (strictly HTTP / HTTPS to prevent javascript: XSS)
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'URL must start with http:// or https://' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
  }

  // Sanitize title (strip HTML tags)
  const sanitizedTitle = String(title).replace(/<[^>]*>/g, '').trim();
  if (!sanitizedTitle || sanitizedTitle.length > 200) {
    return res.status(400).json({ error: 'Title must be 1-200 characters' });
  }

  try {
    const linksCount = (await adminDb.collection('links')
      .where('userId', '==', req.user!.uid)
      .get()).size;

    const newLink = {
      userId: req.user!.uid,
      title: sanitizedTitle,
      url,
      icon: icon || '🔗',
      isActive: isActive !== undefined ? isActive : true,
      order: linksCount,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('links').add(newLink);
    res.status(201).json({ id: docRef.id, ...newLink });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/links/:id
 * Update a link
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const linkDoc = await adminDb.collection('links').doc(id).get();

    if (!linkDoc.exists) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (linkDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this link' });
    }

    const allowedUpdates = ['title', 'url', 'icon', 'isActive', 'order'];
    const filteredUpdates: any = {};
    allowedUpdates.forEach(key => {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (filteredUpdates.url !== undefined) {
      try {
        const parsedUrl = new URL(filteredUpdates.url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return res.status(400).json({ error: 'URL must start with http:// or https://' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid URL format. Must start with http:// or https://' });
      }
    }

    if (filteredUpdates.title !== undefined) {
      const sanitizedTitle = String(filteredUpdates.title).replace(/<[^>]*>/g, '').trim();
      if (!sanitizedTitle || sanitizedTitle.length > 200) {
        return res.status(400).json({ error: 'Title must be 1-200 characters' });
      }
      filteredUpdates.title = sanitizedTitle;
    }

    filteredUpdates.updatedAt = new Date().toISOString();

    await adminDb.collection('links').doc(id).update(filteredUpdates);
    res.json({ id, ...filteredUpdates });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * DELETE /api/links/:id
 * Delete a link
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const linkDoc = await adminDb.collection('links').doc(id).get();

    if (!linkDoc.exists) {
      return res.status(404).json({ error: 'Link not found' });
    }

    if (linkDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ error: 'Forbidden: You do not own this link' });
    }

    await adminDb.collection('links').doc(id).delete();
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
