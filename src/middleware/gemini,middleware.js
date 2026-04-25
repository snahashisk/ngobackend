import { getGeminiResponse } from "../utils/getGeminiResponse.js";

export const aiReportAnalysisMiddleware = async (req, res, next) => {
  try {
    const { description, category, affectedPeople } = req.body;
    const prompt = ` You are an Expert NGO assistant. I have a crisis report describing the issue the category and number of people affected. description: ${description} category: ${category} affectedPeople: ${affectedPeople}. Analyze this report and tell me what are the steps to resolve this crisis? And also tell me the urgency level of the crisis? For the urgency level choose from Low, Medium, High, Critical strictly only one category cannot provide multiple. 
    Analyze the report and return:
    1. urgencyLevel (Low, Medium, High, Critical)
    2. stepsToResolve (clear actionable steps)
    Return ONLY JSON:
    {
      "urgencyLevel": "...",
      "stepsToResolve": {
      "s1": "...",
      "s2": "...",
      "s3": "...",
      "s4": "...",
      "s5": "..."
      }
    }`;

    const geminiResponse = await getGeminiResponse(prompt);

    const cleaned = geminiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let aiData;

    try {
      aiData = JSON.parse(cleaned);
    } catch (err) {
      const fallbackSteps = `1. Assess the situation on ground\n2. Contact nearby volunteers or NGOs\n3. Provide immediate basic assistance\n4. Monitor the situation for escalation\n5. Plan follow-up support if needed`;

      let fallbackUrgency = "Medium";
      if (desc.includes("critical") || desc.includes("emergency")) {
        fallbackUrgency = "Critical";
      } else if (desc.includes("urgent") || desc.includes("severe")) {
        fallbackUrgency = "High";
      } else if (desc.includes("minor") || desc.includes("mild")) {
        fallbackUrgency = "Low";
      }
      req.body.stepsToResolve = fallbackSteps;
      req.body.urgencyLevel = fallbackUrgency;

      return next();
    }

    // ✅ Convert steps
    const stepsString = Object.values(aiData.stepsToResolve || {})
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n");

    // ✅ Validate urgency
    const allowed = ["Low", "Medium", "High", "Critical"];
    const urgency = allowed.includes(aiData.urgencyLevel) ? aiData.urgencyLevel : "Medium";

    console.log("stepsString:", stepsString);
    console.log("urgency:", urgency);

    req.body.stepsToResolve = stepsString;
    req.body.urgencyLevel = urgency;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
