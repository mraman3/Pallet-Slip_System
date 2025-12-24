export async function apiFetch(
  input: RequestInfo,
  init: RequestInit = {}
) {
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      "x-app-access": localStorage.getItem("app_token") || "",
      "Content-Type": "application/json",
    },
  });

  // If backend says locked → relock app
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("app_token");
    
    // notify app instead of reloading
    window.dispatchEvent(new Event("app:locked"));
    
    throw new Error("App locked");
  }

  return res;
}
