import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BsPinAngleFill, BsPinAngle } from "react-icons/bs";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import { toast } from "react-toastify";
import { getAllSubjects, createSubject } from "@/services/api";

const initialSubjects = [
  { id: "python", name: "Python", hasImage: true, isPinned: false },
  { id: "2", name: "C Programming", hasImage: false, isPinned: false },
  { id: "3", name: "Data Structures", hasImage: false, isPinned: false },
  { id: "4", name: "Web Development", hasImage: false, isPinned: false },
];

export default function Subjects() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [subjects, setSubjects] = useState(initialSubjects);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subjectId: "",
    subjectName: "",
    subjectCode: "",
    level: 1,
    semester: 1,
    description: "",
  });

  const loadSubjects = () => {
    getAllSubjects()
      .then((res) => {
        if (res.subjects && res.subjects.length > 0) {
          const dbSubjects = res.subjects.map(s => ({
             id: s.subjectId,
             name: s.subjectName,
             hasImage: false,
             isPinned: false
          }));
          // Combine initial dummy with real DB ones for preview, 
          // usually you'd just do setSubjects(dbSubjects)
          setSubjects([...initialSubjects, ...dbSubjects]);
        }
      })
      .catch((err) => console.error("Failed to load subjects:", err));
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await createSubject(formData);
      toast.success("Subject created successfully!");
      setIsModalOpen(false);
      setFormData({
         subjectId: "",
         subjectName: "",
         subjectCode: "",
         level: 1,
         semester: 1,
         description: "",
      });
      loadSubjects();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create subject");
    }
  };

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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Resources</h1>
        {role === "superadmin" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition shadow-sm"
          >
            + Add Subject
          </button>
        )}
      </div>

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
              <span className="text-sm font-medium text-gray-800 truncate pr-2">{subject.name}</span>
              <button
                onClick={(e) => togglePin(e, subject.id)}
                className={`text-lg transition-colors p-1 rounded-full flex-shrink-0 ${
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

      <Modal
        title="Create New Subject"
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject ID</label>
              <input
                type="text"
                name="subjectId"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                placeholder="e.g. SENG 41283"
                value={formData.subjectId}
                onChange={handleChange}
              />
            </div>
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
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Subject Name</label>
            <input
              type="text"
              name="subjectName"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. Machine Learning"
              value={formData.subjectName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <input
                type="number"
                name="level"
                min="1"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={formData.level}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Semester</label>
              <input
                type="number"
                name="semester"
                min="1"
                max="2"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
                value={formData.semester}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="Optional subject description..."
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
              Create Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
