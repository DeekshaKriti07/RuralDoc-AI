// Small pure helpers used by step-by-step first-aid lessons.
export const getStepCount = (lesson) => Array.isArray(lesson?.steps) ? lesson.steps.length : 0;
export const clampStep = (index, count) => Math.max(0, Math.min(Number(index) || 0, Math.max(0, count - 1)));
export const getProgress = (index, count) => count > 0 ? Math.round(((clampStep(index, count) + 1) / count) * 100) : 0;
