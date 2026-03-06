import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaDotCircle, FaBars, FaArrowLeft, FaArrowRight, FaHome } from "react-icons/fa";

export default function StudySessionCalendar() {
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [calendarRef, setCalendarRef] = useState(null);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [isMdUp, setIsMdUp] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsMdUp(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    axios.get("http://localhost:3001/api/studysession/").then((res) => {
      const sessions = res.data;
      const calendarEvents = sessions.map((session) => {
        const utcDate = new Date(session.date); 

        const localSriLankaDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

        return {
          title: session.subjectCode,
          start: localSriLankaDate,
          extendedProps: {
            topic: session.topic,
            type: session.type,
            time: session.time,          
            description: session.description,
          },
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
    }).catch(err => {
      console.error("Failed to load study sessions:", err);
    });
  }, []);

  const handleViewChange = (view) => {
    if (calendarRef) {
      calendarRef.getApi().changeView(view);
      setShowViewMenu(false);
    }
  };

  const handleNav = (action) => {
    if (!calendarRef) return;
    const api = calendarRef.getApi();
    if (action === "prev") api.prev();
    if (action === "next") api.next();
    if (action === "today") api.today();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        {/* Calendar Section */}
        <div className="w-full lg:w-4/5 bg-white p-6 rounded-lg shadow relative">
          <h2 className="text-2xl text-blue-700 font-bold mb-6">
            Study Session Reminder
          </h2>

          {/* Mobile navigation */}
          {!isMdUp && (
            <div className="absolute top-4 left-4 flex gap-2 z-20">
              <button className="p-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => handleNav("prev")}>
                <FaArrowLeft />
              </button>
              <button className="p-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => handleNav("today")}>
                <FaHome />
              </button>
              <button className="p-2 bg-gray-200 rounded hover:bg-gray-300" onClick={() => handleNav("next")}>
                <FaArrowRight />
              </button>
            </div>
          )}

          {/* Mobile view selector */}
          {!isMdUp && (
            <div className="absolute top-4 right-4 z-20">
              <button
                className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowViewMenu(!showViewMenu)}
              >
                <FaBars />
              </button>
              {showViewMenu && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg flex flex-col min-w-[140px]">
                  {["dayGridMonth", "timeGridWeek", "timeGridDay", "listWeek"].map((view) => (
                    <button
                      key={view}
                      className="px-4 py-2 text-left hover:bg-blue-50"
                      onClick={() => handleViewChange(view)}
                    >
                      {view.replace("dayGrid", "").replace("timeGrid", "").replace("list", "") || "Month"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="pt-10 md:pt-0">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
              initialView="dayGridMonth"
              fixedWeekCount={false}
              timeZone="Asia/Colombo"
              headerToolbar={{
                left: isMdUp ? "prev,next today" : "",
                center: "title",
                right: isMdUp ? "dayGridMonth,timeGridWeek,timeGridDay,listWeek" : "",
              }}
              events={events}
              height="auto"
              ref={setCalendarRef}
              eventContent={(eventInfo) => (
                <div
                  className="text-[12px] px-1.5 py-0.5 truncate font-medium text-gray-900 hover:text-black rounded transition cursor-pointer flex items-center gap-1.5 "
                  title={`Time: ${eventInfo.event.extendedProps.time}\nType: ${eventInfo.event.extendedProps.type}\nTopic: ${eventInfo.event.extendedProps.topic}`}
                >
                  {/* <FaDotCircle className="text-[6px] text-gray-800" /> */}
                  {eventInfo.event.title}
                </div>
              )}
            />
          </div>
        </div>

        {/* Upcoming Tasks Sidebar */}
        <div className="w-full lg:w-1/5 bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-5 text-gray-800">Upcoming Tasks</h3>
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => {
              // Convert UTC date → Colombo local date string
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
                  <p className="font-semibold text-base text-gray-900">{task.topic}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {dateStr} • {task.time}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{task.type}</p>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <p className="text-gray-500 text-sm">No upcoming sessions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}