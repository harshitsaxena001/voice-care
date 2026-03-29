import { Calendar, Clock, Phone, CheckCircle, XCircle } from "lucide-react";
import { useAppointments } from "../data/useAppointments";
import { usePatients } from "../data/usePatients";
import { useState } from "react";
import { toast } from "sonner";
import { fetchWithAuth } from "../../lib/api";

export default function Schedule() {
  const { appointments, approveAppointment } = useAppointments();
  const { patients } = usePatients();
  const [triggering, setTriggering] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate dynamic schedules (2-3 days gap for 15-30 days)
  const schedules = patients.flatMap((patient) => {
    const start = new Date(patient.dischargeDate || new Date());
    start.setHours(0, 0, 0, 0);

    // Follow-up plan: Days 2, 5, 8, 11, 15, 18, 21, 24, 27, 30
    const followUpDays = [2, 5, 8, 11, 15, 18, 21, 24, 27, 30]; 

    return followUpDays.map((daysToAdd, index) => {
      const scheduledDate = new Date(start);
      scheduledDate.setDate(start.getDate() + daysToAdd);
      scheduledDate.setHours(9 + (index % 8), 0, 0, 0); // between 9 AM and 4 PM

      let status = "pending";
      
      if (scheduledDate < today) {
         // Past schedule
         status = Math.random() > 0.3 ? "completed" : "failed";
      } else if (scheduledDate.getTime() === today.getTime()) {
         // Today
         status = "pending";
      } else {
         // Future
         status = "pending";
      }

      // Ensure some calls are always pending today for simulation if discharge was 2-30 days ago
      // If none match exactly, let's force the most recent overdue as pending today
      
      return {
        id: `${patient.id}-${daysToAdd}`,
        patientId: patient.id,
        patientName: patient.name,
        scheduledAt: scheduledDate.toISOString(),
        status: status,
        callDay: `Day ${daysToAdd}`,
        language: patient.language || 'English',
      };
    });
  });

  // Filter schedules that are active today or future pending
  const activeSchedules = schedules.filter(s => {
      const sDate = new Date(s.scheduledAt);
      sDate.setHours(0,0,0,0);
      return sDate.getTime() >= today.getTime();
  });

  const pendingCalls = activeSchedules.filter((s) => s.status === "pending" || new Date(s.scheduledAt) >= today);
  const completedCalls = schedules.filter((s) => s.status === "completed");
  const failedCalls = schedules.filter((s) => s.status === "failed");

  const handleCallNow = async (patientId: string, language: string) => {
    try {
      setTriggering(patientId);
      await fetchWithAuth('/calls/trigger', {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, language }),
      });
      toast.success("Call triggered successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to trigger call");
    } finally {
      setTriggering(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-primary">
          Call Schedule & Appointments
        </h1>
        <p className="text-muted-foreground">
          Automated follow-up call timeline & pending appointments
        </p>
      </div>

      {/* AI Requested Appointments */}
      <div className="bg-card p-6 rounded-xl shadow-md border border-border mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-accent-foreground" />
          <h2 className="text-xl text-primary">
            Pending AI Appointments (HITL)
          </h2>
        </div>
        {appointments.filter((a) => a.status === "PENDING").length === 0 ? (
          <p className="text-muted-foreground">
            No pending appointments requested by AI.
          </p>
        ) : (
          <div className="space-y-4">
            {appointments
              .filter((a) => a.status === "PENDING")
              .map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-accent/30 bg-accent/5"
                >
                  <div>
                    <p className="font-semibold text-primary">
                      {appt.patient?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Diagnosis: {appt.patient?.primary_diagnosis}
                    </p>
                    {appt.proposed_date ? (
                      <p className="text-sm text-primary mt-1">
                        Requested Session: {appt.proposed_date} (
                        {appt.proposed_session})
                      </p>
                    ) : (
                      <p className="text-sm text-primary mt-1">
                        Requested Session: {appt.proposed_session}
                      </p>
                    )}
                  </div>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    onClick={async () => {
                      try {
                        await approveAppointment(appt.id);
                        toast.success("Appointment Approved & SMS sent to patient!");
                      } catch (e) {
                        toast.error("Failed to approve appointment");
                      }
                    }}
                  >
                    Approve (Send SMS)
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-card p-6 rounded-xl shadow-md border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <div className="text-2xl text-primary">{pendingCalls.length}</div>
              <p className="text-sm text-muted-foreground">Pending Today</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-md border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl text-green-600">
                {completedCalls.length}
              </div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-md border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl text-red-600">{failedCalls.length}</div>
              <p className="text-sm text-muted-foreground">Failed/Missed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-card p-6 rounded-xl shadow-md border border-border">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="text-xl text-primary">Today's Schedule</h2>
        </div>

        <div className="space-y-4">
          {schedules
            .sort(
              (a, b) =>
                new Date(a.scheduledAt).getTime() -
                new Date(b.scheduledAt).getTime(),
            )
            .map((schedule) => {
              const time = new Date(schedule.scheduledAt).toLocaleTimeString(
                "en-IN",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );

              return (
                <div
                  key={schedule.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                >
                  {/* Time */}
                  <div className="w-20 text-center">
                    <div className="text-lg text-primary">{time}</div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {schedule.status === "pending" && (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent-foreground" />
                      </div>
                    )}
                    {schedule.status === "completed" && (
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {schedule.status === "failed" && (
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                    )}
                  </div>

                  {/* Patient Info */}
                  <div className="flex-1">
                    <div className="text-primary mb-1">
                      {schedule.patientName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Post-discharge {schedule.callDay} follow-up
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {schedule.status === "pending" && (
                      <span className="px-3 py-1 bg-accent/20 text-accent-foreground rounded-full text-sm capitalize">
                        Scheduled
                      </span>
                    )}
                    {schedule.status === "completed" && (
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm capitalize">
                        Completed
                      </span>
                    )}
                    {schedule.status === "failed" && (
                      <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm capitalize">
                        Failed
                      </span>
                    )}
                  </div>

                  {/* Action */}
                  {schedule.status === "pending" && (
                    <button disabled={triggering === schedule.patientId} onClick={() => handleCallNow(schedule.patientId, schedule.language)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                      <Phone className="w-4 h-4" />
                      {triggering === schedule.patientId ? "Calling..." : "Call Now"}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Upcoming Week */}
      <div className="mt-6 bg-card p-6 rounded-xl shadow-md border border-border">
        <h2 className="text-xl mb-4 text-primary">This Week Overview</h2>
        <div className="grid grid-cols-7 gap-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => (
            <div key={day} className="text-center">
              <div className="text-sm text-muted-foreground mb-2">{day}</div>
              <div className="bg-secondary rounded-lg p-3">
                <div className="text-lg text-primary">{20 + idx * 2}</div>
                <div className="text-xs text-muted-foreground">calls</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
