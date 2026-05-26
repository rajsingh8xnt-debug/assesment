import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/db.js';
import Ticket from './models/Ticket.js';

const assert = (condition, msg) => {
  if (!condition) throw new Error(`Assertion Failed: ${msg}`);
  console.log(`[PASS] ${msg}`);
};

const runTests = async () => {
  console.log('--- STARTING BACKEND BUSINESS LOGIC TESTS ---');
  await connectDB();
  
  try {
    // Clear any existing database state
    await Ticket.deleteMany({});

    // Test 1: Validation - Invalid email
    console.log('\nTest 1: Validating invalid email...');
    try {
      const badTicket = new Ticket({
        subject: 'Test',
        description: 'Test description',
        customerEmail: 'not-an-email',
        priority: 'high',
        status: 'open'
      });
      await badTicket.save();
      throw new Error('Should have failed validation for invalid email!');
    } catch (e) {
      assert(e.name === 'ValidationError', 'Incorrect email returns validation error');
    }

    // Test 2: Validation - Missing subject
    console.log('\nTest 2: Validating missing subject...');
    try {
      const badTicket = new Ticket({
        description: 'Test description',
        customerEmail: 'test@example.com',
        priority: 'high',
        status: 'open'
      });
      await badTicket.save();
      throw new Error('Should have failed validation for missing subject!');
    } catch (e) {
      assert(e.name === 'ValidationError', 'Missing subject returns validation error');
    }

    // Test 3: SLA derived fields - Unresolved and breached (Created 5 hours ago, priority high -> target 4 hours)
    console.log('\nTest 3: Checking unresolved ticket SLA breach...');
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    const unresolvedBreached = new Ticket({
      subject: 'Slow server',
      description: 'The server is extremely slow',
      customerEmail: 'admin@company.com',
      priority: 'high',
      status: 'open',
      createdAt: fiveHoursAgo
    });
    await unresolvedBreached.save();
    
    let doc = await Ticket.findById(unresolvedBreached._id);
    let json = doc.toJSON();
    assert(json.ageMinutes >= 300 && json.ageMinutes <= 301, `Age calculated correctly (${json.ageMinutes} minutes)`);
    assert(json.slaBreached === true, 'High priority unresolved ticket > 4h marked as SLA breached');

    // Test 4: SLA derived fields - Unresolved and not breached (Created 2 hours ago, priority high -> target 4 hours)
    console.log('\nTest 4: Checking unresolved ticket SLA not breached...');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const unresolvedNotBreached = new Ticket({
      subject: 'Typo in docs',
      description: 'Minor typo',
      customerEmail: 'user@gmail.com',
      priority: 'high',
      status: 'open',
      createdAt: twoHoursAgo
    });
    await unresolvedNotBreached.save();
    doc = await Ticket.findById(unresolvedNotBreached._id);
    json = doc.toJSON();
    assert(json.ageMinutes >= 120 && json.ageMinutes <= 121, `Age calculated correctly (${json.ageMinutes} minutes)`);
    assert(json.slaBreached === false, 'High priority unresolved ticket < 4h not marked as breached');

    // Test 5: SLA derived fields - Resolved within SLA (Created 5h ago, resolved 3h later -> age 3h, high priority target 4h)
    console.log('\nTest 5: Checking resolved ticket within SLA...');
    const resolvedInSla = new Ticket({
      subject: 'Printer issue',
      description: 'Printer jam',
      customerEmail: 'staff@office.com',
      priority: 'high',
      status: 'resolved',
      createdAt: fiveHoursAgo,
      resolvedAt: new Date(fiveHoursAgo.getTime() + 3 * 60 * 60 * 1000) // 3 hours later
    });
    await resolvedInSla.save();
    doc = await Ticket.findById(resolvedInSla._id);
    json = doc.toJSON();
    assert(json.ageMinutes === 180, 'Resolved ticket age stops at resolution time (180 minutes)');
    assert(json.slaBreached === false, 'Resolved within SLA is not breached');

    // Test 6: SLA derived fields - Resolved after SLA (Created 5h ago, resolved 4.5h later -> age 4.5h, high target 4h)
    console.log('\nTest 6: Checking resolved ticket breaching SLA...');
    const resolvedBreached = new Ticket({
      subject: 'Network down',
      description: 'Switch broke',
      customerEmail: 'network@office.com',
      priority: 'high',
      status: 'resolved',
      createdAt: fiveHoursAgo,
      resolvedAt: new Date(fiveHoursAgo.getTime() + 4.5 * 60 * 60 * 1000) // 4.5 hours later
    });
    await resolvedBreached.save();
    doc = await Ticket.findById(resolvedBreached._id);
    json = doc.toJSON();
    assert(json.ageMinutes === 270, 'Resolved ticket age stops at resolution time (270 minutes)');
    assert(json.slaBreached === true, 'Resolved after SLA target is correctly marked as breached');

    console.log('\nAll business logic tests passed!');
  } catch (error) {
    console.error(`\n[FAIL] Test suite crashed: ${error.message}`);
    console.error(error.stack);
  } finally {
    await disconnectDB();
    console.log('\n--- TESTS COMPLETED ---');
  }
};

runTests();
