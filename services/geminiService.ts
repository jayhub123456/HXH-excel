import { GoogleGenAI, Type } from "@google/genai";
import { CourseRecord } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeImage = async (base64Image: string): Promise<CourseRecord[]> => {
  try {
    // Remove data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG, but Gemini is flexible
              data: base64Data,
            },
          },
          {
            text: `Analyze the provided image of a course schedule and extract the course details into a structured list.
            
            The image likely contains Chinese text. Follow these specific extraction rules carefully:
            
            1. **Student Name** (学生姓名): Typically found at the beginning of a course line or block.
            2. **Course Name** (课程名称): Identify the subject or activity. It is often found after a duration marker like "minutes" or "mins" (e.g., look for "分钟", "30分钟 钢琴课" -> "钢琴课").
            3. **Teacher Name** (老师姓名): Usually enclosed in parentheses or brackets (e.g., "(王老师)" -> "王老师").
            4. **Course Date** (上课日期): Extract dates from section headers, calendar titles, or specific date lines near the course. Format as YYYY-MM-DD if possible, otherwise keep original text.
            5. **Course Time** (上课时间): Extract the time range in the format "Start Time - End Time" (e.g., "14:00 - 15:00").
            
            If a field is missing, leave it as an empty string. Return a clean JSON array.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of extracted course records",
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "The date of the course (YYYY-MM-DD)" },
              time: { type: Type.STRING, description: "The time range of the course" },
              studentName: { type: Type.STRING, description: "The name of the student" },
              courseName: { type: Type.STRING, description: "The name of the course/subject" },
              teacherName: { type: Type.STRING, description: "The name of the teacher" },
            },
            required: ["date", "time", "studentName", "courseName", "teacherName"],
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("No data returned from Gemini.");
    }

    const data: CourseRecord[] = JSON.parse(response.text);
    return data;

  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Failed to process image content. Please try again.");
  }
};