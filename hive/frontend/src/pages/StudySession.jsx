import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAllSessions, createSession } from "@/services";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import { toast } from "react-toastify";

const localizer = momentLocalizer(moment);

// Custom event style (matches Dashboard)
const eventStyleGetter = () => ({
  style: {
    backgroundColor: "#FFCC00",
    color: "#4D3D00",
    border: "none",
    borderRadius: "4px",
    fontSize: "12px",
    padding: "2px 6px",
  },
});

export default function StudySessionCalendar({ isUpcomingTasks = true }) {
  const { role } = useAuth();
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjectCode: "",
    type: "Lecture",
    topic: "",
    date: "",
    time: "",
    description: "",
    repeatType: "Does not repeat",
    customRepeat: "",
  });

  const loadSessions = () => {
    getAllSessions()
      .then((sessions) => {
        const calendarEvents = sessions.map((session) => {
          const utcDate = new Date(session.date);
          const localSriLankaDate = new Date(
            utcDate.getTime() + 5.5 * 60 * 60 * 1000
          );

          return {
            title: session.subjectCode,
            start: localSriLankaDate,
            end: localSriLankaDate,
            topic: session.topic,
            type: session.type,
            time: session.time,
            description: session.description,
          };
        });

        setEvents(calendarEvents);

        const todayColombo = new Date();
        todayColombo.setHours(0, 0, 0, 0);

        const futureTasks = sessions
          .map((task) => {
            const utc = new Date(task.date);
            const local = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);
            return { ...task, localDate: local };
          })
          .filter((task) => task.localDate >= todayColombo)
          .sort((a, b) => a.localDate - b.localDate);

        setTasks(futureTasks);
      })
      .catch((err) => {
        console.error("Failed to load study sessions:", err);
      });
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      await createSession(formData);
      toast.success("Study session created successfully");
      setIsModalOpen(false);
      setFormData({
        subjectCode: "",
        type: "Lecture",
        topic: "",
        date: "",
        time: "",
        description: "",
        repeatType: "Does not repeat",
        customRepeat: "",
      });
      loadSessions();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create session");
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Calendar Section */}
        <div
          className={`w-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm ${isUpcomingTasks ? "lg:w-4/5" : "lg:w-full"
            }`}
        >
          <div className="flex items-center justify-between mb-6">
            {isUpcomingTasks && (
              <h2 className="text-2xl text-gray-700 font-bold">
                Study Session Reminder
              </h2>
            )}
            {(role === "admin" || role === "superadmin") && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition"
              >
                + Add Session
              </button>
            )}
          </div>

          <style>{`
            .rbc-calendar { font-family: "Inter", sans-serif; font-size: 13px; }
            .rbc-toolbar { margin-bottom: 12px; }
            .rbc-toolbar button { font-size: 13px; padding: 4px 12px; border: 1px solid #D2D6DC; border-radius: 6px; color: #393E41; background: #fff; }
            .rbc-toolbar button.rbc-active { background: #393E41; color: #fff; border-color: #393E41; }
            .rbc-toolbar button:hover { background: #F4F4F5; }
            .rbc-toolbar button.rbc-active:hover { background: #24282A; color: #fff; }
            .rbc-header { padding: 8px 4px; font-weight: 600; font-size: 13px; color: #6E7377; border-bottom: 1px solid #E5E7EB; }
            .rbc-month-view { border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
            .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row { border-color: #E5E7EB; }
            .rbc-off-range-bg { background: #FAFAFA; }
            .rbc-today { background: #FFF8DE; }
            .rbc-date-cell { padding: 4px 8px; font-size: 13px; }
            .rbc-show-more { color: #FFCC00; font-weight: 600; font-size: 11px; }
          `}</style>

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            defaultView="month"
            views={["month", "week", "day", "agenda"]}
            style={{ height: 520 }}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={(event) =>
              `${event.title}\nTime: ${event.time}\nType: ${event.type}\nTopic: ${event.topic}`
            }
          />
        </div>

        {/* Upcoming Tasks Sidebar */}
        {isUpcomingTasks && (
          <div className="w-full lg:w-1/5 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-5 text-gray-800">
              Upcoming Tasks
            </h3>
            <div className="space-y-4">
              {tasks.slice(0, 5).map((task) => {
                const utc = new Date(task.date);
                const local = new Date(utc.getTime() + 5.5 * 60 * 60 * 1000);
                const dateStr = local.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <div
                    key={task._id}
                    className="bg-gray-50 p-4 rounded-lg border-l-4 border-yellow-400 shadow-sm"
                  >
                    <p className="font-semibold text-base text-gray-900">
                      {task.topic}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {dateStr} • {task.time}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{task.type}</p>
                  </div>
                );
              })}

              {tasks.length === 0 && (
                <p className="text-gray-500 text-sm">
                  No upcoming sessions.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Create Study Session"
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Code</label>
            <input
              type="text"
              name="subjectCode"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. SENG 41283"
              value={formData.subjectCode}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <input
              type="text"
              name="topic"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. Intro to ML"
              value={formData.topic}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <select
                name="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="Lecture">Lecture</option>
                <option value="Assignment">Assignment</option>
                <option value="Lab">Lab</option>
                <option value="Exam">Exam</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                name="date"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Time (e.g., 05.30 PM)</label>
              <input
                type="text"
                name="time"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="05.30 PM"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Repeat</label>
              <select
                name="repeatType"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={formData.repeatType}
                onChange={handleChange}
              >
                <option value="Does not repeat">Does not repeat</option>
                <option value="Every day">Every day</option>
                <option value="Every week">Every week</option>
                <option value="Every month">Every month</option>
                <option value="Every year">Every year</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
          {formData.repeatType === "Custom" && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Custom Repeat Formula</label>
              <input
                type="text"
                name="customRepeat"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g. Every 2 weeks on Tuesday"
                value={formData.customRepeat}
                onChange={handleChange}
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="Additional details..."
              value={formData.description}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md"
            >
              Create Session
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}