import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HospitalDashboard } from './components/dashboard/HospitalDashboard';
import { PatientList } from './components/patients/PatientList';
import { TriageWizard } from './components/triage/TriageWizard';
import { AppointmentCalendar } from './components/appointments/AppointmentCalendar';
import { WaitingRoomDisplay } from './components/queue/WaitingRoomDisplay';
import { PrescriptionList } from './components/prescriptions/PrescriptionList';
import { StockList } from './components/inventory/StockList';
import { EquipmentList } from './components/equipment/EquipmentList';
import { BedBoard } from './components/beds/BedBoard';
import { VisitorLogView } from './components/visitors/VisitorLog';
import { AttendanceScanner } from './components/attendance/AttendanceScanner';
import { KioskSurvey } from './components/satisfaction/KioskSurvey';
import { RoomScheduler } from './components/rooms/RoomScheduler';
import { MedicalCalculators } from './components/calculators/MedicalCalculators';
import { MedicalDirectory } from './components/directory/MedicalDirectory';

const MainContent: React.FC = () => {
  const { activeModule } = useHospital();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <HospitalDashboard />;
      case 'patients':
        return <PatientList />;
      case 'triage':
        return <TriageWizard />;
      case 'appointments':
        return <AppointmentCalendar />;
      case 'queue':
        return <WaitingRoomDisplay />;
      case 'prescriptions':
        return <PrescriptionList />;
      case 'stock':
        return <StockList />;
      case 'equipment':
        return <EquipmentList />;
      case 'beds':
        return <BedBoard />;
      case 'visitors':
        return <VisitorLogView />;
      case 'attendance':
        return <AttendanceScanner />;
      case 'surveys':
        return <KioskSurvey />;
      case 'rooms':
        return <RoomScheduler />;
      case 'calculators':
        return <MedicalCalculators />;
      case 'directory':
        return <MedicalDirectory />;
      default:
        return <HospitalDashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar navigation */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main app area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderModule()}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <HospitalProvider>
      <MainContent />
    </HospitalProvider>
  );
}

export default App;
