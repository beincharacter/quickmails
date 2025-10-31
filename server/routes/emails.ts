import { Router, Response } from 'express';
import { EmailLog } from '../models/EmailLog.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get email logs
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, campaignId, limit = '50', page = '1' } = req.query;

    const query: any = { userId: req.userId };
    if (status) {
      query.status = status;
    }
    if (campaignId) {
      query.campaignId = campaignId;
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const emails = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip)
      .populate('campaignId', 'name');

    const total = await EmailLog.countDocuments(query);

    res.json({
      emails,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single email log
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const email = await EmailLog.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('campaignId', 'name');

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(email);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

