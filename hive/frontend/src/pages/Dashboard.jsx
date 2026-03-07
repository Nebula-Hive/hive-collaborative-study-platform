import StudySessionCalendar from "./StudySession";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
 const { user } = useAuth();
  useEffect(() => {
    axios.get("http://localhost:3001/api/studysession/")
      .then((res) => {
        const sessions = res.data;
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
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-primary p-0">
      <div className="flex flex-col lg:flex-row ">

        {/* Calendar Section */}
        <div className="lg:w-3/4 w-full">
        <h2 className="p-6">Hey {user?.displayName || user?.name || "there"}!  🐝 Let’s buzz through today’s tasks together!</h2>
          <StudySessionCalendar isUpcomingTasks={false} />

        </div>

        {/* Right Sidebar */}
        <div className="lg:w-1/4 w-full flex flex-col gap-4  md:p-6 p-2">

          {/* Focus Timer */}
          <div className=" p-6 rounded-lg shadow text-center">
            <h3 className="font-semibold mb-4">Focus Timer</h3>
            <div className="text-3xl font-bold mb-4">25:00</div>
            <div className="flex justify-center gap-3">
              <button className="px-4 py-2 bg-yellow-500 rounded">Start</button>
              <button className="px-4 py-2 bg-gray-400 rounded">Reset</button>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className=" p-6 rounded-lg shadow">
            <h3 className="font-bold text-lg mb-5 text-gray-800">Upcoming Tasks</h3>
            <div className="space-y-4">
              {tasks.slice(0, 3).map((task) => {
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
                    className=" p-4 rounded-lg border-l-4 border-yellow-400 shadow-sm"
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

          {/* Academic Progress */}
          <div className=" p-6 rounded-lg shadow text-center">
            <h3 className="font-semibold mb-4">Academic Progress</h3>
            <div className="text-4xl font-bold text-gray-800">3.65</div>
            <p className="text-sm text-gray-500 mt-2">Great job, keep it up!</p>
          </div>

        </div>
      </div>

      {/* Bottom Section: Resources */}

    </div>
  );
}