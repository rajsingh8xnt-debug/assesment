import express from 'express';
import Ticket from '../models/Ticket.js';

const router = express.Router();

// Valid adjacent transitions mapping
const VALID_TRANSITIONS = {
  'open': ['in_progress'],
  'in_progress': ['open', 'resolved'],
  'resolved': ['in_progress', 'closed'],
  'closed': ['resolved']
};

/**
 * @route   POST /tickets
 * @desc    Create a new support ticket
 */
router.post('/', async (req, res, next) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
    // Explicit validation before save to respond with a clean 400
    if (!subject || !description || !customerEmail || !priority) {
      return res.status(400).json({ 
        message: 'Validation failed: subject, description, customerEmail, and priority are required.' 
      });
    }

    const ticket = new Ticket({
      subject,
      description,
      customerEmail,
      priority,
      status: 'open'
    });

    const savedTicket = await ticket.save();
    return res.status(201).json(savedTicket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}` 
      });
    }
    next(error);
  }
});

/**
 * @route   GET /tickets
 * @desc    List support tickets with optional query filters (status, priority, breached)
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, priority, breached } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Fetch matching tickets
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    
    // Transform to standard JSON objects to invoke schema virtual fields
    let ticketList = tickets.map(ticket => ticket.toJSON());

    // Apply client-side virtual filter for SLA Breach if provided
    if (breached !== undefined) {
      const breachedBool = breached === 'true';
      ticketList = ticketList.filter(t => t.slaBreached === breachedBool);
    }

    return res.json(ticketList);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /tickets/stats
 * @desc    Get aggregate metrics per status, priority, and SLA breached count
 */
router.get('/stats', async (req, res, next) => {
  try {
    const allTickets = await Ticket.find({});
    
    const stats = {
      statusCounts: {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      },
      priorityCounts: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0
      },
      openSlaBreachedCount: 0
    };

    allTickets.forEach(doc => {
      const ticket = doc.toJSON();
      
      // Increment status count
      if (stats.statusCounts[ticket.status] !== undefined) {
        stats.statusCounts[ticket.status]++;
      }
      
      // Increment priority count
      if (stats.priorityCounts[ticket.priority] !== undefined) {
        stats.priorityCounts[ticket.priority]++;
      }
      
      // Increment SLA breached count if ticket is still open/in-progress and breached
      if ((ticket.status === 'open' || ticket.status === 'in_progress') && ticket.slaBreached) {
        stats.openSlaBreachedCount++;
      }
    });

    return res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PATCH /tickets/:id
 * @desc    Update a support ticket (primarily used to change status)
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: `Ticket with ID ${id} not found.` });
    }

    // Enforce status transitions rules if status is changing
    if (updates.status !== undefined && updates.status !== ticket.status) {
      const currentStatus = ticket.status;
      const newStatus = updates.status;
      const allowed = VALID_TRANSITIONS[currentStatus] || [];

      if (!allowed.includes(newStatus)) {
        return res.status(400).json({
          message: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowed.join(', ')}`
        });
      }

      // Automatically handle resolvedAt
      if (newStatus === 'resolved') {
        ticket.resolvedAt = new Date();
      } else if (currentStatus === 'resolved' && newStatus === 'in_progress') {
        // "Moving backwards from resolved -> in_progress must clear resolvedAt"
        ticket.resolvedAt = null;
      } else if (newStatus === 'in_progress' || newStatus === 'open') {
        // Extra safeguard: clear resolvedAt if moving/staying in open/in-progress
        ticket.resolvedAt = null;
      }
      
      ticket.status = newStatus;
    }

    // Apply any other updates (subject, description, priority, customerEmail)
    if (updates.subject !== undefined) ticket.subject = updates.subject;
    if (updates.description !== undefined) ticket.description = updates.description;
    if (updates.priority !== undefined) ticket.priority = updates.priority;
    if (updates.customerEmail !== undefined) ticket.customerEmail = updates.customerEmail;

    const updatedTicket = await ticket.save();
    return res.json(updatedTicket);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: `Validation failed: ${Object.values(error.errors).map(e => e.message).join(', ')}` 
      });
    }
    next(error);
  }
});

/**
 * @route   DELETE /tickets/:id
 * @desc    Delete a ticket
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    
    if (!deletedTicket) {
      return res.status(404).json({ message: `Ticket with ID ${id} not found.` });
    }

    return res.json({ message: 'Ticket deleted successfully.', id });
  } catch (error) {
    next(error);
  }
});

export default router;
