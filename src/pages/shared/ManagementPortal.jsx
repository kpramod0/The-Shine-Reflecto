import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listUsers, toDirectoryClient, toDirectoryUser } from '../../services/usersApi';
import {
  createRosterFromUi,
  deleteRoster as deleteApiRoster,
  downloadAttendancePdf,
  listAttendance as listApiAttendance,
  listRosters as listApiRosters,
  updateRosterFromUi,
} from '../../services/operationsApi';
import './ManagementPortal.css';
import { MaterialsView } from './MaterialsView';

/* ── Supervisor Scope Configuration ── */
export const SUPERVISOR_SCOPES = {
  '9999999991': {
    name: 'Supervisor One',
    clients: ['Acme Corp', 'Apex'],
    workers: [
      { name: 'Worker One', phone: '9999999993' },
      { name: 'Aarav Sharma', phone: '9876543210' }
    ]
  },
  '9766123961': {
    name: 'ANIL S/o Mattar',
    clients: ['Renaissance Bengaluru Race Course Hotel', 'Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel'],
    workers: [
      { name: 'SHIVKARAN', phone: '9580916481' },
      { name: 'Shidharth', phone: '9880438510' }
    ]
  },
  '9305200273': {
    name: 'MOHIT S/o PRAMLAL',
    clients: ['JW Marriott Hotel Kolkata'],
    workers: [
      { name: 'SURJEET', phone: '7439971566' },
      { name: 'MANISH KUMAR', phone: '8252259573' },
      { name: 'BRIJENDRA .', phone: '9975801468' }
    ]
  }
};

/* ── Initial Roster Seed Data ── */
const INITIAL_ROSTERS = [
  {
    id: 'r1',
    rosterDate: '2026-05-24',
    shift: 'Day',
    name: 'Day Shift',
    createdAt: '2026-05-23T10:00:00.000Z',
    createdBy: 'ANIL S/o Mattar',
    clients: ['Renaissance Bengaluru Race Course Hotel'],
    supervisor: 'ANIL S/o Mattar (9766123961)',
    workers: [
      { name: 'SHIVKARAN', phone: '9580916481' }
    ]
  },
  {
    id: 'r2',
    rosterDate: '2026-05-24',
    shift: 'Day',
    name: 'Day Shift',
    createdAt: '2026-05-23T11:00:00.000Z',
    createdBy: 'ANIL S/o Mattar',
    clients: ['Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel'],
    supervisor: 'ANIL S/o Mattar (9766123961)',
    workers: [
      { name: 'Shidharth', phone: '9880438510' }
    ]
  },
  {
    id: 'r3',
    rosterDate: '2026-05-24',
    shift: 'Day',
    name: 'Day Shift',
    createdAt: '2026-05-23T09:00:00.000Z',
    createdBy: 'MOHIT S/o PRAMLAL',
    clients: ['JW Marriott Hotel Kolkata'],
    supervisor: 'MOHIT S/o PRAMLAL (9305200273)',
    workers: [
      { name: 'SURJEET', phone: '7439971566' },
      { name: 'MANISH KUMAR', phone: '8252259573' },
      { name: 'BRIJENDRA .', phone: '9975801468' }
    ]
  },
  {
    id: 'r4',
    rosterDate: '2026-05-24',
    shift: 'Day',
    name: 'Day Shift',
    createdAt: '2026-05-23T12:00:00.000Z',
    createdBy: 'Supervisor One',
    clients: ['Acme Corp'],
    supervisor: 'Supervisor One (9999999991)',
    workers: [
      { name: 'Worker One', phone: '9999999993' }
    ]
  }
];

export const getRosters = () => {
  const data = localStorage.getItem('tsr_rosters');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_ROSTERS;
    }
  }
  localStorage.setItem('tsr_rosters', JSON.stringify(INITIAL_ROSTERS));
  return INITIAL_ROSTERS;
};

export const saveRosters = (rosters) => {
  localStorage.setItem('tsr_rosters', JSON.stringify(rosters));
};

export const getNotifications = () => {
  const data = localStorage.getItem('tsr_notifications');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }
  return [];
};

export const saveNotifications = (notifications) => {
  localStorage.setItem('tsr_notifications', JSON.stringify(notifications));
};

export const addNotification = (workerPhone, workerName, message) => {
  const list = getNotifications();
  const newNotif = {
    id: 'n_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    workerPhone,
    workerName,
    message,
    read: false,
    timestamp: new Date().toISOString()
  };
  list.unshift(newNotif);
  saveNotifications(list);
};

export const runAutoMonitor = (simDate, simTime) => {
  const rosters = getRosters();
  const scans = getAttendanceScans();
  const remindersSentKey = 'tsr_reminders_sent';
  const remindersSent = JSON.parse(localStorage.getItem(remindersSentKey) || '[]');
  const missedMarkedKey = 'tsr_missed_marked';
  const missedMarked = JSON.parse(localStorage.getItem(missedMarkedKey) || '[]');

  let updatedScans = [...scans];
  let scanUpdated = false;
  let reminderCount = 0;
  let missedCount = 0;

  const parseTimeToMinutes = (tStr) => {
    if (!tStr) return 0;
    const match = tStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return 0;
    let hrs = parseInt(match[1]);
    const mins = parseInt(match[2]);
    const ampm = match[3];
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && hrs < 12) hrs += 12;
      if (ampm.toUpperCase() === 'AM' && hrs === 12) hrs = 0;
    }
    return hrs * 60 + mins;
  };

  const simMins = parseTimeToMinutes(simTime);

  rosters.forEach(r => {
    if (r.rosterDate !== simDate) return;

    const thresholdMins = r.shift === 'Day' ? 570 : 1320; // 9:30 AM or 10:00 PM
    const cutoffMins = r.shift === 'Day' ? 600 : 1380;    // 10:00 AM or 11:00 PM
    const thresholdStr = r.shift === 'Day' ? '09:30 AM' : '10:00 PM';
    const cutoffStr = r.shift === 'Day' ? '10:00 AM' : '11:00 PM';

    r.workers.forEach(w => {
      // Check check-in
      const hasScan = scans.some(s => s.workerMobile === w.phone && s.date === simDate && s.shift === r.shift && s.client === r.clients[0]);

      if (!hasScan) {
        // past threshold -> reminder
        if (simMins >= thresholdMins) {
          const reminderId = `${w.phone}_${simDate}_${r.shift}_reminder`;
          if (!remindersSent.includes(reminderId)) {
            remindersSent.push(reminderId);
            addNotification(w.phone, w.name, `Reminder: You have not marked check-in attendance for your ${r.shift} shift at ${r.clients[0]} (Threshold: ${thresholdStr}).`);
            const supMobile = r.supervisor ? (r.supervisor.match(/\((\d+)\)/)?.[1] || '9999999991') : '9999999991';
            addNotification(supMobile, 'Supervisor', `Alert: Worker ${w.name} has not checked in for ${r.shift} shift at ${r.clients[0]} by ${thresholdStr}.`);
            reminderCount++;
          }
        }

        // past cutoff -> auto mark missed (Unofficial Leave)
        if (simMins >= cutoffMins) {
          const missedId = `${w.phone}_${simDate}_${r.shift}_missed`;
          if (!missedMarked.includes(missedId)) {
            missedMarked.push(missedId);
            
            const newScan = {
              id: 'AS_MISSED_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
              date: simDate,
              workerName: w.name,
              workerMobile: w.phone,
              supervisorMobile: r.supervisor ? (r.supervisor.match(/\((\d+)\)/)?.[1] || '9999999991') : '9999999991',
              client: r.clients[0],
              shift: r.shift,
              status: 'Unofficial Leave',
              checkIn: '',
              checkOut: '',
              totalHours: 0,
              notes: `System auto-marked: Missed check-in window (Cutoff: ${cutoffStr})`
            };
            updatedScans.push(newScan);
            scanUpdated = true;

            const supMobile = r.supervisor ? (r.supervisor.match(/\((\d+)\)/)?.[1] || '9999999991') : '9999999991';
            addNotification(supMobile, 'Supervisor', `Missed Attendance Alert: Worker ${w.name} has failed to mark attendance for ${r.shift} shift at ${r.clients[0]}. Marked as Unofficial Leave.`);
            missedCount++;
          }
        }
      }
    });
  });

  localStorage.setItem(remindersSentKey, JSON.stringify(remindersSent));
  localStorage.setItem(missedMarkedKey, JSON.stringify(missedMarked));

  if (scanUpdated) {
    saveAttendanceScans(updatedScans);
  }

  return { reminderCount, missedCount };
};

/* ── Supervisor Visit Seed Data & Helpers ── */
const INITIAL_VISITS = [
  {
    id: 'V1',
    date: '2026-05-23',
    client: 'Acme Corp',
    supervisor: 'Supervisor One',
    supervisorMobile: '9999999991',
    type: 'Property Round',
    checkIn: '10:00 AM',
    checkOut: '11:15 AM',
    duration: 1.25,
    status: 'Completed',
    notes: 'Lobby and parking inspection complete.',
    rounds: [
      { area: 'Lobby', desc: 'Main entrance floor', condition: 'Good' },
      { area: 'Parking Lot', desc: 'Basement 1', condition: 'Average' }
    ],
    location: 'Lat: 12.9716, Lng: 77.5946'
  },
  {
    id: 'V2',
    date: '2026-05-22',
    client: 'Renaissance Bengaluru Race Course Hotel',
    supervisor: 'ANIL S/o Mattar',
    supervisorMobile: '9766123961',
    type: 'Monthly Site Visits',
    checkIn: '02:00 PM',
    checkOut: '03:15 PM',
    duration: 1.25,
    status: 'Completed',
    area: 'Lobby Level',
    subArea: 'Reception Floor',
    readings: [85, 88, 82, 84],
    avgReading: 84.75,
    remarks: 'Gloss level satisfies the premium standard. High luster.',
    location: 'Lat: 12.9815, Lng: 77.5796'
  }
];

const INITIAL_VISIT_REQUESTS = [
  {
    id: 'VR1',
    client: 'Apex',
    requestedBy: 'Client One',
    requestedByMobile: '9999999992',
    role: 'client',
    type: 'On Demand by Client',
    reason: 'Need review of polishing work done in the conference hall.',
    date: '2026-05-24',
    status: 'Pending'
  }
];

export const getVisits = () => {
  const data = localStorage.getItem('tsr_supervisor_visits');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_VISITS;
    }
  }
  localStorage.setItem('tsr_supervisor_visits', JSON.stringify(INITIAL_VISITS));
  return INITIAL_VISITS;
};

export const saveVisits = (visits) => {
  localStorage.setItem('tsr_supervisor_visits', JSON.stringify(visits));
};

export const getVisitRequests = () => {
  const data = localStorage.getItem('tsr_visit_requests');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return INITIAL_VISIT_REQUESTS;
    }
  }
  localStorage.setItem('tsr_visit_requests', JSON.stringify(INITIAL_VISIT_REQUESTS));
  return INITIAL_VISIT_REQUESTS;
};

export const saveVisitRequests = (reqs) => {
  localStorage.setItem('tsr_visit_requests', JSON.stringify(reqs));
};

/* ── Material Requests Data Layer ────────────────────────────── */

const MATERIAL_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_SUPERVISOR_REVIEW: 'Under Supervisor Review',
  SUPERVISOR_APPROVED: 'Supervisor Approved',
  SUPERVISOR_REJECTED: 'Supervisor Rejected',
  SENT_TO_ADMIN: 'Sent to Admin',
  UNDER_ADMIN_REVIEW: 'Under Admin Review',
  ADMIN_APPROVED: 'Admin Approved',
  ADMIN_REJECTED: 'Admin Rejected',
  ON_HOLD: 'On Hold',
  PROCUREMENT_STARTED: 'Procurement Started',
  DELIVERED: 'Delivered',
  CLOSED: 'Closed'
};

const MATERIAL_UNITS = ['Bags', 'Litres', 'Pieces', 'Pairs', 'Rolls', 'Boxes', 'Kg', 'Metres', 'Packets', 'Sets'];

const MATERIAL_SUGGESTIONS = [
  'White Powder', 'Grinder', 'Polishing Chemical', 'Cleaning Cloth', 'Machine Parts',
  'Safety Gloves', 'Floor Polish', 'Wax Stripper', 'Mop', 'Scrubbing Pad',
  'Diamond Pads', 'Marble Sealer', 'Spray Bottle', 'Vacuum Cleaner Bag',
  'Knee Pads', 'Eye Protection Goggles', 'Face Mask', 'Burnishing Pads', 'Degreaser'
];

const makeTimestamp = (offsetMins = 0) => {
  const d = new Date('2026-05-24T09:00:00.000Z');
  d.setMinutes(d.getMinutes() + offsetMins);
  return d.toISOString();
};

const INITIAL_MATERIAL_REQUESTS = [
  {
    id: 'MR001',
    materialName: 'White Powder',
    quantity: 5,
    unit: 'Bags',
    priority: 'High',
    reason: 'Lobby polishing scheduled for next week. Current stock insufficient.',
    requiredDate: '2026-05-28',
    client: 'Acme Corp',
    shift: 'Day',
    status: MATERIAL_STATUS.DELIVERED,
    isDraft: false,
    createdBy: 'Worker One',
    createdByMobile: '9999999993',
    supervisorMobile: '9999999991',
    supervisorName: 'Supervisor One',
    supervisorNotes: 'Approved for urgent cleaning. Quantity confirmed with site.',
    adminNotes: 'Dispatched from central warehouse. Vendor: Supreme Supplies.',
    quantityModified: 5,
    createdAt: makeTimestamp(0),
    updatedAt: makeTimestamp(480),
    timeline: [
      { actor: 'Worker One', role: 'worker', action: 'Created request', timestamp: makeTimestamp(0), note: 'Needed urgently for lobby project.' },
      { actor: 'Supervisor One', role: 'supervisor', action: 'Approved & Forwarded to Admin', timestamp: makeTimestamp(10), note: 'Approved for urgent cleaning. Quantity confirmed with site.' },
      { actor: 'Admin User', role: 'admin', action: 'Admin Approved — Procurement Started', timestamp: makeTimestamp(60), note: 'Dispatched from central warehouse.' },
      { actor: 'Admin User', role: 'admin', action: 'Marked as Delivered', timestamp: makeTimestamp(480), note: 'Material delivered to Acme Corp site.' }
    ]
  },
  {
    id: 'MR002',
    materialName: 'Diamond Pads',
    quantity: 10,
    unit: 'Pieces',
    priority: 'Urgent',
    reason: 'Machine pads worn out. Cannot continue polishing without replacement.',
    requiredDate: '2026-05-25',
    client: 'Apex',
    shift: 'Night',
    status: MATERIAL_STATUS.SENT_TO_ADMIN,
    isDraft: false,
    createdBy: 'Aarav Sharma',
    createdByMobile: '9876543210',
    supervisorMobile: '9999999991',
    supervisorName: 'Supervisor One',
    supervisorNotes: 'Urgent replacement needed. Cannot delay further.',
    adminNotes: '',
    quantityModified: 8,
    createdAt: makeTimestamp(60),
    updatedAt: makeTimestamp(80),
    timeline: [
      { actor: 'Aarav Sharma', role: 'worker', action: 'Created request', timestamp: makeTimestamp(60), note: 'Pads completely worn out. Urgent.' },
      { actor: 'Supervisor One', role: 'supervisor', action: 'Modified quantity (10 → 8) & Forwarded', timestamp: makeTimestamp(80), note: 'Reduced to 8 based on current stock check. Still urgent.' }
    ]
  },
  {
    id: 'MR003',
    materialName: 'Safety Gloves',
    quantity: 20,
    unit: 'Pairs',
    priority: 'Medium',
    reason: 'Monthly safety gear replenishment for team.',
    requiredDate: '2026-06-01',
    client: 'Renaissance Bengaluru Race Course Hotel',
    shift: 'Day',
    status: MATERIAL_STATUS.UNDER_SUPERVISOR_REVIEW,
    isDraft: false,
    createdBy: 'SHIVKARAN',
    createdByMobile: '9580916481',
    supervisorMobile: '9766123961',
    supervisorName: 'ANIL S/o Mattar',
    supervisorNotes: '',
    adminNotes: '',
    quantityModified: null,
    createdAt: makeTimestamp(120),
    updatedAt: makeTimestamp(120),
    timeline: [
      { actor: 'SHIVKARAN', role: 'worker', action: 'Created request', timestamp: makeTimestamp(120), note: 'Monthly safety gear replenishment.' }
    ]
  },
  {
    id: 'MR004',
    materialName: 'Marble Sealer',
    quantity: 3,
    unit: 'Litres',
    priority: 'Low',
    reason: 'Post-polishing sealing for VIP suite area.',
    requiredDate: '2026-06-10',
    client: 'JW Marriott Hotel Kolkata',
    shift: 'Day',
    status: MATERIAL_STATUS.DRAFT,
    isDraft: true,
    createdBy: 'Supervisor One',
    createdByMobile: '9999999991',
    supervisorMobile: '9999999991',
    supervisorName: 'Supervisor One',
    supervisorNotes: '',
    adminNotes: '',
    quantityModified: null,
    createdAt: makeTimestamp(180),
    updatedAt: makeTimestamp(180),
    timeline: [
      { actor: 'Supervisor One', role: 'supervisor', action: 'Saved as Draft', timestamp: makeTimestamp(180), note: '' }
    ]
  }
];

/* ── Material Requests Data ────────────────────────────────────── */
export const getMaterialRequests = () => {
  return JSON.parse(localStorage.getItem('tsr_material_requests') || JSON.stringify(INITIAL_MATERIAL_REQUESTS));
};

export const saveMaterialRequests = (reqs) => {
  localStorage.setItem('tsr_material_requests', JSON.stringify(reqs));
};

/* ── Complaints Data ─────────────────────────────────────────── */
export const COMPLAINT_STATUS = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  SUPERVISOR_APPROVED: 'Supervisor Approved',
  SUPERVISOR_REJECTED: 'Supervisor Rejected',
  ADMIN_APPROVED: 'Admin Approved',
  ADMIN_REJECTED: 'Admin Rejected',
  CLOSED: 'Closed'
};

const INITIAL_COMPLAINTS = [];

export const getComplaints = () => {
  const data = localStorage.getItem('tsr_complaints');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_COMPLAINTS;
    }
  }
  localStorage.setItem('tsr_complaints', JSON.stringify(INITIAL_COMPLAINTS));
  return INITIAL_COMPLAINTS;
};

export const saveComplaints = (complaints) => {
  localStorage.setItem('tsr_complaints', JSON.stringify(complaints));
};



/* ── Tasks Data ─────────────────────────────────────────────── */

const MOCK_TASKS = [
  { id: 'T1', title: 'Quarterly report', client: 'Acme Corp', worker: 'Aarav Sharma', workerMobile: '9876543210', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-01-30', due: '2025-09-21', completed: '2025-09-21', status: 'Completed', priority: 'High', review: 'Very Good', notes: 'Submitted on time', location: '123 Tech Street, Silicon Valley' },
  { id: 'T2', title: 'Update project plan', client: 'Acme Corp', worker: 'Aarav Sharma', workerMobile: '9876543210', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-03-13', due: '2025-04-10', completed: '2025-04-13', status: 'In Progress', priority: 'Medium', review: 'Average', notes: 'Minor delay due to scope change', location: '123 Tech Street, Silicon Valley' },
  { id: 'T3', title: 'Data entry audit', client: 'Apex', worker: 'Priya Patel', workerMobile: '9999999993', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-02-03', due: '2025-03-10', completed: '2025-03-08', status: 'Completed', priority: 'Low', review: 'Good', notes: 'All clean', location: '901 Industrial Blvd, Austin TX' },
  { id: 'T4', title: 'Bug triage', client: 'Acme Corp', worker: 'Aarav Sharma', workerMobile: '9876543210', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-04-22', due: '2025-05-02', completed: '2025-05-03', status: 'Completed', priority: 'High', review: 'Bad', notes: 'Handled 17 issues', location: '123 Tech Street, Silicon Valley' },
  { id: 'T5', title: 'Integration tests', client: 'Nexus', worker: 'Priya Patel', workerMobile: '9999999993', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-02-24', due: '2025-03-15', completed: '2025-03-15', status: 'Completed', priority: 'High', review: 'Very Good', notes: 'Full pass', location: '77 Harbor Road, Seattle WA' },
  { id: 'T6', title: 'Policy review', client: 'Apex', worker: 'Priya Patel', workerMobile: '9999999993', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-12-27', due: '2026-01-20', completed: '', status: 'On Hold', priority: 'Medium', review: '-', notes: 'Drafting updates', location: '901 Industrial Blvd, Austin TX' },
  { id: 'T7', title: 'Risk register', client: 'Apex', worker: 'Priya Patel', workerMobile: '9999999993', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-11-04', due: '2025-11-28', completed: '', status: 'In Progress', priority: 'Low', review: '-', notes: 'Waiting stakeholder inputs', location: '901 Industrial Blvd, Austin TX' },
  { id: 'T8', title: 'Legacy cleanup', client: 'Acme Corp', worker: 'Aarav Sharma', workerMobile: '9876543210', supervisor: 'Rohan Singh', supervisorMobile: '9999999991', assignedOn: '2025-08-11', due: '2025-09-01', completed: '2025-09-02', status: 'Cancelled', priority: 'Low', review: 'Poor', notes: 'Scope cancelled', location: '123 Tech Street, Silicon Valley' },
];

export const getTasks = () => {
  const data = localStorage.getItem('tsr_tasks');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return MOCK_TASKS;
    }
  }
  localStorage.setItem('tsr_tasks', JSON.stringify(MOCK_TASKS));
  return MOCK_TASKS;
};

export const saveTasks = (tasks) => {
  localStorage.setItem('tsr_tasks', JSON.stringify(tasks));
};

const MOCK_ATTENDANCE_SCANS = [
  { id: 'AS1', date: '2025-01-30', workerName: 'Aarav Sharma', workerMobile: '9876543210', supervisorMobile: '9999999991', client: 'Acme Corp', shift: 'Day', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', totalHours: 9.0, notes: 'Completed daily rounds' },
  { id: 'AS2', date: '2025-01-31', workerName: 'Aarav Sharma', workerMobile: '9876543210', supervisorMobile: '9999999991', client: 'Acme Corp', shift: 'Day', status: 'Present', checkIn: '08:50 AM', checkOut: '06:05 PM', totalHours: 9.25, notes: 'Regular work day' },
  { id: 'AS3', date: '2025-02-01', workerName: 'Aarav Sharma', workerMobile: '9876543210', supervisorMobile: '9999999991', client: 'Acme Corp', shift: 'Night', status: 'Present', checkIn: '09:00 PM', checkOut: '06:00 AM', totalHours: 9.0, notes: 'Night watch' },
  { id: 'AS4', date: '2025-02-02', workerName: 'Aarav Sharma', workerMobile: '9876543210', supervisorMobile: '9999999991', client: 'Acme Corp', shift: 'Day', status: 'Official Leave', checkIn: '', checkOut: '', totalHours: 0, notes: 'Sick leave approved by supervisor' },
  { id: 'AS5', date: '2025-02-03', workerName: 'Aarav Sharma', workerMobile: '9876543210', supervisorMobile: '9999999991', client: 'Acme Corp', shift: 'Day', status: 'Unofficial Leave', checkIn: '', checkOut: '', totalHours: 0, notes: 'Absent without approval' },
  { id: 'AS6', date: '2025-01-30', workerName: 'Priya Patel', workerMobile: '9999999993', supervisorMobile: '9999999991', client: 'Apex', shift: 'Day', status: 'Present', checkIn: '09:15 AM', checkOut: '06:15 PM', totalHours: 9.0, notes: 'Traffic delay but completed all tasks' },
  { id: 'AS7', date: '2025-01-31', workerName: 'Priya Patel', workerMobile: '9999999993', supervisorMobile: '9999999991', client: 'Apex', shift: 'Day', status: 'Present', checkIn: '09:00 AM', checkOut: '05:30 PM', totalHours: 8.5, notes: 'Regular shift' },
  { id: 'AS8', date: '2025-02-01', workerName: 'Priya Patel', workerMobile: '9999999993', supervisorMobile: '9999999991', client: 'Apex', shift: 'Night', status: 'Official Leave', checkIn: '', checkOut: '', totalHours: 0, notes: 'Approved vacation' },
  { id: 'AS9', date: '2025-02-02', workerName: 'Priya Patel', workerMobile: '9999999993', supervisorMobile: '9999999991', client: 'Apex', shift: 'Day', status: 'Present', checkIn: '09:00 AM', checkOut: '06:00 PM', totalHours: 9.0, notes: 'On-time' },
  { id: 'AS10', date: '2025-02-03', workerName: 'Priya Patel', workerMobile: '9999999993', supervisorMobile: '9999999991', client: 'Apex', shift: 'Day', status: 'Unofficial Leave', checkIn: '', checkOut: '', totalHours: 0, notes: 'Unplanned absence' },
  { id: 'AS11', date: '2025-01-30', workerName: 'Admin User', workerMobile: '8830227359', supervisorMobile: '', client: 'Nexus', shift: 'Day', status: 'Present', checkIn: '09:00 AM', checkOut: '05:00 PM', totalHours: 8.0, notes: 'Setup portal configurations' }
];

export const getAttendanceScans = () => {
  const data = localStorage.getItem('tsr_attendance_scans');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return MOCK_ATTENDANCE_SCANS;
    }
  }
  localStorage.setItem('tsr_attendance_scans', JSON.stringify(MOCK_ATTENDANCE_SCANS));
  return MOCK_ATTENDANCE_SCANS;
};

export const saveAttendanceScans = (scans) => {
  localStorage.setItem('tsr_attendance_scans', JSON.stringify(scans));
};

export default function ManagementPortal() {
  const { user } = useAuth();
  const location = useLocation();
  const [currentView, setCurrentView] = useState('hub'); // hub, tasks, attendance, roster, visits, materials, complaints
  const [simDate, setSimDate] = useState(() => localStorage.getItem('tsr_simulated_date') || '2026-05-24');
  const [simTime, setSimTime] = useState(() => localStorage.getItem('tsr_simulated_time') || '10:30 AM');
  const [simConsoleOpen, setSimConsoleOpen] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (location.state?.view) {
      setCurrentView(location.state.view);
    }
  }, [location.state]);

  const navigateTo = (view) => setCurrentView(view);

  const handleRunMonitor = () => {
    localStorage.setItem('tsr_simulated_date', simDate);
    localStorage.setItem('tsr_simulated_time', simTime);
    const res = runAutoMonitor(simDate, simTime);
    setTick(prev => prev + 1);
    alert(`Smart Attendance Monitoring complete!\n- Reminders triggered: ${res.reminderCount}\n- Missed shifts auto-marked: ${res.missedCount}`);
  };

  return (
    <div className="mgt-page" id="management-portal-page" key={tick}>
      {/* Simulation Console */}
      <div style={{ background: '#0F172A', color: '#F8FAFC', padding: '12px 20px', borderBottom: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setSimConsoleOpen(!simConsoleOpen)}>
          <span style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚙️ Smart Attendance & Time Simulation Console
          </span>
          <span style={{ fontSize: 12, color: '#94A3B8' }}>{simConsoleOpen ? 'Collapse ▲' : 'Expand Simulation Controls ▼'}</span>
        </div>

        {simConsoleOpen && (
          <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 15, alignItems: 'center', borderTop: '1px solid #1E293B', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Simulated Date:</span>
              <input 
                type="date" 
                value={simDate} 
                onChange={e => { setSimDate(e.target.value); localStorage.setItem('tsr_simulated_date', e.target.value); }} 
                style={{ background: '#1E293B', border: '1px solid #475569', color: '#FFFFFF', padding: '4px 8px', borderRadius: 4, fontSize: 12 }} 
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Simulated Time:</span>
              <select 
                value={simTime} 
                onChange={e => { setSimTime(e.target.value); localStorage.setItem('tsr_simulated_time', e.target.value); }} 
                style={{ background: '#1E293B', border: '1px solid #475569', color: '#FFFFFF', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}
              >
                <option value="09:00 AM">09:00 AM (Day Shift Start)</option>
                <option value="09:45 AM">09:45 AM (Day Check-in Overdue)</option>
                <option value="10:15 AM">10:15 AM (Day Cutoff Missed)</option>
                <option value="02:00 PM">02:00 PM (Afternoon)</option>
                <option value="09:50 PM">09:50 PM (Night Shift Start)</option>
                <option value="10:15 PM">10:15 PM (Night Check-in Overdue)</option>
                <option value="11:15 PM">11:15 PM (Night Cutoff Missed)</option>
              </select>
            </div>
            <button 
              onClick={handleRunMonitor} 
              style={{ background: '#3B82F6', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#2563EB'}
              onMouseOut={e => e.currentTarget.style.background = '#3B82F6'}
            >
              🚀 Run Smart Monitor
            </button>
            <span style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>
              Simulates cron-based monitoring behavior on selected date/time.
            </span>
          </div>
        )}
      </div>

      {currentView === 'hub' && <HubView onNavigate={navigateTo} user={user} />}
      {currentView === 'tasks' && <TasksView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'attendance' && <AttendanceView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'roster' && <RosterView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'visits' && <VisitsView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'materials' && <MaterialsView onBack={() => navigateTo('hub')} user={user} />}
      {currentView === 'complaints' && <ComplaintsView onBack={() => navigateTo('hub')} user={user} />}
    </div>
  );
}

/* ── Services & Reports Hub ──────────────────────────────────── */

function HubView({ onNavigate, user }) {
  const role = user?.role;

  // Let's compute actual metric summaries for the cards based on role-isolated tasks
  const allTasks = getTasks();
  let isolated = allTasks;
  if (role === 'worker') {
    isolated = allTasks.filter(t => t.workerMobile === user.mobile);
  } else if (role === 'supervisor') {
    isolated = allTasks.filter(t => t.supervisorMobile === user.mobile);
  } else if (role === 'client') {
    isolated = allTasks.filter(t => t.client === user.client);
  }

  const activeCount = isolated.filter(t => t.status === 'In Progress' || t.status === 'On Hold').length;

  const savedScans = getAttendanceScans();
  let isolatedScans = savedScans;
  if (role === 'worker') {
    isolatedScans = savedScans.filter(as => as.workerMobile === user.mobile);
  } else if (role === 'supervisor') {
    const myWorkers = ['9876543210', '9999999993'];
    const myClients = ['Acme Corp', 'Apex'];
    isolatedScans = savedScans.filter(as => myWorkers.includes(as.workerMobile) || myClients.includes(as.client) || as.supervisorMobile === user.mobile);
  } else if (role === 'client') {
    isolatedScans = savedScans.filter(as => as.client === user.client || as.client === 'Acme Corp');
  }
  const totalScans = isolatedScans.length;
  const presentScans = isolatedScans.filter(s => s.status === 'Present').length;
  const pct = totalScans > 0 ? Math.round((presentScans / totalScans) * 100) : 100;

  // Dynamically count rosters
  const savedRosters = getRosters();
  let isolatedRosters = savedRosters;
  if (role === 'worker') {
    isolatedRosters = savedRosters.filter(r => r.workers.some(w => w.phone === user.mobile));
  } else if (role === 'client') {
    isolatedRosters = savedRosters.filter(r => r.clients.includes(user.client) || r.clients.includes('Acme Corp'));
  } else if (role === 'supervisor') {
    const supervisorScope = SUPERVISOR_SCOPES[user.mobile];
    if (supervisorScope) {
      isolatedRosters = savedRosters.filter(r => 
        r.workers.some(w => supervisorScope.workers.some(sw => sw.phone === w.phone)) || 
        r.clients.some(c => supervisorScope.clients.includes(c)) ||
        r.supervisor.includes(user.mobile)
      );
    }
  }
  const rosterCount = isolatedRosters.length;

  const visitsCount = getVisits().length;

  // Materials live count
  const allMaterialReqs = getMaterialRequests();
  let myMaterialReqs = allMaterialReqs;
  if (role === 'worker') {
    myMaterialReqs = allMaterialReqs.filter(r => r.createdByMobile === user.mobile);
  } else if (role === 'supervisor') {
    const scope = SUPERVISOR_SCOPES[user.mobile];
    if (scope) {
      const myWorkerPhones = scope.workers.map(w => w.phone);
      myMaterialReqs = allMaterialReqs.filter(r => r.supervisorMobile === user.mobile || myWorkerPhones.includes(r.createdByMobile));
    }
  }
  const pendingMaterialCount = myMaterialReqs.filter(r =>
    [MATERIAL_STATUS.SUBMITTED, MATERIAL_STATUS.UNDER_SUPERVISOR_REVIEW, MATERIAL_STATUS.SENT_TO_ADMIN, MATERIAL_STATUS.UNDER_ADMIN_REVIEW].includes(r.status)
  ).length;

  const allComplaints = getComplaints();
  let scopedComplaints = allComplaints;
  if (role === 'worker') {
    scopedComplaints = allComplaints.filter(c => c.createdByMobile === user.mobile);
  } else if (role === 'supervisor') {
    const scope = SUPERVISOR_SCOPES[user.mobile];
    const workerPhones = scope?.workers.map(w => w.phone) || [];
    scopedComplaints = allComplaints.filter(c =>
      c.supervisorMobile === user.mobile || workerPhones.includes(c.createdByMobile)
    );
  } else if (role === 'client') {
    scopedComplaints = allComplaints.filter(c => c.createdByMobile === user.mobile);
  }
  const openComplaintCount = scopedComplaints.filter(c =>
    ![COMPLAINT_STATUS.ADMIN_REJECTED, COMPLAINT_STATUS.SUPERVISOR_REJECTED, COMPLAINT_STATUS.CLOSED].includes(c.status)
  ).length;

  const NAVIGABLE = ['tasks', 'attendance', 'roster', 'visits', 'materials', 'complaints'];

  let cards = [
    { id: 'tasks', name: 'Tasks', desc: 'Add tasks and view status', status: `Active: ${activeCount} tasks`, icon: '📋', bg: '#EEF2FF', color: '#4F46E5' },
    { id: 'attendance', name: 'Attendance Scans', desc: 'View & export attendance records', status: `Logs: ${totalScans} | ${pct}% present`, icon: '📶', bg: '#ECFDF5', color: '#10B981' },
    { id: 'service', name: 'Service Requests', desc: 'Add and view service requests', status: 'Pending: 7 requests', icon: '☁️', bg: '#EFF6FF', color: '#2563EB' },
    { id: 'roster', name: 'Roster Master', desc: 'View all created rosters', status: `Active: ${rosterCount} rosters`, icon: '📅', bg: '#FFFBEB', color: '#F59E0B' },
    { id: 'visits', name: 'Supervisor Visits', desc: 'Property rounds, gloss readings & site visits', status: `Total: ${visitsCount} visits`, icon: '🛡️', bg: '#F8FAFC', color: '#334155' },
    { id: 'complaints', name: 'Requests & Complaints', desc: 'Handle user requests and complaints', status: 'Open: 12 items', icon: '⚠️', bg: '#FEF2F2', color: '#EF4444' },
    { id: 'materials', name: 'Materials', desc: 'Material requirements & procurement workflow', status: `Pending: ${pendingMaterialCount} requests`, icon: '📦', bg: '#FAF5FF', color: '#9333EA' },
    { id: 'reports', name: 'Reports', desc: 'View analytics and reports', status: 'Generated: This month', icon: '📊', bg: '#F8FAFC', color: '#475569' },
  ];

  cards = cards.map(c =>
    c.id === 'complaints' ? { ...c, status: `Open: ${openComplaintCount} items` } : c
  );

  // Client cannot see Materials
  if (role === 'client') {
    cards = cards.filter(c => c.id !== 'materials');
  }

  return (
    <>
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">Services & Reports</h1>
          <p className="mgt-subtitle">Manage service and request modules, attendance, rosters and analytics.</p>
        </div>
      </div>

      <div className="mgt-hub-grid">
        {cards.map(c => (
          <div key={c.id} className="mgt-hub-card" onClick={() => NAVIGABLE.includes(c.id) && onNavigate(c.id)} id={`mgt-hub-${c.id}`}>
            <div className="mgt-hub-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="mgt-hub-info">
              <h3 className="mgt-hub-name">{c.name}</h3>
              <p className="mgt-hub-desc">{c.desc}</p>
              <span className="mgt-hub-status">{c.status}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Tasks Sub-View ──────────────────────────────────────────── */

function getComplaintStatusClass(status) {
  if (status.includes('Rejected')) return 'cancelled';
  if (status === COMPLAINT_STATUS.CLOSED || status.includes('Admin Approved')) return 'completed';
  if (status.includes('Supervisor Approved')) return 'in-progress';
  if (status.includes('Review')) return 'pending-approval';
  return 'pending';
}

function getSupervisorForClient() {
  return { mobile: '9999999991', name: 'Supervisor One' };
}

function ComplaintsView({ onBack, user }) {
  const role = user?.role;
  const [complaints, setComplaints] = useState(() => getComplaints());
  const [showCreate, setShowCreate] = useState(role === 'client' || role === 'supervisor');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [expandedId, setExpandedId] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [remarks, setRemarks] = useState('');

  const accessibleComplaints = useMemo(() => {
    if (role === 'worker' || role === 'client') {
      return complaints.filter(c => c.createdByMobile === user.mobile);
    }
    if (role === 'supervisor') {
      const scope = SUPERVISOR_SCOPES[user.mobile];
      const workerPhones = scope?.workers.map(w => w.phone) || [];
      return complaints.filter(c =>
        c.supervisorMobile === user.mobile ||
        workerPhones.includes(c.createdByMobile) ||
        c.createdByMobile === user.mobile
      );
    }
    if (role === 'admin') {
      return complaints.filter(c =>
        c.role === 'supervisor' ||
        [
          COMPLAINT_STATUS.SUPERVISOR_APPROVED,
          COMPLAINT_STATUS.ADMIN_APPROVED,
          COMPLAINT_STATUS.ADMIN_REJECTED,
          COMPLAINT_STATUS.CLOSED
        ].includes(c.status)
      );
    }
    return complaints;
  }, [complaints, role, user]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('Medium');
  };

  const handleCreateComplaint = (event) => {
    event.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please enter a complaint title and description.');
      return;
    }

    const now = new Date().toISOString();
    const supervisor = role === 'client'
      ? getSupervisorForClient(user)
      : { mobile: user.mobile, name: user.name };
    const status = role === 'supervisor'
      ? COMPLAINT_STATUS.SUPERVISOR_APPROVED
      : COMPLAINT_STATUS.SUBMITTED;
    const initialAction = role === 'supervisor'
      ? 'Submitted directly to Admin'
      : 'Submitted complaint';

    const complaint = {
      id: 'CMP_' + Date.now(),
      title: title.trim(),
      description: description.trim(),
      priority,
      role,
      status,
      createdBy: user.name,
      createdByMobile: user.mobile,
      supervisorMobile: supervisor.mobile,
      supervisorName: supervisor.name,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          actor: user.name,
          role,
          action: initialAction,
          timestamp: now,
          note: description.trim()
        }
      ]
    };

    const updated = [complaint, ...complaints];
    saveComplaints(updated);
    setComplaints(updated);
    resetForm();
    setExpandedId(complaint.id);
    setShowCreate(false);

    if (role === 'supervisor') {
      addNotification('8830227359', 'Admin User', `New complaint from Supervisor ${user.name}: ${complaint.title}`);
    } else {
      addNotification(supervisor.mobile, supervisor.name, `New complaint from Client ${user.name}: ${complaint.title}`);
    }
    alert('Complaint submitted successfully.');
  };

  const applyComplaintAction = () => {
    if (!actionModal) return;

    const { complaintId, type } = actionModal;
    const now = new Date().toISOString();
    const updated = complaints.map(complaint => {
      if (complaint.id !== complaintId) return complaint;

      let nextStatus = complaint.status;
      let action = 'Added remarks';

      if (role === 'supervisor') {
        if (type === 'approve') {
          nextStatus = COMPLAINT_STATUS.SUPERVISOR_APPROVED;
          action = 'Supervisor approved and forwarded to Admin';
          addNotification('8830227359', 'Admin User', `Complaint forwarded by ${user.name}: ${complaint.title}`);
          addNotification(complaint.createdByMobile, complaint.createdBy, 'Your complaint was approved by Supervisor and forwarded to Admin.');
        } else if (type === 'reject') {
          nextStatus = COMPLAINT_STATUS.SUPERVISOR_REJECTED;
          action = 'Supervisor rejected complaint';
          addNotification(complaint.createdByMobile, complaint.createdBy, 'Your complaint was rejected by Supervisor.');
        }
      }

      if (role === 'admin') {
        if (type === 'approve') {
          nextStatus = COMPLAINT_STATUS.ADMIN_APPROVED;
          action = 'Admin approved complaint';
          addNotification(complaint.createdByMobile, complaint.createdBy, 'Your complaint was approved by Admin.');
          if (complaint.supervisorMobile) {
            addNotification(complaint.supervisorMobile, complaint.supervisorName, `Admin approved complaint: ${complaint.title}`);
          }
        } else if (type === 'reject') {
          nextStatus = COMPLAINT_STATUS.ADMIN_REJECTED;
          action = 'Admin rejected complaint';
          addNotification(complaint.createdByMobile, complaint.createdBy, 'Your complaint was rejected by Admin.');
        } else if (type === 'close') {
          nextStatus = COMPLAINT_STATUS.CLOSED;
          action = 'Admin closed complaint';
          addNotification(complaint.createdByMobile, complaint.createdBy, 'Your complaint has been closed.');
        }
      }

      return {
        ...complaint,
        status: nextStatus,
        updatedAt: now,
        timeline: [
          ...complaint.timeline,
          {
            actor: user.name,
            role,
            action,
            timestamp: now,
            note: remarks
          }
        ]
      };
    });

    saveComplaints(updated);
    setComplaints(updated);
    setActionModal(null);
    setRemarks('');
  };

  const canCreate = role === 'client' || role === 'supervisor';

  return (
    <div className="mgt-view-container">
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={onBack}>Services & Reports &rsaquo; </span>
            Complaints
          </h1>
          <p className="mgt-subtitle">Track complaint submission, supervisor approval, admin review, and closure timelines.</p>
        </div>
        {canCreate && (
          <button className="mgt-btn primary" onClick={() => setShowCreate(value => !value)}>
            {showCreate ? 'Hide Form' : 'Create Complaint'}
          </button>
        )}
      </div>

      {showCreate && canCreate && (
        <form className="mgt-card" style={{ padding: 24 }} onSubmit={handleCreateComplaint}>
          <h2 style={{ marginTop: 0, fontSize: 18 }}>New Complaint</h2>
          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Title</label>
              <input className="mgt-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Complaint title" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Description</label>
              <textarea className="mgt-input" style={{ minHeight: 100, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Priority</label>
              <select className="mgt-select" value={priority} onChange={e => setPriority(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button type="button" className="mgt-btn secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button type="submit" className="mgt-btn primary">Submit Complaint</button>
          </div>
        </form>
      )}

      <div className="mgt-card" style={{ padding: 20 }}>
        <div className="mgt-table-wrapper">
          <table className="mgt-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Complaint</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accessibleComplaints.map(complaint => {
                const canSupervisorAct = role === 'supervisor' &&
                  complaint.supervisorMobile === user.mobile &&
                  complaint.role !== 'supervisor' &&
                  [COMPLAINT_STATUS.SUBMITTED, COMPLAINT_STATUS.UNDER_REVIEW].includes(complaint.status);
                const canAdminReview = role === 'admin' && complaint.status === COMPLAINT_STATUS.SUPERVISOR_APPROVED;
                const canAdminClose = role === 'admin' && complaint.status === COMPLAINT_STATUS.ADMIN_APPROVED;

                return (
                  <React.Fragment key={complaint.id}>
                    <tr>
                      <td style={{ fontSize: 12, color: '#64748B' }}>{complaint.id}</td>
                      <td>
                        <strong>{complaint.title}</strong>
                        <div style={{ fontSize: 12, color: '#64748B', maxWidth: 320 }}>{complaint.description}</div>
                      </td>
                      <td>{complaint.priority}</td>
                      <td><span className={`mgt-badge ${getComplaintStatusClass(complaint.status)}`}>{complaint.status}</span></td>
                      <td>
                        {complaint.createdBy}
                        <div style={{ fontSize: 11, color: '#64748B' }}>{complaint.role}</div>
                      </td>
                      <td>{new Date(complaint.updatedAt || complaint.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <button className="mgt-btn secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setExpandedId(expandedId === complaint.id ? null : complaint.id)}>
                            Timeline
                          </button>
                          {canSupervisorAct && (
                            <>
                              <button className="mgt-btn primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setActionModal({ complaintId: complaint.id, type: 'approve' })}>Accept & Forward</button>
                              <button className="mgt-btn" style={{ padding: '5px 10px', fontSize: 12, background: '#FEF2F2', color: '#B91C1C' }} onClick={() => setActionModal({ complaintId: complaint.id, type: 'reject' })}>Reject</button>
                            </>
                          )}
                          {canAdminReview && (
                            <>
                              <button className="mgt-btn primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setActionModal({ complaintId: complaint.id, type: 'approve' })}>Approve</button>
                              <button className="mgt-btn" style={{ padding: '5px 10px', fontSize: 12, background: '#FEF2F2', color: '#B91C1C' }} onClick={() => setActionModal({ complaintId: complaint.id, type: 'reject' })}>Reject</button>
                            </>
                          )}
                          {canAdminClose && (
                            <button className="mgt-btn primary" style={{ padding: '5px 10px', fontSize: 12, background: '#059669' }} onClick={() => setActionModal({ complaintId: complaint.id, type: 'close' })}>Close</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === complaint.id && (
                      <tr className="mgt-expanded-row">
                        <td colSpan="7">
                          <div className="mgt-expanded-detail" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="mgt-detail-section">
                              <h5>Status Timeline</h5>
                              {complaint.timeline.map((event, index) => (
                                <div key={`${complaint.id}-${index}`} style={{ marginBottom: 12, paddingLeft: 14, borderLeft: '2px solid #CBD5E1' }}>
                                  <div style={{ fontWeight: 800, fontSize: 13 }}>{event.action}</div>
                                  <div style={{ fontSize: 12, color: '#64748B' }}>{event.actor} ({event.role}) | {new Date(event.timestamp).toLocaleString()}</div>
                                  {event.note && <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>{event.note}</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {accessibleComplaints.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No complaints found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {actionModal && (
        <div className="mgt-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="mgt-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="mgt-modal-header">
              <span className="mgt-modal-title">Complaint Action</span>
              <button className="mgt-modal-close" onClick={() => setActionModal(null)}>x</button>
            </div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Remarks</label>
            <textarea className="mgt-input" style={{ minHeight: 90, resize: 'vertical' }} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Add notes for this action" />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="mgt-btn secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button className="mgt-btn primary" onClick={applyComplaintAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TasksView({ onBack, user }) {
  const role = user?.role;

  // 1. Data Isolation
  let accessibleTasks = MOCK_TASKS;
  if (role === 'worker') {
    accessibleTasks = MOCK_TASKS.filter(t => t.workerMobile === user.mobile);
  } else if (role === 'supervisor') {
    accessibleTasks = MOCK_TASKS.filter(t => t.supervisorMobile === user.mobile);
  } else if (role === 'client') {
    accessibleTasks = MOCK_TASKS.filter(t => t.client === user.client);
  }

  // 2. Filter States (Temporary vs Applied)
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  
  // Temporary states (user inputs)
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempWorkerFilter, setTempWorkerFilter] = useState('All');
  const [tempPriorityFilter, setTempPriorityFilter] = useState('All');
  const [tempClientFilter, setTempClientFilter] = useState('All');
  const [tempStatusFilter, setTempStatusFilter] = useState('All');
  const [tempSearch, setTempSearch] = useState('');

  // Applied states (used for filtering results and graphs)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workerFilter, setWorkerFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  // 3. Filter Options
  const uniqueWorkers = [...new Set(accessibleTasks.map(t => t.worker))];
  const uniqueClients = [...new Set(accessibleTasks.map(t => t.client))];

  // 4. Apply Filters (AND logic)
  const filteredTasks = accessibleTasks.filter(t => {
    // Search
    const matchSearch = search === '' || 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      t.notes.toLowerCase().includes(search.toLowerCase());

    // Worker filter (Supervisor/Admin)
    let matchWorker = true;
    if (workerFilter === 'Own') {
      matchWorker = t.workerMobile === user.mobile;
    } else if (workerFilter !== 'All') {
      matchWorker = t.worker === workerFilter;
    }

    // Priority
    const matchPriority = priorityFilter === 'All' || t.priority === priorityFilter;

    // Client
    const matchClient = clientFilter === 'All' || t.client === clientFilter;

    // Status
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;

    // Date Range
    let matchDate = true;
    if (startDate) {
      matchDate = matchDate && new Date(t.assignedOn) >= new Date(startDate);
    }
    if (endDate) {
      matchDate = matchDate && new Date(t.assignedOn) <= new Date(endDate);
    }

    return matchSearch && matchWorker && matchPriority && matchClient && matchStatus && matchDate;
  });

  const handleApply = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setWorkerFilter(tempWorkerFilter);
    setPriorityFilter(tempPriorityFilter);
    setClientFilter(tempClientFilter);
    setStatusFilter(tempStatusFilter);
    setSearch(tempSearch);
  };

  const clearFilters = () => {
    setTempStartDate('');
    setTempEndDate('');
    setTempWorkerFilter('All');
    setTempPriorityFilter('All');
    setTempClientFilter('All');
    setTempStatusFilter('All');
    setTempSearch('');

    setStartDate('');
    setEndDate('');
    setWorkerFilter('All');
    setPriorityFilter('All');
    setClientFilter('All');
    setStatusFilter('All');
    setSearch('');
  };

  // 5. Analytics Calculations
  const completedCount = filteredTasks.filter(t => t.status === 'Completed').length;
  const pendingCount = filteredTasks.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled').length;
  
  // On-time %
  const completedTasks = filteredTasks.filter(t => t.status === 'Completed');
  const onTimeTasks = completedTasks.filter(t => {
    return new Date(t.completed) <= new Date(t.due);
  });
  const onTimePct = completedTasks.length > 0 ? Math.round((onTimeTasks.length / completedTasks.length) * 100) : 0;

  // Avg Cycle Time (Days)
  const cycleTimes = completedTasks.map(t => {
    const diff = new Date(t.completed) - new Date(t.assignedOn);
    return diff / (1000 * 60 * 60 * 24);
  });
  const avgCycleTime = cycleTimes.length > 0 ? (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length).toFixed(1) : '—';

  // Quality Score Calculation
  const reviewMap = {
    'Very Good': 100,
    'Good': 70,
    'Average': 50,
    'Poor': 25,
    'Bad': 0
  };

  const ratedTasks = filteredTasks.filter(t => reviewMap[t.review] !== undefined);
  const totalReviewScore = ratedTasks.reduce((sum, t) => sum + reviewMap[t.review], 0);
  const calculatedQualityScore = ratedTasks.length > 0 ? totalReviewScore / ratedTasks.length : null;
  const avgQualityScore = calculatedQualityScore !== null 
    ? (calculatedQualityScore % 1 === 0 ? calculatedQualityScore.toFixed(0) : calculatedQualityScore.toFixed(1))
    : '—';

  // Work Status Breakdown for SVG Chart
  const statusCounts = {
    Completed: filteredTasks.filter(t => t.status === 'Completed').length,
    'In Progress': filteredTasks.filter(t => t.status === 'In Progress').length,
    'On Hold': filteredTasks.filter(t => t.status === 'On Hold').length,
    Cancelled: filteredTasks.filter(t => t.status === 'Cancelled').length,
  };

  // Performance Rating Breakdown
  const ratingCounts = {
    'Very Good': filteredTasks.filter(t => t.review === 'Very Good').length,
    'Good': filteredTasks.filter(t => t.review === 'Good').length,
    'Average': filteredTasks.filter(t => t.review === 'Average').length,
    'Poor': filteredTasks.filter(t => t.review === 'Poor').length,
    'Bad': filteredTasks.filter(t => t.review === 'Bad').length,
  };

  // 6. CSV Export & Printable Window PDF
  const exportCSV = () => {
    const summaryLines = [
      `"Report: Task History Report"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      `"Throughput: ${filteredTasks.length}"`,
      `"Completed: ${completedCount}"`,
      `"Pending: ${pendingCount}"`,
      `"On-time %: ${onTimePct}%"`,
      `"Avg. Cycle Time (Days): ${avgCycleTime}"`,
      `"Quality Score: ${avgQualityScore === '—' ? '—' : `${avgQualityScore}%`}"`,
      `` // empty spacer line
    ];
    const headers = ['Title', 'Client', 'Worker', 'Supervisor', 'Assigned Date', 'Due Date', 'Completed Date', 'Status', 'Priority', 'Review', 'Notes'];
    const rows = filteredTasks.map(t => [
      `"${t.title.replace(/"/g, '""')}"`, 
      `"${t.client.replace(/"/g, '""')}"`, 
      `"${t.worker.replace(/"/g, '""')}"`, 
      `"${t.supervisor.replace(/"/g, '""')}"`, 
      `"${t.assignedOn}"`, 
      `"${t.due}"`, 
      `"${t.completed}"`, 
      `"${t.status}"`, 
      `"${t.priority}"`, 
      `"${t.review}"`, 
      `"${t.notes.replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [
      ...summaryLines,
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tasks_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Task History Report</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 20px; }
            h2 { color: #0b0e17; margin-bottom: 5px; }
            .meta-info { font-size: 13px; color: #475569; margin-bottom: 20px; }
            .summary-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-card { border: 1px solid #E2E8F0; padding: 10px; border-radius: 8px; text-align: center; background: #F8FAFC; }
            .summary-card h4 { margin: 0 0 4px 0; font-size: 11px; color: #64748B; text-transform: uppercase; }
            .summary-card p { margin: 0; font-size: 16px; font-weight: 800; color: #0b0e17; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #F8FAFC; }
          </style>
        </head>
        <body>
          <h2>The Shine Reflecto - Tasks Report</h2>
          <div class="meta-info">Generated on: ${new Date().toLocaleDateString()}</div>
          <div class="summary-cards">
            <div class="summary-card"><h4>Throughput</h4><p>${filteredTasks.length}</p></div>
            <div class="summary-card"><h4>Completed</h4><p>${completedCount}</p></div>
            <div class="summary-card"><h4>Pending</h4><p>${pendingCount}</p></div>
            <div class="summary-card"><h4>On-time %</h4><p>${onTimePct}%</p></div>
            <div class="summary-card"><h4>Avg Cycle Time</h4><p>${avgCycleTime} days</p></div>
            <div class="summary-card"><h4>Quality Score</h4><p>${avgQualityScore === '—' ? '—' : `${avgQualityScore}%`}</p></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Client</th><th>Assigned On</th><th>Due</th><th>Completed</th><th>Status</th><th>Priority</th><th>Review</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTasks.map(t => `
                <tr>
                  <td><strong>${t.title}</strong></td>
                  <td>${t.client}</td>
                  <td>${t.assignedOn}</td>
                  <td>${t.due}</td>
                  <td>${t.completed || '—'}</td>
                  <td>${t.status}</td>
                  <td>${t.priority}</td>
                  <td>${t.review}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleRow = (id) => setExpandedRowId(prev => prev === id ? null : id);

  return (
    <>
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{cursor:'pointer', color:'#64748B'}} onClick={onBack}>Management &rsaquo; </span> 
            Task History
          </h1>
          <p className="mgt-subtitle">Browse, filter and review all previously handled tasks.</p>
        </div>
      </div>

      {/* Collapsible Filters */}
      <div className="mgt-filters-card">
        <div className="mgt-filters-header" onClick={() => setFiltersOpen(!filtersOpen)}>
          <span>Filters</span>
          <span>{filtersOpen ? '▲' : '▼'}</span>
        </div>
        {filtersOpen && (
          <div className="mgt-filters-body">
            <div className="mgt-filters-row">
              <div className="mgt-filter-group date-range">
                <span className="mgt-filter-label">Date range</span>
                <div className="mgt-date-inputs">
                  <input type="date" className="mgt-input" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} />
                  <span>to</span>
                  <input type="date" className="mgt-input" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} />
                </div>
              </div>
              
              {(role === 'admin' || role === 'supervisor') && (
                <div className="mgt-filter-group">
                  <span className="mgt-filter-label">Worker</span>
                  <select className="mgt-select" value={tempWorkerFilter} onChange={e => setTempWorkerFilter(e.target.value)}>
                    <option value="All">All</option>
                    <option value="Own">Own Tasks</option>
                    {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Priority</span>
                <select className="mgt-select" value={tempPriorityFilter} onChange={e => setTempPriorityFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {role !== 'client' && (
                <div className="mgt-filter-group">
                  <span className="mgt-filter-label">Client</span>
                  <select className="mgt-select" value={tempClientFilter} onChange={e => setTempClientFilter(e.target.value)}>
                    <option value="All">All</option>
                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Status</span>
                <select className="mgt-select" value={tempStatusFilter} onChange={e => setTempStatusFilter(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mgt-filters-row">
              <div className="mgt-filter-group search">
                <span className="mgt-filter-label">Search (title / notes)</span>
                <input type="text" className="mgt-input" placeholder="Type to search..." value={tempSearch} onChange={e => setTempSearch(e.target.value)} />
              </div>
              <div className="mgt-filters-actions">
                <button className="mgt-btn mgt-btn-primary" onClick={handleApply}>Apply</button>
                <button className="mgt-btn" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Analytics & SVG Charts */}
      <div className="mgt-analytics-card">
        <div className="mgt-analytics-header" onClick={() => setAnalyticsOpen(!analyticsOpen)}>
          <span>Worker Performance Summary</span>
          <span>{analyticsOpen ? '▲' : '▼'}</span>
        </div>
        {analyticsOpen && (
          <div className="mgt-analytics-body">
            <div className="mgt-stats-row">
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{filteredTasks.length}</div>
                <div className="mgt-stat-lbl">Throughput</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{completedCount}</div>
                <div className="mgt-stat-lbl">Completed Tasks</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{pendingCount}</div>
                <div className="mgt-stat-lbl">Pending Tasks</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{onTimePct}%</div>
                <div className="mgt-stat-lbl">On-time %</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{avgCycleTime}</div>
                <div className="mgt-stat-lbl">Avg. Cycle Time (days)</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{avgQualityScore === '—' ? '—' : `${avgQualityScore}%`}</div>
                <div className="mgt-stat-lbl">Quality Score</div>
              </div>
            </div>

            <div className="mgt-charts-row">
              {/* Work Status (SVG Donut Chart) */}
              <div className="mgt-chart-box">
                <h4>Work Status</h4>
                <div className="mgt-svg-container" style={{width: 140, height: 140}}>
                  <StatusDonutChart counts={statusCounts} total={filteredTasks.length} />
                </div>
                <div className="mgt-chart-legend">
                  <div className="mgt-legend-item"><div className="mgt-legend-dot" style={{background:'#10B981'}}/>Completed</div>
                  <div className="mgt-legend-item"><div className="mgt-legend-dot" style={{background:'#3B82F6'}}/>In Progress</div>
                  <div className="mgt-legend-item"><div className="mgt-legend-dot" style={{background:'#F59E0B'}}/>On Hold</div>
                  <div className="mgt-legend-item"><div className="mgt-legend-dot" style={{background:'#EF4444'}}/>Cancelled</div>
                </div>
              </div>

              {/* Performance Rating (SVG Semi-Circle Gauge) */}
              <div className="mgt-chart-box">
                <h4>Performance Rating</h4>
                <div className="mgt-svg-container" style={{width: 140, height: 90, marginTop:10}}>
                  <PerformanceGauge score={avgQualityScore} />
                </div>
                <div className="mgt-chart-legend" style={{marginTop:15, display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                  <span style={{fontSize:12, fontWeight:800, color:'#0B0E17'}}>Quality Score: {avgQualityScore === '—' ? '—' : `${avgQualityScore}%`}</span>
                  <div style={{fontSize:10, color:'#64748B', display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center'}}>
                    <span>VG: {ratingCounts['Very Good']}</span>
                    <span>G: {ratingCounts['Good']}</span>
                    <span>A: {ratingCounts['Average']}</span>
                    <span>P: {ratingCounts['Poor']}</span>
                    <span>B: {ratingCounts['Bad']}</span>
                  </div>
                </div>
              </div>

              {/* Throughput Trend Graph (SVG Line Chart) */}
              <div className="mgt-chart-box mgt-trend-chart">
                <h4>Throughput / Completed Tasks Trend</h4>
                <div className="mgt-svg-container" style={{width: '100%', height: 130}}>
                  <ThroughputLineChart tasks={completedTasks} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Table (Desktop) / Cards (Mobile) */}
      <div className="mgt-results-card">
        <div className="mgt-results-header">
          <h3 className="mgt-results-title">Results</h3>
          <div className="mgt-actions-group">
            <button className="mgt-btn" onClick={printPDF}>Export PDF</button>
            <button className="mgt-btn" onClick={exportCSV}>Export CSV</button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="mgt-table-wrapper">
          <table className="mgt-table">
            <thead>
              <tr>
                <th>Title</th><th>Client</th><th>Assigned On</th><th>Due</th><th>Completed</th><th>Status</th><th>Priority</th><th>Review</th><th>Notes</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <React.Fragment key={t.id}>
                  <tr>
                    <td style={{fontWeight:800, color:'#0b0e17'}}>{t.title}</td>
                    <td>{t.client}</td>
                    <td>{t.assignedOn}</td>
                    <td>{t.due}</td>
                    <td>{t.completed || '—'}</td>
                    <td>
                      <span className={`mgt-badge ${t.status.toLowerCase().replace(' ', '-')}`}>
                        <span className="mgt-dot"></span> {t.status}
                      </span>
                    </td>
                    <td>
                      <span className={`mgt-prio ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </td>
                    <td>{t.review}</td>
                    <td style={{color:'#64748B', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{t.notes}</td>
                    <td>
                      <button className="mp-action-btn" onClick={() => toggleRow(t.id)}>
                        {expandedRowId === t.id ? '▲' : '▼'}
                      </button>
                    </td>
                  </tr>
                  {expandedRowId === t.id && (
                    <tr className="mgt-expanded-row">
                      <td colSpan={10}>
                        <div className="mgt-expanded-detail">
                          <div className="mgt-detail-section">
                            <h5>Task Metadata &amp; Remarks</h5>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Notes:</span><span className="mgt-detail-val">{t.notes}</span></div>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Location:</span><span className="mgt-detail-val">{t.location}</span></div>
                          </div>
                          <div className="mgt-detail-section">
                            <h5>Assigned Team</h5>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Worker:</span><span className="mgt-detail-val">{t.worker}</span></div>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Supervisor:</span><span className="mgt-detail-val">{t.supervisor}</span></div>
                          </div>
                          <div className="mgt-detail-section">
                            <h5>Target Schedule</h5>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Assigned:</span><span className="mgt-detail-val">{t.assignedOn}</span></div>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Due:</span><span className="mgt-detail-val">{t.due}</span></div>
                            <div className="mgt-detail-item"><span className="mgt-detail-label">Completed:</span><span className="mgt-detail-val">{t.completed || '—'}</span></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Phone / Mobile Card List */}
        <div className="mgt-mobile-list">
          {filteredTasks.map(t => <MobileTaskCard key={t.id} task={t} />)}
        </div>
      </div>
    </>
  );
}

/* ── Mobile Compact Task Card ────────────────────────────────── */

function MobileTaskCard({ task }) {
  const [open, setOpen] = useState(false);

  // Status mapping to dot colors
  const statusColorMap = {
    Completed: 'completed',
    'In Progress': 'in-progress',
    'On Hold': 'on-hold',
    Cancelled: 'cancelled',
  };
  const dotClass = statusColorMap[task.status] || 'in-progress';

  return (
    <div className="mgt-mobile-card">
      <div className="mgt-mc-header" onClick={() => setOpen(!open)}>
        <div className="mgt-mc-left">
          <span className="mgt-mc-date">{task.assignedOn}</span>
          <span className="mgt-mc-client">{task.client}</span>
          <h4 className="mgt-mc-title">{task.title}</h4>
        </div>
        <div className="mgt-mc-right">
          <div className={`mgt-mc-dot ${dotClass}`}></div>
          <svg className={`mgt-mc-chevron ${open ? 'open' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>
      {open && (
        <div className="mgt-mc-body">
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Worker</span><span className="mgt-mc-val">{task.worker}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Supervisor</span><span className="mgt-mc-val">{task.supervisor}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Due Date</span><span className="mgt-mc-val">{task.due}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Completed</span><span className="mgt-mc-val">{task.completed || '—'}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Priority</span><span className="mgt-mc-val" style={{fontWeight:700}}>{task.priority}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Quality Review</span><span className="mgt-mc-val">{task.review}</span></div>
          <div className="mgt-mc-row"><span className="mgt-mc-lbl">Location</span><span className="mgt-mc-val">{task.location}</span></div>
          <div className="mgt-mc-row" style={{flexDirection:'column', alignItems:'flex-start'}}><span className="mgt-mc-lbl" style={{marginBottom:4}}>Notes</span><span className="mgt-mc-val" style={{textAlign:'left', maxWidth:'100%', color:'#64748B'}}>{task.notes}</span></div>
        </div>
      )}
    </div>
  );
}

/* ── SVG Charts Components ───────────────────────────────────── */

// 1. Status Donut Chart
function StatusDonutChart({ counts, total }) {
  const r = 35;
  const circ = 2 * Math.PI * r;

  const data = [
    { label: 'Completed', count: counts.Completed, color: '#10B981' },
    { label: 'In Progress', count: counts['In Progress'], color: '#3B82F6' },
    { label: 'On Hold', count: counts['On Hold'], color: '#F59E0B' },
    { label: 'Cancelled', count: counts.Cancelled, color: '#EF4444' },
  ].filter(d => d.count > 0);

  if (total === 0 || data.length === 0) {
    return (
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
        <text x="50" y="55" textAnchor="middle" fontSize="12" fill="#64748B" fontWeight="600">No Data</text>
      </svg>
    );
  }

  let accumulatedPercent = 0;

  return (
    <svg width="120" height="120" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E2E8F0" strokeWidth="12" />
      {data.map((d, i) => {
        const percent = d.count / total;
        const strokeLength = percent * circ;
        const strokeOffset = circ - (accumulatedPercent * circ);
        accumulatedPercent += percent;

        return (
          <circle
            key={d.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth="12"
            strokeDasharray={`${strokeLength} ${circ}`}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 50 50)"
          />
        );
      })}
      <text x="50" y="54" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0B0E17">{total}</text>
      <text x="50" y="66" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748B">TASKS</text>
    </svg>
  );
}

// 2. Performance Semi-Circle Gauge
function PerformanceGauge({ score }) {
  const finalScore = score === '—' ? 0 : score;
  
  // Semi-circle path radius 35, length is Math.PI * r = 109.95
  const circ = 109.95;
  const strokeOffset = circ - (finalScore / 100) * circ;

  return (
    <svg width="120" height="70" viewBox="0 0 100 60">
      {/* Background Arc */}
      <path d="M 15 50 A 35 35 0 0 1 85 50" fill="none" stroke="#E2E8F0" strokeWidth="10" strokeLinecap="round" />
      {/* Filled Arc */}
      {finalScore > 0 && (
        <path
          d="M 15 50 A 35 35 0 0 1 85 50"
          fill="none"
          stroke="#10B981"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={strokeOffset}
        />
      )}
      <text x="50" y="44" textAnchor="middle" fontSize="16" fontWeight="800" fill="#0B0E17">{score === '—' ? '—' : `${score}%`}</text>
      <text x="50" y="56" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748B">ACCURACY</text>
    </svg>
  );
}

// 3. Throughput Line Trend Chart
function ThroughputLineChart({ tasks }) {
  // Compute Completed tasks counts by month for 2025
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const completedByMonth = Array(12).fill(0);

  tasks.forEach(t => {
    if (t.completed) {
      const dateObj = new Date(t.completed);
      const m = dateObj.getMonth();
      if (!isNaN(m)) {
        completedByMonth[m]++;
      }
    }
  });

  const maxVal = Math.max(...completedByMonth, 2);

  // Generate SVG coordinate points
  const points = completedByMonth.map((val, idx) => {
    // Width is approx 320, padding left/right 25
    const x = idx * (270 / 11) + 25;
    // Height is 100, padding top/bottom 15
    const y = 90 - (val / maxVal) * 70;
    return `${x},${y}`;
  });

  const pointsString = points.join(' ');

  return (
    <svg width="100%" height="100" viewBox="0 0 320 110" preserveAspectRatio="none" style={{overflow:'visible'}}>
      {/* Grid lines */}
      <line x1="25" y1="20" x2="295" y2="20" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="25" y1="55" x2="295" y2="55" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="25" y1="90" x2="295" y2="90" stroke="#E2E8F0" strokeWidth="1" />

      {/* Polyline Path */}
      {points.length > 0 && (
        <polyline
          fill="none"
          stroke="#3B82F6"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pointsString}
        />
      )}

      {/* Data Dots & Label Numbers */}
      {points.map((pt, idx) => {
        const [x, y] = pt.split(',');
        const val = completedByMonth[idx];
        return (
          <g key={idx}>
            <circle cx={x} cy={y} r="4" fill="#3B82F6" stroke="#fff" strokeWidth="1.5" />
            {val > 0 && (
              <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fontWeight="800" fill="#1E3A8A">
                {val}
              </text>
            )}
            <text x={x} y="105" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748B">
              {months[idx]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Attendance Scans View ──────────────────────────────────── */

export function AttendanceView({ onBack, user }) {
  const role = user?.role;
  const [scans, setScans] = useState(() => getAttendanceScans());
  const [apiSync, setApiSync] = useState({ loading: false, error: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadAttendanceData() {
      setApiSync({ loading: true, error: '' });
      try {
        const apiUsers = await listUsers();
        const apiRosters = await listApiRosters(apiUsers);
        const apiScans = await listApiAttendance(apiRosters);
        if (!cancelled) {
          setScans(apiScans);
          saveAttendanceScans(apiScans);
          setApiSync({ loading: false, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          setApiSync({
            loading: false,
            error: error.message || 'Unable to sync attendance from API.',
          });
        }
      }
    }

    loadAttendanceData();
    return () => { cancelled = true; };
  }, []);

  // Approval queue modal state
  const [activeApprovalId, setActiveApprovalId] = useState(null);
  const [approvalAction, setApprovalAction] = useState('approve'); // 'approve' | 'reject'
  const [selectedPredefinedNote, setSelectedPredefinedNote] = useState('Marked on time');
  const [customNote, setCustomNote] = useState('');

  const PREDEFINED_NOTES = [
    'Marked on time', 
    'Late check-in', 
    'Early check-in', 
    'Late check-out', 
    'Left early', 
    'Shift completed properly', 
    'Incomplete shift', 
    'Location mismatch', 
    'Manual approval', 
    'Approved after verification', 
    'Attendance corrected', 
    'Client confirmed presence'
  ];

  const handleConfirmApproval = (id, action) => {
    const idx = scans.findIndex(s => s.id === id);
    if (idx !== -1) {
      const target = scans[idx];
      const noteStr = `${action === 'approve' ? 'Approved' : 'Rejected'}: [${selectedPredefinedNote}] ${customNote ? '- ' + customNote : ''}`;
      
      const updated = {
        ...target,
        status: action === 'approve' ? 'Present' : 'Unofficial Leave',
        notes: target.notes ? `${target.notes} | ${noteStr}` : noteStr
      };

      const updatedScans = [...scans];
      updatedScans[idx] = updated;
      saveAttendanceScans(updatedScans);
      setScans(updatedScans);

      // Trigger notification
      addNotification(target.workerMobile, target.workerName, `Your attendance for ${target.date} has been ${action === 'approve' ? 'APPROVED' : 'REJECTED'} by Supervisor. Note: ${selectedPredefinedNote}`);

      setActiveApprovalId(null);
    }
  };

  // 1. Data Isolation & Security Checks
  const accessibleScans = useMemo(() => {
    let raw = scans;
    if (role === 'worker') {
      return raw.filter(as => as.workerMobile === user.mobile);
    } else if (role === 'supervisor') {
      const scope = SUPERVISOR_SCOPES[user.mobile];
      if (scope) {
        const workerMobiles = scope.workers.map(w => w.phone);
        const clientsList = scope.clients;
        return raw.filter(as => workerMobiles.includes(as.workerMobile) || clientsList.includes(as.client) || as.supervisorMobile === user.mobile);
      }
      const myWorkers = ['9876543210', '9999999993'];
      const myClients = ['Acme Corp', 'Apex'];
      return raw.filter(as => myWorkers.includes(as.workerMobile) || myClients.includes(as.client) || as.supervisorMobile === user.mobile);
    } else if (role === 'client') {
      return raw.filter(as => as.client === user.client || as.client === 'Acme Corp');
    }
    return raw; // Admin has full access
  }, [scans, role, user]);

  const pendingApprovals = useMemo(() => {
    if (role !== 'supervisor' && role !== 'admin') return [];
    return accessibleScans.filter(s => s.status === 'Pending Approval');
  }, [accessibleScans, role]);

  const uniqueWorkers = useMemo(() => {
    return [...new Set(accessibleScans.map(as => as.workerName))].filter(Boolean);
  }, [accessibleScans]);

  const uniqueClients = useMemo(() => {
    return [...new Set(accessibleScans.map(as => as.client))].filter(Boolean);
  }, [accessibleScans]);

  // 2. Filter States (Temporary vs Applied)
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);

  const [tempFilterMode, setTempFilterMode] = useState('By Worker'); // 'By Worker', 'By Client'
  const [tempWorker, setTempWorker] = useState('All');
  const [tempClient, setTempClient] = useState('All');
  const [tempWantToSee, setTempWantToSee] = useState('Complete details'); // 'Complete details', 'Only no. of days'
  const [tempDateFrom, setTempDateFrom] = useState('2025-01-01');
  const [tempDateTo, setTempDateTo] = useState('2026-06-30');
  const [tempShift, setTempShift] = useState('All'); // 'All', 'Day', 'Night'
  const [tempStatus, setTempStatus] = useState('All'); // 'All', 'Present', 'Official Leave', 'Unofficial Leave'
  const [tempSearch, setTempSearch] = useState('');

  // Applied States
  const [appliedFilterMode, setAppliedFilterMode] = useState('By Worker');
  const [appliedWorker, setAppliedWorker] = useState('All');
  const [appliedClient, setAppliedClient] = useState('All');
  const [appliedWantToSee, setAppliedWantToSee] = useState('Complete details');
  const [appliedDateFrom, setAppliedDateFrom] = useState('2025-01-01');
  const [appliedDateTo, setAppliedDateTo] = useState('2026-06-30');
  const [appliedShift, setAppliedShift] = useState('All');
  const [appliedStatus, setAppliedStatus] = useState('All');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [hasFiltersApplied, setHasFiltersApplied] = useState(false);

  const handleApply = () => {
    setAppliedFilterMode(tempFilterMode);
    setAppliedWorker(tempWorker);
    setAppliedClient(tempClient);
    setAppliedWantToSee(tempWantToSee);
    setAppliedDateFrom(tempDateFrom);
    setAppliedDateTo(tempDateTo);
    setAppliedShift(tempShift);
    setAppliedStatus(tempStatus);
    setAppliedSearch(tempSearch);
    setHasFiltersApplied(true);
  };

  const clearFilters = () => {
    setTempFilterMode('By Worker');
    setTempWorker('All');
    setTempClient('All');
    setTempWantToSee('Complete details');
    setTempDateFrom('2025-01-01');
    setTempDateTo('2026-06-30');
    setTempShift('All');
    setTempStatus('All');
    setTempSearch('');

    setAppliedFilterMode('By Worker');
    setAppliedWorker('All');
    setAppliedClient('All');
    setAppliedWantToSee('Complete details');
    setAppliedDateFrom('2025-01-01');
    setAppliedDateTo('2025-02-15');
    setAppliedShift('All');
    setAppliedStatus('All');
    setAppliedSearch('');
    setHasFiltersApplied(false);
  };

  // 3. Filter Execution (AND logic)
  const filteredScans = useMemo(() => {
    return accessibleScans.filter(s => {
      // Date Range Filter
      if (appliedDateFrom && new Date(s.date) < new Date(appliedDateFrom)) return false;
      if (appliedDateTo && new Date(s.date) > new Date(appliedDateTo)) return false;

      // Shift Filter
      if (appliedShift !== 'All' && s.shift !== appliedShift) return false;

      // Status Filter
      if (appliedStatus !== 'All') {
        if (appliedStatus === 'Present' && s.status !== 'Present') return false;
        if (appliedStatus === 'Official Leave' && s.status !== 'Official Leave') return false;
        if (appliedStatus === 'Unofficial Leave' && !s.status.includes('Unofficial') && !s.status.includes('Absent')) return false;
      }

      // Search Filter (date / notes / client)
      if (appliedSearch) {
        const query = appliedSearch.toLowerCase();
        const dateMatch = s.date.includes(query);
        const notesMatch = s.notes ? s.notes.toLowerCase().includes(query) : false;
        const clientMatch = s.client ? s.client.toLowerCase().includes(query) : false;
        const workerMatch = s.workerName ? s.workerName.toLowerCase().includes(query) : false;
        if (!dateMatch && !notesMatch && !clientMatch && !workerMatch) return false;
      }

      // Supervisor / Admin / Client selective dropdown filters based on Mode
      if (role === 'supervisor' || role === 'admin') {
        if (appliedFilterMode === 'By Worker') {
          if (appliedWorker !== 'All' && s.workerName !== appliedWorker) return false;
          if (appliedClient !== 'All' && s.client !== appliedClient) return false;
        } else {
          if (appliedClient !== 'All' && s.client !== appliedClient) return false;
        }
      } else if (role === 'client') {
        if (appliedWorker !== 'All' && s.workerName !== appliedWorker) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [accessibleScans, role, appliedFilterMode, appliedWorker, appliedClient, appliedDateFrom, appliedDateTo, appliedShift, appliedStatus, appliedSearch]);

  // 4. Summary Statistics
  // Global summary values (using all accessible scans) vs Filtered summary values
  const isDefaultFilters = 
    appliedDateFrom === '2025-01-01' &&
    appliedDateTo === '2025-02-15' &&
    appliedShift === 'All' &&
    appliedStatus === 'All' &&
    appliedSearch === '' &&
    appliedWorker === 'All' &&
    appliedClient === 'All';

  // Choose stats dataset based on constraint: "Do not show global summary if filters are applied."
  const statsDataset = (isDefaultFilters && !hasFiltersApplied) ? accessibleScans : filteredScans;
  const summaryStats = useMemo(() => calculateAttendanceStats(statsDataset), [statsDataset]);

  // Grouped results for "Only no. of days" view
  const groupedResults = useMemo(() => {
    if (appliedWantToSee !== 'Only no. of days') return [];
    const groups = {};
    filteredScans.forEach(s => {
      const key = appliedFilterMode === 'By Client' && role === 'supervisor' ? s.client : s.workerName;
      if (!groups[key]) {
        groups[key] = {
          name: key,
          scans: []
        };
      }
      groups[key].scans.push(s);
    });
    return Object.values(groups).map(g => ({
      ...g,
      stats: calculateAttendanceStats(g.scans)
    }));
  }, [filteredScans, appliedWantToSee, appliedFilterMode, role]);

  // Exports
  const exportAttendanceCSV = () => {
    const summary = calculateAttendanceStats(filteredScans);
    const summaryLines = [
      `"Report: Attendance Scans Report"`,
      `"Generated: ${new Date().toLocaleDateString()}"`,
      `"Scope: ${appliedWantToSee}"`,
      `"Worked Days: ${summary.workedDone}"`,
      `"Official Absent: ${summary.officialAbsent}"`,
      `"Unofficial Absent: ${summary.unofficialAbsent}"`,
      `"Average Hrs/Shift: ${summary.avgHrsPerShift}"`,
      `"Punctuality Score: ${summary.punctualityScore}%"`,
      `"Total Hours: ${summary.totalHours}"`,
      ``
    ];

    let headers = [];
    let rows = [];

    if (appliedWantToSee === 'Complete details') {
      headers = ['Date', 'Worker Name', 'Client', 'Shift', 'Check In', 'Check Out', 'Total Hours', 'Status', 'Notes'];
      rows = filteredScans.map(s => [
        `"${s.date}"`,
        `"${s.workerName}"`,
        `"${s.client}"`,
        `"${s.shift}"`,
        `"${s.checkIn || '-'}"`,
        `"${s.checkOut || '-'}"`,
        `"${s.totalHours}"`,
        `"${s.status}"`,
        `"${s.notes.replace(/"/g, '""')}"`
      ]);
    } else {
      headers = [appliedFilterMode === 'By Client' && role === 'supervisor' ? 'Client' : 'Worker Name', 'Worked Days (Present)', 'Official Leave', 'Unofficial Leave', 'Total Hours', 'Punctuality Score (%)'];
      rows = groupedResults.map(g => [
        `"${g.name}"`,
        `"${g.stats.workedDone}"`,
        `"${g.stats.officialAbsent}"`,
        `"${g.stats.unofficialAbsent}"`,
        `"${g.stats.totalHours}"`,
        `"${g.stats.punctualityScore}%"`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [
      ...summaryLines,
      headers.join(","),
      ...rows.map(e => e.join(","))
    ].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printAttendancePDF = async () => {
    try {
      await downloadAttendancePdf();
      return;
    } catch {
      // Fall back to the existing browser-generated report when the API export is unavailable.
    }

    const summary = calculateAttendanceStats(filteredScans);
    const printWindow = window.open('', '_blank');
    
    let tableHTML = '';
    if (appliedWantToSee === 'Complete details') {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Worker</th><th>Client</th><th>Shift</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filteredScans.map(s => `
              <tr>
                <td>${s.date}</td>
                <td><strong>${s.workerName}</strong></td>
                <td>${s.client}</td>
                <td>${s.shift}</td>
                <td>${s.checkIn || '—'}</td>
                <td>${s.checkOut || '—'}</td>
                <td>${s.totalHours}h</td>
                <td><span class="badge ${s.status.toLowerCase().replace(' ', '-')}">${s.status}</span></td>
                <td>${s.notes || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else {
      tableHTML = `
        <table>
          <thead>
            <tr>
              <th>${appliedFilterMode === 'By Client' && role === 'supervisor' ? 'Client' : 'Worker Name'}</th><th>Worked Days</th><th>Official Leave</th><th>Unofficial Leave</th><th>Total Hours</th><th>Punctuality Score</th>
            </tr>
          </thead>
          <tbody>
            ${groupedResults.map(g => `
              <tr>
                <td><strong>${g.name}</strong></td>
                <td>${g.stats.workedDone} days</td>
                <td>${g.stats.officialAbsent} days</td>
                <td>${g.stats.unofficialAbsent} days</td>
                <td>${g.stats.totalHours}h</td>
                <td>${g.stats.punctualityScore}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Scans Report</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 20px; }
            h2 { color: #0b0e17; margin-bottom: 5px; }
            .meta-info { font-size: 13px; color: #475569; margin-bottom: 20px; }
            .summary-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 20px; }
            .summary-card { border: 1px solid #E2E8F0; padding: 10px; border-radius: 8px; text-align: center; background: #F8FAFC; }
            .summary-card h4 { margin: 0 0 4px 0; font-size: 11px; color: #64748B; text-transform: uppercase; }
            .summary-card p { margin: 0; font-size: 16px; font-weight: 800; color: #0b0e17; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #F8FAFC; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
            .badge.present { background: #ECFDF5; color: #10B981; }
            .badge.official-leave { background: #EFF6FF; color: #3B82F6; }
            .badge.unofficial-leave { background: #FEF2F2; color: #EF4444; }
          </style>
        </head>
        <body>
          <h2>The Shine Reflecto - Attendance Scans Report</h2>
          <div class="meta-info">Generated on: ${new Date().toLocaleDateString()} | Mode: ${appliedWantToSee}</div>
          <div class="summary-cards">
            <div class="summary-card"><h4>Worked Days</h4><p>${summary.workedDone}</p></div>
            <div class="summary-card"><h4>Official Absent</h4><p>${summary.officialAbsent}</p></div>
            <div class="summary-card"><h4>Unofficial Absent</h4><p>${summary.unofficialAbsent}</p></div>
            <div class="summary-card"><h4>Avg. Hrs/Shift</h4><p>${summary.avgHrsPerShift}</p></div>
            <div class="summary-card"><h4>Punctuality</h4><p>${summary.punctualityScore}%</p></div>
            <div class="summary-card"><h4>Total Hours</h4><p>${summary.totalHours} hrs</p></div>
          </div>
          ${tableHTML}
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 5. Expandable Rows state
  const [expandedRowId, setExpandedRowId] = useState(null);
  const toggleRow = (id) => setExpandedRowId(prev => prev === id ? null : id);

  return (
    <div className="mgt-view-container">
      {/* Header */}
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={onBack}>Services & Reports &rsaquo; </span>
            Attendance Scans
          </h1>
          <p className="mgt-subtitle">View, filter and export employee and client attendance logs.</p>
        </div>
      </div>
      {(apiSync.loading || apiSync.error) && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: apiSync.error ? '1px solid #FCA5A5' : '1px solid #BFDBFE', background: apiSync.error ? '#FEF2F2' : '#EFF6FF', color: apiSync.error ? '#991B1B' : '#1E40AF', fontSize: 13, fontWeight: 700 }}>
          {apiSync.loading ? 'Syncing attendance from API...' : `Attendance API unavailable: showing local fallback data. ${apiSync.error}`}
        </div>
      )}

      {/* Filters Card */}
      <div className="mgt-filters-card">
        <div className="mgt-filters-header" onClick={() => setFiltersOpen(!filtersOpen)}>
          <span className="mgt-filters-title">Filter Attendance Records</span>
          <span>{filtersOpen ? '▲' : '▼'}</span>
        </div>

        {filtersOpen && (
          <div className="mgt-filters-body">
            {/* Mode selection for Supervisor / Admin */}
            {(role === 'supervisor' || role === 'admin') && (
              <div className="mgt-filters-row" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 12, marginBottom: 12 }}>
                <div className="mgt-filter-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <span className="mgt-filter-label" style={{ marginBottom: 0 }}>Filter Mode:</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B0E17', cursor: 'pointer' }}>
                    <input type="radio" name="filterMode" value="By Worker" checked={tempFilterMode === 'By Worker'} onChange={() => { setTempFilterMode('By Worker'); setTempWorker('All'); }} /> By Worker
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0B0E17', cursor: 'pointer' }}>
                    <input type="radio" name="filterMode" value="By Client" checked={tempFilterMode === 'By Client'} onChange={() => { setTempFilterMode('By Client'); setTempClient('All'); }} /> By Client
                  </label>
                </div>
              </div>
            )}

            <div className="mgt-filters-row">
              {/* Conditional dropdown selections based on role & mode */}
              {(role === 'supervisor' || role === 'admin') && tempFilterMode === 'By Worker' && (
                <>
                  <div className="mgt-filter-group">
                    <span className="mgt-filter-label">Worker</span>
                    <select className="mgt-select" value={tempWorker} onChange={e => setTempWorker(e.target.value)}>
                      <option value="All">All Workers</option>
                      {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="mgt-filter-group">
                    <span className="mgt-filter-label">Client</span>
                    <select className="mgt-select" value={tempClient} onChange={e => setTempClient(e.target.value)}>
                      <option value="All">All Clients</option>
                      {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </>
              )}

              {(role === 'supervisor' || role === 'admin') && tempFilterMode === 'By Client' && (
                <div className="mgt-filter-group">
                  <span className="mgt-filter-label">Client</span>
                  <select className="mgt-select" value={tempClient} onChange={e => setTempClient(e.target.value)}>
                    <option value="All">All Clients</option>
                    {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {role === 'client' && (
                <div className="mgt-filter-group">
                  <span className="mgt-filter-label">Worker</span>
                  <select className="mgt-select" value={tempWorker} onChange={e => setTempWorker(e.target.value)}>
                    <option value="All">All Workers</option>
                    {uniqueWorkers.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              )}

              {(role === 'supervisor' || role === 'client' || role === 'admin') && (
                <div className="mgt-filter-group">
                  <span className="mgt-filter-label">Want to see</span>
                  <select className="mgt-select" value={tempWantToSee} onChange={e => setTempWantToSee(e.target.value)}>
                    <option value="Complete details">Complete details</option>
                    <option value="Only no. of days">Only no. of days</option>
                  </select>
                </div>
              )}

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Date From</span>
                <input type="date" className="mgt-input" value={tempDateFrom} onChange={e => setTempDateFrom(e.target.value)} />
              </div>

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Date To</span>
                <input type="date" className="mgt-input" value={tempDateTo} onChange={e => setTempDateTo(e.target.value)} />
              </div>

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Shift</span>
                <select className="mgt-select" value={tempShift} onChange={e => setTempShift(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Day">Day</option>
                  <option value="Night">Night</option>
                </select>
              </div>

              <div className="mgt-filter-group">
                <span className="mgt-filter-label">Status</span>
                <select className="mgt-select" value={tempStatus} onChange={e => setTempStatus(e.target.value)}>
                  <option value="All">All</option>
                  <option value="Present">Present</option>
                  <option value="Official Leave">Official Leave</option>
                  <option value="Unofficial Leave">Unofficial Leave</option>
                </select>
              </div>
            </div>

            <div className="mgt-filters-row">
              <div className="mgt-filter-group search">
                <span className="mgt-filter-label">Search (date / notes / client)</span>
                <input type="text" className="mgt-input" placeholder="Type to search..." value={tempSearch} onChange={e => setTempSearch(e.target.value)} />
              </div>
              <div className="mgt-filters-actions">
                <button className="mgt-btn mgt-btn-primary" onClick={handleApply}>Apply</button>
                <button className="mgt-btn" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Heading & Section */}
      <div className="mgt-analytics-card" style={{ marginBottom: 24 }}>
        <div className="mgt-analytics-header" onClick={() => setSummaryOpen(!summaryOpen)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Attendance Summary</span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              ({(isDefaultFilters && !hasFiltersApplied) ? 'Global totals' : 'Filtered subset'})
            </span>
          </div>
          <span>{summaryOpen ? '▲' : '▼'}</span>
        </div>
        {summaryOpen && (
          <div className="mgt-analytics-body">
            <div className="mgt-stats-row">
              <div className="mgt-stat-item">
                <div className="mgt-stat-val" style={{ color: '#10B981' }}>{summaryStats.workedDone}</div>
                <div className="mgt-stat-lbl">Worked Days</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val" style={{ color: '#3B82F6' }}>{summaryStats.officialAbsent}</div>
                <div className="mgt-stat-lbl">Official Absent</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val" style={{ color: '#EF4444' }}>{summaryStats.unofficialAbsent}</div>
                <div className="mgt-stat-lbl">Unofficial Absent</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{summaryStats.avgHrsPerShift}h</div>
                <div className="mgt-stat-lbl">Avg. hr/shift</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val">{summaryStats.punctualityScore}%</div>
                <div className="mgt-stat-lbl">Punctuality Score</div>
              </div>
              <div className="mgt-stat-item">
                <div className="mgt-stat-val" style={{ color: '#0B0E17' }}>{summaryStats.totalHours}h</div>
                <div className="mgt-stat-lbl">Total Hours</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pending Attendance Approvals Queue */}
      {pendingApprovals.length > 0 && (
        <div className="mgt-results-card" style={{ marginBottom: 24, border: '2px solid #3B82F6', overflow: 'hidden' }}>
          <div className="mgt-results-header" style={{ background: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '16px 20px' }}>
            <h3 className="mgt-results-title" style={{ color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: 8 }}>
              📥 Pending Attendance Approvals Queue ({pendingApprovals.length})
            </h3>
          </div>
          <div className="mgt-table-wrapper">
            <table className="mgt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Worker Name</th>
                  <th>Client / Property</th>
                  <th>Shift</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                  <th>Location & Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingApprovals.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700 }}>{s.date}</td>
                    <td>
                      <strong>{s.workerName}</strong>
                      <br/>
                      <span style={{ fontSize: 10, color: '#64748B' }}>{s.workerMobile}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.client}</td>
                    <td>{s.shift}</td>
                    <td style={{ color: '#10B981', fontWeight: 600 }}>{s.checkIn || '—'}</td>
                    <td style={{ color: '#F59E0B', fontWeight: 600 }}>{s.checkOut || '—'}</td>
                    <td style={{ fontWeight: 600 }}>{s.totalHours > 0 ? `${s.totalHours} hrs` : '—'}</td>
                    <td style={{ fontSize: 11, color: '#475569' }}>
                      📍 Lat: 12.9716, Lng: 77.5946 (Verified)<br/>
                      📸 Face Verified (100% Match)
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button 
                          className="mgt-btn" 
                          style={{ padding: '6px 12px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 12, fontWeight: 700 }}
                          onClick={() => { setActiveApprovalId(s.id); setApprovalAction('approve'); setSelectedPredefinedNote('Marked on time'); setCustomNote(''); }}
                        >
                          Approve
                        </button>
                        <button 
                          className="mgt-btn" 
                          style={{ padding: '6px 12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: 12, fontWeight: 700 }}
                          onClick={() => { setActiveApprovalId(s.id); setApprovalAction('reject'); setSelectedPredefinedNote('Late check-in'); setCustomNote(''); }}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view for pending queue */}
          <div className="mgt-mobile-list" style={{ padding: 10, background: '#F8FAFC' }}>
            {pendingApprovals.map(s => (
              <div key={s.id} className="mgt-mobile-row-card" style={{ border: '1px solid #BFDBFE', background: '#FFFFFF', padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{s.date}</span>
                  <span className="mgt-badge in-progress">{s.shift}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B', marginBottom: 4 }}>{s.workerName}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Client: {s.client}</div>
                <div style={{ fontSize: 12, color: '#334155', display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span>In: <strong style={{ color: '#10B981' }}>{s.checkIn || '—'}</strong></span>
                  <span>Out: <strong style={{ color: '#F59E0B' }}>{s.checkOut || '—'}</strong></span>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button 
                    className="mgt-btn" 
                    style={{ padding: '4px 10px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11 }}
                    onClick={() => { setActiveApprovalId(s.id); setApprovalAction('approve'); setSelectedPredefinedNote('Marked on time'); setCustomNote(''); }}
                  >
                    Approve
                  </button>
                  <button 
                    className="mgt-btn" 
                    style={{ padding: '4px 10px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: 11 }}
                    onClick={() => { setActiveApprovalId(s.id); setApprovalAction('reject'); setSelectedPredefinedNote('Late check-in'); setCustomNote(''); }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Table & Desktop View */}
      <div className="mgt-results-card">
        <div className="mgt-results-header">
          <h3 className="mgt-results-title">Scans Results ({appliedWantToSee === 'Complete details' ? filteredScans.length : groupedResults.length})</h3>
          <div className="mgt-actions-group">
            <button className="mgt-btn" onClick={printAttendancePDF}>Export PDF</button>
            <button className="mgt-btn" onClick={exportAttendanceCSV}>Export CSV</button>
          </div>
        </div>

        {/* Complete Details Mode */}
        {appliedWantToSee === 'Complete details' ? (
          <>
            <div className="mgt-table-wrapper">
              <table className="mgt-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Worker Name</th>
                    <th>Client</th>
                    <th>Shift</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map(s => (
                    <React.Fragment key={s.id}>
                      <tr>
                        <td style={{ fontWeight: 800, color: '#0b0e17' }}>{s.date}</td>
                        <td>{s.workerName}</td>
                        <td>{s.client}</td>
                        <td>{s.shift}</td>
                        <td>{s.checkIn || '—'}</td>
                        <td>{s.checkOut || '—'}</td>
                        <td>{s.totalHours > 0 ? `${s.totalHours} hrs` : '—'}</td>
                        <td>
                          <span className={`mgt-badge ${s.status.toLowerCase().includes('present') ? 'completed' : s.status.toLowerCase().includes('official') ? 'in-progress' : 'cancelled'}`}>
                            <span className="mgt-dot"></span> {s.status}
                          </span>
                        </td>
                        <td style={{ color: '#64748B', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes}</td>
                        <td>
                          <button className="mp-action-btn" onClick={() => toggleRow(s.id)}>
                            {expandedRowId === s.id ? '▲' : '▼'}
                          </button>
                        </td>
                      </tr>
                      {expandedRowId === s.id && (
                        <tr className="mgt-expanded-row">
                          <td colSpan={10}>
                            <div className="mgt-expanded-detail">
                              <div className="mgt-detail-section">
                                <h5>Scan Notes</h5>
                                <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>{s.notes || 'No remarks added.'}</p>
                              </div>
                              <div className="mgt-detail-section">
                                <h5>Shift Details</h5>
                                <div className="mgt-detail-item"><span className="mgt-detail-label">Working Shift:</span><span className="mgt-detail-val">{s.shift}</span></div>
                                <div className="mgt-detail-item"><span className="mgt-detail-label">Check-In:</span><span className="mgt-detail-val">{s.checkIn || '—'}</span></div>
                                <div className="mgt-detail-item"><span className="mgt-detail-label">Check-Out:</span><span className="mgt-detail-val">{s.checkOut || '—'}</span></div>
                              </div>
                              <div className="mgt-detail-section">
                                <h5>Worker &amp; Client</h5>
                                <div className="mgt-detail-item"><span className="mgt-detail-label">Worker Mobile:</span><span className="mgt-detail-val">{s.workerMobile}</span></div>
                                <div className="mgt-detail-item"><span className="mgt-detail-label">Property:</span><span className="mgt-detail-val">{s.client}</span></div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {filteredScans.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No attendance scans found matching filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Complete Details */}
            <div className="mgt-mobile-list">
              {filteredScans.map(s => (
                <MobileScanCard key={s.id} scan={s} />
              ))}
              {filteredScans.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No attendance scans found.</div>
              )}
            </div>
          </>
        ) : (
          /* Summarized No. of Days Mode */
          <>
            <div className="mgt-table-wrapper">
              <table className="mgt-table">
                <thead>
                  <tr>
                    <th>{appliedFilterMode === 'By Client' && role === 'supervisor' ? 'Client Company' : 'Worker Name'}</th>
                    <th>Worked Days (Present)</th>
                    <th>Official Leaves</th>
                    <th>Unofficial Absences</th>
                    <th>Total Hours</th>
                    <th>Punctuality Score</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedResults.map((g, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 800, color: '#0b0e17' }}>{g.name}</td>
                      <td>{g.stats.workedDone} days</td>
                      <td>{g.stats.officialAbsent} days</td>
                      <td>{g.stats.unofficialAbsent} days</td>
                      <td>{g.stats.totalHours} hrs</td>
                      <td>
                        <span className="mgt-prio high" style={{ background: '#ECFDF5', color: '#10B981', padding: '4px 8px', borderRadius: 4 }}>
                          {g.stats.punctualityScore}%
                        </span>
                      </td>
                    </tr>
                  ))}
                  {groupedResults.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No summarized results found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Only no. of days */}
            <div className="mgt-mobile-list">
              {groupedResults.map((g, idx) => (
                <MobileSummaryCard key={idx} group={g} filterMode={appliedFilterMode} role={role} />
              ))}
              {groupedResults.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No summarized results found.</div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Attendance Approval Notes Dialog Modal */}
      {activeApprovalId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001, padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 0, marginBottom: 12 }}>
              {approvalAction === 'approve' ? '✅ Approve Attendance Scan' : '❌ Reject Attendance Scan'}
            </h3>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              Confirm attendance action for <strong>{scans.find(s => s.id === activeApprovalId)?.workerName}</strong>.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Predefined Supervisor Note</label>
              <select 
                className="mgt-select" 
                value={selectedPredefinedNote} 
                onChange={e => setSelectedPredefinedNote(e.target.value)} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}
              >
                {PREDEFINED_NOTES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Custom Remarks (Optional)</label>
              <textarea 
                className="mgt-input" 
                value={customNote} 
                onChange={e => setCustomNote(e.target.value)} 
                placeholder="Type any additional remarks..." 
                style={{ width: '100%', height: 80, resize: 'none', padding: '8px 10px', border: '1px solid #CBD5E1', borderRadius: 8 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="mgt-btn secondary" onClick={() => setActiveApprovalId(null)}>Cancel</button>
              <button 
                className="mgt-btn primary" 
                style={{ background: approvalAction === 'approve' ? '#10B981' : '#EF4444', border: 'none', color: '#FFF' }}
                onClick={() => handleConfirmApproval(activeApprovalId, approvalAction)}
              >
                {approvalAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Mobile Scan Card Component ── */
function MobileScanCard({ scan }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mgt-mobile-row-card">
      <div className="mgt-mobile-row-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{scan.date}</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0B0E17' }}>{scan.workerName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`mgt-badge ${scan.status.toLowerCase().includes('present') ? 'completed' : scan.status.toLowerCase().includes('official') ? 'in-progress' : 'cancelled'}`} style={{ padding: '2px 6px', fontSize: 10 }}>
            {scan.status}
          </span>
          <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', color: '#64748B' }}>▼</span>
        </div>
      </div>
      {scan.notes && !expanded && (
        <div style={{ padding: '0 12px 10px 12px', fontSize: 12, color: '#64748B', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {scan.notes}
        </div>
      )}
      {expanded && (
        <div style={{ padding: 12, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
            <div><span style={{ color: '#64748B' }}>Client:</span> <strong style={{ color: '#0b0e17' }}>{scan.client}</strong></div>
            <div><span style={{ color: '#64748B' }}>Shift:</span> <strong style={{ color: '#0b0e17' }}>{scan.shift}</strong></div>
            <div><span style={{ color: '#64748B' }}>Check In:</span> <strong style={{ color: '#0b0e17' }}>{scan.checkIn || '—'}</strong></div>
            <div><span style={{ color: '#64748B' }}>Check Out:</span> <strong style={{ color: '#0b0e17' }}>{scan.checkOut || '—'}</strong></div>
            <div><span style={{ color: '#64748B' }}>Hours:</span> <strong style={{ color: '#0b0e17' }}>{scan.totalHours} hrs</strong></div>
          </div>
          {scan.notes && (
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8, fontSize: 12 }}>
              <span style={{ color: '#64748B', display: 'block', marginBottom: 2 }}>Notes:</span>
              <p style={{ margin: 0, color: '#475569' }}>{scan.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mobile Summary Card Component ── */
function MobileSummaryCard({ group, filterMode, role }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mgt-mobile-row-card">
      <div className="mgt-mobile-row-header" onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
            {filterMode === 'By Client' && role === 'supervisor' ? 'Client' : 'Worker'}
          </span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#0B0E17' }}>{group.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ background: '#ECFDF5', color: '#10B981', padding: '2px 6px', fontSize: 10, borderRadius: 4, fontWeight: 700 }}>
            {group.stats.punctualityScore}% Punctual
          </span>
          <span style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', color: '#64748B' }}>▼</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: 12, background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
          <div><span style={{ color: '#64748B' }}>Worked Days:</span> <strong style={{ color: '#0b0e17' }}>{group.stats.workedDone} days</strong></div>
          <div><span style={{ color: '#64748B' }}>Official Leaves:</span> <strong style={{ color: '#0b0e17' }}>{group.stats.officialAbsent} days</strong></div>
          <div><span style={{ color: '#64748B' }}>Unofficial Absences:</span> <strong style={{ color: '#0b0e17' }}>{group.stats.unofficialAbsent} days</strong></div>
          <div><span style={{ color: '#64748B' }}>Total Hours:</span> <strong style={{ color: '#0b0e17' }}>{group.stats.totalHours} hrs</strong></div>
        </div>
      )}
    </div>
  );
}

const calculateAttendanceStats = (scans) => {
  const workedDone = scans.filter(s => s.status === 'Present').length;
  const officialAbsent = scans.filter(s => s.status === 'Official Leave').length;
  const unofficialAbsent = scans.filter(s => s.status === 'Unofficial Leave' || s.status === 'Absent (Unofficial)').length;
  const totalHours = scans.reduce((sum, s) => sum + (s.totalHours || 0), 0);
  const avgHrsPerShift = workedDone > 0 ? (totalHours / workedDone).toFixed(1) : '—';
  const punctualityScore = (workedDone + unofficialAbsent) > 0
    ? Math.round((workedDone / (workedDone + unofficialAbsent)) * 100)
    : 100;
  return { workedDone, officialAbsent, unofficialAbsent, totalHours: totalHours.toFixed(1), avgHrsPerShift, punctualityScore };
};

/* ── Roster Master View Component ── */

const ALL_CLIENTS = [
  'Acme Corp',
  'Apex',
  'Nexus',
  'Renaissance Bengaluru Race Course Hotel',
  'Holiday Inn Express Bengaluru Whitefield Itpl, an IHG Hotel',
  'JW Marriott Hotel Kolkata'
];

const ALL_WORKERS = [
  { name: 'Worker One', phone: '9999999993' },
  { name: 'Aarav Sharma', phone: '9876543210' },
  { name: 'SHIVKARAN', phone: '9580916481' },
  { name: 'Shidharth', phone: '9880438510' },
  { name: 'SURJEET', phone: '7439971566' },
  { name: 'MANISH KUMAR', phone: '8252259573' },
  { name: 'BRIJENDRA .', phone: '9975801468' },
  { name: 'Priya Patel', phone: '9999999993' }
];

const ALL_SUPERVISORS = [
  { name: 'Supervisor One', phone: '9999999991' },
  { name: 'ANIL S/o Mattar', phone: '9766123961' },
  { name: 'MOHIT S/o PRAMLAL', phone: '9305200273' }
];

export function RosterView({ onBack, user }) {
  const role = user?.role || 'admin';
  const [rosters, setRosters] = useState(() => getRosters());
  
  // Filters State
  const [filterDate, setFilterDate] = useState('');
  const [filterClient, setFilterClient] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [filterWorker, setFilterWorker] = useState('All');
  const [filterSupervisor, setFilterSupervisor] = useState('All');

  // Form / Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoster, setEditingRoster] = useState(null);
  const [queuedRosters, setQueuedRosters] = useState([]);

  // Form Fields State
  const [formDateType, setFormDateType] = useState('single'); // 'single' | 'range'
  const [formSingleDate, setFormSingleDate] = useState('2026-05-24');
  const [formStartDate, setFormStartDate] = useState('2026-05-24');
  const [formEndDate, setFormEndDate] = useState('2026-05-24');
  const [formShift, setFormShift] = useState('Day');
  const [formClient, setFormClient] = useState('');
  const [formSupervisorMobile, setFormSupervisorMobile] = useState('');
  const [selectedWorkers, setSelectedWorkers] = useState([]); // list of {name, phone}
  const [tempWorkerPhone, setTempWorkerPhone] = useState('');
  const [apiDirectory, setApiDirectory] = useState({ clients: [], workers: [], supervisors: [] });
  const [apiSync, setApiSync] = useState({ loading: false, error: '' });

  useEffect(() => {
    let cancelled = false;

    async function loadRosterData() {
      setApiSync({ loading: true, error: '' });
      try {
        const apiUsers = await listUsers();
        const directoryUsers = apiUsers.map(toDirectoryUser);
        const clients = directoryUsers
          .filter(item => item.role === 'Client')
          .map(item => toDirectoryClient(item.apiUser));
        const workers = directoryUsers
          .filter(item => item.role === 'Worker')
          .map(item => ({ id: item.apiId, apiId: item.apiId, name: item.name, phone: item.mobile }));
        const supervisors = directoryUsers
          .filter(item => item.role === 'Supervisor')
          .map(item => ({ id: item.apiId, apiId: item.apiId, name: item.name, phone: item.mobile }));
        const apiRosters = await listApiRosters(apiUsers);

        if (!cancelled) {
          setApiDirectory({ clients, workers, supervisors });
          setRosters(apiRosters);
          saveRosters(apiRosters);
          setApiSync({ loading: false, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          setApiSync({
            loading: false,
            error: error.status === 403
              ? 'Your account does not have permission to manage rosters in the backend yet. Showing local roster data.'
              : error.message || 'Unable to sync rosters from API.',
          });
        }
      }
    }

    loadRosterData();
    return () => { cancelled = true; };
  }, []);

  const clientOptions = useMemo(() => (
    apiDirectory.clients.length > 0
      ? apiDirectory.clients
      : ALL_CLIENTS.map(name => ({ name, id: null, apiId: null }))
  ), [apiDirectory.clients]);

  const workerOptions = useMemo(() => (
    apiDirectory.workers.length > 0 ? apiDirectory.workers : ALL_WORKERS
  ), [apiDirectory.workers]);

  const supervisorOptions = useMemo(() => (
    apiDirectory.supervisors.length > 0 ? apiDirectory.supervisors : ALL_SUPERVISORS
  ), [apiDirectory.supervisors]);

  // Isolation logic
  const accessibleRosters = useMemo(() => {
    if (role === 'worker') {
      return rosters.filter(r => r.workers.some(w => w.phone === user.mobile));
    } else if (role === 'client') {
      return rosters.filter(r => r.clients.includes(user.client) || r.clients.includes('Acme Corp'));
    } else if (role === 'supervisor') {
      const scope = SUPERVISOR_SCOPES[user.mobile];
      if (scope) {
        return rosters.filter(r => 
          r.workers.some(w => scope.workers.some(sw => sw.phone === w.phone)) || 
          r.clients.some(c => scope.clients.includes(c)) ||
          r.supervisor.includes(user.mobile)
        );
      }
    }
    return rosters;
  }, [rosters, role, user]);

  // Dropdown options based on scope
  const supervisorScope = role === 'supervisor' ? SUPERVISOR_SCOPES[user.mobile] : null;

  const allowedClients = useMemo(() => {
    if (role === 'supervisor' && supervisorScope) {
      return supervisorScope.clients;
    }
    return clientOptions.map(client => client.name);
  }, [clientOptions, role, supervisorScope]);

  const allowedWorkers = useMemo(() => {
    if (role === 'supervisor' && supervisorScope) {
      return supervisorScope.workers;
    }
    return workerOptions;
  }, [role, supervisorScope, workerOptions]);

  // Set default client in form when opening
  useEffect(() => {
    if (allowedClients.length > 0 && !formClient) {
      setFormClient(allowedClients[0]);
    }
  }, [allowedClients, formClient]);

  // Set default supervisor
  useEffect(() => {
    if (role === 'supervisor') {
      setFormSupervisorMobile(user.mobile);
    } else if (supervisorOptions.length > 0 && !formSupervisorMobile) {
      setFormSupervisorMobile(supervisorOptions[0].phone);
    }
  }, [role, user, formSupervisorMobile, supervisorOptions]);

  // Filter application
  const filteredRosters = useMemo(() => {
    return accessibleRosters.filter(r => {
      const matchDate = !filterDate || r.rosterDate === filterDate;
      const matchClient = filterClient === 'All' || r.clients.includes(filterClient);
      const matchShift = filterShift === 'All' || r.shift === filterShift;
      const matchWorker = filterWorker === 'All' || r.workers.some(w => w.name === filterWorker || w.phone === filterWorker);
      const matchSupervisor = filterSupervisor === 'All' || r.supervisor.includes(filterSupervisor);

      return matchDate && matchClient && matchShift && matchWorker && matchSupervisor;
    });
  }, [accessibleRosters, filterDate, filterClient, filterShift, filterWorker, filterSupervisor]);

  // Conflict checking
  const checkConflicts = (datesToCheck, shiftToCheck, clientToCheck, workersToCheck, skipRosterId = null) => {
    const warnings = [];
    rosters.forEach(r => {
      if (skipRosterId && r.id === skipRosterId) return;
      if (datesToCheck.includes(r.rosterDate) && r.shift === shiftToCheck) {
        // Client conflict check
        if (r.clients.includes(clientToCheck)) {
          warnings.push(`Client "${clientToCheck}" is already assigned to a roster on ${r.rosterDate} (${shiftToCheck} Shift).`);
        }
        // Worker conflict check
        workersToCheck.forEach(w => {
          if (r.workers.some(rw => rw.phone === w.phone)) {
            warnings.push(`Worker "${w.name}" is already assigned to another roster on ${r.rosterDate} (${shiftToCheck} Shift).`);
          }
        });
      }
    });
    return warnings;
  };

  const getDatesBetween = (start, end) => {
    const dates = [];
    let curr = new Date(start);
    const last = new Date(end);
    while (curr <= last) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  const handleAddWorker = () => {
    if (!tempWorkerPhone) return;
    const workerObj = ALL_WORKERS.find(w => w.phone === tempWorkerPhone);
    if (workerObj && !selectedWorkers.some(sw => sw.phone === tempWorkerPhone)) {
      setSelectedWorkers([...selectedWorkers, workerObj]);
    }
    setTempWorkerPhone('');
  };

  const handleRemoveWorker = (phone) => {
    setSelectedWorkers(selectedWorkers.filter(sw => sw.phone !== phone));
  };

  const handleOpenAdd = () => {
    setEditingRoster(null);
    setQueuedRosters([]);
    setSelectedWorkers([]);
    setFormDateType('single');
    setFormSingleDate(new Date().toISOString().split('T')[0]);
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date().toISOString().split('T')[0]);
    setFormShift('Day');
    setFormClient(allowedClients[0] || '');
    if (role === 'supervisor') {
      setFormSupervisorMobile(user.mobile);
    } else {
      setFormSupervisorMobile(supervisorOptions[0]?.phone || '');
    }
    setShowModal(true);
  };

  const handleOpenEdit = (roster) => {
    setEditingRoster(roster);
    setQueuedRosters([]);
    setSelectedWorkers(roster.workers);
    setFormDateType('single');
    setFormSingleDate(roster.rosterDate);
    setFormShift(roster.shift);
    setFormClient(roster.clients[0] || '');
    const supervisorPhone = roster.supervisor.match(/\((\d+)\)/)?.[1] || '';
    setFormSupervisorMobile(supervisorPhone);
    setShowModal(true);
  };

  const handleQueueRoster = () => {
    if (!formClient) {
      alert('Please select a client.');
      return;
    }
    if (selectedWorkers.length === 0) {
      alert('Please add at least one worker to the roster.');
      return;
    }

    const dates = formDateType === 'single' 
      ? [formSingleDate] 
      : getDatesBetween(formStartDate, formEndDate);

    if (dates.length === 0) {
      alert('Invalid date selection.');
      return;
    }

    // Check conflicts
    const conflicts = checkConflicts(dates, formShift, formClient, selectedWorkers, editingRoster?.id);
    if (conflicts.length > 0) {
      const proceed = window.confirm(`Conflict warnings:\n\n${conflicts.join('\n')}\n\nDo you want to proceed anyway?`);
      if (!proceed) return;
    }

    const supervisorObj = supervisorOptions.find(s => s.phone === formSupervisorMobile) || { name: 'Supervisor', phone: formSupervisorMobile };
    const supervisorStr = `${supervisorObj.name} (${supervisorObj.phone})`;

    const newQueued = dates.map(d => ({
      id: editingRoster ? editingRoster.id : 'r_' + Math.random().toString(36).substr(2, 9),
      rosterDate: d,
      shift: formShift,
      name: `${formShift} Shift`,
      createdAt: new Date().toISOString(),
      createdBy: user.name,
      clients: [formClient],
      supervisor: supervisorStr,
      workers: selectedWorkers
    }));

    setQueuedRosters([...queuedRosters, ...newQueued]);
    // Clear list of selected workers for next queue item
    setSelectedWorkers([]);
  };

  const handleSubmitRosters = async () => {
    let finalRosters = [...queuedRosters];

    // If queue is empty, try to compile the current form state
    if (finalRosters.length === 0) {
      if (!formClient) {
        alert('Please select a client.');
        return;
      }
      if (selectedWorkers.length === 0) {
        alert('Please add at least one worker.');
        return;
      }

      const dates = formDateType === 'single' 
        ? [formSingleDate] 
        : getDatesBetween(formStartDate, formEndDate);

      if (dates.length === 0) {
        alert('Invalid date range.');
        return;
      }

      const conflicts = checkConflicts(dates, formShift, formClient, selectedWorkers, editingRoster?.id);
      if (conflicts.length > 0) {
        const proceed = window.confirm(`Conflict warnings:\n\n${conflicts.join('\n')}\n\nDo you want to proceed anyway?`);
        if (!proceed) return;
      }

      const supervisorObj = supervisorOptions.find(s => s.phone === formSupervisorMobile) || { name: 'Supervisor', phone: formSupervisorMobile };
      const supervisorStr = `${supervisorObj.name} (${supervisorObj.phone})`;

      finalRosters = dates.map(d => ({
        id: editingRoster ? editingRoster.id : 'r_' + Math.random().toString(36).substr(2, 9),
        rosterDate: d,
        shift: formShift,
        name: `${formShift} Shift`,
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        clients: [formClient],
        supervisor: supervisorStr,
        workers: selectedWorkers
      }));
    }

    const canSyncRosterApi = apiDirectory.clients.length > 0 && apiDirectory.workers.length > 0;
    if (canSyncRosterApi) {
      try {
        if (editingRoster?.apiId) {
          await updateRosterFromUi(editingRoster.apiId, finalRosters[0], { clients: clientOptions });
        } else {
          for (const roster of finalRosters) {
            await createRosterFromUi(roster, { clients: clientOptions });
          }
        }

        const apiUsers = await listUsers();
        const syncedRosters = await listApiRosters(apiUsers);
        saveRosters(syncedRosters);
        setRosters(syncedRosters);
        setShowModal(false);
        setQueuedRosters([]);
        alert(`Successfully synced ${finalRosters.length} roster(s) with API.`);
        return;
      } catch (error) {
        alert(`API roster sync failed: ${error.message}. Saving this roster locally only.`);
      }
    }

    // Save to local fallback list
    let updatedRosters = [...rosters];
    if (editingRoster) {
      updatedRosters = updatedRosters.filter(r => r.id !== editingRoster.id);
    }
    updatedRosters = [...updatedRosters, ...finalRosters];

    saveRosters(updatedRosters);
    setRosters(updatedRosters);

    // Trigger Notifications for workers
    finalRosters.forEach(fr => {
      fr.workers.forEach(w => {
        const msg = `${editingRoster ? 'Updated' : 'New'} Duty Assigned: Client "${fr.clients.join(', ')}", Date ${fr.rosterDate}, Shift: ${fr.shift}. Supervisor: ${fr.supervisor}`;
        addNotification(w.phone, w.name, msg);
      });
    });

    setShowModal(false);
    setQueuedRosters([]);
    alert(`Successfully saved ${finalRosters.length} roster(s). Workers have been notified.`);
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterClient('All');
    setFilterShift('All');
    setFilterWorker('All');
    setFilterSupervisor('All');
  };

  const handleDelete = async (roster) => {
    if (window.confirm('Are you sure you want to delete this roster assignment?')) {
      if (roster.apiId) {
        try {
          await deleteApiRoster(roster.apiId);
        } catch (error) {
          alert(`API delete failed: ${error.message}. Removing this roster from the local view only.`);
        }
      }
      const updated = rosters.filter(r => r.id !== roster.id);
      saveRosters(updated);
      setRosters(updated);
    }
  };

  return (
    <div className="mgt-view-container">
      {/* Header & Back Action */}
      <div className="mgt-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={onBack} 
            aria-label="Go Back"
            style={{
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              borderRadius: '10px',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#475569',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0B0E17'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#475569'; }}
          >
            ←
          </button>
          <div>
            <h1 className="mgt-title">Roster Master Portal</h1>
            <p className="mgt-subtitle">Assign duty shifts, select client properties, and dispatch workers.</p>
          </div>
        </div>
        {(role === 'supervisor' || role === 'admin') && (
          <button className="mgt-btn primary" onClick={handleOpenAdd}>➕ Add New Roster</button>
        )}
      </div>

      {(apiSync.loading || apiSync.error) && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: apiSync.error ? '1px solid #FCA5A5' : '1px solid #BFDBFE', background: apiSync.error ? '#FEF2F2' : '#EFF6FF', color: apiSync.error ? '#991B1B' : '#1E40AF', fontSize: 13, fontWeight: 700 }}>
          {apiSync.loading ? 'Syncing rosters from API...' : apiSync.error}
        </div>
      )}

      {/* Filter Section */}
      <div className="mgt-filters-card" style={{ marginBottom: '20px' }}>
        <div className="mgt-filters-header" style={{ cursor: 'default', borderBottom: '1px solid #E2E8F0', padding: '16px 20px', background: '#F8FAFC' }}>
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#0B0E17' }}>🔍 Filter Assignments</span>
        </div>
        <div className="mgt-filters-body" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="mgt-filters-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
            <div className="mgt-filter-group">
              <label className="mgt-filter-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Roster Date</label>
              <input 
                type="date" 
                className="mgt-input" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div className="mgt-filter-group">
              <label className="mgt-filter-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Client Property</label>
              <select 
                className="mgt-select" 
                value={filterClient} 
                onChange={e => setFilterClient(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              >
                <option value="All">All Clients</option>
                {allowedClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="mgt-filter-group">
              <label className="mgt-filter-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Duty Shift</label>
              <select 
                className="mgt-select" 
                value={filterShift} 
                onChange={e => setFilterShift(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              >
                <option value="All">All Shifts</option>
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>

            <div className="mgt-filter-group">
              <label className="mgt-filter-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Worker Name</label>
              <select 
                className="mgt-select" 
                value={filterWorker} 
                onChange={e => setFilterWorker(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              >
                <option value="All">All Workers</option>
                {allowedWorkers.map(w => <option key={w.phone} value={w.name}>{w.name}</option>)}
              </select>
            </div>

            {(role === 'admin' || role === 'staff') && (
              <div className="mgt-filter-group">
                <label className="mgt-filter-label" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Supervisor Name</label>
                <select 
                  className="mgt-select" 
                  value={filterSupervisor} 
                  onChange={e => setFilterSupervisor(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="All">All Supervisors</option>
                  {supervisorOptions.map(s => <option key={s.phone} value={s.name}>{s.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="mgt-filters-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              className="mgt-btn secondary" 
              onClick={handleClearFilters}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#0B0E17'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#475569'; }}
            >
              🧹 Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Roster List Table / Cards */}
      <div className="mgt-results-card">
        <div className="mgt-results-header">
          <h3 className="mgt-results-title">Duty Assignment List ({filteredRosters.length})</h3>
        </div>

        <div className="mgt-table-wrapper">
          <table className="mgt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Shift</th>
                <th>Client / Property</th>
                <th>Workers Assigned</th>
                <th>Created By</th>
                <th>Created On</th>
                {(role === 'supervisor' || role === 'admin') && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRosters.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700 }}>{r.rosterDate}</td>
                  <td>
                    <span className={`mgt-badge ${r.shift.toLowerCase() === 'day' ? 'completed' : 'in-progress'}`} style={{ textTransform: 'capitalize' }}>
                      {r.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800 }}>{r.clients.join(', ')}</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.workers.map((w, idx) => (
                        <span key={idx} style={{ background: '#F1F5F9', color: '#1E293B', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {w.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{r.createdBy || 'Admin'}</td>
                  <td>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  {(role === 'supervisor' || role === 'admin') && (
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="mgt-btn secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => handleOpenEdit(r)}>Edit</button>
                        <button className="mgt-btn secondary" style={{ padding: '4px 8px', fontSize: 12, color: '#B91C1C' }} onClick={() => handleDelete(r)}>Delete</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredRosters.length === 0 && (
                <tr>
                  <td colSpan={(role === 'supervisor' || role === 'admin') ? 7 : 6} style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No roster records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Roster Cards */}
        <div className="mgt-mobile-list">
          {filteredRosters.map(r => (
            <div className="mgt-mobile-row-card" key={r.id} style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0B0E17' }}>{r.rosterDate}</span>
                <span className={`mgt-badge ${r.shift.toLowerCase() === 'day' ? 'completed' : 'in-progress'}`}>
                  {r.shift === 'Day' ? '☀️ Day' : '🌙 Night'}
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{r.clients.join(', ')}</p>
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Workers:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {r.workers.map((w, idx) => (
                    <span key={idx} style={{ background: '#F1F5F9', color: '#1E293B', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {w.name} ({w.phone})
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#475569', borderTop: '1px solid #E2E8F0', paddingTop: 8, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Created By:</span> {r.createdBy || 'Admin'}
                </div>
                <div>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Created On:</span> {new Date(r.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
                {(role === 'supervisor' || role === 'admin') && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button className="mgt-btn secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleOpenEdit(r)}>Edit</button>
                    <button className="mgt-btn secondary" style={{ padding: '4px 10px', fontSize: 11, color: '#B91C1C' }} onClick={() => handleDelete(r)}>Delete</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredRosters.length === 0 && (
            <div style={{ textAlign: 'center', padding: 24, color: '#64748B' }}>No roster records found.</div>
          )}
        </div>
      </div>

      {/* Roster Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 600, padding: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9', paddingBottom: 16, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {editingRoster ? '✏️ Edit Roster Assignment' : '📅 Create New Roster'}
              </h2>
              <button style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#94A3B8' }} onClick={() => setShowModal(false)}>×</button>
            </div>

            {/* Date Type Selector (only for create) */}
            {!editingRoster && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Date Option</label>
                <div style={{ display: 'flex', gap: 16 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="radio" checked={formDateType === 'single'} onChange={() => setFormDateType('single')} />
                    Single Date
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input type="radio" checked={formDateType === 'range'} onChange={() => setFormDateType('range')} />
                    Date Range
                  </label>
                </div>
              </div>
            )}

            {/* Date inputs */}
            {formDateType === 'single' || editingRoster ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Roster Date</label>
                <input 
                  type="date" 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }} 
                  value={formSingleDate} 
                  onChange={e => setFormSingleDate(e.target.value)} 
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Start Date</label>
                  <input 
                    type="date" 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }} 
                    value={formStartDate} 
                    onChange={e => setFormStartDate(e.target.value)} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>End Date</label>
                  <input 
                    type="date" 
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }} 
                    value={formEndDate} 
                    onChange={e => setFormEndDate(e.target.value)} 
                  />
                </div>
              </div>
            )}

            {/* Shift select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Shift</label>
              <select 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                value={formShift}
                onChange={e => setFormShift(e.target.value)}
              >
                <option value="Day">☀️ Day (9 AM - 9 PM)</option>
                <option value="Night">🌙 Night (9 PM - 9 AM)</option>
              </select>
            </div>

            {/* Client Select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Client Property</label>
              <select 
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                value={formClient}
                onChange={e => setFormClient(e.target.value)}
              >
                {allowedClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Supervisor Select (Admin only) */}
            {role === 'admin' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Supervisor</label>
                <select 
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                  value={formSupervisorMobile}
                  onChange={e => setFormSupervisorMobile(e.target.value)}
                >
                  {supervisorOptions.map(s => <option key={s.phone} value={s.phone}>{s.name} ({s.phone})</option>)}
                </select>
              </div>
            )}

            {/* Worker multi-selection */}
            <div style={{ marginBottom: 16, border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Add Workers</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <select 
                  style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}
                  value={tempWorkerPhone}
                  onChange={e => setTempWorkerPhone(e.target.value)}
                >
                  <option value="">-- Choose Worker --</option>
                  {allowedWorkers
                    .filter(w => {
                      const inSelected = selectedWorkers.some(sw => sw.phone === w.phone);
                      const inQueued = queuedRosters.some(qr => qr.workers.some(qw => qw.phone === w.phone));
                      return !inSelected && !inQueued;
                    })
                    .map(w => (
                      <option key={w.phone} value={w.phone}>{w.name} ({w.phone})</option>
                    ))}
                </select>
                <button className="mgt-btn primary" type="button" onClick={handleAddWorker}>➕ Add</button>
              </div>

              {/* Selected workers list */}
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6 }}>Selected Workers:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {selectedWorkers.map(w => (
                    <span key={w.phone} style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '4px 10px', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {w.name}
                      <button 
                        type="button" 
                        style={{ border: 'none', background: 'none', color: '#1E40AF', fontWeight: 'bold', fontSize: 14, cursor: 'pointer', padding: 0 }}
                        onClick={() => handleRemoveWorker(w.phone)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedWorkers.length === 0 && (
                    <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No workers added yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Queue info panel */}
            {queuedRosters.length > 0 && (
              <div style={{ border: '1px solid #FEF08A', background: '#FEFCE8', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#854D0E', display: 'block', marginBottom: 4 }}>Queued Duties in Batch ({queuedRosters.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
                  {queuedRosters.map((qr, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#713F12' }}>
                      <span>• {qr.rosterDate} | {qr.shift} | {qr.clients[0]} ({qr.workers.length} workers)</span>
                      <button 
                        type="button"
                        style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }}
                        onClick={() => setQueuedRosters(queuedRosters.filter((_, qIdx) => qIdx !== idx))}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #F1F5F9', paddingTop: 16, marginTop: 16 }}>
              <button className="mgt-btn secondary" onClick={() => setShowModal(false)}>Cancel</button>
              
              {!editingRoster && (
                <button className="mgt-btn secondary" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' }} onClick={handleQueueRoster}>
                  ➕ Add More (Queue)
                </button>
              )}

              <button className="mgt-btn primary" onClick={handleSubmitRosters}>
                {queuedRosters.length > 0 ? `Submit All (${queuedRosters.length})` : 'Submit Roster'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Supervisor Visits View ──────────────────────────────────── */

export function VisitsView({ onBack, user }) {
  const role = user?.role;
  const [visits, setVisits] = useState(() => getVisits());
  const [requests, setRequests] = useState(() => getVisitRequests());

  // Form / active session states
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [activeVisit, setActiveVisit] = useState(null); // { id, client, type, checkInTime, elapsed: 0 }
  
  // Form fields
  const [visitClient, setVisitClient] = useState('Acme Corp');
  const [visitType, setVisitType] = useState('Property Round');
  const [remarks, setRemarks] = useState('');

  // Purpose-specific fields
  // 1. Property round areas
  const [roundAreas, setRoundAreas] = useState([{ area: 'Lobby', desc: '', condition: 'Good' }]);
  // 2. Gloss readings
  const [glossArea, setGlossArea] = useState('Lobby Level');
  const [glossSubArea, setGlossSubArea] = useState('Reception Floor');
  const [glossReadings, setGlossReadings] = useState([80, 80, 80]);
  // 3. On-demand issue / action
  const [issueDesc, setIssueDesc] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolution, setResolution] = useState('');

  const [activeRequestObj, setActiveRequestObj] = useState(null);

  // Load clients and workers available
  const allowedClients = ['Acme Corp', 'Apex', 'Nexus', 'Renaissance Bengaluru Race Course Hotel'];

  // Effect for timer
  useEffect(() => {
    let interval;
    if (activeVisit) {
      interval = setInterval(() => {
        setActiveVisit(prev => ({
          ...prev,
          elapsed: prev.elapsed + 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeVisit]);

  const handleStartCheckIn = (clientName = 'Acme Corp', typeVal = 'Property Round', reqObj = null) => {
    const checkInStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveVisit({
      id: 'V_' + Date.now(),
      client: clientName,
      type: typeVal,
      checkInTime: checkInStr,
      elapsed: 0
    });
    setVisitClient(clientName);
    setVisitType(typeVal);
    setActiveRequestObj(reqObj);
    
    // Seed/reset forms
    setRemarks('');
    setRoundAreas([{ area: 'Lobby', desc: '', condition: 'Good' }]);
    setGlossArea('Lobby Level');
    setGlossSubArea('Reception Floor');
    setGlossReadings([80, 80, 80]);
    setIssueDesc('');
    setActionTaken('');
    setResolution('');
    setShowCheckInModal(true);
  };

  const handleAddRoundRow = () => {
    setRoundAreas([...roundAreas, { area: '', desc: '', condition: 'Good' }]);
  };

  const handleRemoveRoundRow = (idx) => {
    setRoundAreas(roundAreas.filter((_, i) => i !== idx));
  };

  const handleAddReading = () => {
    setGlossReadings([...glossReadings, 80]);
  };

  const handleRemoveReading = (idx) => {
    if (glossReadings.length > 2) {
      setGlossReadings(glossReadings.filter((_, i) => i !== idx));
    }
  };

  const handleReadingChange = (idx, val) => {
    const updated = [...glossReadings];
    updated[idx] = parseFloat(val) || 0;
    setGlossReadings(updated);
  };

  const handleCompleteCheckOut = () => {
    if (!activeVisit) return;
    
    // Calculate elapsed duration in hours
    const durationHrs = Math.max(0.1, parseFloat((activeVisit.elapsed / 3600).toFixed(2)));
    const checkOutStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toISOString().split('T')[0];

    // Build the specific reports depending on type
    const newVisitObj = {
      id: activeVisit.id,
      date: todayStr,
      client: visitClient,
      supervisor: user?.name || 'Supervisor One',
      supervisorMobile: user?.mobile || '9999999991',
      type: visitType,
      checkIn: activeVisit.checkInTime,
      checkOut: checkOutStr,
      duration: durationHrs,
      status: 'Completed',
      location: 'Lat: 12.9716, Lng: 77.5946 (Verified)',
    };

    if (visitType === 'Property Round') {
      newVisitObj.rounds = roundAreas;
      newVisitObj.notes = remarks || 'Regular property round completed.';
    } else if (visitType === 'Monthly Site Visits') {
      const avg = parseFloat((glossReadings.reduce((a,b)=>a+b, 0) / glossReadings.length).toFixed(2));
      newVisitObj.area = glossArea;
      newVisitObj.subArea = glossSubArea;
      newVisitObj.readings = glossReadings;
      newVisitObj.avgReading = avg;
      newVisitObj.remarks = remarks || `Gloss level measured. Average: ${avg}`;
    } else if (visitType.includes('On Demand')) {
      newVisitObj.reason = issueDesc || 'Client requested urgent visit.';
      newVisitObj.actions = actionTaken || 'Checked site conditions.';
      newVisitObj.resolution = resolution || 'Issue addressed.';
      newVisitObj.notes = remarks;
      newVisitObj.rating = 0; // rating will be filled by worker or client
    } else {
      newVisitObj.notes = remarks || 'General work executed.';
    }

    const updatedVisits = [newVisitObj, ...visits];
    saveVisits(updatedVisits);
    setVisits(updatedVisits);

    // If this was an incoming request, update request status to Completed
    if (activeRequestObj) {
      const updatedReqs = requests.map(r => r.id === activeRequestObj.id ? { ...r, status: 'Completed' } : r);
      saveVisitRequests(updatedReqs);
      setRequests(updatedReqs);
      addNotification(activeRequestObj.requestedByMobile, activeRequestObj.requestedBy, `Your supervisor visit request has been COMPLETED. You can now view the visit report and rate the visit.`);
    }

    // Notify administrators
    addNotification('8830227359', 'Admin', `Supervisor ${user?.name} completed a ${visitType} visit report for client ${visitClient}.`);

    setActiveVisit(null);
    setShowCheckInModal(false);
    alert('Visit checked out successfully! Visit report has been logged.');
  };

  const handleAcceptRequest = (reqId) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'Accepted' } : r);
    saveVisitRequests(updated);
    setRequests(updated);
    
    const req = requests.find(r => r.id === reqId);
    if (req) {
      addNotification(req.requestedByMobile, req.requestedBy, `Your visit request for ${req.type} has been ACCEPTED by Supervisor.`);
    }
  };

  const handleRejectRequest = (reqId) => {
    const updated = requests.map(r => r.id === reqId ? { ...r, status: 'Rejected' } : r);
    saveVisitRequests(updated);
    setRequests(updated);

    const req = requests.find(r => r.id === reqId);
    if (req) {
      addNotification(req.requestedByMobile, req.requestedBy, `Your visit request for ${req.type} has been REJECTED by Supervisor.`);
    }
  };

  // Export functions
  const exportVisitsCSV = () => {
    const headers = ['Date', 'Client', 'Supervisor', 'Type', 'Check In', 'Check Out', 'Duration (Hrs)', 'Status', 'Details'];
    const rows = visits.map(v => [
      v.date,
      v.client,
      v.supervisor,
      v.type,
      v.checkIn,
      v.checkOut,
      v.duration,
      v.status,
      v.type === 'Property Round' ? `${v.rounds?.length || 0} areas inspected` : v.type === 'Monthly Site Visits' ? `Avg Gloss: ${v.avgReading}` : v.notes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "supervisor_visits_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [expandedVisitId, setExpandedVisitId] = useState(null);

  // Compute analytics
  const completedCount = visits.filter(v => v.status === 'Completed').length;
  const ratingVisits = visits.filter(v => v.rating && v.rating > 0);
  const avgRating = ratingVisits.length > 0 ? (ratingVisits.reduce((sum, v) => sum + v.rating, 0) / ratingVisits.length).toFixed(1) : 'N/A';
  const glossVisits = visits.filter(v => v.type === 'Monthly Site Visits' && v.avgReading > 0);
  const avgGloss = glossVisits.length > 0 ? (glossVisits.reduce((sum, v) => sum + v.avgReading, 0) / glossVisits.length).toFixed(1) : 'N/A';

  return (
    <div className="mgt-view-container">
      {/* Header */}
      <div className="mgt-header">
        <div>
          <h1 className="mgt-title">
            <span style={{ cursor: 'pointer', color: '#64748B' }} onClick={onBack}>Services & Reports &rsaquo; </span>
            Supervisor Visits
          </h1>
          <p className="mgt-subtitle">Record rounds, gloss readings, client demands, and track visit history.</p>
        </div>
        {role === 'supervisor' && !activeVisit && (
          <button className="mgt-btn primary" onClick={() => { setVisitClient('Acme Corp'); setVisitType('Property Round'); setShowCheckInModal(true); }}>
            ➕ Start Supervisor Visit
          </button>
        )}
      </div>

      {/* Active Visit Panel */}
      {activeVisit && (
        <div className="mgt-results-card" style={{ border: '2px solid #10B981', marginBottom: 24 }}>
          <div className="mgt-results-header" style={{ background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', padding: '16px 20px' }}>
            <h3 className="mgt-results-title" style={{ color: '#047857' }}>🟢 Supervisor Visit In Progress</h3>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#047857' }}>
              ⏱️ Elapsed: {Math.floor(activeVisit.elapsed / 60)}m {activeVisit.elapsed % 60}s
            </span>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 15, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', fontWeight: 600 }}>Client Property</span>
                <strong style={{ fontSize: 15 }}>{visitClient}</strong>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', fontWeight: 600 }}>Visit Purpose</span>
                <strong style={{ fontSize: 15 }}>{visitType}</strong>
              </div>
              <div>
                <span style={{ fontSize: 12, color: '#64748B', display: 'block', fontWeight: 600 }}>Check-In Time</span>
                <strong style={{ fontSize: 15 }}>{activeVisit.checkInTime}</strong>
              </div>
            </div>

            {/* PURPOSE FIELDS */}
            {visitType === 'Property Round' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 800, display: 'block', marginBottom: 12 }}>Property Inspection Checklist Rounds</span>
                {roundAreas.map((ra, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                    <input 
                      type="text" 
                      className="mgt-input" 
                      placeholder="Area (e.g. Lobby)" 
                      value={ra.area} 
                      onChange={e => {
                        const updated = [...roundAreas];
                        updated[idx].area = e.target.value;
                        setRoundAreas(updated);
                      }} 
                      style={{ flex: 1, minWidth: 150 }}
                    />
                    <input 
                      type="text" 
                      className="mgt-input" 
                      placeholder="Inspector description/notes" 
                      value={ra.desc} 
                      onChange={e => {
                        const updated = [...roundAreas];
                        updated[idx].desc = e.target.value;
                        setRoundAreas(updated);
                      }} 
                      style={{ flex: 2, minWidth: 200 }}
                    />
                    <select 
                      className="mgt-select" 
                      value={ra.condition} 
                      onChange={e => {
                        const updated = [...roundAreas];
                        updated[idx].condition = e.target.value;
                        setRoundAreas(updated);
                      }}
                      style={{ width: 120 }}
                    >
                      <option value="Good">🟢 Good</option>
                      <option value="Average">🟡 Average</option>
                      <option value="Poor">🔴 Poor</option>
                    </select>
                    {roundAreas.length > 1 && (
                      <button type="button" style={{ border: 'none', background: '#FEE2E2', color: '#EF4444', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }} onClick={() => handleRemoveRoundRow(idx)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className="mgt-btn secondary" onClick={handleAddRoundRow}>➕ Add Area</button>
              </div>
            )}

            {visitType === 'Monthly Site Visits' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 800, display: 'block', marginBottom: 12 }}>Monthly Site Inspection - Gloss Level Readings</span>
                
                {/* Date restriction check */}
                {!(new Date().getDate() >= 20 && new Date().getDate() <= 30) && (
                  <div style={{ border: '1px solid #FEF08A', background: '#FEFCE8', color: '#854D0E', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
                    ⚠️ Warning: Monthly site inspections are scheduled between 20th and 30th of the month.
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Inspection Area</label>
                    <input type="text" className="mgt-input" placeholder="e.g. Block A" value={glossArea} onChange={e => setGlossArea(e.target.value)} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Sub-Area / Floor</label>
                    <input type="text" className="mgt-input" placeholder="e.g. Reception Desk" value={glossSubArea} onChange={e => setGlossSubArea(e.target.value)} style={{ width: '100%' }} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Gloss Meter readings (Units: GU)</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    {glossReadings.map((r, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 4 }} key={idx}>
                        <input 
                          type="number" 
                          className="mgt-input" 
                          value={r} 
                          onChange={e => handleReadingChange(idx, e.target.value)} 
                          style={{ width: 70, textAlign: 'center' }} 
                        />
                        {glossReadings.length > 2 && (
                          <button type="button" style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: 12 }} onClick={() => handleRemoveReading(idx)}>×</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="mgt-btn secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={handleAddReading}>➕ Add Reading</button>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginTop: 8 }}>
                    📊 Average Gloss Level: {(glossReadings.reduce((a,b)=>a+b,0)/glossReadings.length).toFixed(2)} GU
                  </div>
                </div>
              </div>
            )}

            {visitType.includes('On Demand') && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, marginBottom: 20 }}>
                <span style={{ fontSize: 13, fontWeight: 800, display: 'block', marginBottom: 12 }}>On-Demand Visit Details</span>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Reason for Visit / Issue Reported</label>
                  <input type="text" className="mgt-input" placeholder="Type reason or problem description..." value={issueDesc} onChange={e => setIssueDesc(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Actions Taken</label>
                  <input type="text" className="mgt-input" placeholder="Type what checkups/cleaning was done..." value={actionTaken} onChange={e => setActionTaken(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#475569', marginBottom: 4 }}>Final Resolution Status</label>
                  <input type="text" className="mgt-input" placeholder="Type resolution details..." value={resolution} onChange={e => setResolution(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>General Remarks / Report Summary</label>
              <textarea className="mgt-input" placeholder="Type visit logs notes here..." value={remarks} onChange={e => setRemarks(e.target.value)} style={{ width: '100%', height: 70, resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="mgt-btn secondary" onClick={() => { if(confirm('Cancel check-in? Active visit logs will not be saved.')) setActiveVisit(null); }}>Discard</button>
              <button className="mgt-btn primary" style={{ background: '#10B981', color: '#FFF', border: 'none' }} onClick={handleCompleteCheckOut}>
                🏁 Complete Visit & Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="mgt-analytics-card" style={{ marginBottom: 24 }}>
        <div className="mgt-analytics-header">
          <span>📊 Supervisor Inspection & Visits Analytics Overview</span>
        </div>
        <div className="mgt-analytics-body">
          <div className="mgt-stats-row">
            <div className="mgt-stat-item">
              <div className="mgt-stat-val" style={{ color: '#3B82F6' }}>{completedCount}</div>
              <div className="mgt-stat-lbl">Completed Visits</div>
            </div>
            <div className="mgt-stat-item">
              <div className="mgt-stat-val" style={{ color: '#F59E0B' }}>⭐ {avgRating}</div>
              <div className="mgt-stat-lbl">Avg Client Rating</div>
            </div>
            <div className="mgt-stat-item">
              <div className="mgt-stat-val" style={{ color: '#10B981' }}>{avgGloss} GU</div>
              <div className="mgt-stat-lbl">Avg. Gloss Level</div>
            </div>
            <div className="mgt-stat-item">
              <div className="mgt-stat-val">{requests.filter(r => r.status === 'Pending').length}</div>
              <div className="mgt-stat-lbl">Pending Demands</div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Check-in Selection Modal */}
      {role === 'supervisor' && !activeVisit && showCheckInModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 450, padding: 24, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 0, marginBottom: 16 }}>🛡️ Start New Supervisor Visit Check-in</h3>
            
            {/* Mock QR Scanner Display */}
            <div style={{ border: '2px dashed #10B981', background: '#F0FDF4', borderRadius: 12, padding: 16, textAlign: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 40 }}>📷</span>
              <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#047857', marginTop: 6 }}>Mock Camera Feed Scanning Property QR</span>
              <span style={{ fontSize: 11, color: '#64748B' }}>Point camera at the property wall QR code</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Select Property (Or manual override)</label>
              <select className="mgt-select" value={visitClient} onChange={e => setVisitClient(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}>
                {allowedClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Visit Purpose Type</label>
              <select className="mgt-select" value={visitType} onChange={e => setVisitType(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: 8 }}>
                <option value="Property Round">Property Round (Inspection Checklist)</option>
                <option value="Monthly Site Visits">Monthly Site Visits (Gloss Readings)</option>
                <option value="On Demand by Client">On Demand by Client</option>
                <option value="On Demand by Workers">On Demand by Workers</option>
                <option value="On Demand by Admin">On Demand by Admin</option>
                <option value="To Do Work">To Do Work</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button className="mgt-btn secondary" onClick={() => setShowCheckInModal(false)}>Cancel</button>
              <button className="mgt-btn primary" onClick={() => { setShowCheckInModal(false); handleStartCheckIn(visitClient, visitType); }}>
                Check-in Property
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visit Requests Queue */}
      {requests.filter(r => r.status === 'Pending' || r.status === 'Accepted').length > 0 && (
        <div className="mgt-results-card" style={{ marginBottom: 24, border: '1px solid #BFDBFE' }}>
          <div className="mgt-results-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <h3 className="mgt-results-title">📥 Incoming Visit Requests ({requests.filter(r => r.status === 'Pending' || r.status === 'Accepted').length})</h3>
          </div>
          <div className="mgt-table-wrapper">
            <table className="mgt-table">
              <thead>
                <tr>
                  <th>Requested By</th>
                  <th>Client Property</th>
                  <th>Visit Type</th>
                  <th>Reason Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.filter(r => r.status === 'Pending' || r.status === 'Accepted').map(r => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.requestedBy}</strong><br/>
                      <span style={{ fontSize: 10, color: '#64748B' }}>Role: {r.role}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.client}</td>
                    <td>{r.type}</td>
                    <td style={{ fontSize: 12, color: '#475569', maxWidth: 200 }}>{r.reason}</td>
                    <td>
                      <span className={`mgt-badge ${r.status === 'Accepted' ? 'in-progress' : 'pending'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'Pending' && (
                          <>
                            <button className="mgt-btn" style={{ padding: '4px 8px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: 11 }} onClick={() => handleAcceptRequest(r.id)}>Accept</button>
                            <button className="mgt-btn" style={{ padding: '4px 8px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', fontSize: 11 }} onClick={() => handleRejectRequest(r.id)}>Reject</button>
                          </>
                        )}
                        {role === 'supervisor' && !activeVisit && (
                          <button className="mgt-btn primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleStartCheckIn(r.client, r.type, r)}>
                            🏁 Start Visit
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Logs List */}
      <div className="mgt-results-card">
        <div className="mgt-results-header">
          <h3 className="mgt-results-title">📜 Historical Visit Logs Report ({visits.length})</h3>
          <button className="mgt-btn" onClick={exportVisitsCSV}>Export CSV</button>
        </div>
        <div className="mgt-table-wrapper">
          <table className="mgt-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client Property</th>
                <th>Supervisor</th>
                <th>Visit Purpose</th>
                <th>Check In/Out</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {visits.map(v => (
                <React.Fragment key={v.id}>
                  <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedVisitId(expandedVisitId === v.id ? null : v.id)}>
                    <td style={{ fontWeight: 700 }}>{v.date}</td>
                    <td style={{ fontWeight: 600 }}>{v.client}</td>
                    <td>{v.supervisor}</td>
                    <td>{v.type}</td>
                    <td>{v.checkIn} - {v.checkOut}</td>
                    <td>{v.duration} hrs</td>
                    <td><span className="mgt-badge completed">{v.status}</span></td>
                    <td style={{ color: '#3B82F6', fontWeight: 700 }}>
                      {expandedVisitId === v.id ? 'Hide Details ▲' : 'Show Details ▼'}
                    </td>
                  </tr>

                  {expandedVisitId === v.id && (
                    <tr>
                      <td colSpan={8} style={{ background: '#F8FAFC', padding: 20, borderTop: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* Location GPS */}
                          <div>
                            <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>GPS COORDINATES</span>
                            <span style={{ fontSize: 13, color: '#334155' }}>📍 {v.location}</span>
                          </div>

                          {/* Property Rounds list */}
                          {v.rounds && (
                            <div>
                              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600, marginBottom: 6 }}>ROUNDS INSPECTION LIST</span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {v.rounds.map((ra, idx) => (
                                  <div key={idx} style={{ display: 'flex', gap: 15, background: '#FFFFFF', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0', fontSize: 12 }}>
                                    <strong style={{ width: 120 }}>{ra.area}</strong>
                                    <span style={{ flex: 1 }}>{ra.desc || 'No description'}</span>
                                    <span style={{ color: ra.condition === 'Good' ? '#10B981' : ra.condition === 'Average' ? '#F59E0B' : '#EF4444', fontWeight: 700 }}>
                                      {ra.condition === 'Good' ? '🟢 Good' : ra.condition === 'Average' ? '🟡 Average' : '🔴 Poor'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Gloss readings */}
                          {v.readings && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>INSPECTED AREA</span>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{v.area} / {v.subArea}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>GLOSS READINGS (GU)</span>
                                <span style={{ fontSize: 13 }}>{v.readings.join(', ')} (Average: <strong>{v.avgReading} GU</strong>)</span>
                              </div>
                            </div>
                          )}

                          {/* Demand reasons & resolution */}
                          {v.reason && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 15 }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>ISSUE DESCRIPTION</span>
                                <span style={{ fontSize: 12 }}>{v.reason}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>ACTIONS TAKEN</span>
                                <span style={{ fontSize: 12 }}>{v.actions}</span>
                              </div>
                              <div>
                                <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>RESOLUTION STATUS</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>{v.resolution}</span>
                              </div>
                            </div>
                          )}

                          {/* Remarks */}
                          {v.notes && (
                            <div>
                              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>GENERAL NOTES</span>
                              <span style={{ fontSize: 12, color: '#334155' }}>{v.notes}</span>
                            </div>
                          )}

                          {/* Feedback / Rating */}
                          {v.rating > 0 ? (
                            <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                              <span style={{ fontSize: 11, color: '#64748B', display: 'block', fontWeight: 600 }}>CLIENT / WORKER FEEDBACK</span>
                              <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700 }}>★ {v.rating} / 5 Stars</span>
                              {v.feedback && <span style={{ fontSize: 12, color: '#475569', marginLeft: 10 }}>- "{v.feedback}"</span>}
                            </div>
                          ) : (
                            v.type.includes('On Demand') && (
                              <div style={{ borderTop: '1px dashed #CBD5E1', paddingTop: 8, fontSize: 11, color: '#64748B', fontStyle: 'italic' }}>
                                Waiting for client / worker rating & feedback.
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
