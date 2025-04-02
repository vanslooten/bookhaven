import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const queryParams = queryKey[1] as Record<string, any> | undefined;
    
    let finalUrl = url;
    
    // Handle query parameters if provided
    if (queryParams) {
      console.log("QUERY CLIENT: Raw query params:", queryParams);
      
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined && value !== null && value !== '') {
          console.log(`QUERY CLIENT: Adding param ${key}=${value}`);
          params.append(key, value.toString());
        }
      }
      
      const queryString = params.toString();
      if (queryString) {
        finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
        console.log(`QUERY CLIENT: Created query string: ${queryString}`);
      } else {
        console.log("QUERY CLIENT: No valid query parameters found");
      }
    }
    
    console.log("QUERY CLIENT: Final URL:", finalUrl);
    
    const res = await fetch(finalUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Important: allow refetching when query parameters change
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
