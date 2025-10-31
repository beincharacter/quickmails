import { Router, Response } from 'express';
import { Template } from '../models/Template.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Extract variables from template text
function extractVariables(text: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}

// Get all templates
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const templates = await Template.find({ userId: req.userId });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single template
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create template
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    // Extract variables from subject and body
    const subjectVars = extractVariables(subject);
    const bodyVars = extractVariables(body);
    const variables = [...new Set([...subjectVars, ...bodyVars])];

    const template = await Template.create({
      userId: req.userId,
      name,
      subject,
      body,
      variables,
    });

    res.status(201).json(template);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Template name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { name, subject, body } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (subject) {
      updateData.subject = subject;
      const subjectVars = extractVariables(subject);
      const existingVars = updateData.variables || [];
      updateData.variables = [...new Set([...existingVars, ...subjectVars])];
    }
    if (body) {
      updateData.body = body;
      const bodyVars = extractVariables(body);
      const existingVars = updateData.variables || [];
      updateData.variables = [...new Set([...existingVars, ...bodyVars])];
    }

    // Re-extract all variables if subject or body changed
    if (subject || body) {
      const template = await Template.findById(req.params.id);
      if (template) {
        const finalSubject = subject || template.subject;
        const finalBody = body || template.body;
        const subjectVars = extractVariables(finalSubject);
        const bodyVars = extractVariables(finalBody);
        updateData.variables = [...new Set([...subjectVars, ...bodyVars])];
      }
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Preview template with sample data
router.post('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { sampleData } = req.body;

    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    let previewSubject = template.subject;
    let previewBody = template.body;

    // Replace placeholders with sample data
    if (sampleData && typeof sampleData === 'object') {
      Object.keys(sampleData).forEach((key) => {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        const value = sampleData[key]?.toString() || `{${key}}`;
        previewSubject = previewSubject.replace(placeholder, value);
        previewBody = previewBody.replace(placeholder, value);
      });
    }

    res.json({
      subject: previewSubject,
      body: previewBody,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

