import { useEffect, useMemo, useState } from 'react';
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
import { listUsers, toDirectoryUser } from '../../services/usersApi';
import { listRosters as listApiRosters, scanAttendance } from '../../services/operationsApi';
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
  const [apiUsers, setApiUsers] = useState([]);
  const [apiRosters, setApiRosters] = useState([]);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        const users = await listUsers();
        const rosters = await listApiRosters(users);
        if (!cancelled) {
          setApiUsers(users);
          setApiRosters(rosters);
          setApiError('');
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(error.status === 403
            ? 'Some dashboard API data is restricted for your account role. Showing local fallback data.'
            : error.message || 'Unable to sync home data.');
        }
      }
    }

    if (user) loadHomeData();
    return () => { cancelled = true; };
  }, [user]);

  // Role mapping logic, fallback to 'Worker' if unknown
  const role = user?.role === 'supervisor' ? 'Supervisor' : 
               user?.role === 'client' ? 'Client' : 'Worker';

  const userPerms = permissions[role] || permissions['Worker'];

  const directoryUsers = useMemo(() => apiUsers.map(toDirectoryUser), [apiUsers]);
  const liveDirectoryData = useMemo(() => {
    if (directoryUsers.length === 0) return mockDirectoryData;

    return {
      activeUsers: directoryUsers.filter(item => item.active).length,
      activeClients: directoryUsers.filter(item => item.role === 'Client' && item.active).length,
      fieldWorkers: directoryUsers.filter(item => item.role === 'Worker' && item.active).length,
    };
  }, [directoryUsers]);

  const liveAssignedDuty = useMemo(() => {
    if (apiRosters.length === 0) return mockAssignedDuty;

    const today = new Date().toISOString().split('T')[0];
    const match = apiRosters.find(roster => (
      roster.rosterDate === today
      && roster.workers.some(worker => worker.phone === user?.mobile || worker.apiId === user?.id)
    )) || apiRosters.find(roster => (
      roster.workers.some(worker => worker.phone === user?.mobile || worker.apiId === user?.id)
    )) || apiRosters[0];

    if (!match) return null;

    return {
      propertyName: match.clients[0],
      shift: `${match.shift} Shift`,
      clientName: match.clients[0],
      location: match.clients[0],
      clientId: match.clientId,
    };
  }, [apiRosters, user]);

  const liveClientWorkers = useMemo(() => {
    if (apiRosters.length === 0) return mockClientAssignedWorkers;

    return apiRosters.flatMap(roster => roster.workers.map(worker => ({
      workerName: worker.name,
      phone: worker.phone || '-',
      shift: `${roster.shift} Shift`,
      propertyName: roster.clients[0],
      location: roster.clients[0],
      status: 'Assigned',
    })));
  }, [apiRosters]);

  const handleScannerClick = async () => {
    if (!liveAssignedDuty?.clientId) {
      alert('No API client id found for this duty. Please sync roster data first.');
      return;
    }

    try {
      await scanAttendance(liveAssignedDuty.clientId);
      alert('Attendance scan recorded successfully.');
    } catch (error) {
      alert(error.message || 'Unable to record attendance scan.');
    }
  };

  return (
    <div className="home-page">
      {apiError && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#991B1B', fontSize: 13, fontWeight: 700 }}>
          {apiError}
        </div>
      )}
      {userPerms.showDirectory && (
        <DirectorySection data={liveDirectoryData} />
      )}

      {userPerms.showAssignedDuty && (
        <AssignedDutySection 
          assignedDuty={liveAssignedDuty} 
          clientWorkers={liveClientWorkers} 
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
