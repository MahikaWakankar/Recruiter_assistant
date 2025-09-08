import express from 'express';
import rateLimit from 'express-rate-limit';
import Candidate from '../models/Candidate.js';
import { scanResumeDirectory } from '../utils/resumeParser.js';
import { validateCandidateUpdate } from '../utils/validation.js';
import { downloadResumesFromDrive } from '../utils/googleDrive.js';
import fs from 'fs';

const router = express.Router();

// Rate limiting
const scanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many scan requests, please try again later' }
});

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const { status, search, limit = 100, skip = 0 } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const candidates = await Candidate
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
      
    const total = await Candidate.countDocuments(query);
    
    res.json({ candidates, total });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// Scan resumes
router.post('/scan', scanLimiter, async (req, res) => {
  try {
    const { driveLink } = req.body;
    if (!driveLink) {
      return res.status(400).json({ error: 'Google Drive link is required' });
    }
    
    // Download resumes from Google Drive to temp directory
    const tempDir = await downloadResumesFromDrive(driveLink);

    console.log('Starting resume scan...');
    const parsedCandidates = await scanResumeDirectory(tempDir);

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });

    // Get all current source files from the scan
    const currentSourceFiles = parsedCandidates.map(c => c.sourceFile);

    // Remove candidates whose sourceFile is not in the current scan
    await Candidate.deleteMany({ sourceFile: { $nin: currentSourceFiles } });

    if (parsedCandidates.length === 0) {
      return res.json({ count: 0, message: 'No resume files found', candidates: [] });
    }

    // Upsert candidates (avoid duplicates based on sourceFile)
    const bulkOps = parsedCandidates.map(candidate => ({
      updateOne: {
        filter: { sourceFile: candidate.sourceFile },
        update: { 
          $set: candidate,
          $setOnInsert: { status: 'new', createdAt: new Date() }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Candidate.bulkWrite(bulkOps, { ordered: false });
    }

    // Return updated list
    const allCandidates = await Candidate
      .find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: parsedCandidates.length,
      message: `Successfully processed ${parsedCandidates.length} resume files`,
      candidates: allCandidates
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: `Scan failed: ${error.message}` });
  }
});

// Update candidate
router.patch('/:id', async (req, res) => {
  try {
    const { error, value } = validateCandidateUpdate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// Delete candidate
router.delete('/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

export default router;