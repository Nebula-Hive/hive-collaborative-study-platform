import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsPinAngleFill, BsPinAngle } from "react-icons/bs";

const initialSubjects = [
  { id: "python", name: "Python", hasImage: true, isPinned: false },
  { id: "2", name: "C Programming", hasImage: false, isPinned: false },
  { id: "3", name: "Data Structures", hasImage: false, isPinned: false },
  { id: "4", name: "Web Development", hasImage: false, isPinned: false },
  { id: "5", name: "Software Engineering", hasImage: false, isPinned: false },
  { id: "6", name: "Computer Networks", hasImage: false, isPinned: false },
  { id: "7", name: "Database Systems", hasImage: false, isPinned: false },
  { id: "8", name: "Operating Systems", hasImage: false, isPinned: false },
  { id: "9", name: "Machine Learning", hasImage: false, isPinned: false },
  { id: "10", name: "System Architecture", hasImage: false, isPinned: false },
];

export default function Subjects() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState(initialSubjects);

  const togglePin = (e, id) => {
    e.stopPropagation();
    setSubjects((prev) =>
      prev.map((sub) =>
        sub.id === id ? { ...sub, isPinned: !sub.isPinned } : sub
      )
    );
  };

  const sortedSubjects = [...subjects].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0; // maintain original order for same pinned status
  });

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Resources</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sortedSubjects.map((subject) => (
          <div
            key={subject.id}
            onClick={() => navigate(`/resources/${subject.id}`)}
            className="flex flex-col bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow h-48 group"
          >
            {/* Top Half - Background / Image */}
            <div className={`flex-grow ${!subject.hasImage ? 'bg-[#393E41]' : 'bg-white p-2 flex items-center justify-center'}`}>
              {subject.hasImage && (
                <div className="text-blue-500 font-bold text-3xl opacity-80 flex flex-wrap justify-center content-center h-full w-full">
                  <span className="text-[10px] m-1 text-slate-400">ASM</span>
                  <span className="text-[14px] m-1 text-indigo-400">Rust</span>
                  <span className="text-[18px] m-1 text-yellow-500">JavaScript</span>
                  <span className="text-5xl m-1 text-blue-600">Python</span>
                  <span className="text-[14px] m-1 text-blue-400">C++</span>
                  <span className="text-[12px] m-1 text-purple-500">PHP</span>
                  <span className="text-[16px] m-1 text-cyan-500">Go</span>
                </div>
              )}
            </div>

            {/* Bottom Half - Title & Pin */}
            <div className="h-12 bg-white flex justify-between items-center px-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-800">{subject.name}</span>
              <button
                onClick={(e) => togglePin(e, subject.id)}
                className={`text-lg transition-colors p-1 rounded-full ${
                  subject.isPinned
                    ? "text-primary-600"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
                }`}
                title={subject.isPinned ? "Unpin subject" : "Pin subject"}
              >
                {subject.isPinned ? <BsPinAngleFill /> : <BsPinAngle />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
