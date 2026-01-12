//import { axios } from 'axios';

// ✅ Replace with YOUR computer's IP address from ipconfig
const API_URL = "http://192.168.10.7:8000";
const API_KEY = "energy_optimisation_model";

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

// ✅ Get Recommendations Function
export const getRecommendations = async (appliancesPayload) => {
  try {
    console.log("🔵 API URL:", API_URL);
    console.log("🔵 Sending request to:", `${API_URL}/energy/recommendations`);
    console.log("🔵 Payload:", JSON.stringify(appliancesPayload, null, 2));
    
    const response = await axios.post(
      `${API_URL}/energy/recommendations`,
      appliancesPayload,
      { 
        headers,
        timeout: 15000 // 15 seconds timeout
      }
    );
    
    console.log("✅ Response Status:", response.status);
    console.log("✅ Response Data:", JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.error("❌ === API ERROR DETAILS ===");
    
    if (error.response) {
      // Server responded with error
      console.error("❌ Status Code:", error.response.status);
      console.error("❌ Error Data:", JSON.stringify(error.response.data, null, 2));
      console.error("❌ Headers:", error.response.headers);
    } else if (error.request) {
      // No response received
      console.error("❌ No Response Received from Server");
      console.error("❌ Request Config:", error.config);
      console.error("");
      console.error("💡 TROUBLESHOOTING CHECKLIST:");
      console.error("   ✓ Is server running? Run: python -m uvicorn api.voltx_app:app --reload --host 0.0.0.0 --port 8000");
      console.error("   ✓ Is API_URL correct?", API_URL);
      console.error("   ✓ Are phone and computer on same WiFi?");
      console.error("   ✓ Can you access", API_URL + "/docs", "from phone browser?");
      console.error("   ✓ Is Windows Firewall blocking port 8000?");
    } else {
      // Other errors
      console.error("❌ Error Message:", error.message);
      console.error("❌ Error Stack:", error.stack);
    }
    
    throw error;
  }
};

// ✅ Test Connection Function (Optional but useful)
export const testConnection = async () => {
  try {
    console.log("🔵 Testing connection to:", API_URL);
    const response = await axios.get(`${API_URL}/docs`, { 
      timeout: 5000 
    });
    console.log("✅ Server connection successful!");
    return { success: true, message: "Connected to server" };
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return { success: false, message: error.message };
  }
};

// ✅ Default export (optional, for flexibility)
export default {
  getRecommendations,
  testConnection,
};