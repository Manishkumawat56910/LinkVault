import { Router, Response } from 'express';
import { adminDb } from '../firebaseAdmin';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * GET /api/analytics
 * Get click analytics for the logged-in user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // 1. Fetch all links to map linkId to title
    const linksSnapshot = await adminDb.collection('links')
      .where('userId', '==', req.user!.uid)
      .get();

    const linkMap: any = {};
    linksSnapshot.docs.forEach(doc => {
      linkMap[doc.id] = doc.data().title;
    });

    // 2. Fetch all clicks for this user without composite index requirement
    const clicksSnapshot = await adminDb.collection('clicks')
      .where('userId', '==', req.user!.uid)
      .limit(1000)
      .get();

    const clicks = clicksSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          linkTitle: linkMap[data.linkId] || 'Deleted Link'
        } as any;
      })
      .sort((a, b) => {
        const timeA = a.clickedAt ? new Date(a.clickedAt).getTime() : 0;
        const timeB = b.clickedAt ? new Date(b.clickedAt).getTime() : 0;
        return timeB - timeA;
      });

    // 3. Aggregate data for charts
    const stats = {
      totalClicks: clicks.length,
      byLink: {} as Record<string, number>,
      byDevice: {} as Record<string, number>,
      byBrowser: {} as Record<string, number>,
      byDate: {} as Record<string, number>
    };

    clicks.forEach((click: any) => {
      // By Link
      const linkName = linkMap[click.linkId] || 'Deleted Link';
      stats.byLink[linkName] = (stats.byLink[linkName] || 0) + 1;

      // By Device
      const device = click.device || 'desktop';
      stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;

      // By Browser
      const browser = click.browser || 'Unknown';
      stats.byBrowser[browser] = (stats.byBrowser[browser] || 0) + 1;

      // By Date
      const date = (click.clickedAt && typeof click.clickedAt === 'string')
        ? click.clickedAt.split('T')[0]
        : 'Recent';
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    res.json({
      clicks: clicks.slice(0, 50), // Return last 50 for the table
      stats
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
