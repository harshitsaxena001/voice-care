import axios from "axios";
import "dotenv/config";

export const createUltravoxCall = async (
  patientName,
  primaryDiagnosis,
  patientId,
) => {
  try {
    const response = await axios.post(
      "https://api.ultravox.ai/api/calls",
      {
        systemPrompt: `You are a medical AI assistant for VoiceCare.
            You are calling a patient named ${patientName}.
            Their primary diagnosis or concern is: ${primaryDiagnosis}.

            Your job is to politely ask them specific questions related ONLY to ${primaryDiagnosis}.
            Do NOT answer irrelevant questions. Do NOT hallucinate medical advice. Ask 3-4 simple questions to check their current symptoms, wait for their answer, and then politely end the call.

            Tell them if they have any severe symptoms like chest pain or difficulty breathing, they should hang up and call an ambulance immediately.`,
        temperature: 0.3,
        model: "ultravox-v0.7",
        medium: { twilio: {} },
      },
      {
        headers: {
          "X-API-Key": process.env.ULTRAVOX_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Ultravox API Error:", error.response?.data || error.message);
    throw new Error("Failed to initialize Ultravox AI call");
  }
};
