import { Router, Response } from 'express';
import { Template } from '../models/Template.js';
import { Dataset } from '../models/Dataset.js';
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
    const templates = await Template.find({ userId: req.userId })
      .populate('datasetId', 'name fields');
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
    })
      .populate('datasetId', 'name fields');

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
    const { name, subject, body, datasetId, variableMappings } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({ error: 'Name, subject, and body are required' });
    }

    // Extract variables from subject and body
    const subjectVars = extractVariables(subject);
    const bodyVars = extractVariables(body);
    const variables = [...new Set([...subjectVars, ...bodyVars])];

    // If datasetId is provided, validate it belongs to the user
    if (datasetId) {
      const dataset = await Dataset.findOne({
        _id: datasetId,
        userId: req.userId,
      });
      if (!dataset) {
        return res.status(404).json({ error: 'Dataset not found' });
      }

      // Auto-map variables to dataset fields if mappings not provided
      let mappings = variableMappings || {};
      if (!variableMappings && dataset.fields) {
        variables.forEach((variable) => {
          // Try to find matching field (case-insensitive)
          const matchingField = dataset.fields.find(
            (f) => f.label.toLowerCase() === variable.toLowerCase()
          );
          if (matchingField) {
            mappings[variable] = matchingField.label;
          }
        });
      }
    }

    const template = await Template.create({
      userId: req.userId,
      name,
      subject,
      body,
      variables,
      datasetId: datasetId || undefined,
      variableMappings: variableMappings || undefined,
    });

    const populated = await Template.findById(template._id)
      .populate('datasetId', 'name fields');

    res.status(201).json(populated);
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
    const { name, subject, body, datasetId, variableMappings } = req.body;

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

    // Handle dataset binding
    if (datasetId !== undefined) {
      if (datasetId === null || datasetId === '') {
        updateData.datasetId = undefined;
        updateData.variableMappings = undefined;
      } else {
        const dataset = await Dataset.findOne({
          _id: datasetId,
          userId: req.userId,
        });
        if (!dataset) {
          return res.status(404).json({ error: 'Dataset not found' });
        }
        updateData.datasetId = datasetId;

        // Auto-map variables if mappings not provided
        if (!variableMappings && dataset.fields) {
          const template = await Template.findById(req.params.id);
          if (template) {
            const vars = updateData.variables || template.variables || [];
            let mappings: Record<string, string> = {};
            vars.forEach((variable: string) => {
              const matchingField = dataset.fields.find(
                (f) => f.label.toLowerCase() === variable.toLowerCase()
              );
              if (matchingField) {
                mappings[variable] = matchingField.label;
              }
            });
            updateData.variableMappings = Object.keys(mappings).length > 0 ? mappings : undefined;
          }
        } else if (variableMappings) {
          updateData.variableMappings = variableMappings;
        }
      }
    } else if (variableMappings !== undefined) {
      updateData.variableMappings = variableMappings;
    }

    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    )
      .populate('datasetId', 'name fields');

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

// Preview template with sample data or dataset record
router.post('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const { sampleData, recordIndex, datasetId } = req.body;

    const template = await Template.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).populate('datasetId');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    let previewSubject = template.subject;
    let previewBody = template.body;
    let dataToUse = sampleData;

    // Determine which dataset to use (provided datasetId or template's bound dataset)
    const datasetIdToUse = datasetId || (template.datasetId ? (typeof template.datasetId === 'object' ? template.datasetId._id : template.datasetId) : null);

    // If dataset ID and recordIndex are provided, use dataset record
    if (datasetIdToUse && recordIndex !== undefined) {
      const dataset = await Dataset.findOne({
        _id: datasetIdToUse,
        userId: req.userId,
      });
      
      if (dataset && dataset.records && dataset.records[recordIndex]) {
        const record = dataset.records[recordIndex];
        
        // Use variable mappings if available, otherwise auto-map by field name
        if (template.variableMappings) {
          dataToUse = {};
          Object.keys(template.variableMappings).forEach((variable) => {
            const fieldLabel = template.variableMappings![variable];
            dataToUse[variable] = record[fieldLabel];
          });
        } else {
          // Auto-map: variable name matches field label (case-insensitive)
          dataToUse = {};
          template.variables.forEach((variable) => {
            const field = dataset.fields.find((f) => f.label.toLowerCase() === variable.toLowerCase());
            if (field) {
              dataToUse[variable] = record[field.label];
            }
          });
        }
      }
    }

    // Replace placeholders with data
    if (dataToUse && typeof dataToUse === 'object') {
      Object.keys(dataToUse).forEach((key) => {
        const placeholder = new RegExp(`\\{${key}\\}`, 'g');
        const value = dataToUse[key]?.toString() || `{${key}}`;
        previewSubject = previewSubject.replace(placeholder, value);
        previewBody = previewBody.replace(placeholder, value);
      });
    }

    res.json({
      subject: previewSubject,
      body: previewBody,
      dataUsed: dataToUse,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

