import { Calendar } from "../ui/calendar";

export function AppointmentCalendarView({ appointments }: { appointments: Array<{ date: string; time: string; title: string }> }) {
  return <Calendar dates={appointments.map((item) => ({ date: item.date, label: `${item.time} · ${item.title}` }))} />;
}
