import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { getResourceStats } from "@/services/resourceService";

const getErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission to view this page.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallbackMessage;
};

export default function ResourceStats() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalResources: 0,
    embeddedCount: 0,
    pendingEmbedding: 0,
    bySubject: [],
    topDownloaded: [],
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const response = await getResourceStats();
        setStats({
          totalResources: response?.totalResources || 0,
          embeddedCount: response?.embeddedCount || 0,
          pendingEmbedding: response?.pendingEmbedding || 0,
          bySubject: response?.bySubject || [],
          topDownloaded: response?.topDownloaded || [],
        });
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load resource stats"));
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-xl shadow-sm border border-gray-100 pb-10">
      <div className="flex items-center gap-4 border-b border-gray-200 px-6 pt-6 pb-4">
        <button
          onClick={() => navigate("/resources")}
          className="p-2 hover:bg-gray-100 rounded-full transition"
          aria-label="Go back"
        >
          <FaArrowLeft size={18} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">Resource Statistics</h2>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Resources</p>
          <p className="text-2xl font-semibold text-gray-800 mt-2">{stats.totalResources}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">AI Ready</p>
          <p className="text-2xl font-semibold text-success-500 mt-2">{stats.embeddedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pending Embedding</p>
          <p className="text-2xl font-semibold text-gray-700 mt-2">{stats.pendingEmbedding}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Embedding Completion</p>
          <p className="text-2xl font-semibold text-primary-700 mt-2">
            {stats.totalResources > 0
              ? `${Math.round((stats.embeddedCount / stats.totalResources) * 100)}%`
              : "0%"}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resources Per Subject</h3>
          {stats.bySubject.length === 0 ? (
            <p className="text-gray-500 italic">No subject breakdown available yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.bySubject.map((entry) => (
                <div
                  key={entry._id}
                  className="border border-gray-200 rounded-md p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {entry.subjectName || entry._id}
                    </p>
                    <p className="text-xs text-gray-500">{entry._id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-700">{entry.resourceCount || 0} resources</p>
                    <p className="text-xs text-gray-500">{entry.totalDownloads || 0} downloads</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Most Downloaded Resources</h3>
          {stats.topDownloaded.length === 0 ? (
            <p className="text-gray-500 italic">No downloads recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.topDownloaded.map((resource) => (
                <div
                  key={resource.resourceId}
                  className="border border-gray-200 rounded-md p-3"
                >
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {resource.title || resource.fileName || "Untitled"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {resource.subjectCode} | {resource.resourceType}
                  </p>
                  <p className="text-sm text-gray-700 mt-2">
                    Downloads: {resource.downloadCount || 0}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
