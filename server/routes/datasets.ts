import { Router, Response } from 'express';
import { Dataset, IDatasetField, IDatasetRecord } from '../models/Dataset.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all datasets for user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    console.log('📋 GET /datasets - User ID:', req.userId);
    const datasets = await Dataset.find({ userId: req.userId }).select('-records');
    console.log(`✅ Found ${datasets.length} datasets for user`);
    
    // Ensure fields and records arrays exist (even if empty) for client-side safety
    const datasetsWithDefaults = datasets.map((ds: any) => ({
      ...ds.toObject(),
      fields: ds.fields || [],
      records: [], // Records are excluded for performance, but ensure array exists
    }));
    
    res.json(datasetsWithDefaults);
  } catch (error: any) {
    console.error('❌ Error fetching datasets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single dataset with records
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const dataset = await Dataset.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(dataset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create dataset
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, fields, records } = req.body;

    if (!name || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Name and fields are required' });
    }

    const dataset = await Dataset.create({
      userId: req.userId,
      name,
      fields: fields as IDatasetField[],
      records: (records || []) as IDatasetRecord[],
    });

    res.status(201).json(dataset);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Dataset name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update dataset
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, fields, records } = req.body;

    const dataset = await Dataset.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...(name && { name }),
        ...(fields && { fields }),
        ...(records !== undefined && { records }),
      },
      { new: true }
    );

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json(dataset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add field to dataset
router.post('/:id/fields', async (req: AuthRequest, res: Response) => {
  try {
    const { label, type } = req.body;

    if (!label) {
      return res.status(400).json({ error: 'Field label is required' });
    }

    const dataset = await Dataset.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    // Check if field already exists
    if (dataset.fields.some((f) => f.label === label)) {
      return res.status(400).json({ error: 'Field already exists' });
    }

    dataset.fields.push({ label, type: type || 'string' });
    await dataset.save();

    res.json(dataset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add record to dataset
router.post('/:id/records', async (req: AuthRequest, res: Response) => {
  try {
    const { record } = req.body;

    if (!record || typeof record !== 'object') {
      return res.status(400).json({ error: 'Record object is required' });
    }

    const dataset = await Dataset.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    dataset.records.push(record);
    await dataset.save();

    res.json(dataset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dataset
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const dataset = await Dataset.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }

    res.json({ message: 'Dataset deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

