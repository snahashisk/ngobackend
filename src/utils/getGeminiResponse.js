import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const getGeminiResponse = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.log("Error from gemini:", error);
    throw new Error("Failed to get response from Gemini");
  }
};

export { getGeminiResponse };

//function to analyze the report and determine the urgency level
const analyzeReportUrgency = async (report) => {
  try {
    const prompt = `Analyze the following report and determine the urgency level:\n\n${JSON.stringify(report, null, 2)}\n\nReturn the urgency level in the format: { "urgencyLevel": "Low" | "Medium" | "High" | "Critical" }`;
    const response = await getGeminiResponse(prompt);
    return JSON.parse(response);
  } catch (error) {
    throw new Error("Failed to analyze report urgency");
  }
};

export { analyzeReportUrgency };

//function to give the steps to resolve the report
const getStepsToResolve = async (report) => {
  try {
    const prompt = `Give the steps to resolve the following report:\n\n${JSON.stringify(report, null, 2)}\n\nReturn the steps in the format: { "stepsToResolve": "step1,step2,step3" }`;
    const response = await getGeminiResponse(prompt);
    return JSON.parse(response);
  } catch (error) {
    throw new Error("Failed to give steps to resolve");
  }
};

export { getStepsToResolve };
