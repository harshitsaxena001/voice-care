import { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  User,
  Shield,
  Save,
  UserPlus,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { fetchWithAuth } from "../../lib/api";

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  phone: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    email: "",
    specialty: "",
    phone: "",
  });
  const [hospitalName, setHospitalName] = useState("");

  useEffect(() => {
    const loadHospitalData = async () => {
      try {
        const res = await fetchWithAuth("/hospitals/me");
        if (res.success) {
          setHospitalName(res.data.name);
          setDoctors(res.data.doctors || []);
        }
      } catch (err) {
        console.error("Failed to load hospital data", err);
      }
    };
    loadHospitalData();
  }, [activeTab]);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetchWithAuth("/hospitals/doctors", {
        method: "POST",
        body: JSON.stringify(newDoctor),
      });
      if (res.success) {
        setDoctors([...doctors, res.data]);
        setNewDoctor({ name: "", email: "", specialty: "", phone: "" });
      }
    } catch (err) {
      console.error("Failed to add doctor", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2 text-primary">Settings</h1>
        <p className="text-muted-foreground">
          Manage your hospital profile, staff and preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 space-y-2">
          <button
            onClick={() => setActiveTab("account")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === "account" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Hospital Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("doctors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === "doctors" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Stethoscope className="w-5 h-5" />
            <span className="font-medium">Manage Doctors</span>
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === "notifications" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Notifications</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card rounded-xl shadow-md border border-border overflow-hidden">
          {activeTab === "account" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Hospital Profile</h2>
              <form className="max-w-2xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">
                      Hospital Name
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full px-4 py-2 bg-input-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <button className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition">
                    <Save className="w-4 h-4" />
                    Save Hospital Info
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "doctors" && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Manage Doctors</h2>

              {/* Add Doctor Form */}
              <div className="bg-muted/30 p-4 rounded-lg mb-8 border border-border/50">
                <h3 className="text-md font-medium mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Add New Doctor
                </h3>
                <form
                  onSubmit={handleAddDoctor}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  <input
                    placeholder="Name"
                    required
                    value={newDoctor.name}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, name: e.target.value })
                    }
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    required
                    value={newDoctor.email}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, email: e.target.value })
                    }
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md"
                  />
                  <input
                    placeholder="Specialty"
                    value={newDoctor.specialty}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, specialty: e.target.value })
                    }
                    className="px-3 py-2 text-sm bg-background border border-border rounded-md"
                  />
                  <button
                    disabled={loading}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition text-sm font-medium"
                  >
                    {loading ? "Adding..." : "Add Doctor"}
                  </button>
                </form>
              </div>

              {/* Doctors List */}
              <div className="space-y-4">
                <h3 className="text-md font-medium text-muted-foreground">
                  Registered Doctors ({doctors.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="p-4 border border-border rounded-lg flex justify-between items-start bg-background/50"
                    >
                      <div>
                        <p className="font-semibold text-primary">
                          {doctor.name}
                        </p>
                        <p className="text-xs text-muted-foreground italic mb-2">
                          {doctor.specialty || "General Practitioner"}
                        </p>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="w-3 h-3" /> {doctor.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {doctors.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                      No doctors added yet. Use the form above to add your
                      medical staff.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="p-6">
              <h2 className="text-xl mb-6 text-primary">
                Notification Preferences
              </h2>

              <div className="space-y-6">
                {/* SMS Notifications */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h3 className="mb-1">SMS Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive text messages for high-priority patient alerts
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* WhatsApp Notifications */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="mb-1">WhatsApp Alerts</h3>
                      <p className="text-sm text-muted-foreground">
                        Get instant alerts via WhatsApp with patient details
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Push Notifications */}
                <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="mb-1">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive real-time push notifications on your mobile
                        device
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                {/* Email Digest */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="mb-1">Daily Email Digest</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive a daily summary of all patient activities
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Alert Thresholds Section moved inside the main content area or layout */}
          <div className="p-6 border-t border-border mt-auto">
            <h2 className="text-xl mb-6 text-primary">Alert Thresholds</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm">Notify on Critical risk level</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm">Notify on High risk level</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm">Notify on Medium risk level</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
                />
                <span className="text-sm">Notify on Low risk level</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
