import React, { useState } from 'react';
import {
  Calculator,
  Activity,
  Flame,
  Brain,
  Baby,
  Stethoscope,
  Heart,
  Droplets,
} from 'lucide-react';
import {
  calculateBMI,
  calculateGFR,
  calculatePediatricDose,
  COMMON_PEDIATRIC_DRUGS,
  calculateParkland,
  evaluateGlasgow,
  evaluateAlvarado,
  calculateMAP,
} from '../../utils/calculators';

export const MedicalCalculators: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'bmi' | 'gfr' | 'pediatric' | 'parkland' | 'glasgow' | 'alvarado' | 'map'
  >('bmi');

  // 1. BMI state
  const [bmiWeight, setBmiWeight] = useState(70);
  const [bmiHeight, setBmiHeight] = useState(170);
  const bmiResult = calculateBMI(bmiWeight, bmiHeight);

  // 2. GFR state
  const [gfrAge, setGfrAge] = useState(55);
  const [gfrWeight, setGfrWeight] = useState(72);
  const [gfrCreatinine, setGfrCreatinine] = useState(1.1);
  const [gfrGender, setGfrGender] = useState<'M' | 'F'>('M');
  const gfrResult = calculateGFR(gfrAge, gfrWeight, gfrCreatinine, gfrGender);

  // 3. Pediatric state
  const [pedWeight, setPedWeight] = useState(15);
  const [selectedDrugIdx, setSelectedDrugIdx] = useState(0);
  const [selectedPresIdx, setSelectedPresIdx] = useState(0);
  const pedDrug = COMMON_PEDIATRIC_DRUGS[selectedDrugIdx];
  const pedResult = calculatePediatricDose(pedWeight, pedDrug, selectedPresIdx);

  // 4. Parkland state
  const [parklandWeight, setParklandWeight] = useState(70);
  const [burnPercent, setBurnPercent] = useState(25);
  const parklandResult = calculateParkland(parklandWeight, burnPercent);

  // 5. Glasgow state
  const [glasgowEye, setGlasgowEye] = useState(4);
  const [glasgowVerbal, setGlasgowVerbal] = useState(5);
  const [glasgowMotor, setGlasgowMotor] = useState(6);
  const glasgowResult = evaluateGlasgow(glasgowEye, glasgowVerbal, glasgowMotor);

  // 6. Alvarado state
  const [alvaradoCriteria, setAlvaradoCriteria] = useState({
    migratoryPain: true,
    anorexia: true,
    nauseaVomiting: false,
    rlqTenderness: true,
    reboundTenderness: false,
    elevatedTemp: true,
    leukocytosis: true,
    leftShift: false,
  });
  const alvaradoResult = evaluateAlvarado(alvaradoCriteria);

  // 7. PAM state
  const [pamSystolic, setPamSystolic] = useState(120);
  const [pamDiastolic, setPamDiastolic] = useState(80);
  const mapResult = calculateMAP(pamSystolic, pamDiastolic);

  const tabs = [
    { id: 'bmi', label: 'IMC y Sup. Corporal', icon: <Calculator className="w-4 h-4" /> },
    { id: 'gfr', label: 'Función Renal (TFG / CKD-EPI)', icon: <Droplets className="w-4 h-4" /> },
    { id: 'pediatric', label: 'Dosis Pediátricas x Peso', icon: <Baby className="w-4 h-4" /> },
    { id: 'parkland', label: 'Parkland (Quemaduras)', icon: <Flame className="w-4 h-4" /> },
    { id: 'glasgow', label: 'Escala de Glasgow', icon: <Brain className="w-4 h-4" /> },
    { id: 'alvarado', label: 'Score de Alvarado (Apendicitis)', icon: <Stethoscope className="w-4 h-4" /> },
    { id: 'map', label: 'Presión Arterial Media (PAM)', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Calculadoras Clínicas y Soporte Médico
            </h2>
            <p className="text-xs text-slate-500">
              Herramientas automatizadas para fórmulas médicas frecuentes y dosificación clínica
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as unknown as typeof activeTab)}
            className={`px-3 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-hospital-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Calculator Panels */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        {/* 1. BMI & Mosteller */}
        {activeTab === 'bmi' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Índice de Masa Corporal (IMC) y Superficie Corporal
              </h3>
              <p className="text-slate-500 text-xs">
                Clasificación de peso según la Organización Mundial de la Salud (OMS) y cálculo de Superficie Corporal (Fórmula de Mosteller).
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Peso del Paciente (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={bmiWeight}
                    onChange={(e) => setBmiWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Talla / Estatura (cm)</label>
                  <input
                    type="number"
                    value={bmiHeight}
                    onChange={(e) => setBmiHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-base"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Resultado de IMC</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {bmiResult.bmi} <span className="text-base text-slate-400 font-normal">kg/m²</span>
                </p>
                <span className={`inline-block px-3 py-1 rounded-full font-bold text-xs mt-2 ${bmiResult.categoryColor}`}>
                  {bmiResult.category}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between text-xs">
                <span className="text-slate-500">Superficie Corporal (Mosteller):</span>
                <span className="font-mono font-bold text-hospital-600">{bmiResult.bsa} m²</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. GFR CKD-EPI & Cockcroft */}
        {activeTab === 'gfr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tasa de Filtración Glomerular (CKD-EPI 2021 & Cockcroft-Gault)
              </h3>
              <p className="text-slate-500 text-xs">
                Evaluación de función renal para ajuste de fármacos y estadificación de Enfermedad Renal Crónica (ERC).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Edad (Años)</label>
                  <input
                    type="number"
                    value={gfrAge}
                    onChange={(e) => setGfrAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Sexo Biológico</label>
                  <select
                    value={gfrGender}
                    onChange={(e) => setGfrGender(e.target.value as 'M' | 'F')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-semibold"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    value={gfrWeight}
                    onChange={(e) => setGfrWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Creatinina Sérica (mg/dL)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gfrCreatinine}
                    onChange={(e) => setGfrCreatinine(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-hospital-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">CKD-EPI 2021</span>
                  <p className="text-2xl font-black font-mono text-hospital-600 mt-1">
                    {gfrResult.ckdEpi}
                  </p>
                  <span className="text-[10px] text-slate-400">ml/min/1.73m²</span>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Cockcroft-Gault</span>
                  <p className="text-2xl font-black font-mono text-slate-800 dark:text-slate-200 mt-1">
                    {gfrResult.cockcroftGault}
                  </p>
                  <span className="text-[10px] text-slate-400">ml/min</span>
                </div>
              </div>

              <div className="text-center pt-2">
                <span className={`inline-block px-3 py-1.5 rounded-xl font-bold text-xs ${gfrResult.riskColor}`}>
                  {gfrResult.stage} • {gfrResult.stageDescription}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Pediatric Dosage */}
        {activeTab === 'pediatric' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Calculadora de Dosis Pediátricas por Peso
              </h3>
              <p className="text-slate-500 text-xs">
                Cálculo instantáneo de volumen en ml por toma según concentración comercial de jarabes.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1">Peso del Niño (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pedWeight}
                    onChange={(e) => setPedWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-base text-hospital-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Fármaco Pediátrico</label>
                  <select
                    value={selectedDrugIdx}
                    onChange={(e) => {
                      setSelectedDrugIdx(Number(e.target.value));
                      setSelectedPresIdx(0);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-bold"
                  >
                    {COMMON_PEDIATRIC_DRUGS.map((d, idx) => (
                      <option key={idx} value={idx}>
                        {d.name} ({d.standardDoseMgPerKgDay} mg/kg/día)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Presentación / Concentración del Jarabe</label>
                  <select
                    value={selectedPresIdx}
                    onChange={(e) => setSelectedPresIdx(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    {pedDrug.presentations.map((p, idx) => (
                      <option key={idx} value={idx}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-hospital-50 to-sky-50 dark:from-slate-800 dark:to-slate-800/60 border border-hospital-200 dark:border-hospital-900 space-y-4">
              <div className="text-center space-y-2">
                <span className="text-[10px] uppercase font-bold text-hospital-700 dark:text-hospital-300">
                  Dosis a Administrar por Toma
                </span>
                <p className="text-4xl sm:text-5xl font-black text-hospital-600 font-mono">
                  {pedResult.mlPerDose} <span className="text-2xl font-bold">ml</span>
                </p>
                <span className="font-bold text-xs text-slate-700 dark:text-slate-300 block">
                  {pedResult.frequencyText}
                </span>
              </div>

              <div className="pt-4 border-t border-hospital-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dosis en miligramos por toma:</span>
                  <span className="font-bold font-mono">{pedResult.mgPerDose} mg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dosis total diaria calculada:</span>
                  <span className="font-bold font-mono">{pedResult.totalDailyMg} mg/día</span>
                </div>
              </div>

              {pedResult.warning && (
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px]">
                  ⚠️ {pedResult.warning}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. Parkland */}
        {activeTab === 'parkland' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Fórmula de Parkland (Reanimación Hídrica en Quemaduras)
              </h3>
              <p className="text-slate-500 text-xs">
                4 ml × Peso (kg) × % Superficie Corporal Quemada (SCQ) de Ringer Lactato en las primeras 24 horas.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Peso del Paciente (kg)</label>
                  <input
                    type="number"
                    value={parklandWeight}
                    onChange={(e) => setParklandWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">% Quemadura (SCQ)</label>
                  <input
                    type="number"
                    value={burnPercent}
                    onChange={(e) => setBurnPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-rose-600"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Fluidos en 24 Horas</span>
                <p className="text-3xl font-black font-mono text-hospital-600 mt-1">
                  {parklandResult.totalFluid24h.toLocaleString()} ml
                </p>
                <span className="text-xs text-slate-500">Lactato Ringer</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-center">
                  <p className="font-bold text-slate-900 dark:text-white">Primeras 8 Horas (50%)</p>
                  <p className="text-lg font-black font-mono text-hospital-600 mt-1">
                    {parklandResult.first8hFluid} ml
                  </p>
                  <span className="text-[10px] text-slate-500">Velocidad: {parklandResult.first8hRateMlH} ml/h</span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 text-center">
                  <p className="font-bold text-slate-900 dark:text-white">Siguientes 16 Horas (50%)</p>
                  <p className="text-lg font-black font-mono text-hospital-600 mt-1">
                    {parklandResult.next16hFluid} ml
                  </p>
                  <span className="text-[10px] text-slate-500">Velocidad: {parklandResult.next16hRateMlH} ml/h</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Glasgow */}
        {activeTab === 'glasgow' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Escala de Coma de Glasgow (GCS)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold mb-1">Respuesta Ocular (1 - 4)</label>
                  <select
                    value={glasgowEye}
                    onChange={(e) => setGlasgowEye(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value={4}>4 - Espontánea</option>
                    <option value={3}>3 - A la orden verbal / estímulo sonoro</option>
                    <option value={2}>2 - Al dolor o presión física</option>
                    <option value={1}>1 - Sin respuesta (Nula)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Respuesta Verbal (1 - 5)</label>
                  <select
                    value={glasgowVerbal}
                    onChange={(e) => setGlasgowVerbal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value={5}>5 - Orientado y conversa con coherencia</option>
                    <option value={4}>4 - Confuso / Desorientado</option>
                    <option value={3}>3 - Palabras inapropiadas / Incoherente</option>
                    <option value={2}>2 - Sonidos incomprensibles / Quejidos</option>
                    <option value={1}>1 - Sin respuesta verbal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Respuesta Motora (1 - 6)</label>
                  <select
                    value={glasgowMotor}
                    onChange={(e) => setGlasgowMotor(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border"
                  >
                    <option value={6}>6 - Obedece órdenes motoras</option>
                    <option value={5}>5 - Localiza el estímulo doloroso</option>
                    <option value={4}>4 - Retirada en flexión al dolor</option>
                    <option value={3}>3 - Flexión anormal (Decorticación)</option>
                    <option value={2}>2 - Extensión anormal (Descerebración)</option>
                    <option value={1}>1 - Sin respuesta motora (Flacidez)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Puntaje Total Glasgow</span>
              <p className="text-5xl font-black font-mono text-slate-900 dark:text-white">
                {glasgowResult.score} <span className="text-xl font-normal text-slate-400">/ 15</span>
              </p>
              <div>
                <span className={`inline-block px-3.5 py-1.5 rounded-full font-bold text-xs ${glasgowResult.color}`}>
                  {glasgowResult.severity}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                {glasgowResult.notes}
              </p>
            </div>
          </div>
        )}

        {/* 6. Alvarado */}
        {activeTab === 'alvarado' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Score de Alvarado (Estratificación de Apendicitis Aguda)
              </h3>

              <div className="space-y-2">
                {[
                  { key: 'migratoryPain', label: 'Dolor migratorio a Fosa Ilíaca Derecha (1 pt)' },
                  { key: 'anorexia', label: 'Anorexia / Pérdida del apetito (1 pt)' },
                  { key: 'nauseaVomiting', label: 'Náuseas o vómitos (1 pt)' },
                  { key: 'rlqTenderness', label: 'Dolor a la palpación en FID (Signo de McBurney) (2 pts)' },
                  { key: 'reboundTenderness', label: 'Rebote positivo en FID (Signo de Blumberg) (1 pt)' },
                  { key: 'elevatedTemp', label: 'Fiebre ≥ 37.3°C (1 pt)' },
                  { key: 'leukocytosis', label: 'Leucocitosis > 10,000 /mm³ (2 pts)' },
                  { key: 'leftShift', label: 'Desviación a la izquierda (Neutrofilia > 75%) (1 pt)' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 p-2.5 rounded-xl border hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={alvaradoCriteria[item.key as keyof typeof alvaradoCriteria]}
                      onChange={(e) =>
                        setAlvaradoCriteria((prev) => ({
                          ...prev,
                          [item.key]: e.target.checked,
                        }))
                      }
                      className="rounded text-hospital-600 focus:ring-hospital-500 w-4 h-4"
                    />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Score de Alvarado</span>
              <p className="text-5xl font-black font-mono text-slate-900 dark:text-white">
                {alvaradoResult.score} <span className="text-xl font-normal text-slate-400">/ 10</span>
              </p>
              <div>
                <span className={`inline-block px-3.5 py-1.5 rounded-xl font-bold text-xs ${alvaradoResult.color}`}>
                  {alvaradoResult.probability}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
                <strong>Conducta sugerida:</strong> {alvaradoResult.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* 7. PAM */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Presión Arterial Media (PAM)
              </h3>
              <p className="text-slate-500 text-xs">
                PAM = (2 × Presión Diastólica + Presión Sistólica) ÷ 3. Valor normal de perfusión: 65 - 105 mmHg.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Presión Sistólica (PAS mmHg)</label>
                  <input
                    type="number"
                    value={pamSystolic}
                    onChange={(e) => setPamSystolic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-base"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Presión Diastólica (PAD mmHg)</label>
                  <input
                    type="number"
                    value={pamDiastolic}
                    onChange={(e) => setPamDiastolic(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold text-base"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-4 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">PAM Calculada</span>
              <p className="text-5xl font-black font-mono text-slate-900 dark:text-white">
                {mapResult.map} <span className="text-xl font-normal text-slate-400">mmHg</span>
              </p>
              <div>
                <span className={`inline-block px-3.5 py-1.5 rounded-full font-bold text-xs ${mapResult.color}`}>
                  {mapResult.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
