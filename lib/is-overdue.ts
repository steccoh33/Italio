/** true si la fecha límite ya pasó (se evalúa al renderizar la página en el servidor). */
export function isPastDue(dueDate: string | null): boolean {
  return dueDate !== null && Date.parse(dueDate) < Date.now();
}
