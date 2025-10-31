import { Router, Response } from 'express';
import { Campaign } from '../models/Campaign.js';
import { AuthRequest } from '../middleware/auth.js';
import { scheduleCampaignEmails } from '../services/scheduler.js';

const router = Router();

// Get all campaigns
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const query: any = { userId: req.userId };
    if (status) {
      query.status = status;
    }

    const campaigns = await Campaign.find(query)
      .populate('datasetId', 'name')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 });

    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single campaign
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    })
      .populate('datasetId')
      .populate('templateId');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      datasetId,
      templateId,
      selectedRecordIds,
      sendType,
      scheduledAt,
      delayBetweenEmails,
      dailySendLimit,
    } = req.body;

    if (!name || !datasetId || !templateId || !sendType) {
      return res.status(400).json({
        error: 'Name, datasetId, templateId, and sendType are required',
      });
    }

    if (sendType === 'scheduled' && !scheduledAt) {
      return res.status(400).json({
        error: 'scheduledAt is required for scheduled campaigns',
      });
    }

    const campaign = await Campaign.create({
      userId: req.userId,
      name,
      datasetId,
      templateId,
      selectedRecordIds: selectedRecordIds || [],
      sendType,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      delayBetweenEmails: delayBetweenEmails
        ? parseInt(delayBetweenEmails) * 1000 // Convert seconds to milliseconds
        : undefined,
      dailySendLimit: dailySendLimit ? parseInt(dailySendLimit) : undefined,
      status: sendType === 'scheduled' ? 'scheduled' : 'draft',
    });

    // If instant send, schedule emails immediately
    if (sendType === 'instant') {
      try {
        await scheduleCampaignEmails(campaign._id.toString());
      } catch (error: any) {
        console.error('Failed to schedule campaign emails:', error);
        campaign.status = 'failed';
        await campaign.save();
      }
    } else if (sendType === 'scheduled') {
      // For scheduled campaigns, schedule emails for the future date
      try {
        await scheduleCampaignEmails(campaign._id.toString());
        console.log(`✅ Campaign scheduled for ${scheduledAt}`);
      } catch (error: any) {
        console.error('Failed to schedule campaign emails:', error);
        campaign.status = 'failed';
        await campaign.save();
      }
    }

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate('datasetId', 'name')
      .populate('templateId', 'name');

    res.status(201).json(populatedCampaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      selectedRecordIds,
      sendType,
      scheduledAt,
      delayBetweenEmails,
      dailySendLimit,
      status,
    } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (selectedRecordIds) updateData.selectedRecordIds = selectedRecordIds;
    if (sendType) updateData.sendType = sendType;
    if (scheduledAt) updateData.scheduledAt = new Date(scheduledAt);
    if (delayBetweenEmails !== undefined) {
      updateData.delayBetweenEmails = delayBetweenEmails * 1000;
    }
    if (dailySendLimit !== undefined) updateData.dailySendLimit = dailySendLimit;
    if (status) updateData.status = status;

    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    )
      .populate('datasetId', 'name')
      .populate('templateId', 'name');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Start campaign (schedule emails)
router.post('/:id/start', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({
        error: 'Campaign can only be started from draft status',
      });
    }

    await scheduleCampaignEmails(campaign._id.toString());

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate('datasetId', 'name')
      .populate('templateId', 'name');

    res.json(updatedCampaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

