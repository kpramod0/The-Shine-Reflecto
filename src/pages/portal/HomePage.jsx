import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  DirectorySection,
  AssignedDutySection,
  TodaysTasksSection,
  RoasterTaskSection,
  AnalysisSection,
  RequestsSection,
  AttendanceScannerButton
} from '../../components/portal/home/HomeSections';
import '../../components/portal/home/Home.css';

// Mock Data as provided
const mockAssignedDuty = {
  propertyName: "123 Main Street",
  shift: "Night Shift",
  clientName: "Acme Corp",
  location: "Hinjawadi Pune Maharashtra"
};

const mockClientAssignedWorkers = [
  {
    workerName: "Ramesh Kumar",
    phone: "9155361733",
    shift: "Day Shift",
    propertyName: "Xion Mall, Hinjawadi",
    location: "Xion Mall Hinjawadi Pune Maharashtra",
    status: "On Duty"
  },
  {
    workerName: "Suresh Patil",
    phone: "9876543210",
    shift: "Night Shift",
    propertyName: "Xion Mall, Hinjawadi",
    location: "Xion Mall Hinjawadi Pune Maharashtra",
    status: "Assigned"
  }
];

const mockDirectoryData = {
  activeUsers: 247,
  activeClients: 38,
  fieldWorkers: 189
};

const mockTodaysTasks = {
  assignedTasks: {
    count: 3,
    deadline: "Today",
    priority: "High"
  },
  pendingTasks: {
    count: 2,
    deadline: "Today",
    priority: "Medium"
  }
};

const permissions = {
  Worker: {
    showDirectory: false,
    showAssignedDuty: true,
    showTodayTasks: true,
    showRoasterTask: false,
    showAnalysis: false,
    showRequests: false,
    showAttendanceScanner: true
  },
  Supervisor: {
    showDirectory: true,
    showAssignedDuty: true,
    showTodayTasks: true,
    showRoasterTask: true,
    showAnalysis: true,
    showRequests: true,
    showAttendanceScanner: true
  },
  Client: {
    showDirectory: false,
    showAssignedDuty: true,
    showTodayTasks: true,
    showRoasterTask: false,
    showAnalysis: false,
    showRequests: false,
    showAttendanceScanner: false
  }
};

export default function HomePage() {
  const { user } = useAuth();
  // Role mapping logic, fallback to 'Worker' if unknown
  const role = user?.role === 'supervisor' ? 'Supervisor' : 
               user?.role === 'client' ? 'Client' : 'Worker';

  const userPerms = permissions[role] || permissions['Worker'];

  const handleScannerClick = () => {
    alert("Attendance Scanner opened");
  };

  return (
    <div className="home-page">
      {userPerms.showDirectory && (
        <DirectorySection data={mockDirectoryData} />
      )}

      {userPerms.showAssignedDuty && (
        <AssignedDutySection 
          assignedDuty={mockAssignedDuty} 
          clientWorkers={mockClientAssignedWorkers} 
          role={role} 
        />
      )}

      {userPerms.showTodayTasks && (
        <TodaysTasksSection tasks={mockTodaysTasks} />
      )}

      {userPerms.showRoasterTask && (
        <RoasterTaskSection />
      )}

      {userPerms.showAnalysis && (
        <AnalysisSection />
      )}

      {userPerms.showRequests && (
        <RequestsSection requests={[]} />
      )}

      {userPerms.showAttendanceScanner && (
        <AttendanceScannerButton onClick={handleScannerClick} />
      )}
    </div>
  );
}
