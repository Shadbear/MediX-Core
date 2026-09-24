/**
 * Medical Calculators & Clinical Decision Support Tools
 */

// 1. BMI & Body Surface Area (Mosteller)
export function calculateBMI(weightKg: number, heightCm: number): {
  bmi: number;
  category: string;
  categoryColor: string;
  bsa: number; // m²
} {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const bsa = Math.sqrt((weightKg * heightCm) / 3600); // Mosteller formula

  let category = 'Normal';
  let categoryColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';

  if (bmi < 18.5) {
    category = 'Bajo peso';
    categoryColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
  } else if (bmi >= 25 && bmi < 29.9) {
    category = 'Sobrepeso';
    categoryColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
  } else if (bmi >= 30 && bmi < 34.9) {
    category = 'Obesidad Grado I';
    categoryColor = 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400';
  } else if (bmi >= 35 && bmi < 39.9) {
    category = 'Obesidad Grado II';
    categoryColor = 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400';
  } else if (bmi >= 40) {
    category = 'Obesidad Mórbida (Grado III)';
    categoryColor = 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400';
  }

  return {
    bmi: parseFloat(bmi.toFixed(2)),
    category,
    categoryColor,
    bsa: parseFloat(bsa.toFixed(2)),
  };
}

// 2. Glomerular Filtration Rate (Cockcroft-Gault & CKD-EPI)
export function calculateGFR(
  age: number,
  weightKg: number,
  serumCreatinine: number, // mg/dL
  gender: 'M' | 'F'
): {
  cockcroftGault: number; // ml/min
  ckdEpi: number; // ml/min/1.73m²
  stage: string;
  stageDescription: string;
  riskColor: string;
} {
  // Cockcroft-Gault: ((140 - age) * weight) / (72 * Cr) (* 0.85 if female)
  let cg = ((140 - age) * weightKg) / (72 * serumCreatinine);
  if (gender === 'F') cg *= 0.85;

  // CKD-EPI 2021 formula (race-free)
  const kappa = gender === 'F' ? 0.7 : 0.9;
  const alpha = gender === 'F' ? -0.241 : -0.302;
  const genderCoeff = gender === 'F' ? 1.012 : 1.0;
  const crRatio = serumCreatinine / kappa;
  const minPart = Math.min(crRatio, 1) ** alpha;
  const maxPart = Math.max(crRatio, 1) ** -1.200;
  const agePart = 0.9938 ** age;

  const ckd = 142 * minPart * maxPart * agePart * genderCoeff;

  let stage = 'G1';
  let stageDescription = 'Función renal normal o elevada';
  let riskColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';

  if (ckd >= 90) {
    stage = 'Estadío G1 (≥90)';
    stageDescription = 'Normal o alto';
    riskColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';
  } else if (ckd >= 60) {
    stage = 'Estadío G2 (60-89)';
    stageDescription = 'Descenso leve de la función renal';
    riskColor = 'text-lime-600 bg-lime-50 dark:bg-lime-950/40 dark:text-lime-400';
  } else if (ckd >= 45) {
    stage = 'Estadío G3a (45-59)';
    stageDescription = 'Descenso leve a moderado';
    riskColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
  } else if (ckd >= 30) {
    stage = 'Estadío G3b (30-44)';
    stageDescription = 'Descenso moderado a severo';
    riskColor = 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400';
  } else if (ckd >= 15) {
    stage = 'Estadío G4 (15-29)';
    stageDescription = 'Descenso severo';
    riskColor = 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400';
  } else {
    stage = 'Estadío G5 (<15)';
    stageDescription = 'Fallo renal terminal (requiere diálisis/trasplante)';
    riskColor = 'text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-300';
  }

  return {
    cockcroftGault: parseFloat(cg.toFixed(1)),
    ckdEpi: parseFloat(ckd.toFixed(1)),
    stage,
    stageDescription,
    riskColor,
  };
}

// 3. Pediatric Dosage Calculator
export interface PediatricDrug {
  name: string;
  standardDoseMgPerKgDay: number;
  maxDoseMgPerDay: number;
  dosesPerDay: number; // e.g. 3 times a day (every 8h)
  presentations: {
    name: string;
    concentrationMg: number; // e.g. 250mg
    volumeMl: number; // in 5ml
  }[];
}

export const COMMON_PEDIATRIC_DRUGS: PediatricDrug[] = [
  {
    name: 'Paracetamol (Acetaminofén)',
    standardDoseMgPerKgDay: 45, // 10-15 mg/kg/dosis (c/6-8h, aprox 45-60 mg/kg/dia)
    maxDoseMgPerDay: 2000,
    dosesPerDay: 4,
    presentations: [
      { name: 'Gotas 100mg / 1ml', concentrationMg: 100, volumeMl: 1 },
      { name: 'Jarabe 120mg / 5ml', concentrationMg: 120, volumeMl: 5 },
      { name: 'Jarabe 160mg / 5ml', concentrationMg: 160, volumeMl: 5 },
    ]
  },
  {
    name: 'Ibuprofeno',
    standardDoseMgPerKgDay: 30, // 5-10 mg/kg/dosis c/8h
    maxDoseMgPerDay: 1200,
    dosesPerDay: 3,
    presentations: [
      { name: 'Suspensión 100mg / 5ml', concentrationMg: 100, volumeMl: 5 },
      { name: 'Suspensión Forte 200mg / 5ml', concentrationMg: 200, volumeMl: 5 },
    ]
  },
  {
    name: 'Amoxicilina',
    standardDoseMgPerKgDay: 50, // 50-90 mg/kg/dia c/8h
    maxDoseMgPerDay: 3000,
    dosesPerDay: 3,
    presentations: [
      { name: 'Suspensión 250mg / 5ml', concentrationMg: 250, volumeMl: 5 },
      { name: 'Suspensión 500mg / 5ml', concentrationMg: 500, volumeMl: 5 },
    ]
  },
  {
    name: 'Amoxicilina + Ácido Clavulánico (7:1 o 8:1)',
    standardDoseMgPerKgDay: 45,
    maxDoseMgPerDay: 2000,
    dosesPerDay: 2,
    presentations: [
      { name: 'Suspensión 400mg + 57mg / 5ml', concentrationMg: 400, volumeMl: 5 },
      { name: 'Suspensión 250mg + 62.5mg / 5ml', concentrationMg: 250, volumeMl: 5 },
    ]
  },
  {
    name: 'Azitromicina',
    standardDoseMgPerKgDay: 10, // 10 mg/kg/dia c/24h x 3-5 días
    maxDoseMgPerDay: 500,
    dosesPerDay: 1,
    presentations: [
      { name: 'Suspensión 200mg / 5ml', concentrationMg: 200, volumeMl: 5 },
    ]
  }
];

export function calculatePediatricDose(
  weightKg: number,
  drug: PediatricDrug,
  selectedPresentationIdx: number
): {
  totalDailyMg: number;
  mgPerDose: number;
  mlPerDose: number;
  frequencyText: string;
  warning?: string;
} {
  let totalDailyMg = weightKg * drug.standardDoseMgPerKgDay;
  let warning: string | undefined;

  if (totalDailyMg > drug.maxDoseMgPerDay) {
    totalDailyMg = drug.maxDoseMgPerDay;
    warning = `Ajustado a dosis máxima permitida (${drug.maxDoseMgPerDay} mg/día).`;
  }

  const mgPerDose = totalDailyMg / drug.dosesPerDay;
  const pres = drug.presentations[selectedPresentationIdx] || drug.presentations[0];
  const mlPerDose = (mgPerDose * pres.volumeMl) / pres.concentrationMg;

  const frequencyHours = 24 / drug.dosesPerDay;
  const frequencyText = `Cada ${frequencyHours} horas (${drug.dosesPerDay} veces al día)`;

  return {
    totalDailyMg: parseFloat(totalDailyMg.toFixed(1)),
    mgPerDose: parseFloat(mgPerDose.toFixed(1)),
    mlPerDose: parseFloat(mlPerDose.toFixed(1)),
    frequencyText,
    warning,
  };
}

// 4. Parkland Burn Formula
export function calculateParkland(weightKg: number, burnPercent: number): {
  totalFluid24h: number; // ml of Ringer Lactate
  first8hFluid: number;
  first8hRateMlH: number;
  next16hFluid: number;
  next16hRateMlH: number;
} {
  // Parkland formula: 4 ml * weight (kg) * % TBSA burn
  const totalFluid24h = 4 * weightKg * burnPercent;
  const first8hFluid = totalFluid24h * 0.5;
  const next16hFluid = totalFluid24h * 0.5;

  return {
    totalFluid24h: Math.round(totalFluid24h),
    first8hFluid: Math.round(first8hFluid),
    first8hRateMlH: Math.round(first8hFluid / 8),
    next16hFluid: Math.round(next16hFluid),
    next16hRateMlH: Math.round(next16hFluid / 16),
  };
}

// 5. Glasgow Coma Scale (GCS)
export function evaluateGlasgow(eye: number, verbal: number, motor: number): {
  score: number;
  severity: 'Grave / Coma (TCE Severo)' | 'Moderado (TCE Moderado)' | 'Leve (TCE Leve)';
  color: string;
  notes: string;
} {
  const score = eye + verbal + motor;

  if (score <= 8) {
    return {
      score,
      severity: 'Grave / Coma (TCE Severo)',
      color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
      notes: 'Requiere intubación orotraqueal inmediata y manejo en UCI/Shock Trauma.',
    };
  } else if (score <= 12) {
    return {
      score,
      severity: 'Moderado (TCE Moderado)',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
      notes: 'Requiere observación estricta, tomografía cerebral y evaluación neuroquirúrgica.',
    };
  } else {
    return {
      score,
      severity: 'Leve (TCE Leve)',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      notes: 'Estado de conciencia conservado. Monitoreo neurológico periódico.',
    };
  }
}

// 6. Alvarado Appendicitis Score
export function evaluateAlvarado(criteria: {
  migratoryPain: boolean; // 1 pt
  anorexia: boolean; // 1 pt
  nauseaVomiting: boolean; // 1 pt
  rlqTenderness: boolean; // 2 pts (Dolor en FID)
  reboundTenderness: boolean; // 1 pt (Signo de Blumberg)
  elevatedTemp: boolean; // 1 pt (≥ 37.3°C)
  leukocytosis: boolean; // 2 pts (> 10,000 /mm³)
  leftShift: boolean; // 1 pt (Neutrofilia > 75%)
}): {
  score: number;
  probability: string;
  recommendation: string;
  color: string;
} {
  let score = 0;
  if (criteria.migratoryPain) score += 1;
  if (criteria.anorexia) score += 1;
  if (criteria.nauseaVomiting) score += 1;
  if (criteria.rlqTenderness) score += 2;
  if (criteria.reboundTenderness) score += 1;
  if (criteria.elevatedTemp) score += 1;
  if (criteria.leukocytosis) score += 2;
  if (criteria.leftShift) score += 1;

  if (score <= 4) {
    return {
      score,
      probability: 'Baja probabilidad de apendicitis aguda',
      recommendation: 'Observación ambulatoria o descartar otros diagnósticos.',
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    };
  } else if (score <= 6) {
    return {
      score,
      probability: 'Sospecha intermedia / Posible apendicitis',
      recommendation: 'Internamiento en observación, ecografía abdominal o TAC y reevaluación en 6h.',
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
    };
  } else {
    return {
      score,
      probability: 'Alta probabilidad / Muy probable apendicitis',
      recommendation: 'Evaluación quirúrgica inmediata para posible apendicectomía de urgencia.',
      color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400',
    };
  }
}

// 7. Mean Arterial Pressure (PAM)
export function calculateMAP(systolic: number, diastolic: number): {
  map: number;
  status: string;
  color: string;
} {
  // MAP = (2 * Diastolic + Systolic) / 3
  const map = (2 * diastolic + systolic) / 3;
  let status = 'Perfusión Tisular Adecuada';
  let color = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400';

  if (map < 65) {
    status = 'Hipotensión / Hipoperfusión crítica (<65 mmHg)';
    color = 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400';
  } else if (map > 105) {
    status = 'Hipertensión marcada (>105 mmHg)';
    color = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400';
  }

  return {
    map: parseFloat(map.toFixed(1)),
    status,
    color,
  };
}
