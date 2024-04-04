import posthog from "posthog-js";

posthog.init("phc_NRzswrA9ri7puagtOLxF1kO9rtl296tLJWXLOpmDFgd", {
  api_host: "https://app.posthog.com",
});

const token = "phx_whu07pSaZvpRWi9ISVky6y2ZCHeIwveM5NyBdKYf26a";

async function fetchVisitorData(method, api) {
  try {
    const response = await fetch(api, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error occurred:", error);
    throw error;
  }
}

export { fetchVisitorData };
