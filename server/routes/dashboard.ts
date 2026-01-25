import { Router, Response } from 'express';
import { EmailLog } from '../models/EmailLog.js';
import { Campaign } from '../models/Campaign.js';
import { Dataset } from '../models/Dataset.js';
import { Template } from '../models/Template.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Email stats
    const [totalSent, totalScheduled, totalFailed] = await Promise.all([
      EmailLog.countDocuments({ userId, status: 'sent' }),
      EmailLog.countDocuments({ userId, status: 'scheduled' }),
      EmailLog.countDocuments({ userId, status: 'failed' }),
    ]);

    // Campaign stats
    const totalCampaigns = await Campaign.countDocuments({ userId });
    const activeCampaigns = await Campaign.countDocuments({
      userId,
      status: { $in: ['scheduled', 'sending'] },
    });

    // Dataset and template counts
    const [totalDatasets, totalTemplates] = await Promise.all([
      Dataset.countDocuments({ userId }),
      Template.countDocuments({ userId }),
    ]);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentEmails = await EmailLog.countDocuments({
      userId,
      createdAt: { $gte: sevenDaysAgo },
    });

    // Campaign completion stats
    const completedCampaigns = await Campaign.countDocuments({
      userId,
      status: 'completed',
    });

    res.json({
      emails: {
        total: totalSent + totalScheduled + totalFailed,
        sent: totalSent,
        scheduled: totalScheduled,
        failed: totalFailed,
        recent: recentEmails,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        completed: completedCampaigns,
      },
      datasets: totalDatasets,
      templates: totalTemplates,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent campaigns
router.get('/recent-campaigns', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '5');

    const campaigns = await Campaign.find({ userId: req.userId })
      .populate('datasetId', 'name')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent emails
router.get('/recent-emails', async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '10');

    const emails = await EmailLog.find({ userId: req.userId })
      .populate('campaignId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

