export const isTokenExpired = (token) => {
    if (!token) return true;
  
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(atob(base64));
  
    const currentTime = Math.floor(Date.now() / 1000); // in seconds
    return decodedPayload.exp < currentTime;
  };
  
  export const getTokenExpiration = (token) => {
    if (!token) return null;
  
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decodedPayload = JSON.parse(atob(base64));
  
    return decodedPayload.exp;
  };