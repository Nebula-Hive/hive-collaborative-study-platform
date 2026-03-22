import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaRegFileAlt, FaArrowLeft } from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/ui/Modal";
import { toast } from "react-toastify";
import { getSubjectResources, uploadResource } from "@/services/api";
import ResourceCard from "../components/ui/ResourceCard";

export default function Resources() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [activeTab, setActiveTab] = useState("papers");
  const [dbResources, setDbResources] = useState({ past_papers: [], notes: [] });
  const [subjectDetails, setSubjectDetails] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [resourceType, setResourceType] = useState("past_paper");
  const [file, setFile] = useState(null);

  const loadResources = () => {
    getSubjectResources(subjectId)
      .then((res) => {
        if (res.subject) setSubjectDetails(res.subject);
        if (res.resources) {
          setDbResources({
            past_papers: res.resources.past_papers || [],
            notes: res.resources.notes || [],
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load resources:", err);
      });
  };

  useEffect(() => {
    loadResources();
  }, [subjectId]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }
    
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", subjectId);
    formData.append("resourceType", resourceType);
    formData.append("title", title);

    try {
      await uploadResource(formData);
      toast.success("Resource uploaded successfully!");
      setIsModalOpen(false);
      setTitle("");
      setFile(null);
      setResourceType("past_paper");
      loadResources(); // Reload the list
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to upload resource");
    }
  };

  const handleDownload = (s3Url, e) => {
    e.preventDefault();
    window.open(s3Url, "_blank");
  };

  return (
    <div className="min-h-screen bg-white rounded-xl shadow-sm border border-gray-100 pb-10">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)} 
            className="mb-2 p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Go back"
          >
            <FaArrowLeft size={18} className="text-gray-600" />
          </button>
          
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("papers")}
              className={`pb-2 font-medium transition-colors ${
                activeTab === "papers"
                  ? "border-b-2 border-primary-500 text-gray-900 font-semibold"
                  : "border-b-2 border-transparent text-gray-500 hover:border-primary-300"
              }`}
            >
              Past Papers
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`pb-2 font-medium transition-colors ${
                activeTab === "notes"
                  ? "border-b-2 border-primary-500 text-gray-900 font-semibold"
                  : "border-b-2 border-transparent text-gray-500 hover:border-primary-300"
              }`}
            >
              Shared Notes
            </button>
          </div>
        </div>

        {/* Superadmin Upload Button */}
        {role === "superadmin" && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="mb-2 bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition shadow-sm text-sm font-medium"
          >
            + Add Resource
          </button>
        )}
      </div>

      <div className="px-8 pt-4 pb-2">
         <h2 className="text-xl font-semibold text-gray-800">
           {subjectDetails ? `${subjectDetails.subjectCode} - ${subjectDetails.subjectName}` : `Subject ID: ${subjectId}`}
         </h2>
      </div>

      {/* Past Papers List */}
      {activeTab === "papers" && (
        <div className="p-6 space-y-4">
          {dbResources.past_papers.length === 0 ? (
            <p className="text-gray-500 italic">No past papers uploaded yet.</p>
          ) : (
            dbResources.past_papers.map((paper, index) => (
              <div
                key={paper.resourceId || index}
                className="flex justify-between items-center border-b border-gray-200 pb-3 hover:bg-gray-50 p-2 rounded transition"
              >
                <div className="flex items-center gap-3">
                  <FaRegFileAlt className="text-blue-500" />
                  <span className="font-medium text-gray-700">{paper.title}</span>
                </div>
                <a 
                  href={paper.s3Url || "#"} 
                  onClick={(e) => paper.s3Url && handleDownload(paper.s3Url, e)}
                  className="text-gray-500 hover:text-primary-600 transition p-2"
                  title="Download File"
                >
                  <IoMdDownload size={20} />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* Shared Notes List */}
      {activeTab === "notes" && (
        <div className="p-8 flex flex-wrap gap-4 items-center justify-start">
          {dbResources.notes.length === 0 ? (
            <p className="text-gray-500 italic w-full">No notes uploaded yet.</p>
          ) : (
            dbResources.notes.map((note, index) => (
               <ResourceCard key={note.resourceId || index} item={{ title: note.title, s3Url: note.s3Url }} />
            ))
          )}
        </div>
      )}

      {/* Upload Resource Modal for Superadmin */}
      <Modal
        title="Upload New Resource"
        activeModal={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Resource Title</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. 2024 Final Exam Paper"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
            >
              <option value="past_paper">Past Paper</option>
              <option value="note">Shared Note</option>
              <option value="resource_book">Resource Book</option>
            </select>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700">PDF File (Max 50MB)</label>
             <input
               type="file"
               accept=".pdf"
               required
               onChange={handleFileChange}
               className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
             />
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
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
              Upload
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}