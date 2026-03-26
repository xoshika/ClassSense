import { useState } from "react";

const students = [
  { rank: 1, name: "STUDENT 1" },
  { rank: 2, name: "STUDENT 2" },
  { rank: 3, name: "STUDENT 3" },
  { rank: 4, name: "STUDENT 4" },
  { rank: 5, name: "STUDENT 5" },
  { rank: 6, name: "STUDENT 6" },
];

export default function ClassSetup() {
  const [subjectName, setSubjectName] = useState("MACHINE LEARNING");
  const [roomNumber, setRoomNumber] = useState("Lab 2 CCS");
  const [teacherName, setTeacherName] = useState("JOHN AUGUSTUS");
  const [studentNames, setStudentNames] = useState(
    students.map((s) => s.name)
  );

  // Backup for cancel functionality
  const [originalSubject, setOriginalSubject] = useState("MACHINE LEARNING");
  const [originalRoom, setOriginalRoom] = useState("Lab 2 CCS");
  const [originalTeacher, setOriginalTeacher] = useState("JOHN AUGUSTUS");
  const [originalStudents, setOriginalStudents] = useState(students.map((s) => s.name));

  const handleSave = () => {
    // Save the current state as the new original
    setOriginalSubject(subjectName);
    setOriginalRoom(roomNumber);
    setOriginalTeacher(teacherName);
    setOriginalStudents([...studentNames]);
    alert("Changes saved successfully!");
  };

  const handleCancel = () => {
    // Restore original values
    setSubjectName(originalSubject);
    setRoomNumber(originalRoom);
    setTeacherName(originalTeacher);
    setStudentNames([...originalStudents]);
    alert("Changes cancelled.");
  };

  return (
    <>
      {/* Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg border border-gray-200 shadow p-6 hover:shadow-md transition-all">

            {/* ── Class Information ── */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-800 mb-4">Class Information</h2>

              <div className="flex items-center gap-8 mb-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs text-gray-700 font-semibold">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs text-gray-700 font-semibold">Room Number</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-gray-700 font-semibold">Teacher Name</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all w-full"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />

            <div>
              <h2 className="text-sm font-bold text-gray-800 mb-4">Student Roster</h2>

              <div className="flex flex-col gap-2.5">
                {students.map((s, i) => (
                  <div key={s.rank} className="flex items-center gap-3 bg-gray-50 border border-gray-150 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-200 transition-all">
                    <span className="text-xs text-gray-600 font-semibold bg-white px-2.5 py-1.5 rounded border border-gray-200 min-w-12 text-center">#{s.rank}</span>
                    <input
                      type="text"
                      value={studentNames[i]}
                      onChange={(e) => {
                        const updated = [...studentNames];
                        updated[i] = e.target.value;
                        setStudentNames(updated);
                      }}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white hover:border-gray-400 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-300 transition-all flex-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 my-6" />
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-2 rounded-lg transition-colors shadow-md"
              >
                Save Changes
              </button>
            </div>

          </div>
        </main>
    </>
  );
}