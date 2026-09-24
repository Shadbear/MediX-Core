/**
 * Web Audio API Chime & Web Speech API Synthesis for Waiting Room Call Notifications
 */

// Generate a pleasant hospital chime sound using Web Audio API oscillator
export function playHospitalChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        resolve();
        return;
      }

      const ctx = new AudioContextClass();
      
      // Chime notes: F5 -> A5 -> C6 (pleasant arpeggio)
      const notes = [698.46, 880.00, 1046.50];
      const noteDuration = 0.35;
      const startTime = ctx.currentTime + 0.05;

      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime + index * noteDuration);

        // Attack and decay
        const noteStart = startTime + index * noteDuration;
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.3, noteStart + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + noteDuration + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration + 0.25);
      });

      setTimeout(() => {
        resolve();
      }, (notes.length * noteDuration + 0.3) * 1000);
    } catch {
      resolve();
    }
  });
}

// Speak the announcement using native SpeechSynthesis
export function speakTurnAnnouncement(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES'; // Spanish
    utterance.rate = 0.92; // Slightly slower for clarity
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    // Pick a Spanish voice if available
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.startsWith('es') || v.lang.includes('ES') || v.lang.includes('MX'));
    if (esVoice) {
      utterance.voice = esVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    // Workaround for some browsers where getVoices is async
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const updatedVoices = window.speechSynthesis.getVoices();
        const voice = updatedVoices.find(v => v.lang.startsWith('es'));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      };
    }

    window.speechSynthesis.speak(utterance);
  });
}

// Full notification sequence: Chime -> Wait -> Voice Announcement
export async function announcePatientCall(patientName: string, consultingRoom: string, ticket: string): Promise<void> {
  await playHospitalChime();
  const text = `Turno ${ticket}. Paciente ${patientName}, por favor acercarse a ${consultingRoom}.`;
  await speakTurnAnnouncement(text);
}
