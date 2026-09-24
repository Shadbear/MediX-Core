/* =========================================================================
   MediX-Core · Esquema SQL Server
   Ejecuta este script una vez tengas tu instancia de SQL Server disponible
   (SSMS, Azure Data Studio, sqlcmd, etc). Crea la base de datos y todas
   las tablas que reemplazan a src/data/initialData.ts.
   ========================================================================= */

IF DB_ID('MediXCore') IS NULL
BEGIN
    CREATE DATABASE MediXCore;
END
GO

USE MediXCore;
GO

/* ---------------------------- Pacientes -------------------------------- */
CREATE TABLE Patients (
    Id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Dni                 NVARCHAR(20) NOT NULL UNIQUE,
    MedicalRecordNumber NVARCHAR(30) NOT NULL UNIQUE,
    FirstName           NVARCHAR(100) NOT NULL,
    LastName            NVARCHAR(100) NOT NULL,
    BirthDate           DATE NOT NULL,
    Gender              NVARCHAR(10) NOT NULL,
    Phone               NVARCHAR(30) NOT NULL,
    Email               NVARCHAR(150) NULL,
    Address             NVARCHAR(250) NOT NULL,
    InsuranceType       NVARCHAR(30) NOT NULL,
    BloodType           NVARCHAR(5) NOT NULL,
    Allergies           NVARCHAR(MAX) NULL,          -- JSON array de strings
    ChronicConditions   NVARCHAR(MAX) NULL,          -- JSON array de strings
    EmergencyContactName NVARCHAR(150) NULL,
    EmergencyContactPhone NVARCHAR(30) NULL,
    EmergencyContactRelationship NVARCHAR(50) NULL,
    Status              NVARCHAR(30) NOT NULL DEFAULT 'Activo',
    CreatedAt           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE ClinicalEntries (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId     UNIQUEIDENTIFIER NOT NULL REFERENCES Patients(Id) ON DELETE CASCADE,
    EntryDate     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    DoctorName    NVARCHAR(150) NOT NULL,
    Specialty     NVARCHAR(100) NOT NULL,
    Symptoms      NVARCHAR(MAX) NOT NULL,
    Diagnosis     NVARCHAR(MAX) NOT NULL,
    Cie10Code     NVARCHAR(10) NULL,
    BloodPressure NVARCHAR(10) NULL,
    HeartRate     INT NULL,
    RespiratoryRate INT NULL,
    Temperature   DECIMAL(4,1) NULL,
    OxygenSaturation INT NULL,
    Weight        DECIMAL(5,2) NULL,
    Height        DECIMAL(5,2) NULL,
    PainLevel     INT NULL,
    Treatment     NVARCHAR(MAX) NOT NULL,
    Notes         NVARCHAR(MAX) NULL
);
GO

/* ---------------------------- Personal ---------------------------------- */
CREATE TABLE Staff (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name           NVARCHAR(150) NOT NULL,
    Dni            NVARCHAR(20) NOT NULL UNIQUE,
    Cmp            NVARCHAR(20) NULL,
    Role           NVARCHAR(50) NOT NULL,
    Specialty      NVARCHAR(100) NULL,
    Department     NVARCHAR(100) NOT NULL,
    Extension      NVARCHAR(10) NULL,
    Phone          NVARCHAR(30) NOT NULL,
    Email          NVARCHAR(150) NOT NULL,
    BadgeCode      NVARCHAR(30) NOT NULL UNIQUE,
    ConsultingRoom NVARCHAR(30) NULL,
    Schedule       NVARCHAR(100) NULL,
    CurrentShift   NVARCHAR(30) NOT NULL,
    Available      BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE StaffAttendance (
    Id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    StaffId    UNIQUEIDENTIFIER NOT NULL REFERENCES Staff(Id),
    Date       DATE NOT NULL,
    CheckIn    TIME NULL,
    BreakStart TIME NULL,
    BreakEnd   TIME NULL,
    CheckOut   TIME NULL,
    Status     NVARCHAR(30) NOT NULL
);
GO

/* ---------------------------- Citas y cola ------------------------------ */
CREATE TABLE Appointments (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TicketNumber   NVARCHAR(20) NOT NULL,
    PatientId      UNIQUEIDENTIFIER NOT NULL REFERENCES Patients(Id),
    DoctorId       UNIQUEIDENTIFIER NULL REFERENCES Staff(Id),
    Specialty      NVARCHAR(100) NOT NULL,
    ConsultingRoom NVARCHAR(30) NULL,
    AppointmentDate DATE NOT NULL,
    AppointmentTime TIME NOT NULL,
    AppointmentType NVARCHAR(50) NOT NULL,
    Status         NVARCHAR(30) NOT NULL DEFAULT 'Pendiente',
    Reason         NVARCHAR(MAX) NULL,
    Notes          NVARCHAR(MAX) NULL
);
GO

CREATE TABLE QueueCalls (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Ticket         NVARCHAR(20) NOT NULL,
    PatientName    NVARCHAR(200) NOT NULL,
    ConsultingRoom NVARCHAR(30) NOT NULL,
    DoctorName     NVARCHAR(150) NOT NULL,
    Specialty      NVARCHAR(100) NOT NULL,
    Timestamp      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Status         NVARCHAR(20) NOT NULL,
    CallCount      INT NOT NULL DEFAULT 1
);
GO

/* ---------------------------- Triaje ------------------------------------ */
CREATE TABLE TriageAssessments (
    Id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientId         UNIQUEIDENTIFIER NULL REFERENCES Patients(Id),
    PatientName       NVARCHAR(200) NOT NULL,
    PatientDni        NVARCHAR(20) NOT NULL,
    Age               INT NOT NULL,
    Gender            NVARCHAR(10) NOT NULL,
    ChiefComplaint    NVARCHAR(MAX) NOT NULL,
    Symptoms          NVARCHAR(MAX) NULL,           -- JSON array
    BloodPressure     NVARCHAR(10) NULL,
    HeartRate         INT NULL,
    RespiratoryRate   INT NULL,
    Temperature       DECIMAL(4,1) NULL,
    OxygenSaturation  INT NULL,
    PriorityLevel     TINYINT NOT NULL,
    PriorityName      NVARCHAR(50) NOT NULL,
    TargetWaitTime    NVARCHAR(30) NULL,
    RecommendedArea   NVARCHAR(50) NOT NULL,
    RecommendationText NVARCHAR(MAX) NULL,
    Status            NVARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    Timestamp         DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------- Recetas ------------------------------------ */
CREATE TABLE Prescriptions (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code          NVARCHAR(30) NOT NULL UNIQUE,
    PatientId     UNIQUEIDENTIFIER NOT NULL REFERENCES Patients(Id),
    DoctorId      UNIQUEIDENTIFIER NULL REFERENCES Staff(Id),
    DoctorCmp     NVARCHAR(20) NULL,
    Specialty     NVARCHAR(100) NOT NULL,
    PrescriptionDate DATE NOT NULL,
    Diagnosis     NVARCHAR(MAX) NOT NULL,
    GeneralRecommendations NVARCHAR(MAX) NULL,
    ValidUntil    DATE NOT NULL
);
GO

CREATE TABLE PrescriptionMedications (
    Id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PrescriptionId   UNIQUEIDENTIFIER NOT NULL REFERENCES Prescriptions(Id) ON DELETE CASCADE,
    Name             NVARCHAR(150) NOT NULL,
    Concentration    NVARCHAR(50) NULL,
    Form             NVARCHAR(30) NOT NULL,
    Dose             NVARCHAR(50) NOT NULL,
    FrequencyHours   INT NOT NULL,
    DurationDays     INT NOT NULL,
    Instructions     NVARCHAR(MAX) NULL,
    CalculatedTimes  NVARCHAR(MAX) NULL             -- JSON array
);
GO

/* ---------------------------- Inventario --------------------------------- */
CREATE TABLE StockItems (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code           NVARCHAR(30) NOT NULL UNIQUE,
    Name           NVARCHAR(150) NOT NULL,
    Category       NVARCHAR(50) NOT NULL,
    Presentation   NVARCHAR(100) NULL,
    CurrentStock   INT NOT NULL DEFAULT 0,
    MinStock       INT NOT NULL DEFAULT 0,
    MaxStock       INT NOT NULL DEFAULT 0,
    UnitCost       DECIMAL(10,2) NOT NULL DEFAULT 0,
    Location       NVARCHAR(100) NULL,
    ExpirationDate DATE NULL,
    BatchNumber    NVARCHAR(50) NULL,
    Status         NVARCHAR(30) NOT NULL DEFAULT 'Óptimo'
);
GO

CREATE TABLE StockMovements (
    Id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ItemId              UNIQUEIDENTIFIER NOT NULL REFERENCES StockItems(Id) ON DELETE CASCADE,
    MovementType        NVARCHAR(50) NOT NULL,
    Quantity            INT NOT NULL,
    PreviousStock       INT NOT NULL,
    NewStock            INT NOT NULL,
    DestinationOrOrigin NVARCHAR(150) NULL,
    Responsible         NVARCHAR(150) NULL,
    Timestamp           DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    Reason              NVARCHAR(MAX) NULL
);
GO

/* ---------------------------- Equipos médicos ---------------------------- */
CREATE TABLE MedicalEquipment (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Code            NVARCHAR(30) NOT NULL UNIQUE,
    Name            NVARCHAR(150) NOT NULL,
    Brand           NVARCHAR(100) NULL,
    Model           NVARCHAR(100) NULL,
    SerialNumber    NVARCHAR(100) NULL,
    Category        NVARCHAR(50) NOT NULL,
    CurrentArea     NVARCHAR(100) NULL,
    AssignedDoctor  NVARCHAR(150) NULL,
    Status          NVARCHAR(30) NOT NULL,
    LastMaintenance DATE NULL,
    NextMaintenance DATE NULL,
    QrCodeData      NVARCHAR(MAX) NULL
);
GO

/* ---------------------------- Camas --------------------------------------- */
CREATE TABLE HospitalBeds (
    Id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    BedNumber      NVARCHAR(20) NOT NULL UNIQUE,
    Ward           NVARCHAR(50) NOT NULL,
    Floor          NVARCHAR(10) NULL,
    BedType        NVARCHAR(50) NOT NULL,
    Status         NVARCHAR(30) NOT NULL DEFAULT 'Libre',
    PatientId      UNIQUEIDENTIFIER NULL REFERENCES Patients(Id),
    AdmissionDate  DATETIME2 NULL,
    DoctorInCharge NVARCHAR(150) NULL,
    Diagnosis      NVARCHAR(MAX) NULL,
    Notes          NVARCHAR(MAX) NULL
);
GO

/* ---------------------------- Visitas -------------------------------------- */
CREATE TABLE VisitorLogs (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    VisitorDni    NVARCHAR(20) NOT NULL,
    VisitorName   NVARCHAR(150) NOT NULL,
    VisitorPhone  NVARCHAR(30) NULL,
    Relationship  NVARCHAR(50) NULL,
    PatientId     UNIQUEIDENTIFIER NOT NULL REFERENCES Patients(Id),
    BedNumber     NVARCHAR(20) NULL,
    Ward          NVARCHAR(50) NULL,
    EntryTime     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ExitTime      DATETIME2 NULL,
    SecurityGuard NVARCHAR(150) NULL,
    Status        NVARCHAR(30) NOT NULL DEFAULT 'En Hospital',
    PassCode      NVARCHAR(20) NULL
);
GO

/* ---------------------------- Encuestas ------------------------------------ */
CREATE TABLE SatisfactionSurveys (
    Id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PatientName           NVARCHAR(200) NULL,
    ServiceRated          NVARCHAR(50) NOT NULL,
    OverallRating         TINYINT NOT NULL,
    WaitDurationRating    TINYINT NOT NULL,
    MedicalCareRating     TINYINT NOT NULL,
    CleanlinessRating     TINYINT NOT NULL,
    PharmacyCareRating    TINYINT NOT NULL,
    RecommendHospital     BIT NOT NULL,
    Comments              NVARCHAR(MAX) NULL,
    Timestamp             DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

/* ---------------------------- Salas / quirófanos --------------------------- */
CREATE TABLE RoomBookings (
    Id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    RoomName           NVARCHAR(100) NOT NULL,
    RoomType           NVARCHAR(50) NOT NULL,
    DoctorId           UNIQUEIDENTIFIER NULL REFERENCES Staff(Id),
    Specialty          NVARCHAR(100) NULL,
    ProcedureName      NVARCHAR(150) NOT NULL,
    PatientName        NVARCHAR(200) NULL,
    PatientDni         NVARCHAR(20) NULL,
    BookingDate        DATE NOT NULL,
    StartTime          TIME NOT NULL,
    EndTime            TIME NOT NULL,
    Anesthesiologist   NVARCHAR(150) NULL,
    NursingStaff       NVARCHAR(150) NULL,
    Status             NVARCHAR(30) NOT NULL DEFAULT 'Confirmada',
    EquipmentRequired  NVARCHAR(MAX) NULL             -- JSON array
);
GO

/* ---------------------------- Índices recomendados -------------------------- */
CREATE INDEX IX_Appointments_Date ON Appointments(AppointmentDate);
CREATE INDEX IX_ClinicalEntries_PatientId ON ClinicalEntries(PatientId);
CREATE INDEX IX_StockMovements_ItemId ON StockMovements(ItemId);
CREATE INDEX IX_HospitalBeds_Status ON HospitalBeds(Status);
GO
