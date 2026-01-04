import * as XLSX from 'xlsx';
import { CourseRecord } from "../types";

export const generateExcel = (data: CourseRecord[], filename: string = 'course_schedule.xlsx') => {
  // 1. Convert data to worksheet
  const worksheet = XLSX.utils.json_to_sheet(data, {
    header: ["date", "time", "studentName", "courseName", "teacherName"]
  });

  // 2. Set readable column headers
  XLSX.utils.sheet_add_aoa(worksheet, [
    ["上课日期", "上课时间", "学生姓名", "课程名称", "老师姓名"]
  ], { origin: "A1" });

  // 3. Adjust column widths (approximate)
  worksheet["!cols"] = [
    { wch: 15 }, // Date
    { wch: 20 }, // Time
    { wch: 15 }, // Student
    { wch: 25 }, // Course
    { wch: 15 }, // Teacher
  ];

  // 4. Create workbook and append sheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");

  // 5. Write file
  XLSX.writeFile(workbook, filename);
};