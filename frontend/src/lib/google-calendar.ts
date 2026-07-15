type CalendarAppointment = {
  title: string;
  date: string;
  time: string;
  notes?: string | null;
};

function compactDateTime(date: string, time: string) {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${date.replaceAll("-", "")}T${normalizedTime.replaceAll(":", "")}`;
}

function addMinutes(date: string, time: string, minutes: number) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const value = new Date(year, month - 1, day, hour, minute + minutes, 0);
  const outputDate = [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
  const outputTime = [
    String(value.getHours()).padStart(2, "0"),
    String(value.getMinutes()).padStart(2, "0"),
    String(value.getSeconds()).padStart(2, "0"),
  ].join(":");

  return { date: outputDate, time: outputTime };
}

export function buildGoogleCalendarUrl(appointment: CalendarAppointment, accountEmail?: string | null) {
  const start = compactDateTime(appointment.date, appointment.time);
  const endDateTime = addMinutes(appointment.date, appointment.time, 60);
  const end = compactDateTime(endDateTime.date, endDateTime.time);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: appointment.title,
    dates: `${start}/${end}`,
    ctz: "Asia/Bangkok",
    details: appointment.notes || "บันทึกจาก MedCare",
  });
  if (accountEmail) {
    params.set("authuser", accountEmail);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
