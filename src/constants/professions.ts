import type { Profession } from '@/types'

export const PROFESSIONS: Profession[] = [
  { id: 'lash_artist', label: 'Lash Artist', emoji: '👁️', category: 'beauty' },
  { id: 'manicurista', label: 'Manicurista', emoji: '💅', category: 'beauty' },
  { id: 'barbero', label: 'Barbero', emoji: '💈', category: 'beauty' },
  { id: 'peluquero', label: 'Peluquero / Estilista', emoji: '✂️', category: 'beauty' },
  { id: 'masajista', label: 'Masajista', emoji: '💆', category: 'wellness' },
  { id: 'esteticista', label: 'Esteticista', emoji: '🧖', category: 'wellness' },
  { id: 'nutricionista', label: 'Nutricionista', emoji: '🥗', category: 'health' },
  { id: 'psicologo', label: 'Psicólogo', emoji: '🧠', category: 'health' },
  { id: 'personal_trainer', label: 'Personal Trainer', emoji: '🏋️', category: 'fitness' },
  { id: 'dentista', label: 'Dentista', emoji: '🦷', category: 'health' },
  { id: 'profesor', label: 'Profesor Particular', emoji: '📚', category: 'education' },
  { id: 'tecnico_celular', label: 'Técnico en Celular', emoji: '📱', category: 'tech' },
  { id: 'tatuador', label: 'Tatuador', emoji: '🎨', category: 'beauty' },
  { id: 'fotografo', label: 'Fotógrafo', emoji: '📷', category: 'creative' },
  { id: 'otro', label: 'Otro', emoji: '✨', category: 'other' },
]
