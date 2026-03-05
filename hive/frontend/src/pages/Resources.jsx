import React from "react";

const resources = [
  {
    title: "Computer Networks Past Paper 2021",
    category: "Past Paper",
    subject: "Computer Networks",
    description: "Final exam paper with marking scheme.",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileType: "pdf"
  },
  {
    title: "Operating Systems Past Paper 2020",
    category: "Past Paper",
    subject: "Operating Systems",
    description: "Final exam paper with answers.",
    fileUrl: "https://www.orimi.com/pdf-test.pdf",
    fileType: "pdf"
  },
  {
    title: "Data Structures Past Paper 2019",
    category: "Past Paper",
    subject: "Data Structures",
    description: "Exam paper with marking scheme.",
    fileUrl: "https://gahp.net/wp-content/uploads/2017/09/sample.pdf",
    fileType: "pdf"
  },
  {
    title: "Database Systems Lecture Notes",
    category: "Lecture Notes",
    subject: "Database Systems",
    description: "Week 1–10 lecture notes.",
    fileUrl: "https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf",
    fileType: "pdf"
  },
  {
    title: "Software Engineering Guidelines",
    category: "Guidelines",
    subject: "Software Engineering",
    description: "Project submission and report guidelines.",
    fileUrl: "https://www.clickdimensions.com/links/TestPDFfile.pdf",
    fileType: "pdf"
  },
  {
    title: "Computer Architecture Past Paper 2022",
    category: "Past Paper",
    subject: "Computer Architecture",
    description: "Final exam paper with marking scheme.",
    fileUrl: "https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf",
    fileType: "pdf"
  },
  {
    title: "Networking Concepts Lecture Notes",
    category: "Lecture Notes",
    subject: "Computer Networks",
    description: "Detailed lecture notes for semester 1.",
    fileUrl: "https://www.pdf995.com/samples/pdf.pdf",
    fileType: "pdf"
  },
  {
    title: "Algorithms Past Paper 2020",
    category: "Past Paper",
    subject: "Algorithms",
    description: "Final exam paper with marking scheme.",
    fileUrl: "https://www.orimi.com/pdf-test.pdf",
    fileType: "pdf"
  }
];

export default function Resources() {
  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="flex flex-wrap gap-4 justify-center">

        {resources.map((item, index) => (
          <div
            key={index}
            className="relative w-64 h-60 bg-white rounded-md overflow-hidden group shadow-2xl flex flex-col"
          >
            {/* Image Section */}
            <div className="h-48 relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4"
                alt={item.title}
                className="w-full h-full object-cover"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/70 text-white flex flex-col justify-center items-center text-center px-4 opacity-0 transform translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                <p className="text-sm mb-3">{item.description}</p>

                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-500 px-3 py-1 rounded text-sm"
                >
                  View PDF
                </a>
              </div>
            </div>

            {/* Title Section */}
            <div className="px-4 py-3 bg-[#e7e2d3] flex-1 flex items-center justify-center">
              <h3 className="text-sm text-blue-900 font-semibold text-center">{item.title}</h3>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}